// Badge coloré de statut — réutilisé dans la liste, le détail et les tableaux de bord.
// Couleurs conformes à ECRANS.md §4.

const COULEURS = {
  'Brouillon': 'bg-purple-100 text-purple-800 border-purple-200',
  'Soumise': 'bg-blue-100 text-blue-800 border-blue-200',
  'En cours': 'bg-amber-100 text-amber-800 border-amber-200',
  'Complément demandé': 'bg-orange-100 text-orange-800 border-orange-200',
  'Validée': 'bg-green-100 text-green-800 border-green-200',
  'Rejetée': 'bg-red-100 text-red-800 border-red-200',
  'Annulée': 'bg-gray-100 text-gray-600 border-gray-200'
};

export default function StatutBadge({ statut }) {
  const classes = COULEURS[statut] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${classes}`}>
      {statut}
    </span>
  );
}

export const STATUTS = Object.keys(COULEURS);
