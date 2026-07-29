// Modèle users : seul endroit qui écrit du SQL sur la table users.
// Requêtes toujours paramétrées (anti-injection).

const pool = require('../config/db');

/** Recherche par email — renvoie le password_hash (nécessaire au login). */
const findByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

/** Recherche par id — SANS password_hash (profil sûr à renvoyer). */
const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, nom, prenom, email, role, structure, actif, created_at
       FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

/** Récupère l'id + le hash par id (pour vérifier l'ancien mot de passe). */
const findHashById = async (id) => {
  const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};

/** Met à jour le hash du mot de passe. */
const updatePassword = async (id, passwordHash) => {
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, passwordHash]);
};

// --------------------------------------------------------------------------
// GESTION DES UTILISATEURS (Phase 5 — Admin). Jamais de password_hash renvoyé.
// --------------------------------------------------------------------------

const PAGE_SIZE = 20;

/** Liste paginée + filtres role / actif. */
const list = async ({ role, actif, page } = {}) => {
  const where = [];
  const params = [];
  if (role) { params.push(role); where.push(`role = $${params.length}`); }
  if (actif !== undefined && actif !== '') {
    params.push(actif === 'true' || actif === true);
    where.push(`actif = $${params.length}`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows: countRows } = await pool.query(`SELECT COUNT(*) AS total FROM users ${clause}`, params);
  const totalItems = parseInt(countRows[0].total, 10);

  const p = Math.max(1, parseInt(page, 10) || 1);
  const offset = (p - 1) * PAGE_SIZE;
  const { rows } = await pool.query(
    `SELECT id, nom, prenom, email, role, structure, actif, created_at
       FROM users ${clause}
       ORDER BY nom, prenom
       LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    params
  );
  return { items: rows, pagination: { page: p, totalPages: Math.max(1, Math.ceil(totalItems / PAGE_SIZE)), totalItems } };
};

/** Création. Renvoie l'utilisateur SANS le hash. */
const create = async ({ nom, prenom, email, passwordHash, role, structure }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (nom, prenom, email, password_hash, role, structure)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nom, prenom, email, role, structure, actif, created_at`,
    [nom, prenom, email, passwordHash, role, structure || null]
  );
  return rows[0];
};

/** Mise à jour des champs modifiables (pas l'email ni le mot de passe). */
const update = async (id, { nom, prenom, role, structure }) => {
  const { rows } = await pool.query(
    `UPDATE users SET nom = $2, prenom = $3, role = $4, structure = $5
      WHERE id = $1
      RETURNING id, nom, prenom, email, role, structure, actif, created_at`,
    [id, nom, prenom, role, structure || null]
  );
  return rows[0] || null;
};

/**
 * Recherche paginée d'utilisateurs pour les mentions (OPT02).
 * Renvoie 10 résultats max + un indicateur hasMore.
 * Astuce : on demande LIMIT+1 lignes ; si on en reçoit une de plus,
 * c'est qu'il existe une page suivante (pas besoin d'un COUNT séparé).
 */
const MENTION_PAGE = 10;
const searchMention = async (q, page, excludeId) => {
  const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * MENTION_PAGE;
  const terme = `%${(q || '').trim()}%`;
  const { rows } = await pool.query(
    `SELECT id, prenom, nom, role
       FROM users
      WHERE actif = TRUE
        AND id <> $1
        AND (prenom ILIKE $2 OR nom ILIKE $2 OR (prenom || ' ' || nom) ILIKE $2)
      ORDER BY prenom, nom
      LIMIT ${MENTION_PAGE + 1} OFFSET ${offset}`,
    [excludeId, terme]
  );
  const hasMore = rows.length > MENTION_PAGE;
  return { items: rows.slice(0, MENTION_PAGE), hasMore };
};

/** Active ou désactive un compte. */
const setActif = async (id, actif) => {
  const { rows } = await pool.query(
    `UPDATE users SET actif = $2 WHERE id = $1
      RETURNING id, nom, prenom, email, role, structure, actif, created_at`,
    [id, actif]
  );
  return rows[0] || null;
};

module.exports = {
  findByEmail, findById, findHashById, updatePassword,
  list, create, update, setActif, searchMention
};
