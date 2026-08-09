// Page Profil : en-tête identité + infos du compte + changement de mot de passe (EF21).
// Design inspiré des profils « SaaS » : carte d'en-tête avec avatar, bandeau de stats,
// et navigation par onglets (Informations / Sécurité).

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ROLE_LIBELLE = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };

// Couleur du badge de rôle
const ROLE_BADGE = {
  ADMIN: 'bg-primaire/10 text-primaire dark:bg-purple-400/20 dark:text-purple-200',
  JURISTE: 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200',
  DEMANDEUR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
};

// Libellé de la statistique « demandes » selon le rôle
const STAT_DEMANDES_LIBELLE = {
  ADMIN: 'Demandes (total)',
  JURISTE: 'Demandes suivies',
  DEMANDEUR: 'Mes demandes'
};

const formaterMois = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—';

/* ---------- petites briques d'UI ---------- */

const Icone = {
  mail: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>),
  batiment: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6"/></svg>),
  calendrier: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>),
  badge: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className}><path d="M20 6 9 17l-5-5"/></svg>),
  dossier: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>),
  cle: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className}><circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.2-8.2M15 6l3 3M18 3l3 3"/></svg>)
};

// Carte de statistique
const StatCard = ({ icone: I, valeur, label, teinte }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
    <span className={`grid place-items-center w-10 h-10 rounded-lg ${teinte}`}>
      <I className="w-5 h-5" />
    </span>
    <div className="min-w-0">
      <div className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">{valeur}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</div>
    </div>
  </div>
);

// Champ en lecture seule (imite un input désactivé)
const ChampLecture = ({ label, valeur }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <div className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-3 py-2 text-sm text-gray-800 dark:text-gray-100">
      {valeur || '—'}
    </div>
  </div>
);

/* ---------- page ---------- */

export default function Profil() {
  const { user: userCtx } = useAuth();
  const [user, setUser] = useState(userCtx);
  const [nbDemandes, setNbDemandes] = useState(null);
  const [onglet, setOnglet] = useState('infos'); // 'infos' | 'securite'

  // Formulaire mot de passe
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  // Récupère le profil complet (created_at) + le nombre de demandes visibles
  useEffect(() => {
    api.get('/auth/me').then((res) => setUser(res.data.data)).catch(() => {});
    api.get('/demandes', { params: { page: 1 } })
      .then((res) => setNbDemandes(res.data.pagination?.totalItems ?? 0))
      .catch(() => {});
  }, []);

  const changer = async (e) => {
    e.preventDefault();
    setMessage(null);
    setErreur(null);

    if (nouveau.length < 8) {
      setErreur('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (nouveau !== confirmation) {
      setErreur('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setEnCours(true);
    try {
      await api.put('/auth/password', { ancien, nouveau });
      setMessage('Mot de passe modifié avec succès.');
      setAncien(''); setNouveau(''); setConfirmation('');
    } catch (err) {
      setErreur(err.response?.data?.error?.message || 'Erreur lors du changement.');
    } finally {
      setEnCours(false);
    }
  };

  const initiales = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase();
  const roleLbl = ROLE_LIBELLE[user?.role] || user?.role;
  const champ = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire';

  const Onglet = ({ id, children }) => (
    <button
      onClick={() => setOnglet(id)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition ${
        onglet === id
          ? 'bg-white dark:bg-gray-800 text-marine dark:text-purple-200 shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* ---- Carte d'en-tête ---- */}
      <div className="rounded-2xl overflow-hidden shadow bg-white dark:bg-gray-800 mb-6">
        <div className="h-24 bg-gradient-to-r from-primaire via-[#452073] to-marine" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full ring-4 ring-white dark:ring-gray-800 bg-gradient-to-br from-primaire to-marine grid place-items-center text-2xl font-bold text-white shrink-0">
              {initiales || '?'}
            </div>
            <div className="flex-1 min-w-0 pt-2 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.prenom} {user?.nom}</h1>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[user?.role] || ''}`}>
                  {roleLbl}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.structure || 'Natixis Algeria'}</p>
            </div>
          </div>

          {/* Contacts : sur le bandeau dégradé on remonte via un fond ; ici sous l'avatar en gris */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <Icone.mail className="w-4 h-4 shrink-0 text-gray-400" /> {user?.email}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <Icone.batiment className="w-4 h-4 shrink-0 text-gray-400" /> {user?.structure || '—'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <Icone.calendrier className="w-4 h-4 shrink-0 text-gray-400" /> Membre depuis {formaterMois(user?.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Bandeau de statistiques ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icone={Icone.dossier}
          valeur={nbDemandes === null ? '…' : nbDemandes}
          label={STAT_DEMANDES_LIBELLE[user?.role] || 'Demandes'}
          teinte="bg-primaire/10 text-primaire dark:bg-purple-400/15 dark:text-purple-200"
        />
        <StatCard
          icone={Icone.badge}
          valeur={roleLbl}
          label="Rôle dans l'application"
          teinte="bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-200"
        />
        <StatCard
          icone={Icone.calendrier}
          valeur={formaterMois(user?.created_at)}
          label="Membre depuis"
          teinte="bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-200"
        />
      </div>

      {/* ---- Onglets ---- */}
      <div className="inline-flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 mb-4">
        <Onglet id="infos">Informations</Onglet>
        <Onglet id="securite">Sécurité</Onglet>
      </div>

      {/* ---- Contenu : Informations ---- */}
      {onglet === 'infos' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Informations personnelles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Ces informations sont gérées par la Direction des Affaires Juridiques. Contactez un administrateur pour toute modification.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChampLecture label="Prénom" valeur={user?.prenom} />
            <ChampLecture label="Nom" valeur={user?.nom} />
            <ChampLecture label="Adresse e-mail" valeur={user?.email} />
            <ChampLecture label="Rôle" valeur={roleLbl} />
            <ChampLecture label="Structure / Direction" valeur={user?.structure} />
            <ChampLecture label="Statut du compte" valeur={user?.actif === false ? 'Désactivé' : 'Actif'} />
          </div>
        </div>
      )}

      {/* ---- Contenu : Sécurité ---- */}
      {onglet === 'securite' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-lg">
          <div className="flex items-center gap-2 mb-1">
            <Icone.cle className="w-5 h-5 text-primaire dark:text-purple-300" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Changer mon mot de passe</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Choisissez un mot de passe d'au moins 8 caractères, différent de l'ancien.
          </p>
          <form onSubmit={changer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Mot de passe actuel</label>
              <input type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} required className={champ} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nouveau mot de passe</label>
              <input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required className={champ} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Confirmer le nouveau mot de passe</label>
              <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required className={champ} />
            </div>

            {message && <p className="text-green-600 text-sm">{message}</p>}
            {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

            <button type="submit" disabled={enCours}
              className="bg-primaire text-white rounded-md py-2 px-4 font-medium hover:bg-primaire/90 transition disabled:opacity-60">
              {enCours ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
