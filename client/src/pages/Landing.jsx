// Landing page publique — présentation de la plateforme « Avis Juridiques ».
// Visible sans connexion. Objectif : présenter le produit et inviter à se connecter.

import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// ---- Petits éléments réutilisés ----
const Logo = ({ className = 'w-9 h-9' }) => (
  <div className={`${className} rounded-xl bg-primaire flex items-center justify-center shadow-sm shrink-0`}>
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M7 21h10M12 6l7 2m-7-2L5 8" />
      <path d="M5 8l-2.5 5a2.5 2.5 0 005 0L5 8zM19 8l-2.5 5a2.5 2.5 0 005 0L19 8z" />
    </svg>
  </div>
);

const Icone = ({ d }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"
       strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// Icônes (chemins SVG)
const ICONES = {
  workflow: 'M4 6h16M4 12h10M4 18h7M17 15l3 3-3 3M20 18h-6',
  roles: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z',
  trace: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  notif: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1',
  dashboard: 'M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zM13 3v6h8V3h-8z',
  collab: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-4.5-7.8L21 3v6h-6'
};

const FONCTIONNALITES = [
  { icone: 'workflow', titre: 'Workflow structuré', desc: 'Un cycle de vie clair en 7 statuts, avec des transitions contrôlées de bout en bout — plus aucun dossier perdu de vue.' },
  { icone: 'roles', titre: 'Rôles & permissions', desc: 'Trois profils — Demandeur, Juriste, Administrateur — chacun avec des droits précis et un espace adapté.' },
  { icone: 'trace', titre: 'Traçabilité totale', desc: 'Historique immuable et journal d’activité : qui a fait quoi, quand, sur chaque demande.' },
  { icone: 'notif', titre: 'Notifications internes', desc: 'Chaque acteur est prévenu en temps réel des actions qui le concernent, directement dans la plateforme.' },
  { icone: 'dashboard', titre: 'Tableaux de bord', desc: 'KPIs et graphiques par rôle : délais, taux de validation, charge de travail, en un coup d’œil.' },
  { icone: 'collab', titre: 'Collaboration', desc: 'Commentaires, mentions @, pièces jointes et exports PDF/CSV pour travailler ensemble efficacement.' }
];

const ROLES = [
  { titre: 'Demandeur', couleur: 'from-blue-500 to-blue-600', desc: 'Soumet ses demandes d’avis, joint les pièces, suit l’avancement et complète les dossiers retournés.' },
  { titre: 'Juriste', couleur: 'from-primaire to-purple-700', desc: 'Prend en charge les demandes, analyse, demande des compléments, rédige l’avis, valide ou rejette.' },
  { titre: 'Administrateur', couleur: 'from-marine to-indigo-800', desc: 'Pilote la plateforme : gestion des comptes, tableau de bord global et supervision de toute l’activité.' }
];

const WORKFLOW = [
  { s: 'Brouillon', c: 'bg-purple-400' },
  { s: 'Soumise', c: 'bg-blue-500' },
  { s: 'En cours', c: 'bg-amber-500' },
  { s: 'Complément', c: 'bg-orange-500' },
  { s: 'Validée', c: 'bg-green-600' },
  { s: 'Rejetée', c: 'bg-red-600' },
  { s: 'Annulée', c: 'bg-gray-400' }
];

function ThemeToggle() {
  const { theme, basculer } = useTheme();
  return (
    <button onClick={basculer} aria-label="Changer de thème"
            className="p-2 rounded-md text-gray-500 hover:text-primaire dark:text-gray-300 dark:hover:text-purple-300 transition">
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.5 6.5-1.5-1.5M6 6 4.5 4.5m13 0L16 6M6 18l-1.5 1.5" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">

      {/* ---- Barre de navigation ---- */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-tight">
              <p className="font-bold text-gray-900 dark:text-white">Avis Juridiques</p>
              <p className="text-[11px] text-gray-400">Natixis Algeria — DAJ</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#fonctionnalites" className="hover:text-primaire dark:hover:text-purple-300 transition">Fonctionnalités</a>
            <a href="#roles" className="hover:text-primaire dark:hover:text-purple-300 transition">Rôles</a>
            <a href="#workflow" className="hover:text-primaire dark:hover:text-purple-300 transition">Workflow</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login"
              className="bg-primaire text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primaire/90 transition">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primaire via-[#452073] to-marine text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <span className="inline-block text-xs font-medium tracking-wide uppercase bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-6">
            Direction des Affaires Juridiques · Natixis Algeria
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl mx-auto">
            La gestion des avis juridiques,<br className="hidden md:block" /> enfin structurée.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
            De la demande à la décision : centralisez, suivez et tracez chaque avis juridique
            dans une plateforme unique, sécurisée et collaborative.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login"
              className="bg-white text-primaire rounded-lg px-6 py-3 font-semibold hover:bg-white/90 transition shadow-lg">
              Accéder à la plateforme
            </Link>
            <a href="#fonctionnalites"
              className="border border-white/40 text-white rounded-lg px-6 py-3 font-semibold hover:bg-white/10 transition">
              Découvrir les fonctionnalités
            </a>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-white/80 text-sm">
            <span><strong className="text-white text-lg">7</strong> statuts de suivi</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span><strong className="text-white text-lg">3</strong> rôles métier</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span><strong className="text-white text-lg">100%</strong> traçable</span>
          </div>
        </div>
      </section>

      {/* ---- Problème / Solution ---- */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-7 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm font-semibold text-red-600 mb-2">Avant</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Des échanges éparpillés</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Demandes transmises par emails non structurés</li>
              <li>• Aucun suivi de statut ni délai maîtrisé</li>
              <li>• Perte d’information et décisions non tracées</li>
              <li>• Impossible de mesurer la charge de travail</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-primaire/30 p-7 bg-primaire/5 dark:bg-purple-900/10">
            <p className="text-sm font-semibold text-primaire dark:text-purple-300 mb-2">Avec la plateforme</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Un flux maîtrisé de A à Z</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Chaque demande centralisée et catégorisée</li>
              <li>• Un workflow clair avec statuts et notifications</li>
              <li>• Historique complet et traçabilité des décisions</li>
              <li>• Tableaux de bord pour piloter les délais</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Fonctionnalités ---- */}
      <section id="fonctionnalites" className="bg-gray-50 dark:bg-gray-800/40 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Tout ce qu’il faut pour gérer un avis juridique</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Une plateforme complète, pensée pour le quotidien de la Direction des Affaires Juridiques.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FONCTIONNALITES.map((f) => (
              <div key={f.titre}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="w-11 h-11 rounded-xl bg-primaire/10 text-primaire dark:bg-purple-400/20 dark:text-purple-300 flex items-center justify-center mb-4">
                  <Icone d={ICONES[f.icone]} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{f.titre}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Rôles ---- */}
      <section id="roles" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Un espace pour chaque acteur</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Chaque rôle dispose de droits précis et d’une vue adaptée à ses besoins.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {ROLES.map((r) => (
            <div key={r.titre} className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              <div className={`h-2 bg-gradient-to-r ${r.couleur}`} />
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{r.titre}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Workflow ---- */}
      <section id="workflow" className="bg-gray-50 dark:bg-gray-800/40 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Un cycle de vie clair</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">De la création à la clôture, chaque demande suit un parcours maîtrisé et tracé.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
            {WORKFLOW.map((w, i) => (
              <div key={w.s} className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-sm">
                  <span className={`w-2.5 h-2.5 rounded-full ${w.c}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{w.s}</span>
                </div>
                {i < WORKFLOW.length - 1 && <span className="text-gray-300 dark:text-gray-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Bénéfices ---- */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            ['Délais', 'maîtrisés et mesurés'],
            ['0', 'perte d’information'],
            ['Sécurité', 'JWT + rôles'],
            ['100%', 'des actions tracées']
          ].map(([k, v]) => (
            <div key={v}>
              <p className="text-3xl md:text-4xl font-extrabold text-primaire dark:text-purple-300">{k}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- CTA final ---- */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-primaire via-[#452073] to-marine text-white text-center px-6 py-16 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold">Prêt à digitaliser vos avis juridiques ?</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">Connectez-vous pour accéder à votre espace et commencer à gérer vos demandes.</p>
          <Link to="/login"
            className="inline-block mt-8 bg-white text-primaire rounded-lg px-7 py-3 font-semibold hover:bg-white/90 transition shadow-lg">
            Se connecter
          </Link>
        </div>
      </section>

      {/* ---- Pied de page ---- */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7" />
            <span className="font-medium text-gray-600 dark:text-gray-300">Avis Juridiques — Natixis Algeria, DAJ</span>
          </div>
          <p>Projet de stage A2 · BOUKERMA Oussama · CESI Exia</p>
        </div>
      </footer>
    </div>
  );
}
