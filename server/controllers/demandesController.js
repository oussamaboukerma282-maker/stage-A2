// Controller des demandes d'avis juridiques.

const path = require('path');
const fs = require('fs');
const demandesModel = require('../models/demandesModel');
const historiqueModel = require('../models/historiqueModel');
const workflow = require('../services/workflow');
const { sensibilitePourTheme, sensibiliteValide } = require('../config/themes');
const { AppError, asyncHandler } = require('../utils/AppError');
const { ok, okPaginated } = require('../helpers/response');

// Statuts dans lesquels le demandeur peut encore modifier sa demande
const STATUTS_MODIFIABLES = ['Brouillon', 'Complément demandé'];

/** Charge une demande ou lève 404. */
const chargerDemande = async (id) => {
  const demande = await demandesModel.findById(id);
  if (!demande) throw new AppError(404, 'NOT_FOUND', 'Demande introuvable');
  return demande;
};

/** Vérifie le droit de LECTURE : un demandeur ne lit que ses propres demandes. */
const verifierLecture = (demande, user) => {
  if (user.role === 'DEMANDEUR' && demande.demandeur_id !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'Accès non autorisé à cette demande');
  }
  // Un juriste/admin ne doit pas voir le brouillon d'un autre
  if (user.role !== 'DEMANDEUR' && demande.statut === 'Brouillon') {
    throw new AppError(403, 'FORBIDDEN', 'Accès non autorisé à cette demande');
  }
};

/** Vérifie le droit d'ÉCRITURE : propriétaire + statut modifiable. */
const verifierEcriture = (demande, user) => {
  if (demande.demandeur_id !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'Seul le demandeur peut modifier cette demande');
  }
  if (!STATUTS_MODIFIABLES.includes(demande.statut)) {
    throw new AppError(409, 'INVALID_TRANSITION',
      `Une demande au statut « ${demande.statut} » n'est plus modifiable`);
  }
};

/** Détermine la sensibilité : celle fournie si valide, sinon déduite du thème. */
const resoudreSensibilite = (theme, fournie) => {
  if (fournie) {
    if (!sensibiliteValide(fournie)) {
      throw new AppError(400, 'VALIDATION', 'Degré de sensibilité invalide');
    }
    return fournie;
  }
  return sensibilitePourTheme(theme);
};

// GET /api/demandes
const lister = asyncHandler(async (req, res) => {
  const { statut, theme, date_debut, date_fin, page } = req.query;
  const resultat = await demandesModel.list(req.user, { statut, theme, date_debut, date_fin, page });
  okPaginated(res, resultat.items, resultat.pagination);
});

// GET /api/demandes/:id
const detail = asyncHandler(async (req, res) => {
  const demande = await chargerDemande(req.params.id);
  verifierLecture(demande, req.user);
  ok(res, demande);
});

// POST /api/demandes
const creer = asyncHandler(async (req, res) => {
  const { titre, theme, description, degre_sensibilite } = req.body;
  const demande = await demandesModel.create({
    titre,
    theme,
    description,
    degre_sensibilite: resoudreSensibilite(theme, degre_sensibilite),
    demandeur_id: req.user.id
  });
  ok(res, demande, 201);
});

// PUT /api/demandes/:id
const modifier = asyncHandler(async (req, res) => {
  const demande = await chargerDemande(req.params.id);
  verifierEcriture(demande, req.user);

  const titre = req.body.titre ?? demande.titre;
  const theme = req.body.theme ?? demande.theme;
  const description = req.body.description ?? demande.description;

  // Si le thème change sans sensibilité explicite, on la recalcule
  const sensibiliteFournie = req.body.degre_sensibilite
    ?? (theme !== demande.theme ? null : demande.degre_sensibilite);

  const maj = await demandesModel.update(req.params.id, {
    titre,
    theme,
    description,
    degre_sensibilite: resoudreSensibilite(theme, sensibiliteFournie)
  });
  ok(res, maj);
});

// ---------------------------------------------------------------------------
// TRANSITIONS DE STATUT — toutes délèguent au moteur (services/workflow.js).
// Aucun UPDATE de `statut` n'est fait ici : c'est la garantie d'atomicité
// (demande + historique + notifications dans une seule transaction).
// ---------------------------------------------------------------------------

// POST /api/demandes/:id/soumettre           (T1)
const soumettre = asyncHandler(async (req, res) => {
  const maj = await workflow.executerTransition(req.params.id, 'Soumise', req.user);
  ok(res, maj);
});

// POST /api/demandes/:id/annuler             (T2)
const annuler = asyncHandler(async (req, res) => {
  const maj = await workflow.executerTransition(req.params.id, 'Annulée', req.user);
  ok(res, maj);
});

// POST /api/demandes/:id/prendre-en-charge   (T3)
const prendreEnCharge = asyncHandler(async (req, res) => {
  const maj = await workflow.executerTransition(req.params.id, 'En cours', req.user);
  ok(res, maj);
});

// POST /api/demandes/:id/complement          (T4)
const demanderComplement = asyncHandler(async (req, res) => {
  const maj = await workflow.executerTransition(req.params.id, 'Complément demandé', req.user, {
    commentaire: req.body.commentaire
  });
  ok(res, maj);
});

// POST /api/demandes/:id/completer           (T5)
const completer = asyncHandler(async (req, res) => {
  const maj = await workflow.executerTransition(req.params.id, 'En cours', req.user);
  ok(res, maj);
});

// POST /api/demandes/:id/valider             (T6)
const valider = asyncHandler(async (req, res) => {
  const maj = await workflow.executerTransition(req.params.id, 'Validée', req.user, {
    avis_juridique: req.body.avis_juridique
  });
  ok(res, maj);
});

// POST /api/demandes/:id/rejeter             (T7)
const rejeter = asyncHandler(async (req, res) => {
  const maj = await workflow.executerTransition(req.params.id, 'Rejetée', req.user, {
    motif_rejet: req.body.motif_rejet
  });
  ok(res, maj);
});

// PUT /api/demandes/:id/theme                (T8 — hors machine à états)
const modifierTheme = asyncHandler(async (req, res) => {
  const demande = await chargerDemande(req.params.id);
  if (demande.statut !== 'En cours') {
    throw new AppError(409, 'INVALID_TRANSITION',
      'Le thème ne peut être modifié que sur une demande en cours de traitement');
  }
  const maj = await demandesModel.updateTheme(
    req.params.id,
    req.body.theme,
    resoudreSensibilite(req.body.theme, null)
  );
  ok(res, maj);
});

// GET /api/demandes/:id/historique
const historique = asyncHandler(async (req, res) => {
  const demande = await chargerDemande(req.params.id);
  verifierLecture(demande, req.user);
  ok(res, await historiqueModel.listerParDemande(req.params.id));
});

// POST /api/demandes/:id/piece-jointe
const uploaderPieceJointe = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'VALIDATION', 'Aucun fichier reçu');

  const demande = await chargerDemande(req.params.id);
  try {
    verifierEcriture(demande, req.user);
  } catch (e) {
    fs.unlink(req.file.path, () => {}); // pas de fichier orphelin si refus
    throw e;
  }

  // Remplacement : supprimer l'ancien fichier du disque
  if (demande.piece_jointe_path) {
    fs.unlink(path.resolve(demande.piece_jointe_path), () => {});
  }

  const maj = await demandesModel.setPieceJointe(req.params.id, {
    nom: req.file.originalname,
    path: req.file.path,
    type: req.file.mimetype,
    taille: req.file.size
  });

  ok(res, {
    piece_jointe_nom: maj.piece_jointe_nom,
    piece_jointe_type: maj.piece_jointe_type,
    piece_jointe_taille: maj.piece_jointe_taille
  }, 201);
});

// GET /api/demandes/:id/piece-jointe
const telechargerPieceJointe = asyncHandler(async (req, res) => {
  const demande = await chargerDemande(req.params.id);
  verifierLecture(demande, req.user);

  if (!demande.piece_jointe_path) {
    throw new AppError(404, 'NOT_FOUND', 'Aucune pièce jointe pour cette demande');
  }

  const fichier = path.resolve(demande.piece_jointe_path);
  if (!fs.existsSync(fichier)) {
    throw new AppError(404, 'NOT_FOUND', 'Fichier introuvable sur le serveur');
  }

  res.download(fichier, demande.piece_jointe_nom);
});

// DELETE /api/demandes/:id/piece-jointe
const supprimerPieceJointe = asyncHandler(async (req, res) => {
  const demande = await chargerDemande(req.params.id);
  verifierEcriture(demande, req.user);

  if (!demande.piece_jointe_path) {
    throw new AppError(404, 'NOT_FOUND', 'Aucune pièce jointe à supprimer');
  }

  fs.unlink(path.resolve(demande.piece_jointe_path), () => {});
  await demandesModel.clearPieceJointe(req.params.id);
  ok(res, { message: 'Pièce jointe supprimée' });
});

module.exports = {
  lister,
  detail,
  creer,
  modifier,
  // Transitions
  soumettre,
  annuler,
  prendreEnCharge,
  demanderComplement,
  completer,
  valider,
  rejeter,
  modifierTheme,
  historique,
  // Pièces jointes
  uploaderPieceJointe,
  telechargerPieceJointe,
  supprimerPieceJointe
};
