// Layout commun aux pages authentifiées : navbar + zone de contenu.
// La navbar affiche des liens conditionnés au rôle et le bouton de déconnexion.

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLibelle = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const actif = pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
        actif ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primaire text-white shadow">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">Avis Juridiques</span>
            <span className="text-white/60 text-sm hidden sm:inline">— Natixis DAJ</span>
          </div>

          <div className="flex items-center gap-1">
            <NavLink to="/">Accueil</NavLink>
            <NavLink to="/demandes">Demandes</NavLink>
            {user?.role === 'ADMIN' && <NavLink to="/utilisateurs">Utilisateurs</NavLink>}
            <NavLink to="/profil">Profil</NavLink>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/90 hidden md:inline">
              {user?.prenom} {user?.nom}
              <span className="text-white/60"> · {roleLibelle[user?.role] || user?.role}</span>
            </span>
            <button
              onClick={logout}
              className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
