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
// Les routes métier (auth, demandes, users, notifications, stats)
// seront montées ici au fil des phases P2 à P5.

// Gestion d'erreurs centralisée (toujours en dernier)
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API démarrée sur http://localhost:${PORT}`));
