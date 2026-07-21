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

// Soumission (transition T1 — sera refactorée en P4 via le moteur de transitions)
router.post('/:id/soumettre', roles('DEMANDEUR'), idValide, validate, ctrl.soumettre);

// Pièces jointes
router.post('/:id/piece-jointe', roles('DEMANDEUR'), uploadPieceJointe, ctrl.uploaderPieceJointe);
router.get('/:id/piece-jointe', idValide, validate, ctrl.telechargerPieceJointe);
router.delete('/:id/piece-jointe', roles('DEMANDEUR'), idValide, validate, ctrl.supprimerPieceJointe);

module.exports = router;
