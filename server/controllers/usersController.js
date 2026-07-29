// Controller de gestion des utilisateurs (réservé ADMIN).

const bcrypt = require('bcryptjs');
const usersModel = require('../models/usersModel');
const { AppError, asyncHandler } = require('../utils/AppError');
const { ok, okPaginated } = require('../helpers/response');

// GET /api/users
const lister = asyncHandler(async (req, res) => {
  const { role, actif, page } = req.query;
  const { items, pagination } = await usersModel.list({ role, actif, page });
  okPaginated(res, items, pagination);
});

// POST /api/users
const creer = asyncHandler(async (req, res) => {
  const { nom, prenom, email, password, role, structure } = req.body;

  // Email unique
  if (await usersModel.findByEmail(email)) {
    throw new AppError(409, 'CONFLICT', 'Un compte utilise déjà cette adresse email');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await usersModel.create({ nom, prenom, email, passwordHash, role, structure });
  ok(res, user, 201);
});

// PUT /api/users/:id
const modifier = asyncHandler(async (req, res) => {
  const existant = await usersModel.findById(req.params.id);
  if (!existant) throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');

  const user = await usersModel.update(req.params.id, {
    nom: req.body.nom ?? existant.nom,
    prenom: req.body.prenom ?? existant.prenom,
    role: req.body.role ?? existant.role,
    structure: req.body.structure ?? existant.structure
  });
  ok(res, user);
});

// PUT /api/users/:id/desactiver   { actif: boolean }
const changerActivation = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Auto-protection : un admin ne peut pas se désactiver lui-même
  if (id === req.user.id && req.body.actif === false) {
    throw new AppError(400, 'VALIDATION', 'Vous ne pouvez pas désactiver votre propre compte');
  }

  const existant = await usersModel.findById(id);
  if (!existant) throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');

  const user = await usersModel.setActif(id, req.body.actif);
  ok(res, user);
});

// GET /api/users/mention?q=&page=   (OPT02 — accessible à tout utilisateur authentifié)
const rechercheMention = asyncHandler(async (req, res) => {
  const { q, page } = req.query;
  const resultat = await usersModel.searchMention(q, page, req.user.id);
  ok(res, resultat);
});

module.exports = { lister, creer, modifier, changerActivation, rechercheMention };
