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

/** Identifiants des juristes et administrateurs actifs (destinataires d'une soumission). */
const idsJuristesEtAdmins = async (client) => {
  const executeur = client || pool;
  const { rows } = await executeur.query(
    `SELECT id FROM users WHERE role IN ('JURISTE', 'ADMIN') AND actif = TRUE`
  );
  return rows.map((r) => r.id);
};

module.exports = { creer, creerPourPlusieurs, idsJuristesEtAdmins };
