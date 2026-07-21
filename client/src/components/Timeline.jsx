// Journal d'activité : chronologie verticale des transitions d'une demande.
// Alimenté par GET /demandes/:id/historique (source : table immuable historique_statuts).

const COULEUR_PASTILLE = {
  'Brouillon': 'bg-purple-400',
  'Soumise': 'bg-blue-500',
  'En cours': 'bg-amber-500',
  'Complément demandé': 'bg-orange-500',
  'Validée': 'bg-green-600',
  'Rejetée': 'bg-red-600',
  'Annulée': 'bg-gray-400'
};

const ROLE_LIBELLE = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };

const formaterDate = (d) =>
  new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export default function Timeline({ evenements }) {
  if (!evenements || evenements.length === 0) {
    return <p className="text-gray-400 text-sm">Aucune activité enregistrée.</p>;
  }

  return (
    <ol className="relative">
      {evenements.map((e, i) => {
        const dernier = i === evenements.length - 1;
        return (
          <li key={e.id} className="flex gap-3 pb-5 last:pb-0">
            {/* Pastille + trait vertical */}
            <div className="flex flex-col items-center shrink-0">
              <span className={`w-3 h-3 rounded-full mt-1.5 ${COULEUR_PASTILLE[e.nouveau_statut] || 'bg-gray-400'}`} />
              {!dernier && <span className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium text-gray-800 text-sm">
                  {e.ancien_statut ? `${e.ancien_statut} → ${e.nouveau_statut}` : e.nouveau_statut}
                </span>
                <span className="text-xs text-gray-400">{formaterDate(e.created_at)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                par {e.user_prenom} {e.user_nom}
                <span className="text-gray-400"> · {ROLE_LIBELLE[e.user_role] || e.user_role}</span>
              </p>
              {e.commentaire && (
                <p className="mt-1.5 text-sm text-gray-700 bg-gray-50 border-l-2 border-gray-300 pl-3 py-1.5 whitespace-pre-wrap">
                  {e.commentaire}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
