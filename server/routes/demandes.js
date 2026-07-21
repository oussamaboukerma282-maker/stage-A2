// Routes des demandes : /api/demandes/*
// Toutes les routes sont authentifiées ; certaines sont restreintes par rôle.

const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const { uploadPieceJointe } = require('../middleware/upload');
const { listeThemes } = require('../config/themes');
const ctrl = require('../controllers/demandesController');

// Toutes les routes ci-dessous exigent une authentification
router.use(auth);

const idValide = param('id').isInt({ min: 1 }).withMessage('Identifiant invalide');

const champsDemande = [
  body('titre').trim().isLength({ min: 3, max: 250 })
    .withMessage('Le titre doit contenir entre 3 et 250 caractères'),
  body('theme').isIn(listeThemes()).withMessage('Thème invalide'),
  body('description').trim().isLength({ min: 10 })
    .withMessage('La description doit contenir au moins 10 caractères')
];

// Liste (filtrage par rôle appliqué côté modèle)
router.get('/', ctrl.lister);

// Création — réservée au DEMANDEUR
router.post('/', roles('DEMANDEUR'), champsDemande, validate, ctrl.creer);

// Détail
router.get('/:id', idValide, validate, ctrl.detail);

// Modification — réservée au DEMANDEUR propriétaire (vérifié dans le controller)
router.put(
  '/:id',
  roles('DEMANDEUR'),
  [
    idValide,
    body('titre').optional().trim().isLength({ min: 3, max: 250 })
      .withMessage('Le titre doit contenir entre 3 et 250 caractères'),
    body('theme').optional().isIn(listeThemes()).withMessage('Thème invalide'),
    body('description').optional().trim().isLength({ min: 10 })
      .withMessage('La description doit contenir au moins 10 caractères')
  ],
  validate,
  ctrl.modifier
);

// ---------------------------------------------------------------------------
// TRANSITIONS (T1 → T8) — la matrice, les rôles et la propriété sont vérifiés
// par le moteur (services/workflow.js). Les routes ne font que valider la forme.
// ---------------------------------------------------------------------------
router.post('/:id/soumettre',         idValide, validate, ctrl.soumettre);          // T1
router.post('/:id/annuler',           idValide, validate, ctrl.annuler);            // T2
router.post('/:id/prendre-en-charge', idValide, validate, ctrl.prendreEnCharge);    // T3

router.post('/:id/complement',                                                       // T4
  [idValide, body('commentaire').trim().isLength({ min: 10, max: 2000 })
    .withMessage('Le commentaire doit contenir entre 10 et 2000 caractères')],
  validate, ctrl.demanderComplement);

router.post('/:id/completer',         idValide, validate, ctrl.completer);          // T5

router.post('/:id/valider',                                                          // T6
  [idValide, body('avis_juridique').trim().isLength({ min: 10, max: 5000 })
    .withMessage("L'avis juridique doit contenir entre 10 et 5000 caractères")],
  validate, ctrl.valider);

router.post('/:id/rejeter',                                                          // T7
  [idValide, body('motif_rejet').trim().isLength({ min: 10, max: 2000 })
    .withMessage('Le motif de rejet doit contenir entre 10 et 2000 caractères')],
  validate, ctrl.rejeter);

router.put('/:id/theme',                                                             // T8
  roles('JURISTE', 'ADMIN'),
  [idValide, body('theme').isIn(listeThemes()).withMessage('Thème invalide')],
  validate, ctrl.modifierTheme);

// Journal d'activité
router.get('/:id/historique', idValide, validate, ctrl.historique);

// Pièces jointes
router.post('/:id/piece-jointe', roles('DEMANDEUR'), uploadPieceJointe, ctrl.uploaderPieceJointe);
router.get('/:id/piece-jointe', idValide, validate, ctrl.telechargerPieceJointe);
router.delete('/:id/piece-jointe', roles('DEMANDEUR'), idValide, validate, ctrl.supprimerPieceJointe);

module.exports = router;
