// Modification d'une demande (statuts Brouillon ou Complément demandé).
// Permet aussi d'ajouter, remplacer ou supprimer la pièce jointe.

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import FileUpload, { formaterTaille } from '../components/FileUpload';

const SENSIBILITE_PAR_THEME = {
  'Procuration': 'Moyen',
  'Révision dossier juridique': 'Confidentiel',
  'Moyens de paiements': 'Confidentiel',
  'Clôture de compte': 'Moyen',
  'Autre problématique': 'Faible'
};
const THEMES = Object.keys(SENSIBILITE_PAR_THEME);
const SENSIBILITES = ['Faible', 'Moyen', 'Confidentiel'];

export default function ModifierDemande() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [titre, setTitre] = useState('');
  const [theme, setTheme] = useState(THEMES[0]);
  const [sensibilite, setSensibilite] = useState('Moyen');
  const [description, setDescription] = useState('');
  const [pjExistante, setPjExistante] = useState(null);
  const [fichier, setFichier] = useState(null);
  const [progression, setProgression] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    api.get(`/demandes/${id}`)
      .then((res) => {
        const d = res.data.data;
        setTitre(d.titre);
        setTheme(d.theme);
        setSensibilite(d.degre_sensibilite);
        setDescription(d.description);
        setPjExistante(d.piece_jointe_nom
          ? { nom: d.piece_jointe_nom, taille: d.piece_jointe_taille }
          : null);
      })
      .catch((err) => setErreur(err.response?.data?.error?.message || 'Demande introuvable.'))
      .finally(() => setChargement(false));
  }, [id]);

  const changerTheme = (t) => {
    setTheme(t);
    setSensibilite(SENSIBILITE_PAR_THEME[t]);
  };

  const supprimerPJ = async () => {
    try {
      await api.delete(`/demandes/${id}/piece-jointe`);
      setPjExistante(null);
    } catch (err) {
      setErreur(err.response?.data?.error?.message || 'Suppression impossible.');
    }
  };

  const enregistrer = async () => {
    if (titre.trim().length < 3) { setErreur('Le titre doit contenir au moins 3 caractères.'); return; }
    if (description.trim().length < 10) { setErreur('La description doit contenir au moins 10 caractères.'); return; }

    setErreur(null);
    setEnCours(true);
    try {
      await api.put(`/demandes/${id}`, {
        titre: titre.trim(),
        theme,
        description: description.trim(),
        degre_sensibilite: sensibilite
      });

      if (fichier) {
        const form = new FormData();
        form.append('fichier', fichier);
        await api.post(`/demandes/${id}/piece-jointe`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => e.total && setProgression(Math.round((e.loaded * 100) / e.total))
        });
      }
      navigate(`/demandes/${id}`);
    } catch (err) {
      setErreur(err.response?.data?.error?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setEnCours(false);
      setProgression(0);
    }
  };

  if (chargement) return <p className="text-gray-400">Chargement…</p>;

  const champ = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link to={`/demandes/${id}`} className="text-sm text-gray-500 hover:underline">← Retour à la demande</Link>
        <h1 className="text-2xl font-bold text-marine mt-1">Modifier la demande #{id}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} maxLength={250} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thème *</label>
            <select value={theme} onChange={(e) => changerTheme(e.target.value)} className={champ}>
              {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degré de sensibilité</label>
            <select value={sensibilite} onChange={(e) => setSensibilite(e.target.value)} className={champ}>
              {SENSIBILITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className={champ} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pièce jointe</label>
          {pjExistante && !fichier && (
            <div className="mb-2 flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2">
              <span className="text-sm text-gray-700 truncate">
                {pjExistante.nom}
                <span className="text-gray-400"> ({formaterTaille(pjExistante.taille)})</span>
              </span>
              <button type="button" onClick={supprimerPJ} className="text-sm text-red-600 hover:underline ml-3">
                Supprimer
              </button>
            </div>
          )}
          <FileUpload fichier={fichier} onChange={setFichier} progression={progression} />
          {pjExistante && fichier && (
            <p className="text-xs text-amber-600 mt-1">
              Le nouveau fichier remplacera « {pjExistante.nom} ».
            </p>
          )}
        </div>

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate(`/demandes/${id}`)} disabled={enCours}
            className="border border-gray-300 rounded-md px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-60">
            Annuler
          </button>
          <button onClick={enregistrer} disabled={enCours}
            className="bg-primaire text-white rounded-md px-4 py-2 font-medium hover:bg-primaire/90 transition disabled:opacity-60">
            {enCours ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
