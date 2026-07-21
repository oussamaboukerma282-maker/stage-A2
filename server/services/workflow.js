// ============================================================================
//  MOTEUR DE TRANSITIONS — source UNIQUE de vérité du workflow.
//
//  Règle absolue : aucun controller ne modifie `statut` directement.
//  Toute transition passe par executerTransition(), qui garantit :
//    - le respect de la matrice (transitions autorisées uniquement)
//    - le contrôle du rôle et de la propriété
//    - la présence des données obligatoires
//    - l'ATOMICITÉ : UPDATE + historique + notifications en UNE transaction
//
//  Spécification : docs/WORKFLOW.md
// ============================================================================

const pool = require('../config/db');
const historiqueModel = require('../models/historiqueModel');
const notificationsModel = require('../models/notificationsModel');
const { AppError } = require('../utils/AppError');

// ----------------------------------------------------------------------------
// Matrice des transitions autorisées : { statutActuel: { nouveauStatut: règles } }
// Tout ce qui n'y figure pas est INTERDIT (409).
// ----------------------------------------------------------------------------
const TRANSITIONS = {
  'Brouillon': {
    'Soumise': { roles: ['DEMANDEUR'], proprietaire: true },
    'Annulée': { roles: ['DEMANDEUR'], proprietaire: true }
  },
  'Soumise': {
    'En cours': { roles: ['JURISTE', 'ADMIN'] }
  },
  'En cours': {
    'Complément demandé': { roles: ['JURISTE', 'ADMIN'], requis: 'commentaire' },
    'Validée': { roles: ['JURISTE', 'ADMIN'], requis: 'avis_juridique' },
    'Rejetée': { roles: ['JURISTE', 'ADMIN'], requis: 'motif_rejet' }
  },
  'Complément demandé': {
    'En cours': { roles: ['DEMANDEUR'], proprietaire: true }
  },
  // États terminaux : aucune sortie possible (règle R2)
  'Validée': {},
  'Rejetée': {},
  'Annulée': {}
};

const STATUTS_TERMINAUX = ['Validée', 'Rejetée', 'Annulée'];

// Longueurs minimales/maximales des champs textuels obligatoires
const CONTRAINTES = {
  commentaire: { min: 10, max: 2000, libelle: 'Le commentaire' },
  avis_juridique: { min: 10, max: 5000, libelle: "L'avis juridique" },
  motif_rejet: { min: 10, max: 2000, libelle: 'Le motif de rejet' }
};

/** Une demande est-elle définitivement figée ? */
const estTerminal = (statut) => STATUTS_TERMINAUX.includes(statut);

/**
 * Décrit les effets d'une transition sur la table demande_avis.
 *  - `colonnes` : couples colonne → valeur (seront paramétrés)
 *  - `bruts`    : fragments SQL sans paramètre (ex. « date_traitement = NOW() »)
 */
const effetsSurDemande = (nouveauStatut, user, donnees) => {
  const colonnes = {};
  const bruts = [];

  switch (nouveauStatut) {
    case 'Soumise':
      bruts.push('date_soumission = NOW()');
      break;
    case 'En cours':
      // Prise en charge (depuis Soumise) : on assigne le juriste.
      // Retour de complément (depuis Complément demandé) : juriste_id inchangé.
      if (user.role !== 'DEMANDEUR') colonnes.juriste_id = user.id;
      break;
    case 'Complément demandé':
      colonnes.commentaire_complement = donnees.commentaire;
      break;
    case 'Validée':
      colonnes.avis_juridique = donnees.avis_juridique;
      bruts.push('date_traitement = NOW()');
      break;
    case 'Rejetée':
      colonnes.motif_rejet = donnees.motif_rejet;
      bruts.push('date_traitement = NOW()');
      break;
    case 'Annulée':
      break;
  }
  return { colonnes, bruts };
};

/**
 * Détermine les destinataires de la notification et son message.
 * Renvoie null si la transition ne notifie personne.
 */
const notificationPour = async (client, nouveauStatut, demande, user) => {
  const id = demande.id;
  switch (nouveauStatut) {
    case 'Soumise': {
      const destinataires = await notificationsModel.idsJuristesEtAdmins(client);
      return {
        destinataires,
        message: `Nouvelle demande #${id} soumise par ${user.prenom} ${user.nom}.`
      };
    }
    case 'En cours':
      // Prise en charge -> le demandeur ; retour de complément -> le juriste en charge
      return user.role === 'DEMANDEUR'
        ? (demande.juriste_id
            ? { destinataires: [demande.juriste_id], message: `La demande #${id} a été complétée.` }
            : null)
        : { destinataires: [demande.demandeur_id], message: `Votre demande #${id} est en cours de traitement.` };
    case 'Complément demandé':
      return { destinataires: [demande.demandeur_id], message: `Complément requis sur votre demande #${id}.` };
    case 'Validée':
      return { destinataires: [demande.demandeur_id], message: `Votre demande #${id} a été validée.` };
    case 'Rejetée':
      return { destinataires: [demande.demandeur_id], message: `Votre demande #${id} a été rejetée.` };
    default:
      return null; // Annulée : aucune notification
  }
};

/** Commentaire à consigner dans l'historique selon la transition. */
const commentaireHistorique = (nouveauStatut, donnees) => {
  if (nouveauStatut === 'Complément demandé') return donnees.commentaire;
  if (nouveauStatut === 'Rejetée') return donnees.motif_rejet;
  return null;
};

/**
 * Exécute une transition de statut.
 *
 * Ordre des contrôles (volontaire) :
 *   1. existence de la demande        -> 404
 *   2. transition permise (matrice)   -> 409   (AVANT le rôle : message plus juste)
 *   3. rôle autorisé                  -> 403
 *   4. propriété (si requise)         -> 403
 *   5. données obligatoires           -> 400
 *
 * Puis les 3 écritures dans UNE SEULE transaction (règle R1).
 *
 * @returns {object} la demande mise à jour
 */
const executerTransition = async (demandeId, nouveauStatut, user, donnees = {}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Existence — verrouillage de la ligne pour la durée de la transaction (règle R4)
    const { rows } = await client.query(
      'SELECT * FROM demande_avis WHERE id = $1 FOR UPDATE',
      [demandeId]
    );
    const demande = rows[0];
    if (!demande) throw new AppError(404, 'NOT_FOUND', 'Demande introuvable');

    // 2. Transition autorisée ?
    const sorties = TRANSITIONS[demande.statut] || {};
    const regle = sorties[nouveauStatut];
    if (!regle) {
      const message = estTerminal(demande.statut)
        ? `La demande est clôturée (${demande.statut}) : plus aucune action n'est possible.`
        : `Transition impossible : « ${demande.statut} » → « ${nouveauStatut} ».`;
      throw new AppError(409, 'INVALID_TRANSITION', message);
    }

    // 3. Rôle
    if (!regle.roles.includes(user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Votre rôle ne permet pas cette action');
    }

    // 4. Propriété
    if (regle.proprietaire && demande.demandeur_id !== user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Seul le demandeur de cette demande peut effectuer cette action');
    }

    // 5. Données obligatoires
    if (regle.requis) {
      const valeur = (donnees[regle.requis] || '').trim();
      const c = CONTRAINTES[regle.requis];
      if (valeur.length < c.min || valeur.length > c.max) {
        throw new AppError(400, 'VALIDATION',
          `${c.libelle} doit contenir entre ${c.min} et ${c.max} caractères`);
      }
      donnees[regle.requis] = valeur;
    }

    // --- Écriture 1 : la demande ---
    const { colonnes, bruts } = effetsSurDemande(nouveauStatut, user, donnees);
    const params = [demandeId, nouveauStatut];   // $1 = id, $2 = statut
    const set = ['statut = $2'];
    for (const [colonne, valeur] of Object.entries(colonnes)) {
      params.push(valeur);
      set.push(`${colonne} = $${params.length}`);
    }
    set.push(...bruts);

    const { rows: majRows } = await client.query(
      `UPDATE demande_avis SET ${set.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    const majDemande = majRows[0];

    // --- Écriture 2 : l'historique (immuable) ---
    await historiqueModel.inserer(client, {
      demande_id: demandeId,
      user_id: user.id,
      ancien_statut: demande.statut,
      nouveau_statut: nouveauStatut,
      commentaire: commentaireHistorique(nouveauStatut, donnees)
    });

    // --- Écriture 3 : les notifications ---
    const notif = await notificationPour(client, nouveauStatut, demande, user);
    if (notif && notif.destinataires.length) {
      await notificationsModel.creerPourPlusieurs(client, notif.destinataires, {
        demande_id: demandeId,
        message: notif.message
      });
    }

    await client.query('COMMIT');
    return majDemande;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release(); // toujours libérer, succès comme échec
  }
};

module.exports = { executerTransition, TRANSITIONS, STATUTS_TERMINAUX, estTerminal };
