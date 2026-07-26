// Cloche de notifications : badge de non-lues + dropdown, rafraîchi par polling (30 s).

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const INTERVALLE_MS = 30000;

const tempsRelatif = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(d).toLocaleDateString('fr-FR');
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef(null);

  const charger = () => {
    api.get('/notifications')
      .then((res) => { setItems(res.data.data.items); setNonLues(res.data.data.nonLues); })
      .catch(() => {}); // silencieux : ne pas polluer l'UI si un poll échoue
  };

  // Un SEUL intervalle par montage, nettoyé au démontage (pas de fuite de timer).
  useEffect(() => {
    charger();
    const timer = setInterval(charger, INTERVALLE_MS);
    return () => clearInterval(timer);
  }, []);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const clicExterieur = (e) => {
      if (conteneur.current && !conteneur.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener('mousedown', clicExterieur);
    return () => document.removeEventListener('mousedown', clicExterieur);
  }, []);

  const ouvrirNotification = async (n) => {
    setOuvert(false);
    if (!n.lue) {
      try {
        await api.put(`/notifications/${n.id}/lue`);
        charger();
      } catch { /* ignore */ }
    }
    if (n.demande_id) navigate(`/demandes/${n.demande_id}`);
  };

  const toutMarquerLu = async () => {
    try { await api.put('/notifications/tout-lu'); charger(); } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={conteneur}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="relative p-2 rounded-md hover:bg-white/10 transition"
        aria-label="Notifications"
      >
        {/* Icône cloche */}
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {nonLues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold
                           rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="font-semibold text-gray-700 text-sm">Notifications</span>
            {nonLues > 0 && (
              <button onClick={toutMarquerLu} className="text-xs text-primaire hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Aucune notification</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => ouvrirNotification(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition
                              flex gap-2 ${n.lue ? '' : 'bg-purple-50/50'}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.lue ? 'bg-transparent' : 'bg-primaire'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-800">{n.message}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{tempsRelatif(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
