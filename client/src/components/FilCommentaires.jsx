// Fil de commentaires (OPT01) + mentions @utilisateur (OPT02).
//
// Mentions « façon réseaux sociaux » :
//  - taper « @ » ouvre une liste d'utilisateurs
//  - chaque lettre affine la recherche (côté serveur, avec debounce)
//  - liste paginée : 10 résultats, puis 10 de plus au défilement (lazy loading)
//  - sélection au clic ou au clavier → insère « @Prénom Nom » et mémorise l'id
//  - à l'envoi, les ids mentionnés déclenchent une notification ciblée

import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_LIBELLE = { ADMIN: 'Administrateur', JURISTE: 'Juriste', DEMANDEUR: 'Demandeur' };
const formaterDate = (d) =>
  new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

// Détecte une mention en cours de saisie : un « @ » suivi de lettres (sans espace)
// juste avant le curseur. Renvoie le texte tapé après « @ », ou null.
const detecterRequeteMention = (texte, pos) => {
  const avant = texte.slice(0, pos);
  const m = avant.match(/@([\p{L}\d'-]*)$/u);
  return m ? m[1] : null;
};

// Surligne les « @Prénom Nom » dans un commentaire affiché.
const rendreAvecMentions = (texte) => {
  const parts = texte.split(/(@[\p{L}][\p{L}'-]*(?: [\p{L}][\p{L}'-]*)?)/gu);
  return parts.map((p, i) =>
    /^@\p{L}/u.test(p)
      ? <span key={i} className="text-primaire dark:text-purple-300 font-medium">{p}</span>
      : <span key={i}>{p}</span>
  );
};

export default function FilCommentaires({ demandeId, verrouille }) {
  const { user } = useAuth();
  const [commentaires, setCommentaires] = useState([]);
  const [contenu, setContenu] = useState('');
  const [mentions, setMentions] = useState([]); // [{ id, label }]
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  // État de l'autocomplétion des mentions
  const [suggestions, setSuggestions] = useState([]);
  const [suggOpen, setSuggOpen] = useState(false);
  const [suggQuery, setSuggQuery] = useState(null); // null = fermé
  const [suggPage, setSuggPage] = useState(1);
  const [suggHasMore, setSuggHasMore] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const listeRef = useRef(null);
  const debounceRef = useRef(null);

  const charger = () => {
    api.get(`/demandes/${demandeId}/commentaires`)
      .then((res) => setCommentaires(res.data.data))
      .catch(() => {});
  };
  useEffect(charger, [demandeId]);

  // Recherche paginée (debounce 200 ms) quand la requête de mention change
  useEffect(() => {
    if (suggQuery === null) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      chercher(suggQuery, 1, false);
    }, 200);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggQuery]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const clicExterieur = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) fermerSugg();
    };
    document.addEventListener('mousedown', clicExterieur);
    return () => document.removeEventListener('mousedown', clicExterieur);
  }, []);

  const chercher = async (q, page, append) => {
    setSuggLoading(true);
    try {
      const res = await api.get('/users/mention', { params: { q, page } });
      const { items, hasMore } = res.data.data;
      setSuggestions((prev) => (append ? [...prev, ...items] : items));
      setSuggHasMore(hasMore);
      setSuggPage(page);
      if (!append) setActiveIdx(0);
    } catch {
      /* silencieux */
    } finally {
      setSuggLoading(false);
    }
  };

  const fermerSugg = () => { setSuggOpen(false); setSuggQuery(null); };

  const onChange = (e) => {
    const val = e.target.value;
    setContenu(val);
    const q = detecterRequeteMention(val, e.target.selectionStart);
    if (q === null) { fermerSugg(); }
    else { setSuggQuery(q); setSuggOpen(true); }
  };

  // Défilement infini : charge les 10 suivants près du bas
  const onScrollListe = () => {
    const el = listeRef.current;
    if (!el || suggLoading || !suggHasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      chercher(suggQuery, suggPage + 1, true);
    }
  };

  const choisir = (u) => {
    const pos = inputRef.current?.selectionStart ?? contenu.length;
    const avant = contenu.slice(0, pos);
    const apres = contenu.slice(pos);
    const label = `${u.prenom} ${u.nom}`;
    // Remplace le « @requête » en cours par « @Prénom Nom  »
    const nouvAvant = avant.replace(/@([\p{L}\d'-]*)$/u, `@${label} `);
    setContenu(nouvAvant + apres);
    setMentions((prev) => (prev.some((m) => m.id === u.id) ? prev : [...prev, { id: u.id, label }]));
    fermerSugg();
    // Replace le curseur juste après la mention insérée
    const newPos = nouvAvant.length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newPos, newPos);
    });
  };

  const onKeyDown = (e) => {
    if (!suggOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (i + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter') { e.preventDefault(); choisir(suggestions[activeIdx]); }
    else if (e.key === 'Escape') { fermerSugg(); }
  };

  const publier = async (e) => {
    e.preventDefault();
    if (contenu.trim().length < 2) return;
    setErreur(null);
    setEnCours(true);
    try {
      // On ne garde que les mentions dont le libellé est encore présent dans le texte
      const ids = [...new Set(
        mentions.filter((m) => contenu.includes(`@${m.label}`)).map((m) => m.id)
      )];
      await api.post(`/demandes/${demandeId}/commentaires`, { contenu, mentions: ids });
      setContenu('');
      setMentions([]);
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
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {rendreAvecMentions(c.contenu)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {verrouille ? (
        <p className="text-xs text-gray-400 italic">Cette demande est clôturée : les commentaires sont désactivés.</p>
      ) : (
        <form onSubmit={publier} className="flex gap-2" ref={wrapperRef}>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={contenu}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder="Écrire un commentaire…  (tapez @ pour mentionner)"
              maxLength={2000}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-primaire"
            />

            {/* Liste d'autocomplétion des mentions */}
            {suggOpen && (
              <div
                ref={listeRef}
                onScroll={onScrollListe}
                className="absolute bottom-full mb-1 left-0 w-72 max-h-56 overflow-y-auto z-40
                           bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl"
              >
                {suggestions.length === 0 && !suggLoading ? (
                  <p className="text-center text-gray-400 text-sm py-4">Aucun utilisateur</p>
                ) : (
                  suggestions.map((u, i) => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}  // évite la perte de focus
                      onClick={() => choisir(u)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 transition
                                  ${i === activeIdx ? 'bg-purple-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'}`}
                    >
                      <span className="w-7 h-7 rounded-full bg-primaire/10 text-primaire dark:text-purple-300 flex items-center justify-center text-xs font-semibold shrink-0">
                        {u.prenom[0]}{u.nom[0]}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-gray-800 dark:text-gray-100 truncate">{u.prenom} {u.nom}</span>
                        <span className="block text-xs text-gray-400">{ROLE_LIBELLE[u.role] || u.role}</span>
                      </span>
                    </button>
                  ))
                )}
                {suggLoading && (
                  <p className="text-center text-gray-400 text-xs py-2">Chargement…</p>
                )}
              </div>
            )}
          </div>

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
