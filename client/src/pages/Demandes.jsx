// Liste des demandes — contenu filtré par rôle côté serveur.
// Les filtres sont poussés dans l'URL pour être partageables et survivre au rechargement.

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StatutBadge, { STATUTS } from '../components/StatutBadge';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

const THEMES = [
  'Procuration',
  'Révision dossier juridique',
  'Moyens de paiements',
  'Clôture de compte',
  'Autre problématique'
];

const formaterDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function Demandes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [demandes, setDemandes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const statut = params.get('statut') || '';
  const theme = params.get('theme') || '';
  const dateDebut = params.get('date_debut') || '';
  const dateFin = params.get('date_fin') || '';
  const page = params.get('page') || '1';

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    api.get('/demandes', { params: { statut, theme, date_debut: dateDebut, date_fin: dateFin, page } })
      .then((res) => {
        setDemandes(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => setErreur('Impossible de charger les demandes.'))
      .finally(() => setChargement(false));
  }, [statut, theme, dateDebut, dateFin, page]);

  const majFiltre = (cle, valeur) => {
    const p = new URLSearchParams(params);
    valeur ? p.set(cle, valeur) : p.delete(cle);
    p.set('page', '1'); // tout changement de filtre remet à la première page
    setParams(p);
  };

  const changerPage = (nouvelle) => {
    const p = new URLSearchParams(params);
    p.set('page', String(nouvelle));
    setParams(p);
  };

  const reinitialiser = () => setParams(new URLSearchParams());

  // Export CSV : télécharge en respectant les filtres courants (OPT05, admin)
  const exporterCsv = async () => {
    const res = await api.get('/demandes/export/csv', {
      params: { statut, theme, date_debut: dateDebut, date_fin: dateFin },
      responseType: 'blob'
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demandes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const champ = 'border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaire';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-marine dark:text-purple-300">Demandes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.totalItems} demande{pagination.totalItems > 1 ? 's' : ''}
            {user?.role === 'DEMANDEUR' ? ' (les vôtres)' : ''}
          </p>
        </div>
        {user?.role === 'DEMANDEUR' && (
          <Link to="/demandes/nouvelle"
            className="bg-primaire text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primaire/90 transition">
            + Nouvelle demande
          </Link>
        )}
        {user?.role === 'ADMIN' && (
          <button onClick={exporterCsv}
            className="border border-primaire text-primaire rounded-md px-4 py-2 text-sm font-medium hover:bg-purple-50 dark:hover:bg-gray-800 transition">
            Exporter en CSV
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Statut</label>
          <select value={statut} onChange={(e) => majFiltre('statut', e.target.value)} className={champ}>
            <option value="">Tous</option>
            {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Thème</label>
          <select value={theme} onChange={(e) => majFiltre('theme', e.target.value)} className={champ}>
            <option value="">Tous</option>
            {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Du</label>
          <input type="date" value={dateDebut} onChange={(e) => majFiltre('date_debut', e.target.value)} className={champ} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Au</label>
          <input type="date" value={dateFin} onChange={(e) => majFiltre('date_fin', e.target.value)} className={champ} />
        </div>
        <button onClick={reinitialiser} className="text-sm text-gray-600 dark:text-gray-300 underline hover:text-gray-900 pb-2">
          Réinitialiser
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {chargement ? (
          <div className="p-8 text-center text-gray-400">Chargement…</div>
        ) : erreur ? (
          <div className="p-8 text-center text-red-600">{erreur}</div>
        ) : demandes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucune demande ne correspond à ces critères.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Titre</th>
                  <th className="text-left px-4 py-3 font-medium">Thème</th>
                  <th className="text-left px-4 py-3 font-medium">Sensibilité</th>
                  {user?.role !== 'DEMANDEUR' && <th className="text-left px-4 py-3 font-medium">Demandeur</th>}
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 font-medium">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map((d) => (
                  <tr key={d.id}
                      onClick={() => navigate(`/demandes/${d.id}`)}
                      className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:bg-gray-700/40 cursor-pointer">
                    <td className="px-4 py-3 text-gray-400">{d.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{d.titre}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{d.theme}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{d.degre_sensibilite}</td>
                    {user?.role !== 'DEMANDEUR' && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{d.demandeur_prenom} {d.demandeur_nom}</td>
                    )}
                    <td className="px-4 py-3"><StatutBadge statut={d.statut} /></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formaterDate(d.date_creation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={changerPage} />
    </div>
  );
}
