// Carte de KPI : titre, valeur, sous-libellé optionnel. Cliquable si `to` est fourni.

import { useNavigate } from 'react-router-dom';

export default function StatCard({ titre, valeur, sousTitre, couleur = 'primaire', to }) {
  const navigate = useNavigate();
  const accents = {
    primaire: 'text-primaire',
    marine: 'text-marine dark:text-purple-300',
    vert: 'text-green-700',
    rouge: 'text-red-700',
    ambre: 'text-amber-600',
    gris: 'text-gray-600 dark:text-gray-300'
  };
  const cliquable = Boolean(to);
  return (
    <div
      onClick={cliquable ? () => navigate(to) : undefined}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-5 ${cliquable ? 'cursor-pointer hover:shadow-md transition' : ''}`}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">{titre}</p>
      <p className={`text-3xl font-bold mt-1 ${accents[couleur]}`}>{valeur}</p>
      {sousTitre && <p className="text-xs text-gray-400 mt-1">{sousTitre}</p>}
    </div>
  );
}
