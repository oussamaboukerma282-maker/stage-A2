// Layout commun aux pages authentifiées : navbar + zone de contenu.
// La navbar affiche des liens conditionnés au rôle et le bouton de déconnexion.

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import ConfirmModal from './ConfirmModal';

const roleLibelle = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };

function ThemeToggle() {
  const { theme, basculer } = useTheme();
  return (
    <button onClick={basculer} aria-label="Changer de thème"
            className="p-2 rounded-md hover:bg-white/10 transition text-white" title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
      {theme === 'dark' ? (
        // Soleil
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.5 6.5-1.5-1.5M6 6 4.5 4.5m13 0L16 6M6 18l-1.5 1.5" />
        </svg>
      ) : (
        // Lune
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

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
  const [confirmationDeconnexion, setConfirmationDeconnexion] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <span className="text-sm text-white/90 hidden md:inline ml-1">
              {user?.prenom} {user?.nom}
              <span className="text-white/60"> · {roleLibelle[user?.role] || user?.role}</span>
            </span>
            <button
              onClick={() => setConfirmationDeconnexion(true)}
              className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

      <ConfirmModal
        open={confirmationDeconnexion}
        onClose={() => setConfirmationDeconnexion(false)}
        onConfirm={logout}
        titre="Se déconnecter ?"
        description="Vous allez être déconnecté de votre session. Vous devrez vous reconnecter pour accéder à l'application."
        libelleConfirmer="Se déconnecter"
      />
    </div>
  );
}
