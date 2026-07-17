# CONVENTIONS — Standards de code du projet

> **Livrable P0.5** · Règles à respecter par tout contributeur pendant le développement.

---

## 1. Langues

| Élément | Langue | Exemple |
|---|---|---|
| Tables & colonnes SQL | **Français** (cohérence CDC) | `demande_avis`, `degre_sensibilite` |
| Code JavaScript (variables, fonctions) | **Anglais** | `getDemandeById`, `isOwner` |
| Composants React | **Anglais** (nom) | `DemandeList`, `StatusBadge` |
| Interface utilisateur | **Français** | « Soumettre », « Aucune demande » |
| Messages d'erreur API | **Français** | « Identifiants invalides » |
| Commits Git | **Français** | `feat: ajout du login JWT` |
| Commentaires de code | **Français** | `// Vérifie que le user est propriétaire` |

---

## 2. Nommage

| Cas | Convention | Exemple |
|---|---|---|
| Variables / fonctions JS | `camelCase` | `const totalPages`, `function calculerSensibilite()` |
| Composants React | `PascalCase` | `function DemandeDetail()` |
| Fichiers composants | `PascalCase.jsx` | `StatusBadge.jsx` |
| Fichiers utilitaires / config | `camelCase.js` | `db.js`, `authMiddleware.js` |
| Constantes globales | `UPPER_SNAKE_CASE` | `const MAX_FILE_SIZE` |
| Routes API | `kebab-case` | `/prendre-en-charge` |
| Colonnes SQL | `snake_case` | `date_soumission` |

---

## 3. Structure du code serveur (architecture en couches)

Une entité = un fichier par couche. Le flux d'une requête :

```
Requête HTTP
   │
   ▼
routes/demandes.js        → définit l'URL + attache middlewares + appelle le controller
   │
   ▼
middleware/               → auth (JWT) → roles → validation (express-validator)
   │
   ▼
controllers/              → orchestration : lit req, appelle model/service, formate la réponse
   │
   ▼
services/workflow.js      → logique métier transverse (transitions) — quand nécessaire
   │
   ▼
models/                   → requêtes SQL paramétrées (le SEUL endroit qui parle à la base)
   │
   ▼
PostgreSQL
```

**Règles** :
- Un **controller** ne contient jamais de SQL brut → il passe par un **model**.
- Un **model** ne contient jamais de logique HTTP (pas de `req`/`res`).
- La logique de **transition de statut** vit uniquement dans `services/workflow.js`.

Structure de dossiers :
```
server/
├── config/db.js            # Pool PostgreSQL
├── middleware/
│   ├── auth.js             # Vérifie le JWT, remplit req.user
│   ├── roles.js            # roles('ADMIN'), roles('JURISTE','ADMIN')
│   ├── upload.js           # Multer (types, taille, nom UUID)
│   ├── validate.js         # Gère le résultat d'express-validator
│   └── errorHandler.js     # Middleware d'erreurs central (dernier)
├── models/                 # usersModel.js, demandesModel.js, ...
├── controllers/            # ...Controller.js
├── services/workflow.js    # Moteur de transitions
├── routes/                 # auth.js, demandes.js, users.js, notifications.js, stats.js
├── uploads/                # fichiers (gitignoré)
├── .env.example
└── server.js               # Point d'entrée
```

---

## 4. Format des réponses API

Toujours passer par deux helpers, jamais de `res.json` brut :

```js
// helpers/response.js
const ok  = (res, data, code = 200) => res.status(code).json({ success: true, data });
const err = (res, code, errorCode, message) =>
    res.status(code).json({ success: false, error: { code: errorCode, message } });
```

- Succès → `{ success: true, data }`
- Erreur → `{ success: false, error: { code, message } }`

---

## 5. Gestion des erreurs

### Serveur
- Chaque controller est enveloppé (try/catch ou wrapper `asyncHandler`) et transmet
  les erreurs via `next(err)`.
- Un **middleware d'erreurs central** (`errorHandler.js`, monté en dernier) formate la
  réponse et masque la stack en production.
- Les erreurs métier explicites (transition illégale, non trouvé…) sont levées comme des
  erreurs typées portant un `statusCode` et un `code`.

### Client
- Échec de **chargement** (GET) → état d'erreur affiché dans la zone concernée.
- Échec d'**action** (POST/PUT) → **toast** d'erreur, formulaire préservé.
- Réponse **401** interceptée par Axios → déconnexion + redirection `/login`.

---

## 6. Sécurité (rappels appliqués partout)

| Règle | Application |
|---|---|
| Requêtes SQL | **Toujours paramétrées** (`$1, $2`). Jamais de concaténation de chaîne. |
| Mots de passe | bcrypt, salt factor **12**. Jamais stockés ni loggés en clair. |
| JWT | Signé HS256, secret dans `.env`, expiration 24 h. |
| Autorisation | Vérifiée **côté serveur** à chaque endpoint (le client ne fait que masquer). |
| Upload | Type MIME + extension vérifiés, taille ≤ 10 Mo, nom disque = UUID. |
| CORS | Restreint à `CORS_ORIGIN` (localhost:3000 en dev). |
| Secrets | Jamais commités. `.env` est gitignoré ; seul `.env.example` est versionné. |

---

## 7. Variables d'environnement

Fichier `server/.env.example` (à copier en `.env` et remplir) :

```
PORT=5000
DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/avis_juridiques
JWT_SECRET=change_me_en_une_chaine_longue_et_aleatoire
JWT_EXPIRES=24h
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:3000
```

Côté client, `client/.env` :
```
VITE_API_URL=http://localhost:5000/api
```

---

## 8. Git

| Sujet | Convention |
|---|---|
| Branche principale | `main` — toujours fonctionnelle |
| Branches de travail | `feat/<sujet>`, `fix/<sujet>` (ex. `feat/auth-jwt`) |
| Format de commit | `type: description` — types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` |
| Exemples | `feat: moteur de transitions`, `fix: contrôle taille upload`, `docs: contrat API` |
| Fréquence de push | Au moins une fois par jour |
| Jalons | Un tag par fin de phase : `phase-0`, `phase-1`, … |

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 17/07/2026 | 1.0 | Création — 8 domaines de conventions |
