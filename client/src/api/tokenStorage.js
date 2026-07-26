// Stockage du token JWT.
// - « Se souvenir de moi » coché  -> localStorage (persiste après fermeture du navigateur)
// - décoché                       -> sessionStorage (effacé à la fermeture de l'onglet)
// La lecture regarde les deux emplacements ; l'écriture nettoie toujours l'autre.

const CLE = 'token';

export const getToken = () =>
  localStorage.getItem(CLE) || sessionStorage.getItem(CLE);

export const setToken = (token, souvenir) => {
  if (souvenir) {
    localStorage.setItem(CLE, token);
    sessionStorage.removeItem(CLE);
  } else {
    sessionStorage.setItem(CLE, token);
    localStorage.removeItem(CLE);
  }
};

export const clearToken = () => {
  localStorage.removeItem(CLE);
  sessionStorage.removeItem(CLE);
};
