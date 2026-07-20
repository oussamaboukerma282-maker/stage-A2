// Accueil — placeholder de la Phase 2.
// Les vrais tableaux de bord (par rôle) seront construits en Phase 5.

import { useAuth } from '../context/AuthContext';

export default function Accueil() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-bold text-marine mb-2">Bonjour {user?.prenom} 👋</h1>
      <p className="text-gray-600">
        Bienvenue sur l'application de gestion des avis juridiques.
      </p>
      <div className="mt-6 bg-white rounded-lg shadow p-6 text-gray-500">
        Le tableau de bord adapté à votre rôle
        (<span className="font-medium">{user?.role}</span>) sera disponible prochainement.
      </div>
    </div>
  );
}
