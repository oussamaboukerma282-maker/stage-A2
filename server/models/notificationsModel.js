// Modèle notifications — écriture (Phase 4).
// L'API de lecture (liste, marquer comme lue) sera ajoutée en Phase 5.

const pool = require('../config/db');

/**
 * Crée une notification pour un destinataire.
 * @param {object} client - client PG de la transaction en cours
 */
const creer = async (client, { user_id, demande_id, message }) => {
  const { rows } = await client.query(
    `INSERT INTO notifications (user_id, demande_id, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [user_id, demande_id, message]
  );
  return rows[0];
};

/** Crée la même notification pour plusieurs destinataires. */
const creerPourPlusieurs = async (client, userIds, { demande_id, message }) => {
  const creees = [];
  for (const user_id of userIds) {
    creees.push(await creer(client, { user_id, demande_id, message }));
  }
  return creees;
};

/**
 * Notifications de mention (OPT02).
 * Sécurise la liste : dédoublonnage, exclusion de l'auteur, et on ne notifie
 * que des utilisateurs réellement actifs (les ids sont fournis par le client).
 * @returns {number} nombre de notifications créées
 */
const creerPourMentions = async (auteurId, userIds, { demande_id, message }) => {
  const cibles = [...new Set(userIds)].filter((id) => Number.isInteger(id) && id !== auteurId);
  if (cibles.length === 0) return 0;

  const { rows } = await pool.query(
    'SELECT id FROM users WHERE id = ANY($1) AND actif = TRUE',
    [cibles]
  );
  for (const r of rows) {
    await pool.query(
      'INSERT INTO notifications (user_id, demande_id, message) VALUES ($1, $2, $3)',
      [r.id, demande_id, message]
    );
  }
  return rows.length;
};

/** Identifiants des juristes et administrateurs actifs (destinataires d'une soumission). */
const idsJuristesEtAdmins = async (client) => {
  const executeur = client || pool;
  const { rows } = await executeur.query(
    `SELECT id FROM users WHERE role IN ('JURISTE', 'ADMIN') AND actif = TRUE`
  );
  return rows.map((r) => r.id);
};

// --------------------------------------------------------------------------
// LECTURE (Phase 5)
// --------------------------------------------------------------------------

/** Les N dernières notifications d'un utilisateur (plus récentes d'abord). */
const listerParUser = async (userId, limite = 20) => {
  const { rows } = await pool.query(
    `SELECT id, demande_id, message, lue, created_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT $2`,
    [userId, limite]
  );
  return rows;
};

/** Nombre de notifications non lues d'un utilisateur. */
const compterNonLues = async (userId) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = $1 AND lue = FALSE',
    [userId]
  );
  return parseInt(rows[0].total, 10);
};

/**
 * Marque une notification comme lue.
 * Le filtre sur user_id garantit qu'on ne touche jamais la notif d'un autre.
 * @returns {boolean} true si une ligne a été affectée
 */
const marquerLue = async (id, userId) => {
  const { rowCount } = await pool.query(
    'UPDATE notifications SET lue = TRUE WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

/** Marque toutes les notifications non lues d'un utilisateur comme lues. */
const marquerToutLu = async (userId) => {
  const { rowCount } = await pool.query(
    'UPDATE notifications SET lue = TRUE WHERE user_id = $1 AND lue = FALSE',
    [userId]
  );
  return rowCount;
};

module.exports = {
  creer,
  creerPourPlusieurs,
  creerPourMentions,
  idsJuristesEtAdmins,
  listerParUser,
  compterNonLues,
  marquerLue,
  marquerToutLu
};
