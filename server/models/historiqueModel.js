// Modèle historique_statuts — journal IMMUABLE des transitions.
// Règle R5 : ce modèle n'expose QUE des INSERT et des SELECT.
// Aucune fonction UPDATE ni DELETE ne doit jamais être ajoutée ici.

const pool = require('../config/db');

/**
 * Enregistre une transition.
 * @param {object} client - client PG de la transaction en cours (obligatoire pour l'atomicité)
 */
const inserer = async (client, { demande_id, user_id, ancien_statut, nouveau_statut, commentaire }) => {
  const { rows } = await client.query(
    `INSERT INTO historique_statuts
       (demande_id, user_id, ancien_statut, nouveau_statut, commentaire)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [demande_id, user_id, ancien_statut, nouveau_statut, commentaire || null]
  );
  return rows[0];
};

/** Journal chronologique d'une demande (du plus ancien au plus récent). */
const listerParDemande = async (demandeId) => {
  const { rows } = await pool.query(
    `SELECT h.id, h.ancien_statut, h.nouveau_statut, h.commentaire, h.created_at,
            u.prenom AS user_prenom, u.nom AS user_nom, u.role AS user_role
       FROM historique_statuts h
       JOIN users u ON u.id = h.user_id
      WHERE h.demande_id = $1
      ORDER BY h.created_at ASC, h.id ASC`,
    [demandeId]
  );
  return rows;
};

module.exports = { inserer, listerParDemande };
