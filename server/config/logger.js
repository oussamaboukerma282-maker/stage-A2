// Journalisation centralisée (Winston).
// - Fichiers : logs/app.log (tout) et logs/error.log (erreurs seulement)
// - Console lisible et colorée en développement
// Référence CDC §7 (Traçabilité — Logs) et §8 (stack).

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  // Format des fichiers : horodatage + stack des erreurs + JSON structuré
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'app.log') })
  ]
});

// En développement : sortie console colorée et concise
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    )
  }));
}

module.exports = logger;
