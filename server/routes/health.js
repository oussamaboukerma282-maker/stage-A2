// Route de santé : prouve que la chaîne Express -> pg -> PostgreSQL fonctionne.
// GET /api/health

const router = require('express').Router();
const pool = require('../config/db');
const { ok, fail } = require('../helpers/response');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time');
    ok(res, { status: 'ok', db: 'connected', time: result.rows[0].time });
  } catch (e) {
    fail(res, 500, 'SERVER_ERROR', 'Base de données injoignable');
  }
});

module.exports = router;
