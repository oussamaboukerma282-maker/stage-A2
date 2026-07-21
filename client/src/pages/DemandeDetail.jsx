// Détail d'une demande — LECTURE (Phase 3).
// Les actions de traitement et le journal d'activité arrivent en Phase 4.

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StatutBadge from '../components/StatutBadge';
import { formaterTaille } from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

const formaterDate = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const STATUTS_MODIFIABLES = ['Brouillon', 'Complément demandé'];

function Ligne({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm shrink-0">{label}</span>
      <span className="font-medium text-gray-800 text-sm text-right">{children}</span>
    </div>
  );
}

export default function DemandeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [action, setAction] = useState(null);

  const charger = () => {
    setChargement(true);
    api.get(`/demandes/${id}`)
      .then((res) => { setDemande(res.data.data); setErreur(null); })
      .catch((err) => setErreur(err.response?.data?.error?.message || 'Demande introuvable.'))
      .finally(() => setChargement(false));
  };

  useEffect(charger, [id]);

  const telecharger = async () => {
    try {
      const res = await api.get(`/demandes/${id}/piece-jointe`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = demande.piece_jointe_nom;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setAction('Impossible de télécharger la pièce jointe.');
    }
  };

  const soumettre = async () => {
    try {
      await api.post(`/demandes/${id}/soumettre`);
      charger();
    } catch (err) {
      setAction(err.response?.data?.error?.message || 'Erreur lors de la soumission.');
    }
  };

  if (chargement) return <p className="text-gray-400">Chargement…</p>;

  if (erreur) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600 mb-3">{erreur}</p>
        <Link to="/demandes" className="text-primaire underline text-sm">Retour aux demandes</Link>
      </div>
    );
  }

  const estProprietaire = demande.demandeur_id === user?.id;
  const modifiable = estProprietaire && STATUTS_MODIFIABLES.includes(demande.statut);

  return (
    <div className="max-w-3xl">
      <Link to="/demandes" className="text-sm text-gray-500 hover:underline">← Retour aux demandes</Link>

      <div className="flex items-start justify-between gap-4 mt-2 mb-6">
        <h1 className="text-2xl font-bold text-marine">
          <span className="text-gray-400">#{demande.id}</span> {demande.titre}
        </h1>
        <StatutBadge statut={demande.statut} />
      </div>

      {action && <p className="text-red-600 text-sm mb-4">{action}</p>}

      {/* Informations */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Informations</h2>
        <Ligne label="Thème">{demande.theme}</Ligne>
        <Ligne label="Degré de sensibilité">{demande.degre_sensibilite}</Ligne>
        <Ligne label="Demandeur">
          {demande.demandeur_prenom} {demande.demandeur_nom}
          {demande.demandeur_structure && (
            <span className="text-gray-400 font-normal"> · {demande.demandeur_structure}</span>
          )}
        </Ligne>
        <Ligne label="Juriste en charge">
          {demande.juriste_nom ? `${demande.juriste_prenom} ${demande.juriste_nom}` : '— non assignée'}
        </Ligne>
        <Ligne label="Créée le">{formaterDate(demande.date_creation)}</Ligne>
        <Ligne label="Soumise le">{formaterDate(demande.date_soumission)}</Ligne>
        {demande.date_traitement && <Ligne label="Traitée le">{formaterDate(demande.date_traitement)}</Ligne>}
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap text-sm">{demande.description}</p>
      </div>

      {/* Contenu produit par le juriste (visible selon l'avancement) */}
      {demande.commentaire_complement && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-4">
          <h2 className="font-semibold text-orange-800 mb-2">Complément demandé</h2>
          <p className="text-orange-900 text-sm whitespace-pre-wrap">{demande.commentaire_complement}</p>
        </div>
      )}
      {demande.avis_juridique && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
          <h2 className="font-semibold text-green-800 mb-2">Avis juridique</h2>
          <p className="text-green-900 text-sm whitespace-pre-wrap">{demande.avis_juridique}</p>
        </div>
      )}
      {demande.motif_rejet && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
          <h2 className="font-semibold text-red-800 mb-2">Motif du rejet</h2>
          <p className="text-red-900 text-sm whitespace-pre-wrap">{demande.motif_rejet}</p>
        </div>
      )}

      {/* Pièce jointe */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Pièce jointe</h2>
        {demande.piece_jointe_nom ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700 truncate">
              {demande.piece_jointe_nom}
              <span className="text-gray-400"> ({formaterTaille(demande.piece_jointe_taille)})</span>
            </span>
            <button onClick={telecharger}
              className="text-sm bg-primaire text-white px-3 py-1.5 rounded-md hover:bg-primaire/90 transition shrink-0">
              Télécharger
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Aucune pièce jointe.</p>
        )}
      </div>

      {/* Actions du demandeur propriétaire */}
      {modifiable && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {demande.statut === 'Brouillon' && (
              <button onClick={soumettre}
                className="bg-primaire text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primaire/90 transition">
                Soumettre la demande
              </button>
            )}
          </div>
        </div>
      )}

      {/* Emplacements réservés à la Phase 4 */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
        Les actions de traitement (prise en charge, validation, rejet, complément)
        et le journal d'activité seront disponibles en Phase 4.
      </div>
    </div>
  );
}
