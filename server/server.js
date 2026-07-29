// Point d'entrée de l'API — Gestion des Avis Juridiques.

require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');

const app = express();

// Middlewares globaux
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Journalisation des requêtes HTTP : méthode, URL, statut, durée
app.use((req, res, next) => {
  const debut = Date.now();
  res.on('finish', () => {
    const duree = Date.now() - debut;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duree}ms`;
    // Les réponses 4xx/5xx sont journalisées en warn/error, le reste en info
    if (res.statusCode >= 500) logger.error(message);
    else if (res.statusCode >= 400) logger.warn(message);
    else logger.info(message);
  });
  next();
});

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/demandes', require('./routes/demandes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/users', require('./routes/users'));

// Gestion d'erreurs centralisée (toujours en dernier)
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`API démarrée sur http://localhost:${PORT}`));
