// Modèle demande_avis : seul endroit qui écrit du SQL sur les demandes.
// Toutes les requêtes sont paramétrées ($1, $2...) — jamais de concaténation de valeurs.

const pool = require('../config/db');

const PAGE_SIZE = 20;

// Colonnes de la demande + noms des acteurs (jointures), pour l'affichage
const SELECT_BASE = `
  SELECT d.*,
         du.nom AS demandeur_nom, du.prenom AS demandeur_prenom, du.structure AS demandeur_structure,
         ju.nom AS juriste_nom,   ju.prenom AS juriste_prenom
    FROM demande_avis d
    JOIN users du ON du.id = d.demandeur_id
    LEFT JOIN users ju ON ju.id = d.juriste_id
`;

/**
 * Liste paginée et filtrée.
 * Règle de visibilité (appliquée EN SQL, jamais côté client) :
 *  - DEMANDEUR        -> uniquement ses propres demandes
 *  - JURISTE / ADMIN  -> toutes SAUF les brouillons (non soumis = privés)
 */
const list = async (user, filtres = {}) => {
  const where = [];
  const params = [];

  if (user.role === 'DEMANDEUR') {
    params.push(user.id);
    where.push(`d.demandeur_id = $${params.length}`);
  } else {
    where.push(`d.statut <> 'Brouillon'`);
  }

  if (filtres.statut) {
    params.push(filtres.statut);
    where.push(`d.statut = $${params.length}`);
  }
  if (filtres.theme) {
    params.push(filtres.theme);
    where.push(`d.theme = $${params.length}`);
  }
  if (filtres.date_debut) {
    params.push(filtres.date_debut);
    where.push(`d.date_creation >= $${params.length}`);
  }
  if (filtres.date_fin) {
    params.push(filtres.date_fin);
    where.push(`d.date_creation <= $${params.length}`);
  }

  const clauseWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Total (pour la pagination)
  const countSql = `SELECT COUNT(*) AS total FROM demande_avis d ${clauseWhere}`;
  const { rows: countRows } = await pool.query(countSql, params);
  const totalItems = parseInt(countRows[0].total, 10);

  // Page demandée
  const page = Math.max(1, parseInt(filtres.page, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const sql = `${SELECT_BASE} ${clauseWhere}
               ORDER BY d.date_creation DESC
               LIMIT ${PAGE_SIZE} OFFSET ${offset}`;
  const { rows } = await pool.query(sql, params);

  return {
    items: rows,
    pagination: {
      page,
      totalPages: Math.max(1, Math.ceil(totalItems / PAGE_SIZE)),
      totalItems
    }
  };
};

/** Détail d'une demande (avec noms des acteurs). */
const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE d.id = $1`, [id]);
  return rows[0] || null;
};

/** Création d'un brouillon. */
const create = async ({ titre, theme, description, degre_sensibilite, demandeur_id }) => {
  const { rows } = await pool.query(
    `INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id)
     VALUES ($1, $2, $3, $4, 'Brouillon', $5)
     RETURNING *`,
    [titre, theme, description, degre_sensibilite, demandeur_id]
  );
  return rows[0];
};

/** Mise à jour des champs modifiables par le demandeur. */
const update = async (id, { titre, theme, description, degre_sensibilite }) => {
  const { rows } = await pool.query(
    `UPDATE demande_avis
        SET titre = $2, theme = $3, description = $4, degre_sensibilite = $5
      WHERE id = $1
      RETURNING *`,
    [id, titre, theme, description, degre_sensibilite]
  );
  return rows[0];
};

/**
 * Modifie le thème et le degré de sensibilité recalculé (transition T8).
 * NB : les changements de STATUT ne passent JAMAIS par ce modèle —
 * ils sont l'affaire exclusive de services/workflow.js.
 */
const updateTheme = async (id, theme, degre_sensibilite) => {
  const { rows } = await pool.query(
    `UPDATE demande_avis SET theme = $2, degre_sensibilite = $3
      WHERE id = $1 RETURNING *`,
    [id, theme, degre_sensibilite]
  );
  return rows[0];
};

/** Enregistre les métadonnées de la pièce jointe. */
const setPieceJointe = async (id, { nom, path, type, taille }) => {
  const { rows } = await pool.query(
    `UPDATE demande_avis
        SET piece_jointe_nom = $2, piece_jointe_path = $3,
            piece_jointe_type = $4, piece_jointe_taille = $5
      WHERE id = $1
      RETURNING *`,
    [id, nom, path, type, taille]
  );
  return rows[0];
};

/** Vide les colonnes de pièce jointe. */
const clearPieceJointe = async (id) => {
  const { rows } = await pool.query(
    `UPDATE demande_avis
        SET piece_jointe_nom = NULL, piece_jointe_path = NULL,
            piece_jointe_type = NULL, piece_jointe_taille = NULL
      WHERE id = $1
      RETURNING *`,
    [id]
  );
  return rows[0];
};

module.exports = {
  PAGE_SIZE,
  list,
  findById,
  create,
  update,
  updateTheme,
  setPieceJointe,
  clearPieceJointe
};
