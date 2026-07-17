// Middleware de gestion d'erreurs centralisé (monté en dernier dans server.js).
// Capture toute erreur transmise via next(err) et renvoie un format uniforme.

module.exports = (err, req, res, next) => {
  console.error(err);
  const code = err.statusCode || 500;
  res.status(code).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Erreur serveur'
    }
  });
};
