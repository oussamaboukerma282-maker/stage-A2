// Pool de connexions PostgreSQL (node-postgres).
// La chaîne de connexion vient de la variable d'environnement DATABASE_URL.

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
