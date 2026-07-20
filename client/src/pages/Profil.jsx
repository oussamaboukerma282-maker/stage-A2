// Page Profil : infos du compte + changement de mot de passe (EF21).

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const roleLibelle = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };

export default function Profil() {
  const { user } = useAuth();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

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

  const Ligne = ({ label, valeur }) => (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{valeur}</span>
    </div>
  );

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-marine mb-6">Mon profil</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Informations</h2>
        <Ligne label="Nom" valeur={`${user?.prenom} ${user?.nom}`} />
        <Ligne label="Email" valeur={user?.email} />
        <Ligne label="Rôle" valeur={roleLibelle[user?.role] || user?.role} />
        <Ligne label="Structure" valeur={user?.structure || '—'} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-3">Changer mon mot de passe</h2>
        <form onSubmit={changer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
            <input type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire" />
          </div>

          {message && <p className="text-green-600 text-sm">{message}</p>}
          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

          <button type="submit" disabled={enCours}
            className="bg-primaire text-white rounded-md py-2 px-4 font-medium hover:bg-primaire/90 transition disabled:opacity-60">
            {enCours ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
