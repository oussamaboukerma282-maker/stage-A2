// Helpers de réponse HTTP — format unique pour toute l'API (voir CONVENTIONS.md §4).

/** Réponse de succès : { success: true, data } */
const ok = (res, data, code = 200) =>
  res.status(code).json({ success: true, data });

/** Réponse d'erreur : { success: false, error: { code, message } } */
const fail = (res, code, errorCode, message) =>
  res.status(code).json({ success: false, error: { code: errorCode, message } });

module.exports = { ok, fail };
