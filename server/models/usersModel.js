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

module.exports = { findByEmail, findById, findHashById, updatePassword };
