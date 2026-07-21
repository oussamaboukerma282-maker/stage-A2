// Création d'une demande : enregistrement en brouillon ou soumission directe.
// La sensibilité est pré-remplie automatiquement selon le thème (modifiable).

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import FileUpload from '../components/FileUpload';

// Même règle que côté serveur (config/themes.js) — le serveur reste la référence.
const SENSIBILITE_PAR_THEME = {
  'Procuration': 'Moyen',
  'Révision dossier juridique': 'Confidentiel',
  'Moyens de paiements': 'Confidentiel',
  'Clôture de compte': 'Moyen',
  'Autre problématique': 'Faible'
};
const THEMES = Object.keys(SENSIBILITE_PAR_THEME);
const SENSIBILITES = ['Faible', 'Moyen', 'Confidentiel'];

export default function NouvelleDemande() {
  const navigate = useNavigate();
  const [titre, setTitre] = useState('');
  const [theme, setTheme] = useState(THEMES[0]);
  const [sensibilite, setSensibilite] = useState(SENSIBILITE_PAR_THEME[THEMES[0]]);
  const [description, setDescription] = useState('');
  const [fichier, setFichier] = useState(null);
  const [progression, setProgression] = useState(0);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  // Changer de thème met à jour la sensibilité proposée
  const changerTheme = (t) => {
    setTheme(t);
    setSensibilite(SENSIBILITE_PAR_THEME[t]);
  };

  const valider = () => {
    if (titre.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères.';
    if (description.trim().length < 10) return 'La description doit contenir au moins 10 caractères.';
    return null;
  };

  const enregistrer = async (soumettre) => {
    const probleme = valider();
    if (probleme) { setErreur(probleme); return; }

    setErreur(null);
    setEnCours(true);
    try {
      // 1. Créer le brouillon
      const res = await api.post('/demandes', {
        titre: titre.trim(),
        theme,
        description: description.trim(),
        degre_sensibilite: sensibilite
      });
      const id = res.data.data.id;

      // 2. Joindre le fichier si présent
      if (fichier) {
        const form = new FormData();
        form.append('fichier', fichier);
        await api.post(`/demandes/${id}/piece-jointe`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setProgression(Math.round((e.loaded * 100) / e.total));
          }
        });
      }

      // 3. Soumettre si demandé
      if (soumettre) {
        await api.post(`/demandes/${id}/soumettre`);
        navigate('/demandes');
      } else {
        navigate(`/demandes/${id}`);
      }
    } catch (err) {
      // Le formulaire est préservé : l'utilisateur ne perd pas sa saisie
      setErreur(err.response?.data?.error?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setEnCours(false);
      setProgression(0);
    }
  };

  const champ = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link to="/demandes" className="text-sm text-gray-500 hover:underline">← Retour aux demandes</Link>
        <h1 className="text-2xl font-bold text-marine mt-1">Nouvelle demande d'avis</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} className={champ}
                 placeholder="Objet de la demande" maxLength={250} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thème *</label>
            <select value={theme} onChange={(e) => changerTheme(e.target.value)} className={champ}>
              {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Degré de sensibilité
              <span className="text-gray-400 font-normal"> (proposé automatiquement)</span>
            </label>
            <select value={sensibilite} onChange={(e) => setSensibilite(e.target.value)} className={champ}>
              {SENSIBILITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6}
                    className={champ} placeholder="Exposez la problématique juridique…" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pièce jointe</label>
          <FileUpload fichier={fichier} onChange={setFichier} progression={progression} />
        </div>

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={() => enregistrer(false)} disabled={enCours}
            className="border border-primaire text-primaire rounded-md px-4 py-2 font-medium hover:bg-purple-50 transition disabled:opacity-60">
            {enCours ? 'Enregistrement…' : 'Enregistrer le brouillon'}
          </button>
          <button onClick={() => enregistrer(true)} disabled={enCours}
            className="bg-primaire text-white rounded-md px-4 py-2 font-medium hover:bg-primaire/90 transition disabled:opacity-60">
            {enCours ? 'Envoi…' : 'Soumettre la demande'}
          </button>
        </div>
      </div>
    </div>
  );
}
