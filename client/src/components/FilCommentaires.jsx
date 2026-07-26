// Fil de commentaires internes sur une demande (OPT01).

import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_LIBELLE = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };
const formaterDate = (d) =>
  new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export default function FilCommentaires({ demandeId, verrouille }) {
  const { user } = useAuth();
  const [commentaires, setCommentaires] = useState([]);
  const [contenu, setContenu] = useState('');
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const charger = () => {
    api.get(`/demandes/${demandeId}/commentaires`)
      .then((res) => setCommentaires(res.data.data))
      .catch(() => {});
  };

  useEffect(charger, [demandeId]);

  const publier = async (e) => {
    e.preventDefault();
    if (contenu.trim().length < 2) return;
    setErreur(null);
    setEnCours(true);
    try {
      await api.post(`/demandes/${demandeId}/commentaires`, { contenu });
      setContenu('');
      charger();
    } catch (err) {
      setErreur(err.response?.data?.error?.message || 'Impossible de publier le commentaire.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Commentaires {commentaires.length > 0 && <span className="text-gray-400">({commentaires.length})</span>}
      </h2>

      {commentaires.length === 0 ? (
        <p className="text-gray-400 text-sm mb-4">Aucun commentaire pour le moment.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {commentaires.map((c) => {
            const moi = c.auteur_id === user?.id;
            return (
              <div key={c.id} className={`rounded-lg p-3 ${moi ? 'bg-purple-50 dark:bg-purple-900/20 ml-6' : 'bg-gray-50 dark:bg-gray-700/40 mr-6'}`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {c.auteur_prenom} {c.auteur_nom}
                    <span className="text-gray-400 font-normal"> · {ROLE_LIBELLE[c.auteur_role] || c.auteur_role}</span>
                  </span>
                  <span className="text-xs text-gray-400">{formaterDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{c.contenu}</p>
              </div>
            );
          })}
        </div>
      )}

      {verrouille ? (
        <p className="text-xs text-gray-400 italic">Cette demande est clôturée : les commentaires sont désactivés.</p>
      ) : (
        <form onSubmit={publier} className="flex gap-2">
          <input
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Écrire un commentaire…"
            maxLength={2000}
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primaire"
          />
          <button type="submit" disabled={enCours || contenu.trim().length < 2}
            className="bg-primaire text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primaire/90 transition disabled:opacity-50">
            Publier
          </button>
        </form>
      )}
      {erreur && <p className="text-red-600 text-sm mt-2">{erreur}</p>}
    </div>
  );
}
