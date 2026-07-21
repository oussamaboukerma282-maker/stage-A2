// Règle métier centralisée : le thème détermine le degré de sensibilité par défaut.
// Référence : DATABASE.md §5.1 / CDC EF05.

const THEMES = {
  'Procuration': 'Moyen',
  'Révision dossier juridique': 'Confidentiel',
  'Moyens de paiements': 'Confidentiel',
  'Clôture de compte': 'Moyen',
  'Autre problématique': 'Faible'
};

const SENSIBILITES = ['Faible', 'Moyen', 'Confidentiel'];

/** Liste des thèmes valides. */
const listeThemes = () => Object.keys(THEMES);

/** Sensibilité par défaut d'un thème (null si thème inconnu). */
const sensibilitePourTheme = (theme) => THEMES[theme] || null;

/** Vérifie qu'un thème est valide. */
const themeValide = (theme) => Object.prototype.hasOwnProperty.call(THEMES, theme);

/** Vérifie qu'un degré de sensibilité est valide. */
const sensibiliteValide = (s) => SENSIBILITES.includes(s);

module.exports = {
  THEMES,
  SENSIBILITES,
  listeThemes,
  sensibilitePourTheme,
  themeValide,
  sensibiliteValide
};
