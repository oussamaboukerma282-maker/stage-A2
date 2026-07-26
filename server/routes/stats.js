// Routes des statistiques : /api/stats/*  (authentifiées + restreintes par rôle)

const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const ctrl = require('../controllers/statsController');

router.use(auth);

router.get('/admin', roles('ADMIN'), ctrl.admin);
router.get('/demandeur', roles('DEMANDEUR'), ctrl.demandeur);
router.get('/juriste', roles('JURISTE', 'ADMIN'), ctrl.juriste);

module.exports = router;
