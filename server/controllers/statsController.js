// Controller des statistiques (tableaux de bord).

const statsModel = require('../models/statsModel');
const { genererBilan } = require('../services/bilanIA');
const { asyncHandler } = require('../utils/AppError');
const { ok } = require('../helpers/response');

// GET /api/stats/admin
const admin = asyncHandler(async (req, res) => ok(res, await statsModel.admin()));

// POST /api/stats/admin/bilan-ia — synthèse rédigée par IA (agrégats anonymes uniquement)
const bilanIA = asyncHandler(async (req, res) => {
  const stats = await statsModel.admin();
  const { texte, modele } = await genererBilan(stats);
  ok(res, { texte, modele, genereLe: new Date().toISOString() });
});

// GET /api/stats/demandeur
const demandeur = asyncHandler(async (req, res) => ok(res, await statsModel.demandeur(req.user.id)));

// GET /api/stats/juriste
const juriste = asyncHandler(async (req, res) => ok(res, await statsModel.juriste(req.user.id)));

module.exports = { admin, bilanIA, demandeur, juriste };
