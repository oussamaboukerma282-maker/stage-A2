// Instance Axios centralisée pour tous les appels à l'API.
// L'intercepteur JWT (ajout du token, gestion du 401) sera ajouté en Phase 2.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

export default api;
