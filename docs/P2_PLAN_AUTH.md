# Phase 2 – Plan détaillé de l'Authentification & Sécurité

> **Durée** : 7 jours (J1 → J7, Semaine 2)
> **Objectif** : un utilisateur se connecte, obtient un JWT, et accède **uniquement** aux
> routes autorisées pour son rôle. À la fin de P2, la sécurité de base du projet est en place
> et toutes les phases suivantes s'appuieront dessus sans y revenir.
> **Références amont** : [`API.md`](API.md) §2, [`CONVENTIONS.md`](CONVENTIONS.md) §5-§6,
> [`ECRANS.md`](ECRANS.md) §2.1/2.6, [`DATABASE.md`](DATABASE.md) table `users`

---

## Sommaire

1. [Périmètre & résultat attendu](#1-périmètre--résultat-attendu)
2. [Découpage des 7 jours](#2-découpage-des-7-jours)
3. [J1-J2 – Backend : authentification](#3-j1-j2--backend--authentification)
4. [J3 – Backend : middlewares de protection](#4-j3--backend--middlewares-de-protection)
5. [J4 – Frontend : contexte & connexion](#5-j4--frontend--contexte--connexion)
6. [J5 – Frontend : routes protégées & layout](#6-j5--frontend--routes-protégées--layout)
7. [J6 – Profil & changement de mot de passe](#7-j6--profil--changement-de-mot-de-passe)
8. [J7 – Tests de sécurité & clôture](#8-j7--tests-de-sécurité--clôture)
9. [Checklist globale de sortie P2](#9-checklist-globale-de-sortie-p2)

---

## 1. Périmètre & résultat attendu

P2 construit **tout le socle d'authentification** — mais **aucune** fonctionnalité de demandes
(ce sera P3). Le livrable est un tunnel de sécurité complet, testé de bout en bout.

**Le test de réussite de la phase :**

```
1. Les 6 comptes de démo se connectent (mot de passe Demo2026!)
2. Un token invalide/expiré → 401 → retour automatique au login
3. Un DEMANDEUR qui appelle une route ADMIN → 403
4. Le changement de mot de passe fonctionne, l'ancien ne marche plus
5. Rafraîchir la page (F5) ne déconnecte pas
```

**Ce qui existe déjà (P1)** : `users` peuplée, `bcrypt` hash dans le seed, `POST` non encore
exposés. Instance Axios, AuthContext vide à créer, structure Express en couches.

**Nouvelles dépendances à installer** (au fur et à mesure) :
- Backend : `jsonwebtoken`, `bcryptjs`, `express-validator`
- Frontend : (rien de neuf — `react-router-dom` déjà présent) + init **shadcn/ui** ici

**Schéma du flux d'authentification cible :**

```
   LOGIN                          REQUÊTE PROTÉGÉE
   ─────                          ────────────────
Client                           Client (token en mémoire/localStorage)
  │ POST /auth/login               │ GET /demandes  + header Authorization: Bearer <JWT>
  ▼                                ▼
Express                          Express
  │ bcrypt.compare                 │ middleware auth → vérifie/décode le JWT → req.user
  │ jwt.sign(payload)              │ middleware roles → 403 si rôle non autorisé
  ▼                                ▼
{ token, user }  ──▶ stocké        controller (exécuté seulement si tout est OK)
```

---

## 2. Découpage des 7 jours

```
J1─J2          J3              J4             J5              J6            J7
┌───────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐
│ Backend   │  │ Middlewares│  │ Frontend  │  │ Routes     │  │ Profil + │  │ Tests      │
│ login/me/ │─▶│ auth+roles │─▶│ AuthContext│─▶│ protégées  │─▶│ mot de   │─▶│ sécurité + │
│ password  │  │ + erreurs  │  │ + Login   │  │ + Navbar   │  │ passe    │  │ tag phase-2│
└───────────┘  └────────────┘  └───────────┘  └────────────┘  └──────────┘  └────────────┘
```

| Jour | Tâches | Livrable |
|---|---|---|
| J1-J2 | Auth backend (login, me, password) + validation | 3 endpoints testés Postman |
| J3 | Middlewares `auth`, `roles`, gestion d'erreurs typées | Routes protégeables |
| J4 | AuthContext + intercepteur Axios + page Login + init shadcn | Login fonctionnel |
| J5 | ProtectedRoute + Layout + Navbar selon rôle | Navigation sécurisée |
| J6 | Page Profil + changement de mot de passe | EF21 complète |
| J7 | Campagne de tests de sécurité + bilan + tag | Phase clôturée |

---

## 3. J1-J2 – Backend : authentification

> Endpoints visés : `POST /auth/login`, `GET /auth/me`, `PUT /auth/password` ([API.md §2](API.md)).

### 3.1 Préparation (J1 matin)

```bash
cd server
npm install jsonwebtoken bcryptjs express-validator
```

Fichiers à créer :
```
server/
├── models/usersModel.js          # requêtes SQL sur users
├── controllers/authController.js # login, me, changePassword
├── routes/auth.js                # définition des routes + validations
├── middleware/validate.js        # exploite le résultat d'express-validator
└── utils/jwt.js                   # sign / verify centralisés (optionnel mais propre)
```

### 3.2 Couche modèle (J1)

`models/usersModel.js` — **le seul endroit** qui écrit du SQL sur `users`. Fonctions :

| Fonction | Requête | Usage |
|---|---|---|
| `findByEmail(email)` | `SELECT * FROM users WHERE email=$1` | login |
| `findById(id)` | `SELECT id,nom,prenom,email,role,structure,actif FROM users WHERE id=$1` | me (sans hash) |
| `updatePassword(id, hash)` | `UPDATE users SET password_hash=$2 WHERE id=$1` | changement mdp |

**Règle** : `findById` ne renvoie **jamais** `password_hash`. `findByEmail` le renvoie
(nécessaire pour `bcrypt.compare`) mais le controller ne le propage jamais dans la réponse.

### 3.3 Login (J1 après-midi)

`authController.login` — logique :
1. `express-validator` a déjà validé la présence de `email` + `password` (sinon 400).
2. `usersModel.findByEmail(email)`.
3. Si user introuvable **OU** `actif = false` **OU** `bcrypt.compare` échoue → **401** avec un
   message **générique** « Identifiants invalides » (ne jamais dire *lequel* est faux : anti-énumération).
4. Sinon : `jwt.sign({ id, role, nom, prenom }, JWT_SECRET, { expiresIn: JWT_EXPIRES })`.
5. Réponse `200 { success:true, data:{ token, user:{ id, nom, prenom, role, structure } } }`.

### 3.4 Me & changement de mot de passe (J2)

`authController.me` :
- Lit `req.user.id` (posé par le middleware `auth` de J3) → `usersModel.findById` → renvoie le profil.
- Sert à rétablir la session au rechargement (F5).

`authController.changePassword` :
1. Corps `{ ancien, nouveau }`, validation : `nouveau` ≥ 8 caractères (sinon 400).
2. Récupère l'utilisateur, `bcrypt.compare(ancien, hash)` → si faux **401** « Ancien mot de passe incorrect ».
3. `bcrypt.hash(nouveau, 12)` → `usersModel.updatePassword`.
4. Réponse `200 { message: "Mot de passe modifié" }`.

### 3.5 Routes + validations (J2)

`routes/auth.js` monte les 3 endpoints avec leurs validateurs `express-validator` et
le middleware `validate`. Puis dans `server.js` :
```js
app.use('/api/auth', require('./routes/auth'));
```

### 3.6 Tests Postman (fin J2)

| Test | Attendu |
|---|---|
| login admin@natixis.dz / Demo2026! | 200 + token |
| login avec mauvais mot de passe | 401 « Identifiants invalides » |
| login email inexistant | 401 même message |
| login compte désactivé (à tester en désactivant en base) | 401 même message |
| me sans token | 401 (après J3) |
| password nouveau trop court | 400 |

### ✅ Critères de sortie J1-J2
- [ ] Les 3 endpoints répondent conformément à API.md §2
- [ ] Le hash n'apparaît **jamais** dans une réponse
- [ ] Message de login générique (anti-énumération)
- [ ] `bcrypt` salt factor 12 · JWT signé avec expiration

---

## 4. J3 – Backend : middlewares de protection

### 4.1 Middleware `auth`

`middleware/auth.js` :
1. Lit le header `Authorization: Bearer <token>`. Absent → **401** `UNAUTHORIZED`.
2. `jwt.verify(token, JWT_SECRET)`. Invalide/expiré → **401**.
3. Pose `req.user = { id, role, nom, prenom }` et appelle `next()`.

### 4.2 Middleware `roles`

`middleware/roles.js` — fabrique de middleware :
```js
const roles = (...autorises) => (req, res, next) =>
  autorises.includes(req.user.role) ? next()
    : fail(res, 403, 'FORBIDDEN', 'Accès non autorisé');
module.exports = roles;
```
Usage : `router.get('/users', auth, roles('ADMIN'), ...)`.

### 4.3 Erreurs métier typées

`utils/AppError.js` — classe d'erreur portant `statusCode` + `code`, pour que les controllers
lèvent des erreurs propres captées par `errorHandler` (déjà en place depuis P1) :
```js
class AppError extends Error {
  constructor(statusCode, code, message) { super(message); this.statusCode = statusCode; this.code = code; }
}
```
Plus un wrapper `asyncHandler(fn)` pour éviter les try/catch répétés dans chaque controller.

### 4.4 Application immédiate
- Protéger `GET /auth/me` et `PUT /auth/password` avec `auth`.
- Créer une route de test temporaire `GET /api/auth/admin-test` protégée par `roles('ADMIN')`
  pour valider le 403 (à supprimer en fin de phase).

### ✅ Critères de sortie J3
- [ ] `me` sans token → 401 ; avec token valide → profil
- [ ] Token expiré (tester avec `JWT_EXPIRES=1s`) → 401
- [ ] DEMANDEUR sur route `roles('ADMIN')` → 403 ; ADMIN → 200
- [ ] Toutes les erreurs passent par `errorHandler` (format uniforme)

---

## 5. J4 – Frontend : contexte & connexion

### 5.1 Initialiser shadcn/ui (J4 matin)

C'est le moment prévu (reporté de P1). Dans `client/` :
```bash
npx shadcn@latest init
npx shadcn@latest add button card input label
```
> **Repli documenté** : si l'init échoue, composants Tailwind manuels (`<button className="…">`),
> réintégration de shadcn plus tard. Ne bloque pas la phase.

### 5.2 AuthContext

`src/context/AuthContext.jsx` — état global d'authentification :

| Élément | Rôle |
|---|---|
| `user`, `token` | état courant (token aussi en `localStorage`) |
| `login(email, password)` | appelle `POST /auth/login`, stocke token+user |
| `logout()` | vide l'état + `localStorage`, redirige `/login` |
| `isAuthenticated` | booléen dérivé |
| au montage | si token en `localStorage` → `GET /auth/me` pour réhydrater `user` (gère le F5) |

### 5.3 Intercepteur Axios

Compléter `src/api/axios.js` (préparé en P1) :
- **Requête** : injecter `Authorization: Bearer <token>` si présent.
- **Réponse** : si `401` → purge du token + redirection `/login`
  (le « retour auto au login » du critère de phase).

### 5.4 Page Login

`src/pages/Login.jsx` ([ECRANS.md §2.1](ECRANS.md)) :
- Formulaire (Card + Input + Button shadcn), champs email/mot de passe.
- Soumission → `auth.login()` ; succès → redirection `/` ; échec → message « Identifiants invalides ».
- États : bouton désactivé + spinner pendant l'appel.

### ✅ Critères de sortie J4
- [ ] Les 6 comptes se connectent depuis l'UI
- [ ] Le token est stocké et réinjecté sur les appels suivants
- [ ] Mauvais identifiants → message d'erreur affiché (pas de crash)

---

## 6. J5 – Frontend : routes protégées & layout

### 6.1 ProtectedRoute

`src/components/ProtectedRoute.jsx` :
- Non authentifié → redirige `/login`.
- Authentifié mais rôle non autorisé (`roles` fourni en prop) → redirige `/` avec message.
- Sinon → rend l'enfant.

### 6.2 Routeur applicatif

`src/App.jsx` **remplace** la page de test P1 par le routeur (`react-router-dom`) :
```
/login                       → Login (public)
/          [tous]            → Accueil (placeholder « Bonjour {prénom} » pour l'instant)
/profil    [tous]            → Profil
/utilisateurs [ADMIN]        → placeholder (vraie page en P5)
/*                           → 404
```
Les pages Demandes viendront en P3 ; ici on pose la **structure de navigation sécurisée**.

### 6.3 Layout & Navbar

`src/components/Layout.jsx` + `Navbar.jsx` :
- Barre affichant le nom de l'utilisateur, son rôle, un bouton **Déconnexion**.
- Liens de navigation **conditionnés au rôle** (ex. « Utilisateurs » visible seulement pour ADMIN).
- `NotificationBell` : emplacement réservé (composant réel en P5).

### ✅ Critères de sortie J5
- [ ] Accès à `/` sans être connecté → redirection `/login`
- [ ] DEMANDEUR tentant `/utilisateurs` → redirigé (côté client) **et** 403 si appel API direct
- [ ] Déconnexion vide la session et renvoie au login
- [ ] La navbar affiche des liens différents selon le rôle

---

## 7. J6 – Profil & changement de mot de passe

`src/pages/Profil.jsx` ([ECRANS.md §2.6](ECRANS.md)) :
- Bloc lecture : nom, prénom, email, rôle, structure (via `GET /auth/me`).
- Formulaire changement de mot de passe : `ancien`, `nouveau`, `confirmation`.
  - Validation client : `nouveau` ≥ 8 car., `nouveau === confirmation`.
  - Appel `PUT /auth/password` ; succès → toast + vider les champs ;
    échec 401 → « Ancien mot de passe incorrect ».

**Test de bout en bout** : changer le mot de passe d'un compte de démo, se déconnecter,
échec de connexion avec l'ancien, succès avec le nouveau. **Puis remettre `Demo2026!`**
(pour ne pas casser le jeu de démo — ou re-seeder avec `npm run db:reset`).

### ✅ Critères de sortie J6
- [ ] Changement de mot de passe fonctionnel
- [ ] L'ancien mot de passe ne fonctionne plus après changement
- [ ] Validation client (longueur + confirmation) opérationnelle
- [ ] Jeu de démo restauré (`Demo2026!`) en fin de test

---

## 8. J7 – Tests de sécurité & clôture

### 8.1 Campagne de tests (les 5 critères de phase + bord)

| # | Test | Attendu |
|---|---|---|
| S1 | Connexion des 6 comptes | ✅ tous |
| S2 | Token trafiqué (modifier 1 caractère) | 401 |
| S3 | Token expiré (`JWT_EXPIRES=1s`, attendre) | 401 + retour login |
| S4 | DEMANDEUR → route ADMIN (API directe Postman) | 403 |
| S5 | JURISTE → route ADMIN | 403 |
| S6 | Route protégée sans header | 401 |
| S7 | F5 sur une page protégée | reste connecté (réhydratation `me`) |
| S8 | Déconnexion puis back navigateur | pas d'accès aux pages protégées |
| S9 | Réponse de login | ne contient jamais `password_hash` |
| S10 | Injection SQL dans email (`' OR '1'='1`) | 401, aucune fuite (requêtes paramétrées) |

### 8.2 Revue de conformité
- Vérifier que **chaque** endpoint auth respecte [API.md §2](API.md).
- Vérifier l'application des règles de [CONVENTIONS.md §6](CONVENTIONS.md) (SQL paramétré,
  bcrypt 12, secret en `.env`, autorisation serveur).
- Supprimer la route de test temporaire `admin-test` de J3.

### 8.3 Clôture
- [ ] Nettoyage du code (pas de `console.log` de debug, pas de route de test)
- [ ] Bilan P2 rédigé dans [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md)
- [ ] Commit + push + tag `phase-2`

---

## 9. Checklist globale de sortie P2

### Backend
- [ ] `POST /auth/login`, `GET /auth/me`, `PUT /auth/password` conformes à API.md
- [ ] Middlewares `auth` et `roles` opérationnels
- [ ] Erreurs typées → `errorHandler` (format uniforme)
- [ ] bcrypt 12, JWT signé + expiration, SQL paramétré, message login générique

### Frontend
- [ ] shadcn/ui initialisé (ou repli Tailwind documenté)
- [ ] AuthContext (login/logout/isAuthenticated + réhydratation `me`)
- [ ] Intercepteur Axios (injection token + 401 → login)
- [ ] Page Login, ProtectedRoute, Layout/Navbar selon rôle, page Profil

### Sécurité (les 10 tests S1-S10)
- [ ] Tous verts

### Décision de passage en P3
> P3 (Cœur métier : les demandes) démarre quand toutes les cases sont vertes.
> Rappel : la sécurité étant posée ici, P3→P6 n'y reviennent pas — elles se contentent
> d'appliquer `auth` + `roles` sur chaque nouvelle route.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 19/07/2026 | 1.0 | Création du plan détaillé de la Phase 2 |
