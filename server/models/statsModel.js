// Modèle des statistiques — agrégations SQL (aucun calcul sur des listes en JS).

const pool = require('../config/db');

/** Transforme des lignes {cle, total} en objet { cle: nombre }. */
const enObjet = (rows, cleCol, valCol = 'total') =>
  rows.reduce((acc, r) => { acc[r[cleCol]] = parseInt(r[valCol], 10); return acc; }, {});

// --------------------------------------------------------------------------
// ADMIN — statistiques globales
// --------------------------------------------------------------------------
const admin = async () => {
  const [statut, theme, sensibilite, mensuel, indicateurs] = await Promise.all([
    pool.query('SELECT statut AS cle, COUNT(*) AS total FROM demande_avis GROUP BY statut'),
    pool.query('SELECT theme AS cle, COUNT(*) AS total FROM demande_avis GROUP BY theme ORDER BY total DESC'),
    pool.query('SELECT degre_sensibilite AS cle, COUNT(*) AS total FROM demande_avis GROUP BY degre_sensibilite'),
    pool.query(
      `SELECT to_char(date_trunc('month', date_creation), 'YYYY-MM') AS cle, COUNT(*) AS total
         FROM demande_avis
        WHERE date_creation >= date_trunc('month', NOW()) - INTERVAL '5 months'
        GROUP BY 1 ORDER BY 1`
    ),
    pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE statut = 'Validée')  AS validees,
         COUNT(*) FILTER (WHERE statut = 'Rejetée')  AS rejetees,
         COUNT(*) FILTER (WHERE statut IN ('Soumise','En cours','Complément demandé')) AS en_retard_base,
         AVG(EXTRACT(EPOCH FROM (date_traitement - date_soumission)) / 86400.0)
           FILTER (WHERE date_traitement IS NOT NULL AND date_soumission IS NOT NULL) AS delai_moyen_jours
       FROM demande_avis`
    )
  ]);

  const ind = indicateurs.rows[0];
  const validees = parseInt(ind.validees, 10);
  const rejetees = parseInt(ind.rejetees, 10);
  const clot = validees + rejetees;

  // "En retard" : demandes actives (non clôturées) soumises depuis plus de 7 jours
  const retard = await pool.query(
    `SELECT COUNT(*) AS total FROM demande_avis
      WHERE statut IN ('Soumise','En cours','Complément demandé')
        AND date_soumission IS NOT NULL
        AND date_soumission < NOW() - INTERVAL '7 days'`
  );

  return {
    totalDemandes: parseInt(ind.total, 10),
    parStatut: enObjet(statut.rows, 'cle'),
    parTheme: enObjet(theme.rows, 'cle'),
    parSensibilite: enObjet(sensibilite.rows, 'cle'),
    evolutionMensuelle: mensuel.rows.map((r) => ({ mois: r.cle, total: parseInt(r.total, 10) })),
    delaiMoyenJours: ind.delai_moyen_jours != null ? Math.round(parseFloat(ind.delai_moyen_jours) * 10) / 10 : null,
    tauxValidation: clot > 0 ? Math.round((validees / clot) * 100) : 0, // garde-fou division par zéro
    tauxRejet: clot > 0 ? Math.round((rejetees / clot) * 100) : 0,
    enRetard: parseInt(retard.rows[0].total, 10)
  };
};

// --------------------------------------------------------------------------
// DEMANDEUR — ses propres demandes
// --------------------------------------------------------------------------
const demandeur = async (userId) => {
  const [statut, recentes] = await Promise.all([
    pool.query('SELECT statut AS cle, COUNT(*) AS total FROM demande_avis WHERE demandeur_id = $1 GROUP BY statut', [userId]),
    pool.query(
      `SELECT id, titre, theme, statut, date_creation
         FROM demande_avis WHERE demandeur_id = $1
         ORDER BY date_creation DESC LIMIT 5`,
      [userId]
    )
  ]);
  const parStatut = enObjet(statut.rows, 'cle');
  const total = Object.values(parStatut).reduce((a, b) => a + b, 0);
  return { total, parStatut, recentes: recentes.rows };
};

// --------------------------------------------------------------------------
// JURISTE — sa charge de travail
// --------------------------------------------------------------------------
const juriste = async (userId) => {
  const [compteurs, aTraiter] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE statut = 'Soumise') AS a_traiter,
         COUNT(*) FILTER (WHERE statut = 'En cours' AND juriste_id = $1) AS mes_en_cours,
         COUNT(*) FILTER (WHERE statut IN ('Validée','Rejetée') AND juriste_id = $1) AS mes_traitees
       FROM demande_avis`,
      [userId]
    ),
    pool.query(
      `SELECT d.id, d.titre, d.theme, d.degre_sensibilite, d.date_soumission,
              u.prenom AS demandeur_prenom, u.nom AS demandeur_nom
         FROM demande_avis d JOIN users u ON u.id = d.demandeur_id
        WHERE d.statut = 'Soumise'
        ORDER BY d.date_soumission ASC LIMIT 8`
    )
  ]);
  const c = compteurs.rows[0];
  return {
    aTraiter: parseInt(c.a_traiter, 10),
    mesEnCours: parseInt(c.mes_en_cours, 10),
    mesTraitees: parseInt(c.mes_traitees, 10),
    recentesATraiter: aTraiter.rows
  };
};

module.exports = { admin, demandeur, juriste };
