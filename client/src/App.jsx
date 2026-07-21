// Routeur applicatif (remplace la page de test de la Phase 1).
// Structure de navigation sécurisée : les pages métier (Demandes, Utilisateurs)
// sont des placeholders remplis dans les phases P3 et P5.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Accueil from './pages/Accueil';
import Profil from './pages/Profil';
import Demandes from './pages/Demandes';
import NouvelleDemande from './pages/NouvelleDemande';
import ModifierDemande from './pages/ModifierDemande';
import DemandeDetail from './pages/DemandeDetail';
import Placeholder from './pages/Placeholder';
import NotFound from './pages/NotFound';

// Enveloppe une page dans le Layout + la protection de route
const Page = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Page><Accueil /></Page>} />
          <Route path="/demandes" element={<Page><Demandes /></Page>} />
          <Route
            path="/demandes/nouvelle"
            element={<Page roles={['DEMANDEUR']}><NouvelleDemande /></Page>}
          />
          <Route
            path="/demandes/:id/modifier"
            element={<Page roles={['DEMANDEUR']}><ModifierDemande /></Page>}
          />
          <Route path="/demandes/:id" element={<Page><DemandeDetail /></Page>} />
          <Route path="/profil" element={<Page><Profil /></Page>} />
          <Route
            path="/utilisateurs"
            element={<Page roles={['ADMIN']}><Placeholder titre="Gestion des utilisateurs" phase="Phase 5" /></Page>}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
