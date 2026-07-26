// Controller des notifications (lecture).

const notificationsModel = require('../models/notificationsModel');
const { AppError, asyncHandler } = require('../utils/AppError');
const { ok } = require('../helpers/response');

// GET /api/notifications
const lister = asyncHandler(async (req, res) => {
  const [items, nonLues] = await Promise.all([
    notificationsModel.listerParUser(req.user.id, 20),
    notificationsModel.compterNonLues(req.user.id)
  ]);
  ok(res, { items, nonLues });
});

// PUT /api/notifications/:id/lue
const marquerLue = asyncHandler(async (req, res) => {
  const affectee = await notificationsModel.marquerLue(req.params.id, req.user.id);
  if (!affectee) throw new AppError(404, 'NOT_FOUND', 'Notification introuvable');
  ok(res, { message: 'Notification marquée comme lue' });
});

// PUT /api/notifications/tout-lu
const marquerToutLu = asyncHandler(async (req, res) => {
  const nombre = await notificationsModel.marquerToutLu(req.user.id);
  ok(res, { message: 'Notifications marquées comme lues', nombre });
});

module.exports = { lister, marquerLue, marquerToutLu };
