// Page de connexion — design inspiré de blocks.so (ephraimduncan/blocks),
// adapté à l'identité « Avis Juridiques – Natixis DAJ » (violet #5B2C8D).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Logo : balance de la justice dans un carré violet arrondi
function Logo() {
  return (
    <div className="mx-auto w-12 h-12 rounded-xl bg-primaire flex items-center justify-center shadow-sm">
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M7 21h10M12 6l7 2m-7-2L5 8" />
        <path d="M5 8l-2.5 5a2.5 2.5 0 005 0L5 8zM19 8l-2.5 5a2.5 2.5 0 005 0L19 8z" />
      </svg>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);
  const [souvenir, setSouvenir] = useState(true);
  const [aideMdp, setAideMdp] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await login(email, password, souvenir);
      navigate('/');
    } catch (err) {
      setErreur(err.response?.data?.error?.message || 'Erreur de connexion');
    } finally {
      setEnCours(false);
    }
  };

  const champ =
    'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3.5 py-2.5 text-sm ' +
    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primaire focus:border-primaire transition';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                      rounded-2xl shadow-sm overflow-hidden">
        {/* Corps */}
        <div className="p-8">
          <Logo />

          <h1 className="mt-5 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
            Connexion
          </h1>
          <p className="mt-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
            Bon retour ! Connectez-vous à votre espace <br /> Avis Juridiques.
          </p>

          <form onSubmit={soumettre} className="mt-7 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="prenom@natixis.dz"
                className={champ}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Mot de passe
                </label>
                <button type="button" onClick={() => setAideMdp((v) => !v)}
                        className="text-sm font-medium text-primaire hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type={voirMdp ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Entrez votre mot de passe"
                  className={`${champ} pr-10`}
                />
                <button type="button" onClick={() => setVoirMdp((v) => !v)}
                        aria-label={voirMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {voirMdp ? (
                    // Œil barré
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3.98 8.22A10.5 10.5 0 001.93 12C3.23 16.34 7.24 19.5 12 19.5c1.53 0 2.99-.33 4.3-.92M6.23 6.23A10.45 10.45 0 0112 4.5c4.76 0 8.77 3.16 10.07 7.5a10.5 10.5 0 01-4.29 5.27M6.23 6.23L3 3m3.23 3.23l3.53 3.53m4.48 4.48L18 18m-3.76-3.76a3 3 0 01-4.24-4.24" />
                    </svg>
                  ) : (
                    // Œil ouvert
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1.93 12C3.23 7.66 7.24 4.5 12 4.5s8.77 3.16 10.07 7.5c-1.3 4.34-5.31 7.5-10.07 7.5S3.23 16.34 1.93 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {aideMdp && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2">
                  Les comptes sont gérés par la Direction des Affaires Juridiques.
                  Contactez votre administrateur pour réinitialiser votre mot de passe.
                </p>
              )}
            </div>

            {/* Se souvenir de moi */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={souvenir}
                onChange={(e) => setSouvenir(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primaire focus:ring-primaire accent-primaire"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Se souvenir de moi</span>
            </label>

            {erreur && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={enCours}
              className="w-full bg-primaire text-white rounded-lg py-2.5 text-sm font-semibold
                         hover:bg-primaire/90 transition disabled:opacity-60"
            >
              {enCours ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Pied de carte */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Avis Juridiques — <span className="font-medium text-gray-700 dark:text-gray-300">Natixis Algeria, DAJ</span>
          </p>
        </div>
      </div>
    </div>
  );
}
