// Gestion des utilisateurs (Admin) : liste + création / édition + activation.

import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_LIBELLE = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };
const ROLES = ['DEMANDEUR', 'JURISTE', 'ADMIN'];

function UserDialog({ initial, onSave, onCancel }) {
  const edition = Boolean(initial);
  const [form, setForm] = useState({
    nom: initial?.nom || '', prenom: initial?.prenom || '', email: initial?.email || '',
    password: '', role: initial?.role || 'DEMANDEUR', structure: initial?.structure || ''
  });
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const maj = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const enregistrer = async () => {
    setErreur(null);
    setEnCours(true);
    try {
      await onSave(form);
    } catch (err) {
      setErreur(err.response?.data?.error?.message || 'Erreur lors de l’enregistrement.');
      setEnCours(false);
    }
  };

  const champ = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaire';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
         onClick={(e) => e.target === e.currentTarget && !enCours && onCancel()}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-marine dark:text-purple-300 mb-4">{edition ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Prénom" value={form.prenom} onChange={(e) => maj('prenom', e.target.value)} className={champ} />
            <input placeholder="Nom" value={form.nom} onChange={(e) => maj('nom', e.target.value)} className={champ} />
          </div>
          <input placeholder="Email" type="email" value={form.email} disabled={edition}
                 onChange={(e) => maj('email', e.target.value)} className={`${champ} ${edition ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}`} />
          {!edition && (
            <input placeholder="Mot de passe (min. 8 caractères)" type="password" value={form.password}
                   onChange={(e) => maj('password', e.target.value)} className={champ} />
          )}
          <select value={form.role} onChange={(e) => maj('role', e.target.value)} className={champ}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LIBELLE[r]}</option>)}
          </select>
          <input placeholder="Structure (optionnel)" value={form.structure} onChange={(e) => maj('structure', e.target.value)} className={champ} />
        </div>

        {erreur && <p className="text-red-600 text-sm mt-3">{erreur}</p>}

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onCancel} disabled={enCours} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:bg-gray-700/40 disabled:opacity-60">Annuler</button>
          <button onClick={enregistrer} disabled={enCours}
            className="px-4 py-2 text-sm text-white bg-primaire rounded-md hover:bg-primaire/90 disabled:opacity-60">
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Utilisateurs() {
  const { user: moi } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [page, setPage] = useState(1);
  const [filtreRole, setFiltreRole] = useState('');
  const [filtreActif, setFiltreActif] = useState('');
  const [chargement, setChargement] = useState(true);
  const [dialog, setDialog] = useState(null); // { mode: 'create' } | { mode: 'edit', user }
  const [erreur, setErreur] = useState(null);

  const charger = () => {
    setChargement(true);
    api.get('/users', { params: { role: filtreRole, actif: filtreActif, page } })
      .then((res) => { setUsers(res.data.data); setPagination(res.data.pagination); })
      .catch(() => setErreur('Impossible de charger les utilisateurs.'))
      .finally(() => setChargement(false));
  };

  useEffect(charger, [filtreRole, filtreActif, page]);

  // Tout changement de filtre ramène à la première page
  const majFiltre = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const creer = async (form) => {
    await api.post('/users', form);
    setDialog(null);
    charger();
  };
  const modifier = async (form) => {
    await api.put(`/users/${dialog.user.id}`, { nom: form.nom, prenom: form.prenom, role: form.role, structure: form.structure });
    setDialog(null);
    charger();
  };
  const basculerActif = async (u) => {
    try {
      await api.put(`/users/${u.id}/desactiver`, { actif: !u.actif });
      charger();
    } catch (err) {
      setErreur(err.response?.data?.error?.message || 'Action impossible.');
    }
  };

  const champ = 'border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaire';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-marine dark:text-purple-300">Gestion des utilisateurs</h1>
        <button onClick={() => setDialog({ mode: 'create' })}
          className="bg-primaire text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primaire/90 transition">
          + Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex gap-3">
        <select value={filtreRole} onChange={majFiltre(setFiltreRole)} className={champ}>
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LIBELLE[r]}</option>)}
        </select>
        <select value={filtreActif} onChange={majFiltre(setFiltreActif)} className={champ}>
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </select>
      </div>

      {erreur && <p className="text-red-600 text-sm mb-3">{erreur}</p>}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {chargement ? (
          <p className="text-center text-gray-400 py-8">Chargement…</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun utilisateur.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Rôle</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{u.prenom} {u.nom}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{ROLE_LIBELLE[u.role]}</td>
                  <td className="px-4 py-3">
                    {u.actif
                      ? <span className="text-green-700 text-xs font-medium">● Actif</span>
                      : <span className="text-gray-400 text-xs font-medium">● Désactivé</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setDialog({ mode: 'edit', user: u })}
                      className="text-sm text-primaire hover:underline mr-3">Modifier</button>
                    <button onClick={() => basculerActif(u)} disabled={u.id === moi.id}
                      className={`text-sm hover:underline ${u.id === moi.id ? 'text-gray-300 cursor-not-allowed' : u.actif ? 'text-red-600' : 'text-green-600'}`}>
                      {u.actif ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (n'apparaît que s'il y a plus d'une page) */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:border-gray-600">
            ← Précédent
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">Page {pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:border-gray-600">
            Suivant →
          </button>
        </div>
      )}

      {dialog?.mode === 'create' && <UserDialog onSave={creer} onCancel={() => setDialog(null)} />}
      {dialog?.mode === 'edit' && <UserDialog initial={dialog.user} onSave={modifier} onCancel={() => setDialog(null)} />}
    </div>
  );
}
