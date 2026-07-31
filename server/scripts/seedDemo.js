// ============================================================================
//  Générateur de données de démonstration ENRICHIES.
//
//  But : peupler la base avec beaucoup de données cohérentes pour tester
//  réellement toutes les fonctionnalités (pagination, dashboards, filtres,
//  notifications, historique...). Données étalées sur ~6 mois (anciennes +
//  récentes), tous les statuts représentés, historique et notifications
//  cohérents avec chaque demande.
//
//  Usage : npm run db:demo   (depuis la racine du projet)
//
//  NB : ne remplace pas database/seed.sql (jeu minimal documenté). Conserve
//  les 6 comptes canoniques pour que les instructions de connexion restent
//  valables. Mot de passe de tous les comptes : Demo2026!
// ============================================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ---------------------------------------------------------------------------
// Données de référence (réalistes, contexte bancaire algérien)
// ---------------------------------------------------------------------------
const PRENOMS = ['Mohamed', 'Fatima', 'Sofiane', 'Lina', 'Riad', 'Amina', 'Bilal', 'Khadija',
  'Omar', 'Yasmine', 'Adel', 'Samira', 'Reda', 'Meriem', 'Walid', 'Nawel', 'Farid', 'Salima',
  'Hakim', 'Imene', 'Toufik', 'Souad', 'Nassim', 'Wahiba'];
const NOMS = ['Belkacem', 'Saidi', 'Bouzid', 'Toumi', 'Mansouri', 'Kaci', 'Zeroual', 'Brahimi',
  'Ferhat', 'Guerroui', 'Slimani', 'Ouali', 'Hamidi', 'Bensalem', 'Djaballah', 'Larbi',
  'Meddour', 'Cherfaoui', 'Benmokhtar', 'Aissani'];
const STRUCTURES = ['Agence Alger Centre', 'Agence Oran', 'Agence Constantine', 'Agence Annaba',
  'Agence Blida', 'Agence Sétif', 'Direction Commerciale', 'Direction des Risques',
  'Direction Financière', 'Direction Conformité'];

// Thème -> degré de sensibilité (identique à config/themes.js)
const THEMES = {
  'Procuration': 'Moyen',
  'Révision dossier juridique': 'Confidentiel',
  'Moyens de paiements': 'Confidentiel',
  'Clôture de compte': 'Moyen',
  'Autre problématique': 'Faible'
};

// Titres réalistes par thème
const TITRES = {
  'Procuration': ['Procuration pour client grand compte', 'Mandat de gestion de compte',
    'Procuration dans le cadre d\'une succession', 'Procuration temporaire limitée',
    'Procuration multi-comptes entreprise', 'Mandat de représentation légale'],
  'Révision dossier juridique': ['Révision d\'un contrat de prêt', 'Révision de garantie bancaire',
    'Analyse d\'une clause contractuelle', 'Révision dossier de crédit immobilier',
    'Vérification des conditions générales', 'Révision convention de compte'],
  'Moyens de paiements': ['Validation d\'un nouveau moyen de paiement', 'Conformité virement international',
    'Analyse carte de paiement entreprise', 'Validation prélèvement automatique',
    'Conformité d\'un chèque de banque', 'Moyen de paiement à l\'international'],
  'Clôture de compte': ['Clôture d\'un compte litigieux', 'Clôture compte inactif',
    'Clôture suite au décès du titulaire', 'Clôture de compte professionnel',
    'Clôture compte sur injonction', 'Clôture de compte joint'],
  'Autre problématique': ['Question réglementaire diverse', 'Demande d\'avis sur le secret bancaire',
    'Interprétation d\'une nouvelle circulaire', 'Question sur la lutte anti-blanchiment',
    'Avis sur une réclamation client', 'Point juridique sur un litige']
};

const DESCRIPTIONS = [
  'Merci de bien vouloir analyser ce dossier et rendre votre avis dans les meilleurs délais.',
  'Le client sollicite une réponse rapide compte tenu de l\'urgence de la situation.',
  'Ce dossier présente une complexité particulière qui nécessite un examen approfondi.',
  'Demande formulée par l\'agence suite à une sollicitation directe du client.',
  'Situation nécessitant une validation juridique avant toute suite opérationnelle.',
  'Dossier transmis pour avis conformément à la procédure interne en vigueur.'
];
const AVIS = [
  'Avis favorable. Le dossier est conforme aux exigences réglementaires en vigueur.',
  'Avis favorable sous réserve de la production des pièces justificatives complémentaires.',
  'Avis favorable. L\'opération peut être engagée dans le respect des conditions habituelles.',
  'Avis favorable après vérification de la conformité de l\'ensemble des éléments transmis.'
];
const MOTIFS = [
  'Dossier rejeté : pièces contractuelles manquantes malgré la demande de complément.',
  'Rejet : l\'opération n\'est pas conforme à la réglementation applicable.',
  'Dossier incomplet et non régularisé dans les délais impartis.'
];
const COMPLEMENTS = [
  'Merci de joindre le contrat cadre ainsi que les conditions générales.',
  'Veuillez préciser le périmètre exact des comptes concernés.',
  'Le dossier doit être complété par une pièce d\'identité en cours de validité.',
  'Merci de fournir le justificatif de domicile de moins de trois mois.'
];
const COMMENTAIRES = [
  'Pouvez-vous préciser le montant concerné par cette opération ?',
  'Je regarde ce dossier dès aujourd\'hui, je reviens vers vous rapidement.',
  'Le client a confirmé les informations par téléphone ce matin.',
  'Merci de votre retour, je transmets au service concerné.',
  'Ce point mérite une vérification auprès de la direction de la conformité.'
];

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
const alea = (arr) => arr[Math.floor(Math.random() * arr.length)];
const entier = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const melanger = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

// Date à N jours dans le passé, avec une heure ouvrée
const ilYaJours = (jours) => {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  d.setHours(entier(8, 17), entier(0, 59), 0, 0);
  return d;
};
const ajouterHeures = (date, h) => new Date(date.getTime() + h * 3600 * 1000);
const iso = (d) => d.toISOString();

// ---------------------------------------------------------------------------
// Génération
// ---------------------------------------------------------------------------
async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'TRUNCATE TABLE commentaires, historique_statuts, notifications, demande_avis, users RESTART IDENTITY CASCADE'
    );

    const hash = bcrypt.hashSync('Demo2026!', 12);

    // ---- Utilisateurs ----
    // 6 comptes canoniques (identiques au seed.sql) + comptes générés
    const canoniques = [
      ['Responsable', 'DAJ', 'admin@natixis.dz', 'ADMIN', 'Direction des Affaires Juridiques', true],
      ['Benali', 'Sarah', 'juriste1@natixis.dz', 'JURISTE', 'Direction des Affaires Juridiques', true],
      ['Haddad', 'Karim', 'juriste2@natixis.dz', 'JURISTE', 'Direction des Affaires Juridiques', true],
      ['Meziane', 'Amel', 'demandeur1@natixis.dz', 'DEMANDEUR', 'Agence Alger Centre', true],
      ['Cherif', 'Yacine', 'demandeur2@natixis.dz', 'DEMANDEUR', 'Direction Commerciale', true],
      ['Boudiaf', 'Nadia', 'demandeur3@natixis.dz', 'DEMANDEUR', 'Agence Oran', true]
    ];

    // Comptes supplémentaires : 1 admin, 3 juristes, 14 demandeurs (dont 2 désactivés)
    const roles = ['ADMIN', 'JURISTE', 'JURISTE', 'JURISTE',
      ...Array(14).fill('DEMANDEUR')];
    const supplementaires = [];
    const emailsVus = new Set(canoniques.map((c) => c[2]));
    let compteur = 1;
    for (const role of roles) {
      const prenom = alea(PRENOMS);
      const nom = alea(NOMS);
      const base = `${prenom}.${nom}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      let email = `${base}${compteur}@natixis.dz`;
      while (emailsVus.has(email)) { compteur++; email = `${base}${compteur}@natixis.dz`; }
      emailsVus.add(email);
      compteur++;
      const structure = role === 'DEMANDEUR' ? alea(STRUCTURES) : 'Direction des Affaires Juridiques';
      // 2 demandeurs désactivés pour tester le filtre "actif"
      const actif = !(role === 'DEMANDEUR' && supplementaires.filter((s) => !s[5]).length < 2 && Math.random() < 0.2);
      supplementaires.push([nom, prenom, email, role, structure, actif]);
    }

    const tousUsers = [...canoniques, ...supplementaires];
    const idsParRole = { ADMIN: [], JURISTE: [], DEMANDEUR: [] };
    for (const [nom, prenom, email, role, structure, actif] of tousUsers) {
      const { rows } = await client.query(
        `INSERT INTO users (nom, prenom, email, password_hash, role, structure, actif)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [nom, prenom, email, hash, role, structure, actif]
      );
      idsParRole[role].push({ id: rows[0].id, prenom, nom, actif });
    }
    const juristes = [...idsParRole.JURISTE, ...idsParRole.ADMIN]; // qui peut traiter
    const demandeursActifs = idsParRole.DEMANDEUR.filter((d) => d.actif);

    // ---- Demandes ----
    // Distribution sur les 7 statuts (72 demandes au total)
    const distribution = [
      ...Array(8).fill('Brouillon'),
      ...Array(14).fill('Soumise'),
      ...Array(14).fill('En cours'),
      ...Array(8).fill('Complément demandé'),
      ...Array(18).fill('Validée'),
      ...Array(6).fill('Rejetée'),
      ...Array(4).fill('Annulée')
    ];
    const statuts = melanger(distribution);

    let nbHisto = 0, nbNotif = 0, nbComm = 0;

    for (const statut of statuts) {
      const theme = alea(Object.keys(THEMES));
      const demandeur = alea(demandeursActifs);
      const juriste = alea(juristes);
      const titre = alea(TITRES[theme]);
      const description = alea(DESCRIPTIONS);

      // Dates cohérentes selon l'ancienneté (5 à 175 jours)
      const jours = entier(5, 175);
      const dateCreation = ilYaJours(jours);
      let dateSoumission = null, dateTraitement = null;
      let avis = null, motif = null, complement = null, juristeId = null;

      const histo = []; // { user_id, ancien, nouveau, commentaire, date }
      const notifs = []; // { user_id, message, date, lue }
      const messageSoumission = `Nouvelle demande soumise par ${demandeur.prenom} ${demandeur.nom}.`;

      if (statut !== 'Brouillon' && statut !== 'Annulée') {
        dateSoumission = ajouterHeures(dateCreation, entier(1, 48));
        histo.push({ user_id: demandeur.id, ancien: 'Brouillon', nouveau: 'Soumise', date: dateSoumission });
        // notifie les juristes + admins (on limite à 2 destinataires pour rester raisonnable)
        for (const j of melanger(juristes).slice(0, 2)) {
          notifs.push({ user_id: j.id, message: messageSoumission, date: dateSoumission });
        }
      }

      if (['En cours', 'Complément demandé', 'Validée', 'Rejetée'].includes(statut)) {
        juristeId = juriste.id;
        const datePrise = ajouterHeures(dateSoumission, entier(4, 72));
        histo.push({ user_id: juriste.id, ancien: 'Soumise', nouveau: 'En cours', date: datePrise });
        notifs.push({ user_id: demandeur.id, message: 'Votre demande est en cours de traitement.', date: datePrise });

        let dateCourante = datePrise;
        // Parfois un aller-retour de complément avant clôture (réalisme)
        const passeParComplement = statut === 'Complément demandé' || (Math.random() < 0.35 && (statut === 'Validée' || statut === 'Rejetée'));

        if (passeParComplement) {
          const dc = ajouterHeures(dateCourante, entier(4, 48));
          complement = alea(COMPLEMENTS);
          histo.push({ user_id: juriste.id, ancien: 'En cours', nouveau: 'Complément demandé', commentaire: complement, date: dc });
          notifs.push({ user_id: demandeur.id, message: 'Complément requis sur votre demande.', date: dc });
          dateCourante = dc;

          if (statut !== 'Complément demandé') {
            // le demandeur complète, retour En cours
            const dr = ajouterHeures(dateCourante, entier(12, 96));
            histo.push({ user_id: demandeur.id, ancien: 'Complément demandé', nouveau: 'En cours', date: dr });
            notifs.push({ user_id: juriste.id, message: 'La demande a été complétée.', date: dr });
            dateCourante = dr;
          }
        }

        if (statut === 'Validée') {
          dateTraitement = ajouterHeures(dateCourante, entier(4, 72));
          avis = alea(AVIS);
          histo.push({ user_id: juriste.id, ancien: 'En cours', nouveau: 'Validée', date: dateTraitement });
          notifs.push({ user_id: demandeur.id, message: 'Votre demande a été validée.', date: dateTraitement });
        } else if (statut === 'Rejetée') {
          dateTraitement = ajouterHeures(dateCourante, entier(4, 72));
          motif = alea(MOTIFS);
          histo.push({ user_id: juriste.id, ancien: 'En cours', nouveau: 'Rejetée', commentaire: motif, date: dateTraitement });
          notifs.push({ user_id: demandeur.id, message: 'Votre demande a été rejetée.', date: dateTraitement });
        }
        // 'Complément demandé' : reste en l'état (déjà consigné), commentaire_complement rempli
        if (statut === 'Complément demandé') complement = complement || alea(COMPLEMENTS);
      }

      if (statut === 'Annulée') {
        const da = ajouterHeures(dateCreation, entier(1, 24));
        histo.push({ user_id: demandeur.id, ancien: 'Brouillon', nouveau: 'Annulée', date: da });
      }

      // Insertion de la demande
      const { rows } = await client.query(
        `INSERT INTO demande_avis
          (titre, theme, description, degre_sensibilite, statut, demandeur_id, juriste_id,
           avis_juridique, commentaire_complement, motif_rejet,
           date_creation, date_soumission, date_traitement)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [titre, theme, description, THEMES[theme], statut, demandeur.id, juristeId,
          avis, complement, motif, iso(dateCreation), dateSoumission ? iso(dateSoumission) : null,
          dateTraitement ? iso(dateTraitement) : null]
      );
      const demandeId = rows[0].id;

      // Historique
      for (const h of histo) {
        await client.query(
          `INSERT INTO historique_statuts (demande_id, user_id, ancien_statut, nouveau_statut, commentaire, created_at)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [demandeId, h.user_id, h.ancien, h.nouveau, h.commentaire || null, iso(h.date)]
        );
        nbHisto++;
      }

      // Notifications (lues si anciennes de plus de 20 jours, sinon non lues)
      for (const n of notifs) {
        const lue = (Date.now() - n.date.getTime()) > 20 * 24 * 3600 * 1000;
        await client.query(
          `INSERT INTO notifications (user_id, demande_id, message, lue, created_at)
           VALUES ($1,$2,$3,$4,$5)`,
          [n.user_id, demandeId, n.message, lue, iso(n.date)]
        );
        nbNotif++;
      }

      // Commentaires (OPT01) sur ~40% des demandes actives
      if (['En cours', 'Complément demandé', 'Validée'].includes(statut) && Math.random() < 0.4) {
        const nbC = entier(1, 3);
        let dateC = ajouterHeures(dateSoumission || dateCreation, entier(2, 24));
        for (let i = 0; i < nbC; i++) {
          const auteur = i % 2 === 0 ? juriste : demandeur;
          await client.query(
            `INSERT INTO commentaires (demande_id, auteur_id, contenu, created_at)
             VALUES ($1,$2,$3,$4)`,
            [demandeId, auteur.id, alea(COMMENTAIRES), iso(dateC)]
          );
          dateC = ajouterHeures(dateC, entier(2, 48));
          nbComm++;
        }
      }
    }

    await client.query('COMMIT');

    const c = async (t) => (await pool.query(`SELECT COUNT(*) FROM ${t}`)).rows[0].count;
    console.log('✔ Données de démo enrichies générées :');
    console.log(`  - ${await c('users')} utilisateurs (dont ${demandeursActifs.length} demandeurs actifs)`);
    console.log(`  - ${await c('demande_avis')} demandes (tous statuts, étalées sur ~6 mois)`);
    console.log(`  - ${nbHisto} lignes d'historique`);
    console.log(`  - ${nbNotif} notifications`);
    console.log(`  - ${nbComm} commentaires`);
    console.log('  Mot de passe de tous les comptes : Demo2026!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('�‑ Échec de la génération, aucune donnée modifiée :', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
