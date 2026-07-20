// Middleware : exploite le résultat d'express-validator.
// Si des erreurs de validation existent, renvoie 400 avec le premier message.

const { validationResult } = require('express-validator');
const { fail } = require('../helpers/response');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'VALIDATION', errors.array()[0].msg);
  }
  next();
};
