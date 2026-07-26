// Routes des notifications : /api/notifications/*  (toutes authentifiées)

const router = require('express').Router();
const { param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/notificationsController');

router.use(auth);

router.get('/', ctrl.lister);
router.put('/tout-lu', ctrl.marquerToutLu);
router.put('/:id/lue',
  param('id').isInt({ min: 1 }).withMessage('Identifiant invalide'),
  validate,
  ctrl.marquerLue
);

module.exports = router;
