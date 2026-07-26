// Controller des statistiques (tableaux de bord).

const statsModel = require('../models/statsModel');
const { asyncHandler } = require('../utils/AppError');
const { ok } = require('../helpers/response');

// GET /api/stats/admin
const admin = asyncHandler(async (req, res) => ok(res, await statsModel.admin()));

// GET /api/stats/demandeur
const demandeur = asyncHandler(async (req, res) => ok(res, await statsModel.demandeur(req.user.id)));

// GET /api/stats/juriste
const juriste = asyncHandler(async (req, res) => ok(res, await statsModel.juriste(req.user.id)));

module.exports = { admin, demandeur, juriste };
