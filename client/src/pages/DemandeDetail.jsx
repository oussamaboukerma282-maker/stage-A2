// Détail d'une demande : consultation, actions contextuelles (Phase 4)
// et journal d'activité.
//
// Les boutons affichés dépendent du couple (rôle, statut) — cf. ECRANS.md §3.
// Rappel : ceci ne fait que MASQUER des boutons ; l'autorisation réelle est
// vérifiée par le serveur (services/workflow.js).

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StatutBadge from '../components/StatutBadge';
import Timeline from '../components/Timeline';
import ConfirmDialog from '../components/ConfirmDialog';
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
  const [historique, setHistorique] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [action, setAction] = useState(null);
  const [dialog, setDialog] = useState(null); // 'valider' | 'rejeter' | 'complement' | null

  const charger = () => {
    setChargement(true);
    Promise.all([
      api.get(`/demandes/${id}`),
      api.get(`/demandes/${id}/historique`).catch(() => ({ data: { data: [] } }))
    ])
      .then(([resD, resH]) => {
        setDemande(resD.data.data);
        setHistorique(resH.data.data);
        setErreur(null);
      })
      .catch((err) => setErreur(err.response?.data?.error?.message || 'Demande introuvable.'))
      .finally(() => setChargement(false));
  };

  useEffect(charger, [id]);

  /** Exécute une transition puis recharge la demande et son historique. */
  const transition = async (chemin, corps) => {
    setAction(null);
    await api.post(`/demandes/${id}/${chemin}`, corps);
    setDialog(null);
    charger();
  };

  /** Variante pour les actions sans modale (erreur affichée en haut de page). */
  const transitionSimple = async (chemin) => {
    try {
      await transition(chemin);
    } catch (err) {
      setAction(err.response?.data?.error?.message || "L'action a échoué.");
    }
  };

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
  const estJuriste = user?.role === 'JURISTE' || user?.role === 'ADMIN';
  const modifiable = estProprietaire && STATUTS_MODIFIABLES.includes(demande.statut);

  // Tableau (rôle × statut) de ECRANS.md §3, traduit en boutons.
  const BTN = {
    principal: 'bg-primaire text-white hover:bg-primaire/90',
    secondaire: 'border border-primaire text-primaire hover:bg-purple-50',
    vert: 'bg-green-700 text-white hover:bg-green-800',
    rouge: 'bg-red-700 text-white hover:bg-red-800',
    neutre: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  const actionsDisponibles = [];
  if (estProprietaire && demande.statut === 'Brouillon') {
    actionsDisponibles.push(
      { cle: 'modifier', libelle: 'Modifier', classe: BTN.secondaire,
        onClick: () => navigate(`/demandes/${id}/modifier`) },
      { cle: 'soumettre', libelle: 'Soumettre la demande', classe: BTN.principal,
        onClick: () => transitionSimple('soumettre') },
      { cle: 'annuler', libelle: 'Annuler', classe: BTN.neutre,
        onClick: () => transitionSimple('annuler') }
    );
  }
  if (estProprietaire && demande.statut === 'Complément demandé') {
    actionsDisponibles.push(
      { cle: 'modifier', libelle: 'Modifier', classe: BTN.secondaire,
        onClick: () => navigate(`/demandes/${id}/modifier`) },
      { cle: 'completer', libelle: 'Compléter et renvoyer', classe: BTN.principal,
        onClick: () => transitionSimple('completer') }
    );
  }
  if (estJuriste && demande.statut === 'Soumise') {
    actionsDisponibles.push(
      { cle: 'prise', libelle: 'Prendre en charge', classe: BTN.principal,
        onClick: () => transitionSimple('prendre-en-charge') }
    );
  }
  if (estJuriste && demande.statut === 'En cours') {
    actionsDisponibles.push(
      { cle: 'complement', libelle: 'Demander un complément', classe: BTN.secondaire,
        onClick: () => setDialog('complement') },
      { cle: 'valider', libelle: 'Valider', classe: BTN.vert,
        onClick: () => setDialog('valider') },
      { cle: 'rejeter', libelle: 'Rejeter', classe: BTN.rouge,
        onClick: () => setDialog('rejeter') }
    );
  }

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

      {/* Actions contextuelles — dépendent du couple (rôle, statut) */}
      {actionsDisponibles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {actionsDisponibles.map((a) => (
              <button key={a.cle} onClick={a.onClick} className={`rounded-md px-4 py-2 text-sm font-medium transition ${a.classe}`}>
                {a.libelle}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Journal d'activité */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Journal d'activité</h2>
        <Timeline evenements={historique} />
      </div>

      {/* Modales de confirmation */}
      {dialog === 'complement' && (
        <ConfirmDialog
          titre="Demander un complément"
          message="Précisez au demandeur les éléments manquants. La demande lui sera renvoyée."
          labelChamp="Commentaire"
          placeholder="Merci de joindre…"
          libelleConfirmer="Demander le complément"
          onConfirm={(texte) => transition('complement', { commentaire: texte })}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'valider' && (
        <ConfirmDialog
          titre="Valider la demande"
          message="Rédigez l'avis juridique. Cette action clôture définitivement la demande."
          labelChamp="Avis juridique"
          placeholder="Avis favorable…"
          libelleConfirmer="Valider"
          couleur="vert"
          onConfirm={(texte) => transition('valider', { avis_juridique: texte })}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'rejeter' && (
        <ConfirmDialog
          titre="Rejeter la demande"
          message="Indiquez le motif du rejet. Cette action clôture définitivement la demande."
          labelChamp="Motif du rejet"
          placeholder="Dossier incomplet…"
          libelleConfirmer="Rejeter"
          couleur="rouge"
          onConfirm={(texte) => transition('rejeter', { motif_rejet: texte })}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
