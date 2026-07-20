// Middleware d'autorisation par rôle. À utiliser APRÈS le middleware auth.
// Exemple : router.get('/users', auth, roles('ADMIN'), controller)

const { fail } = require('../helpers/response');

const roles = (...autorises) => (req, res, next) => {
  if (!req.user || !autorises.includes(req.user.role)) {
    return fail(res, 403, 'FORBIDDEN', 'Accès non autorisé');
  }
  next();
};

module.exports = roles;
