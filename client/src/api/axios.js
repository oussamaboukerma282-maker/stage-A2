// Instance Axios centralisée pour tous les appels à l'API.
// - Requête : injecte le JWT (Authorization: Bearer) s'il est présent.
// - Réponse : sur 401, purge la session et redirige vers /login.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Intercepteur de requête : ajoute le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse : gère l'expiration / invalidité de session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Évite une boucle si l'échec vient de la page de login elle-même
      const surLogin = window.location.pathname === '/login';
      if (!surLogin) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
