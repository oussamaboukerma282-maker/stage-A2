// Erreur métier typée + wrapper async pour les controllers.

/** Erreur portant un statut HTTP et un code applicatif, captée par errorHandler. */
class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** Enveloppe un handler async : toute erreur est transmise à next() (donc à errorHandler). */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { AppError, asyncHandler };
