// Tableau de bord Juriste : charge de travail + file d'attente à traiter.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';

const formaterDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function DashboardJuriste() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats/juriste').then((res) => setStats(res.data.data)).catch(() => {});
  }, []);

  if (!stats) return <p className="text-gray-400">Chargement…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-marine mb-6">Bonjour {user?.prenom} 👋</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard titre="À traiter" valeur={stats.aTraiter} sousTitre="demandes soumises" couleur="ambre" to="/demandes?statut=Soumise" />
        <StatCard titre="Mes dossiers en cours" valeur={stats.mesEnCours} couleur="primaire" to="/demandes?statut=En cours" />
        <StatCard titre="Mes dossiers traités" valeur={stats.mesTraitees} couleur="vert" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">File d'attente — demandes à prendre en charge</h2>
          <p className="text-xs text-gray-400">Les plus anciennes en premier</p>
        </div>
        {stats.recentesATraiter.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Aucune demande en attente. 🎉</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-5 py-2 font-medium">#</th>
                <th className="text-left px-3 py-2 font-medium">Titre</th>
                <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Demandeur</th>
                <th className="text-left px-3 py-2 font-medium">Sensibilité</th>
                <th className="text-right px-5 py-2 font-medium">Soumise le</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentesATraiter.map((d) => (
                <tr key={d.id} onClick={() => navigate(`/demandes/${d.id}`)}
                    className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="px-5 py-3 text-gray-400">#{d.id}</td>
                  <td className="px-3 py-3 font-medium text-gray-800">{d.titre}</td>
                  <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{d.demandeur_prenom} {d.demandeur_nom}</td>
                  <td className="px-3 py-3 text-gray-600">{d.degre_sensibilite}</td>
                  <td className="px-5 py-3 text-gray-400 text-right">{formaterDate(d.date_soumission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
