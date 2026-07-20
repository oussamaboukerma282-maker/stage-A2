// Routes d'authentification : /api/auth/*

const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
  ],
  validate,
  authController.login
);

// GET /api/auth/me  (protégé)
router.get('/me', auth, authController.me);

// PUT /api/auth/password  (protégé)
router.put(
  '/password',
  auth,
  [
    body('ancien').notEmpty().withMessage('Ancien mot de passe requis'),
    body('nouveau').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
  ],
  validate,
  authController.changePassword
);

module.exports = router;
