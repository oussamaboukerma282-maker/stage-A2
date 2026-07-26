// Modale de confirmation d'action — design inspiré de blocks.so « dialog-02 »
// (ephraimduncan/blocks), adapté à l'identité du projet et au mode sombre.
//
// Structure : icône « featured » (cercle + anneau) en haut à gauche, bouton X
// en haut à droite, titre + description, puis boutons Annuler / Confirmer.
//
// Réutilisable : props open, onClose, onConfirm, titre, description,
// libelleConfirmer, variant ('primaire' | 'danger'), icone.

import { useEffect } from 'react';

const VARIANTS = {
  primaire: {
    anneau: 'bg-purple-50 dark:bg-purple-900/20 ring-purple-100 dark:ring-purple-900/40 text-primaire',
    bouton: 'bg-primaire hover:bg-primaire/90'
  },
  danger: {
    anneau: 'bg-red-50 dark:bg-red-900/20 ring-red-100 dark:ring-red-900/40 text-red-600',
    bouton: 'bg-red-600 hover:bg-red-700'
  }
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  titre,
  description,
  libelleConfirmer = 'Confirmer',
  libelleAnnuler = 'Annuler',
  variant = 'primaire',
  icone
}) {
  // Fermer avec la touche Échap
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const v = VARIANTS[variant] || VARIANTS.primaire;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl
                      border border-gray-100 dark:border-gray-700 p-6">
        {/* En-tête : icône featured + bouton fermer */}
        <div className="flex items-start justify-between">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-8 ${v.anneau}`}>
            {icone || (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 12H3m0 0l4-4m-4 4l4 4m5-11h4a2 2 0 012 2v10a2 2 0 01-2 2h-4" />
              </svg>
            )}
          </div>
          <button onClick={onClose} aria-label="Fermer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Texte */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{titre}</h3>
          {description && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>

        {/* Boutons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium
                       text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
            {libelleAnnuler}
          </button>
          <button onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${v.bouton}`}>
            {libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
