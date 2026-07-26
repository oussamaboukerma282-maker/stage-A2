// Routes de gestion des utilisateurs : /api/users/*  (réservées ADMIN)

const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/usersController');

router.use(auth, roles('ADMIN'));

const idValide = param('id').isInt({ min: 1 }).withMessage('Identifiant invalide');

router.get('/', ctrl.lister);

router.post('/',
  [
    body('nom').trim().notEmpty().withMessage('Le nom est requis'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
    body('role').isIn(['DEMANDEUR', 'JURISTE', 'ADMIN']).withMessage('Rôle invalide')
  ],
  validate,
  ctrl.creer
);

router.put('/:id',
  [
    idValide,
    body('role').optional().isIn(['DEMANDEUR', 'JURISTE', 'ADMIN']).withMessage('Rôle invalide')
  ],
  validate,
  ctrl.modifier
);

router.put('/:id/desactiver',
  [idValide, body('actif').isBoolean().withMessage('Le champ actif doit être un booléen')],
  validate,
  ctrl.changerActivation
);

module.exports = router;
