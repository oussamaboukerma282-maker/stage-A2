// Garde de route : protège l'accès selon l'authentification et le rôle.
// - Non authentifié -> redirection /login
// - Rôle non autorisé -> redirection / (accueil)

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, chargement } = useAuth();

  // Attendre la fin de la réhydratation avant de décider (évite un flash vers /login au F5)
  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
