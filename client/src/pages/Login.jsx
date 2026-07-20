// Page de connexion.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErreur(err.response?.data?.error?.message || 'Erreur de connexion');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primaire">Avis Juridiques</h1>
          <p className="text-sm text-gray-500">Natixis — Direction des Affaires Juridiques</p>
        </div>

        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire"
              placeholder="prenom@natixis.dz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primaire"
              placeholder="••••••••"
            />
          </div>

          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="w-full bg-primaire text-white rounded-md py-2 font-medium hover:bg-primaire/90 transition disabled:opacity-60"
          >
            {enCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
