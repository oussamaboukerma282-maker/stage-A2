# Phase 1 – Plan détaillé des Fondations techniques

> **Durée** : 4 jours (J1 → J4)
> **Objectif** : à la fin de P1, un développeur clone le dépôt, lance **deux commandes**, et
> obtient l'application (encore vide) qui tourne : le frontend React s'affiche, appelle le
> backend Express, qui interroge PostgreSQL et renvoie une donnée réelle.
> **Références amont** : [`CONVENTIONS.md`](CONVENTIONS.md), [`DATABASE.md`](DATABASE.md),
> [`API.md`](API.md), [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md)

---

## Sommaire

1. [Principe & résultat attendu](#1-principe--résultat-attendu)
2. [Découpage des 4 jours](#2-découpage-des-4-jours)
3. [J1 – Outils & base de données (P1.1 + P1.4)](#3-j1--outils--base-de-données)
4. [J2 – Squelette backend (P1.2 + P1.5)](#4-j2--squelette-backend)
5. [J3 – Squelette frontend (P1.3 + P1.6)](#5-j3--squelette-frontend)
6. [J4 – Intégration, scripts & documentation (P1.7 + revue)](#6-j4--intégration-scripts--documentation)
7. [Checklist globale de sortie P1](#7-checklist-globale-de-sortie-p1)

---

## 1. Principe & résultat attendu

P1 ne contient **aucune fonctionnalité métier** : ni login, ni demandes. On construit
uniquement le **tunnel technique complet** de bout en bout et on prouve qu'il fonctionne
avec une seule route de test : `GET /api/health`.

**Le test de réussite de toute la phase** :

```
Navigateur (localhost:3000)
   │  affiche « API connectée ✓ » avec l'heure serveur
   ▼
React ── axios ──▶ GET /api/health ──▶ Express ── pg ──▶ PostgreSQL
   ▲                                                        │
   └──────────── { status:"ok", db:"connected", time } ◀────┘
```

Si cette chaîne fonctionne, **toutes les couches communiquent** et les phases suivantes
ne feront qu'ajouter des routes et des écrans sur des fondations saines.

**Schéma d'architecture cible de la phase :**

```
stage-A2/
├── database/     (schema.sql + seed.sql exécutés dans PostgreSQL)
├── server/       (Express qui répond sur :5000)
└── client/       (React/Vite qui s'affiche sur :3000)
```

---

## 2. Découpage des 4 jours

```
J1                    J2                   J3                    J4
┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ P1.1 Outils      │  │ P1.2 Backend   │  │ P1.3 Frontend   │  │ P1.7 Scripts     │
│ P1.4 Base créée  │─▶│ P1.5 Serveur↔BD│─▶│ P1.6 Client↔API │─▶│ + README + revue │
│ (schema + seed)  │  │ GET /health    │  │ page « santé »  │  │ + tag phase-1    │
└──────────────────┘  └────────────────┘  └─────────────────┘  └──────────────────┘
```

| Tâche | Livrable | Durée |
|---|---|---|
| P1.1 | Outils installés et vérifiés | 0,5 j |
| P1.4 | Base `avis_juridiques` créée + `schema.sql` + `seed.sql` exécutés | 0,5 j |
| P1.2 | Squelette Express (structure en couches, `server.js`) | 0,75 j |
| P1.5 | Pool `pg` + route `GET /api/health` qui lit la base | 0,25 j |
| P1.3 | Squelette React + Vite + Tailwind + shadcn/ui | 0,75 j |
| P1.6 | Instance Axios + page de test consommant `/health` | 0,25 j |
| P1.7 | Scripts npm (dev, reset BD) + README + revue + tag | 1 j |

---

## 3. J1 – Outils & base de données

### 3.1 P1.1 — Installation et vérification des outils (matin)

| Outil | Version cible | Vérification | Rôle |
|---|---|---|---|
| **Node.js** | 18 LTS ou 20 LTS | `node -v` / `npm -v` | Runtime JS (backend + build front) |
| **PostgreSQL** | 15 ou 16 | `psql --version` | SGBD |
| **pgAdmin 4** | dernière | (interface) | Administration visuelle de la base |
| **VS Code** | dernière | — | Éditeur |
| **Git** | déjà installé (2.52) | `git --version` | Versionnement |
| **Postman** (ou Thunder Client) | dernière | — | Test manuel des endpoints API |

**Extensions VS Code recommandées** : ESLint, Prettier, Tailwind CSS IntelliSense,
PostgreSQL (cweijan), ES7+ React snippets.

**Points d'attention à l'installation de PostgreSQL** :
- Noter le **mot de passe du superutilisateur `postgres`** choisi à l'installation (il ira dans `DATABASE_URL`).
- Laisser le **port par défaut 5432**.
- Cocher l'installation de **pgAdmin** et des **outils en ligne de commande** (pour disposer de `psql`).

**Critère P1.1** : `node -v`, `npm -v`, `psql --version`, `git --version` renvoient tous une version.

### 3.2 P1.4 — Création de la base (après-midi)

**Étape 1 — Créer la base de données**

Via `psql` (ou pgAdmin → clic droit sur Databases → Create) :

```sql
CREATE DATABASE avis_juridiques;
```

**Étape 2 — Exécuter le schéma puis le seed**

Depuis le dossier du projet, en ligne de commande :

```bash
psql -U postgres -d avis_juridiques -f database/schema.sql
psql -U postgres -d avis_juridiques -f database/seed.sql
```

> Alternative pgAdmin : ouvrir chaque fichier dans le Query Tool et l'exécuter (F5).

**Étape 3 — Vérifications de contrôle**

```sql
-- Doit renvoyer 6
SELECT COUNT(*) FROM users;

-- Doit renvoyer 15
SELECT COUNT(*) FROM demande_avis;

-- Répartition par statut (2/3/3/2/3/1/1)
SELECT statut, COUNT(*) FROM demande_avis GROUP BY statut ORDER BY statut;

-- Une demande validée doit avoir 3 lignes d'historique
SELECT COUNT(*) FROM historique_statuts WHERE demande_id = 11;

-- Cohérence des notifications (doit renvoyer des lignes)
SELECT COUNT(*) FROM notifications;
```

**Étape 4 — Valider l'idempotence** (exigence non tenue en P0, à lever ici)

Ré-exécuter `schema.sql` une 2ᵉ fois : il doit passer **sans erreur** (grâce aux `DROP … IF EXISTS`).

**Critères P1.4 :**
- [ ] Base `avis_juridiques` créée
- [ ] `schema.sql` exécutable **2× de suite** sans erreur (idempotence confirmée)
- [ ] `seed.sql` insère 6 users + 15 demandes + historique + notifications
- [ ] Les 5 requêtes de contrôle renvoient les valeurs attendues

---

## 4. J2 – Squelette backend

### 4.1 P1.2 — Initialisation d'Express (structure en couches)

**Étape 1 — Initialiser le projet Node**

```bash
cd server
npm init -y
npm install express cors dotenv pg
npm install --save-dev nodemon
```

Dépendances qui seront ajoutées **plus tard** (pas maintenant) : `jsonwebtoken`, `bcryptjs`,
`multer`, `express-validator`. On installe au fur et à mesure des phases.

**Étape 2 — Créer l'arborescence** (conforme à [`CONVENTIONS.md §3`](CONVENTIONS.md))

```
server/
├── config/db.js
├── middleware/errorHandler.js
├── helpers/response.js
├── routes/health.js
├── controllers/         (vide pour l'instant)
├── models/              (vide)
├── services/            (vide)
├── uploads/.gitkeep
├── .env                 (copié depuis .env.example, NON commité)
├── .env.example         (déjà présent)
└── server.js
```

**Étape 3 — Fichiers de fondation**

`helpers/response.js` — format de réponse unique (CONVENTIONS §4) :
```js
const ok  = (res, data, code = 200) => res.status(code).json({ success: true, data });
const fail = (res, code, errorCode, message) =>
  res.status(code).json({ success: false, error: { code: errorCode, message } });
module.exports = { ok, fail };
```

`middleware/errorHandler.js` — filet de sécurité central (monté en dernier) :
```js
module.exports = (err, req, res, next) => {
  console.error(err);
  const code = err.statusCode || 500;
  res.status(code).json({
    success: false,
    error: { code: err.code || 'SERVER_ERROR', message: err.message || 'Erreur serveur' }
  });
};
```

`server.js` — point d'entrée :
```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api/health', require('./routes/health'));

app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API démarrée sur http://localhost:${PORT}`));
```

**Critères P1.2 :**
- [ ] `npm run dev` (nodemon) démarre le serveur sans erreur
- [ ] La structure de dossiers respecte les conventions
- [ ] `.env` créé localement à partir de `.env.example` (jamais commité)

### 4.2 P1.5 — Connexion serveur ↔ base + route santé

`config/db.js` — pool de connexions PostgreSQL :
```js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
module.exports = pool;
```

`routes/health.js` — la route qui prouve la chaîne complète :
```js
const router = require('express').Router();
const pool = require('../config/db');
const { ok, fail } = require('../helpers/response');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time');
    ok(res, { status: 'ok', db: 'connected', time: result.rows[0].time });
  } catch (e) {
    fail(res, 500, 'SERVER_ERROR', 'Base de données injoignable');
  }
});

module.exports = router;
```

**Test (Postman ou navigateur)** : `GET http://localhost:5000/api/health`
→ réponse attendue :
```json
{ "success": true, "data": { "status": "ok", "db": "connected", "time": "2026-..." } }
```

**Critères P1.5 :**
- [ ] `GET /api/health` renvoie `db: "connected"` avec l'heure serveur
- [ ] Couper PostgreSQL → la route renvoie une **erreur 500 propre** (pas un crash) → preuve que la gestion d'erreurs fonctionne

---

## 5. J3 – Squelette frontend

### 5.1 P1.3 — Initialisation React + Vite + Tailwind + shadcn/ui

**Étape 1 — Créer le projet Vite**

```bash
cd ..            # revenir à la racine stage-A2
npm create vite@latest client -- --template react
cd client
npm install
```

**Étape 2 — Installer et configurer Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- `tailwind.config.js` → renseigner `content: ["./index.html", "./src/**/*.{js,jsx}"]`
- `src/index.css` → ajouter les directives `@tailwind base; @tailwind components; @tailwind utilities;`

**Étape 3 — Installer les dépendances client**

```bash
npm install axios react-router-dom
```

`chart.js` + `react-chartjs-2` seront ajoutés en P5 (dashboards), pas maintenant.

**Étape 4 — Initialiser shadcn/ui**

```bash
npx shadcn@latest init
```
Répondre aux questions (style par défaut, variables CSS oui). Puis tester en ajoutant un composant :
```bash
npx shadcn@latest add button card
```

> **Solution de repli documentée** (CONVENTIONS / gestion des imprévus) : si shadcn/ui pose
> problème d'installation, on continue avec des composants Tailwind manuels et on réintègre
> shadcn plus tard. Cela ne bloque pas la phase.

**Étape 5 — Configurer le proxy de développement (Vite)**

Dans `vite.config.js`, rediriger `/api` vers le backend pour éviter les soucis CORS en dev :
```js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { '/api': 'http://localhost:5000' }
  }
});
```

**Critères P1.3 :**
- [ ] `npm run dev` (client) affiche une page sur `localhost:3000`
- [ ] Une classe Tailwind (ex. `text-3xl font-bold text-purple-700`) s'applique visiblement
- [ ] Un composant shadcn (`Button`) s'affiche correctement

### 5.2 P1.6 — Connexion client ↔ serveur

`src/api/axios.js` — instance Axios centralisée (l'intercepteur JWT viendra en P2) :
```js
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
export default api;
```

`src/App.jsx` — page de test « santé » qui consomme l'API :
```jsx
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
    <div className="min-h-screen flex items-center justify-center">
      {erreur && <p className="text-red-600">{erreur}</p>}
      {health && (
        <p className="text-2xl font-bold text-green-700">
          API connectée ✓ — {new Date(health.time).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  );
}
```

**Critères P1.6 :**
- [ ] La page affiche « API connectée ✓ » avec l'heure venant de PostgreSQL
- [ ] Arrêter le backend → la page affiche « API injoignable » (pas d'écran blanc)

---

## 6. J4 – Intégration, scripts & documentation

### 6.1 P1.7 — Scripts npm de confort

**Racine du projet** — un `package.json` racine pour lancer les deux serveurs d'un coup :

```bash
cd ..            # racine stage-A2
npm init -y
npm install --save-dev concurrently
```

Scripts dans le `package.json` racine :
```json
{
  "scripts": {
    "dev": "concurrently \"npm --prefix server run dev\" \"npm --prefix client run dev\"",
    "server": "npm --prefix server run dev",
    "client": "npm --prefix client run dev",
    "db:schema": "psql -U postgres -d avis_juridiques -f database/schema.sql",
    "db:seed":   "psql -U postgres -d avis_juridiques -f database/seed.sql",
    "db:reset":  "npm run db:schema && npm run db:seed"
  }
}
```

Script `dev` du `server/package.json` : `"dev": "nodemon server.js"`.

**Résultat visé** : depuis la racine, `npm run dev` lance backend **et** frontend ensemble.

### 6.2 Mise à jour du `.gitignore`

Vérifier que sont bien ignorés : `node_modules/` (aux 3 niveaux), `.env`, `server/uploads/*`
(sauf `.gitkeep`), `client/dist/`. Le `.gitignore` racine existant les couvre — compléter si besoin.

### 6.3 Rédaction du README d'installation

Le `README.md` doit permettre une **installation autonome**. Sections à inclure :

1. Prérequis (Node 18+, PostgreSQL 15+)
2. Cloner le dépôt
3. Créer la base + `.env` (backend et client) à partir des `.env.example`
4. `npm install` à la racine, dans `server/`, dans `client/`
5. `npm run db:reset` pour créer et peupler la base
6. `npm run dev` pour tout lancer
7. URLs : front `localhost:3000`, API `localhost:5000/api`
8. Comptes de démo (rappel : mot de passe `Demo2026!`)

### 6.4 Test « clone frais » (le vrai juge de P1)

Sur un dossier vierge (ou une autre machine), suivre **uniquement le README** :
si l'application tourne au bout des étapes, la phase est réussie.

### 6.5 Clôture de phase

- [ ] Bilan P1 rédigé en bas de [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md)
- [ ] Commit + push
- [ ] Tag git `phase-1`

---

## 7. Checklist globale de sortie P1

### Environnement
- [ ] Node, PostgreSQL, Git, Postman opérationnels
- [ ] Base `avis_juridiques` créée, `schema.sql` **idempotent** confirmé, `seed.sql` chargé

### Backend
- [ ] Structure en couches conforme aux conventions
- [ ] `GET /api/health` → `{ success:true, data:{ status:"ok", db:"connected", time } }`
- [ ] Coupure BD → erreur 500 propre (gestion d'erreurs prouvée)

### Frontend
- [ ] React/Vite s'affiche sur `:3000`
- [ ] Tailwind actif, un composant shadcn affiché
- [ ] Instance Axios consomme `/api/health` et affiche l'heure serveur
- [ ] Backend coupé → message d'erreur (pas d'écran blanc)

### Intégration & doc
- [ ] `npm run dev` (racine) lance les deux serveurs
- [ ] `npm run db:reset` recrée et repeuple la base
- [ ] README permettant un « clone frais » réussi
- [ ] Tout poussé, tag `phase-1` posé

### Décision de passage en P2
> P2 (Authentification) démarre uniquement quand toutes les cases ci-dessus sont vertes.
> La règle reste : si un choix de conception s'avère faux, on met d'abord à jour le document
> `docs/` concerné, puis on code.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 17/07/2026 | 1.0 | Création du plan détaillé de la Phase 1 |
