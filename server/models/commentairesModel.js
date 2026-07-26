// Modèle commentaires (OPT01) — fil de discussion sur une demande.

const pool = require('../config/db');

/** Liste chronologique des commentaires d'une demande (avec auteur). */
const listerParDemande = async (demandeId) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.contenu, c.created_at,
            c.auteur_id, u.prenom AS auteur_prenom, u.nom AS auteur_nom, u.role AS auteur_role
       FROM commentaires c
       JOIN users u ON u.id = c.auteur_id
      WHERE c.demande_id = $1
      ORDER BY c.created_at ASC, c.id ASC`,
    [demandeId]
  );
  return rows;
};

/** Ajoute un commentaire. */
const creer = async ({ demande_id, auteur_id, contenu }) => {
  const { rows } = await pool.query(
    `INSERT INTO commentaires (demande_id, auteur_id, contenu)
     VALUES ($1, $2, $3)
     RETURNING id, contenu, created_at, auteur_id`,
    [demande_id, auteur_id, contenu]
  );
  return rows[0];
};

module.exports = { listerParDemande, creer };
