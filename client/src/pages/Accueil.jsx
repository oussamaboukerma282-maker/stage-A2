// Accueil : aiguille vers le tableau de bord correspondant au rôle connecté.

import { useAuth } from '../context/AuthContext';
import DashboardAdmin from './dashboards/DashboardAdmin';
import DashboardJuriste from './dashboards/DashboardJuriste';
import DashboardDemandeur from './dashboards/DashboardDemandeur';

export default function Accueil() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') return <DashboardAdmin />;
  if (user?.role === 'JURISTE') return <DashboardJuriste />;
  return <DashboardDemandeur />;
}
