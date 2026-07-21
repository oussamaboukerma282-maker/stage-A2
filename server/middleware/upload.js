// Middleware d'upload (Multer) pour les pièces jointes.
// Contraintes : PDF/DOCX/PNG/JPG, 10 Mo max, nom de fichier UUID sur disque.
// Le dossier /uploads n'est JAMAIS servi en statique : l'accès passe par la route contrôlée.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { fail } = require('../helpers/response');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

// Types autorisés : MIME -> extensions acceptées
const TYPES_AUTORISES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`)
});

// On vérifie le type MIME ET l'extension : le MIME envoyé par le client est falsifiable.
const fileFilter = (req, file, cb) => {
  const extensions = TYPES_AUTORISES[file.mimetype];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!extensions || !extensions.includes(ext)) {
    return cb(new Error('FILE_TYPE'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

/** Middleware final : gère proprement les erreurs Multer en réponses françaises. */
const uploadPieceJointe = (req, res, next) => {
  upload.single('fichier')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMo = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      return fail(res, 400, 'FILE_TOO_LARGE', `Le fichier dépasse la taille maximale de ${maxMo} Mo`);
    }
    if (err.message === 'FILE_TYPE') {
      return fail(res, 400, 'FILE_TYPE', 'Type de fichier non autorisé (PDF, DOCX, PNG ou JPG uniquement)');
    }
    return fail(res, 400, 'VALIDATION', "Erreur lors de l'envoi du fichier");
  });
};

module.exports = { uploadPieceJointe, TYPES_AUTORISES, MAX_FILE_SIZE };
