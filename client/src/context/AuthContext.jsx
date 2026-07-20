// Contexte d'authentification global.
// Gère : user courant, token (persisté en localStorage), login/logout,
// et la réhydratation de la session au rechargement (F5) via GET /auth/me.

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chargement, setChargement] = useState(true); // true tant que la réhydratation n'est pas finie

  // Au montage : si un token existe, on récupère le profil (réhydratation)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChargement(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setChargement(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    chargement,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
