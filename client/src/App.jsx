// Page de test de la Phase 1 : vérifie la chaîne React -> API -> PostgreSQL.
// Sera remplacée par le routeur applicatif en Phase 2.

import { useEffect, useState } from 'react';
import api from './api/axios';

export default function App() {
  const [health, setHealth] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then(res => setHealth(res.data.data))
      .catch(() => setErreur('API injoignable'));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <h1 className="text-3xl font-bold text-primaire">Avis Juridiques — Natixis DAJ</h1>
      <p className="text-sm text-gray-500">Phase 1 — Fondations techniques</p>

      {erreur && (
        <p className="text-red-600 font-semibold">✗ {erreur}</p>
      )}

      {health && (
        <div className="text-center">
          <p className="text-2xl font-bold text-green-700">API connectée ✓</p>
          <p className="text-gray-600">
            Base : {health.db} — Heure serveur :{' '}
            {new Date(health.time).toLocaleString('fr-FR')}
          </p>
        </div>
      )}

      {!health && !erreur && (
        <p className="text-gray-400">Connexion à l'API…</p>
      )}
    </div>
  );
}
