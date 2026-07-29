// Middleware de gestion d'erreurs centralisé (monté en dernier dans server.js).
// Capture toute erreur transmise via next(err) et renvoie un format uniforme.

const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  const code = err.statusCode || 500;

  // Les erreurs serveur (5xx) sont journalisées avec la stack ; les erreurs
  // métier attendues (4xx : 400/403/404/409...) en avertissement, sans stack.
  if (code >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${code} ${err.code || ''} : ${err.message}`);
  }

  res.status(code).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Erreur serveur'
    }
  });
};
