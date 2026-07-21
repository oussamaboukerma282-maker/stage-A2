// Modale de confirmation, avec zone de texte optionnelle et obligatoire.
// Utilisée pour Valider (avis), Rejeter (motif) et Demander un complément (commentaire).
// En cas d'erreur serveur, la modale reste ouverte : l'utilisateur ne perd pas sa saisie.

import { useState } from 'react';

export default function ConfirmDialog({
  titre,
  message,
  labelChamp,          // si fourni, une zone de texte obligatoire est affichée
  placeholder,
  libelleConfirmer = 'Confirmer',
  couleur = 'primaire',  // 'primaire' | 'vert' | 'rouge'
  onConfirm,           // (texte) => Promise
  onCancel
}) {
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const MIN = 10;
  const champRequis = Boolean(labelChamp);
  const texteValide = !champRequis || texte.trim().length >= MIN;

  const confirmer = async () => {
    if (!texteValide) {
      setErreur(`Le texte doit contenir au moins ${MIN} caractères.`);
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      await onConfirm(texte.trim());
      // la fermeture est pilotée par le parent en cas de succès
    } catch (err) {
      setErreur(err.response?.data?.error?.message || "L'action a échoué.");
      setEnCours(false);
    }
  };

  const couleurs = {
    primaire: 'bg-primaire hover:bg-primaire/90',
    vert: 'bg-green-700 hover:bg-green-800',
    rouge: 'bg-red-700 hover:bg-red-800'
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
         onClick={(e) => e.target === e.currentTarget && !enCours && onCancel()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-bold text-marine mb-2">{titre}</h3>
        {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

        {champRequis && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{labelChamp} *</label>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={5}
              placeholder={placeholder}
              autoFocus
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-primaire"
            />
            <p className="text-xs text-gray-400 mt-1">
              {texte.trim().length} caractère{texte.trim().length > 1 ? 's' : ''} — {MIN} minimum
            </p>
          </div>
        )}

        {erreur && <p className="text-red-600 text-sm mb-3">{erreur}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={enCours}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60">
            Annuler
          </button>
          <button onClick={confirmer} disabled={enCours || !texteValide}
            className={`px-4 py-2 text-sm text-white rounded-md transition disabled:opacity-50 ${couleurs[couleur]}`}>
            {enCours ? 'En cours…' : libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
