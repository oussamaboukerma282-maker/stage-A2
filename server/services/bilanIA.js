// Service de génération du « bilan d'activité » par IA (OpenAI).
//
// PRINCIPES DE CONFIDENTIALITÉ (importants — données bancaires) :
//  - On n'envoie QUE des statistiques agrégées et anonymes (compteurs, taux, moyennes).
//  - Une whitelist explicite (payloadAnonyme) garantit qu'aucune donnée nominative
//    ni contenu de demande ne peut fuiter, même en cas d'évolution du modèle de stats.
//  - Les chiffres sont calculés par le SQL applicatif ; l'IA se contente de RÉDIGER
//    l'analyse à partir de ces chiffres (pas d'invention de données).

const { AppError } = require('../utils/AppError');
const logger = require('../config/logger');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Réduit l'objet de stats admin à une charge utile strictement agrégée.
 * Tout champ non listé ici n'est JAMAIS transmis à l'API externe.
 */
function payloadAnonyme(stats) {
  return {
    totalDemandes: stats.totalDemandes,
    repartitionParStatut: stats.parStatut,
    repartitionParTheme: stats.parTheme,
    repartitionParSensibilite: stats.parSensibilite,
    evolutionMensuelle: stats.evolutionMensuelle, // [{ mois: 'YYYY-MM', total: n }]
    delaiMoyenTraitementJours: stats.delaiMoyenJours,
    tauxValidationPct: stats.tauxValidation,
    tauxRejetPct: stats.tauxRejet,
    demandesEnRetard: stats.enRetard
  };
}

const SYSTEM_PROMPT = `Tu es analyste au sein de la Direction des Affaires Juridiques (DAJ) de Natixis Algeria.
Tu rédiges un bilan d'activité managérial, en français, à partir de statistiques agrégées et anonymes
sur les demandes d'avis juridiques.

Règles impératives :
- Utilise UNIQUEMENT les chiffres fournis. N'invente jamais de valeur, de nom ou de fait.
- Si une donnée est absente ou nulle, ne la commente pas plutôt que de supposer.
- Ton professionnel, factuel, concis. Pas de flatterie, pas de généralités creuses.
- Structure la réponse en Markdown avec exactement ces sections (titres en "## ") :
  ## Synthèse
  ## Tendances observées
  ## Points d'attention
  ## Recommandations
- Dans "Synthèse" : 2-3 phrases resituant le volume global et l'état général.
- "Tendances observées" : commente la répartition par statut/thème/sensibilité et l'évolution mensuelle.
- "Points d'attention" : mets en avant les demandes en retard, le taux de rejet, les thèmes dominants.
- "Recommandations" : 2 à 4 puces d'actions concrètes et réalistes.
- Cite les chiffres pertinents entre parenthèses. Reste sous ~350 mots.`;

/**
 * Génère le bilan IA à partir des stats admin.
 * @returns {Promise<{ texte: string, modele: string }>}
 */
async function genererBilan(stats) {
  const cle = process.env.OPENAI_API_KEY;
  if (!cle) {
    throw new AppError(503, 'IA_INDISPONIBLE', "La génération par IA n'est pas configurée (clé OpenAI absente).");
  }
  const modele = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const donnees = payloadAnonyme(stats);

  const corps = JSON.stringify({
    model: modele,
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          "Voici les statistiques agrégées de la période. Rédige le bilan d'activité.\n\n" +
          JSON.stringify(donnees, null, 2)
      }
    ]
  });

  // Appel avec timeout (30 s) + reprise automatique sur erreur réseau transitoire.
  const appelUnique = async () => {
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 30000);
    try {
      return await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
        body: corps,
        signal: ctrl.signal
      });
    } finally {
      clearTimeout(minuteur);
    }
  };

  let reponse, derniereErreur;
  for (let tentative = 1; tentative <= 2; tentative++) {
    try {
      reponse = await appelUnique();
      break;
    } catch (err) {
      derniereErreur = err;
      logger.warn(`Appel OpenAI échoué (tentative ${tentative}/2)`, { message: err.message });
    }
  }
  if (!reponse) {
    logger.error('Appel OpenAI échoué après reprise', { message: derniereErreur?.message });
    throw new AppError(502, 'IA_ERREUR', "Le service d'IA est injoignable. Réessayez plus tard.");
  }

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    logger.error('Réponse OpenAI en erreur', { status: reponse.status, detail: detail.slice(0, 500) });
    const msg = reponse.status === 401
      ? "Clé OpenAI invalide ou expirée."
      : "Le service d'IA a renvoyé une erreur.";
    throw new AppError(502, 'IA_ERREUR', msg);
  }

  const json = await reponse.json();
  const texte = json?.choices?.[0]?.message?.content?.trim();
  if (!texte) {
    throw new AppError(502, 'IA_ERREUR', "Réponse vide du service d'IA.");
  }

  logger.info('Bilan IA généré', { modele, tokens: json?.usage?.total_tokens });
  return { texte, modele };
}

module.exports = { genererBilan, payloadAnonyme };
