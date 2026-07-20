// Controller d'authentification : login, me, changePassword.

const bcrypt = require('bcryptjs');
const usersModel = require('../models/usersModel');
const { sign } = require('../utils/jwt');
const { AppError, asyncHandler } = require('../utils/AppError');
const { ok } = require('../helpers/response');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await usersModel.findByEmail(email);

  // Message générique volontaire (anti-énumération) : ne jamais révéler
  // si c'est l'email, le mot de passe ou le compte désactivé qui pose problème.
  if (!user || !user.actif || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, 'UNAUTHORIZED', 'Identifiants invalides');
  }

  const token = sign({ id: user.id, role: user.role, nom: user.nom, prenom: user.prenom });

  ok(res, {
    token,
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      structure: user.structure
    }
  });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await usersModel.findById(req.user.id);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');
  ok(res, user);
});

// PUT /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { ancien, nouveau } = req.body;

  const current = await usersModel.findHashById(req.user.id);
  if (!current || !(await bcrypt.compare(ancien, current.password_hash))) {
    throw new AppError(401, 'UNAUTHORIZED', 'Ancien mot de passe incorrect');
  }

  const hash = await bcrypt.hash(nouveau, 12);
  await usersModel.updatePassword(req.user.id, hash);
  ok(res, { message: 'Mot de passe modifié' });
});

module.exports = { login, me, changePassword };
