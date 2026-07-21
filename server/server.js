// Point d'entrée de l'API — Gestion des Avis Juridiques.

require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globaux
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/demandes', require('./routes/demandes'));
// Les routes restantes (users, notifications, stats) seront montées ici en P5.

// Gestion d'erreurs centralisée (toujours en dernier)
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API démarrée sur http://localhost:${PORT}`));
