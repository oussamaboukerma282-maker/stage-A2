// Tableau de bord Demandeur : compteurs par statut + dernières demandes.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import StatutBadge from '../../components/StatutBadge';
import { useAuth } from '../../context/AuthContext';

const formaterDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function DashboardDemandeur() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats/demandeur').then((res) => setStats(res.data.data)).catch(() => {});
  }, []);

  if (!stats) return <p className="text-gray-400">Chargement…</p>;

  const s = stats.parStatut;
  const cloturees = (s['Validée'] || 0) + (s['Rejetée'] || 0) + (s['Annulée'] || 0);
  const enTraitement = (s['Soumise'] || 0) + (s['En cours'] || 0) + (s['Complément demandé'] || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-marine dark:text-purple-300">Bonjour {user?.prenom} 👋</h1>
        <Link to="/demandes/nouvelle"
          className="bg-primaire text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primaire/90 transition">
          + Nouvelle demande
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard titre="Brouillons" valeur={s['Brouillon'] || 0} couleur="gris" to="/demandes?statut=Brouillon" />
        <StatCard titre="En traitement" valeur={enTraitement} couleur="ambre" to="/demandes?statut=En cours" />
        <StatCard titre="Clôturées" valeur={cloturees} couleur="vert" to="/demandes?statut=Validée" />
        <StatCard titre="Total" valeur={stats.total} couleur="marine" to="/demandes" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">Mes dernières demandes</h2>
          <Link to="/demandes" className="text-sm text-primaire hover:underline">Voir tout</Link>
        </div>
        {stats.recentes.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Aucune demande pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {stats.recentes.map((d) => (
                <tr key={d.id} onClick={() => navigate(`/demandes/${d.id}`)}
                    className="border-t border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:bg-gray-700/40 cursor-pointer">
                  <td className="px-5 py-3 text-gray-400 w-12">#{d.id}</td>
                  <td className="px-3 py-3 font-medium text-gray-800 dark:text-gray-100">{d.titre}</td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{d.theme}</td>
                  <td className="px-3 py-3"><StatutBadge statut={d.statut} /></td>
                  <td className="px-5 py-3 text-gray-400 text-right">{formaterDate(d.date_creation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
