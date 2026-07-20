// Middleware d'authentification : vérifie le JWT et remplit req.user.

const { verify } = require('../utils/jwt');
const { fail } = require('../helpers/response');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return fail(res, 401, 'UNAUTHORIZED', 'Authentification requise');
  }

  try {
    const payload = verify(token);
    req.user = {
      id: payload.id,
      role: payload.role,
      nom: payload.nom,
      prenom: payload.prenom
    };
    next();
  } catch (e) {
    return fail(res, 401, 'UNAUTHORIZED', 'Session invalide ou expirée');
  }
};
