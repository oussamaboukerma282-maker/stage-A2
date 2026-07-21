# Note d'avancement — Phase 2 (Authentification & Sécurité)

> **Projet** : Gestion des Avis Juridiques (application PERN — Natixis DAJ)
> **Phase** : P2 — Authentification & Sécurité
> **Statut** : ✅ **Terminée** — tag Git `phase-2`
> **Date** : 21/07/2026
> **Auteur** : BOUKERMA Oussama (CESI Exia A2)
> **Public visé** : tout développeur rejoignant le projet

---

## 1. Objet de ce document

Cette note explique **ce qui a été réalisé pendant la Phase 2**, comment le code est organisé,
comment le lancer et le tester, et ce qui reste à faire. Elle sert de point d'entrée pour un
développeur qui reprend le projet sans avoir suivi son historique.

Pour le détail de la planification, voir [`P2_PLAN_AUTH.md`](P2_PLAN_AUTH.md).
Pour la vision globale des phases, voir [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md).

---

## 2. En une phrase

P2 met en place **toute l'authentification et la sécurité** de l'application : un utilisateur se
connecte, reçoit un jeton JWT, et n'accède qu'aux ressources autorisées pour son rôle
(Demandeur / Juriste / Administrateur). **Aucune fonctionnalité métier de demandes** n'est
incluse ici — c'est l'objet de la Phase 3.

---

## 3. Ce qui a été réalisé

### 3.1 Backend (Express / Node.js)

| Élément | Fichier | Rôle |
|---|---|---|
| Connexion | `controllers/authController.js` → `login` | Vérifie email + mot de passe (bcrypt), émet un JWT |
| Profil | `controllers/authController.js` → `me` | Renvoie l'utilisateur courant (sans le hash) |
| Mot de passe | `controllers/authController.js` → `changePassword` | Change le mot de passe après vérification de l'ancien |
| Accès données | `models/usersModel.js` | Requêtes SQL sur `users` (paramétrées) |
| Routes | `routes/auth.js` | Monte `/api/auth/*` + validations `express-validator` |
| Middleware auth | `middleware/auth.js` | Vérifie le JWT, remplit `req.user` |
| Middleware rôles | `middleware/roles.js` | Autorise selon le rôle (sinon 403) |
| Middleware validation | `middleware/validate.js` | Renvoie 400 si données invalides |
| Utilitaires | `utils/jwt.js`, `utils/AppError.js` | Signature/vérif JWT ; erreurs typées + `asyncHandler` |

### 3.2 Frontend (React / Vite / Tailwind)

| Élément | Fichier | Rôle |
|---|---|---|
| Contexte d'auth | `context/AuthContext.jsx` | État `user`/token, `login`/`logout`, réhydratation au F5 |
| Client HTTP | `api/axios.js` | Injecte le JWT ; sur 401 → purge + redirection login |
| Garde de route | `components/ProtectedRoute.jsx` | Bloque selon authentification + rôle |
| Mise en page | `components/Layout.jsx` | Navbar (liens selon rôle) + déconnexion |
| Page connexion | `pages/Login.jsx` | Formulaire de login |
| Page profil | `pages/Profil.jsx` | Infos compte + changement de mot de passe |
| Accueil / 404 / placeholder | `pages/Accueil.jsx`, `NotFound.jsx`, `Placeholder.jsx` | Écrans de base |
| Routeur | `App.jsx` | Routes + protections (remplace la page de test P1) |

---

## 4. API livrée en P2

Base URL : `http://localhost:5000/api`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Connexion → `{ token, user }` |
| GET | `/auth/me` | authentifié | Profil de l'utilisateur courant |
| PUT | `/auth/password` | authentifié | Changement de mot de passe |
| GET | `/health` | public | Vérifie l'état API + base (hérité de P1) |

**Format de réponse** (uniforme dans tout le projet) :
- Succès : `{ "success": true, "data": ... }`
- Erreur : `{ "success": false, "error": { "code": "...", "message": "..." } }`

**Codes utilisés** : 200 · 400 (validation) · 401 (non authentifié) · 403 (rôle refusé) · 404 · 500.

---

## 5. Règles de sécurité appliquées

| Règle | Mise en œuvre |
|---|---|
| Mots de passe | Hachage **bcrypt** (salt factor 12). Jamais stockés ni renvoyés en clair. |
| Jeton | **JWT** signé HS256, secret en `.env`, expiration 24 h. |
| Message de login | **Générique** (« Identifiants invalides ») : ne révèle pas si c'est l'email, le mot de passe ou un compte désactivé (anti-énumération). |
| Autorisation | Vérifiée **côté serveur** sur chaque route. Le frontend ne fait que masquer les éléments. |
| Injection SQL | Requêtes **paramétrées** partout (aucune concaténation). |
| `password_hash` | **Jamais** présent dans une réponse API. |
| CORS | Restreint à l'origine du frontend (`.env`). |

---

## 6. Comment lancer et tester

### Prérequis
Node 18+, PostgreSQL 15+ (voir [README](../README.md) pour l'installation complète).

### Démarrage
```bash
# À la racine du projet
npm run install:all      # dépendances (racine + server + client)
npm run db:reset         # (re)crée le schéma + les données de démo
npm run dev              # lance backend (:5000) et frontend (:3000)
```

### Comptes de démonstration
Mot de passe commun : **`Demo2026!`**

| Email | Rôle |
|---|---|
| admin@natixis.dz | Administrateur |
| juriste1@natixis.dz / juriste2@natixis.dz | Juriste |
| demandeur1@natixis.dz … demandeur3@natixis.dz | Demandeur |

### Scénarios de vérification rapide
1. Se connecter avec un compte **juriste** → l'accueil s'affiche, la navbar **ne montre pas**
   « Utilisateurs » (réservé Admin).
2. Tenter d'ouvrir `/utilisateurs` en juriste → redirection vers l'accueil.
3. Recharger la page (F5) → **reste connecté** (réhydratation via `/auth/me`).
4. Se déconnecter → retour au login ; réessayer une page protégée → renvoi au login.
5. Aller dans **Profil** → changer son mot de passe (l'ancien ne fonctionne plus ensuite).

---

## 7. Tests réalisés (résultats)

**Backend (via curl / Postman)** — tous conformes :

| Test | Attendu | Obtenu |
|---|---|---|
| Login correct | 200 + token | ✅ |
| Mauvais mot de passe | 401 générique | ✅ |
| Email inexistant | 401 même message | ✅ |
| Email mal formé | 400 | ✅ |
| `me` sans token | 401 | ✅ |
| `me` avec token | 200, sans `password_hash` | ✅ |
| Token invalide/expiré | 401 | ✅ |
| Demandeur → route Admin | 403 | ✅ |
| Injection SQL dans email | 400 (jamais 500) | ✅ |
| Mot de passe trop court | 400 | ✅ |

**Frontend (parcours navigateur bout en bout)** : login, navigation conditionnée au rôle,
guard de route, persistance au rechargement, déconnexion — **tous OK**.

**Changement de mot de passe (EF21)** : validé (change → ancien échoue → nouveau fonctionne),
puis jeu de données de démo restauré.

---

## 8. Décisions & écarts à connaître

| Sujet | Décision |
|---|---|
| **shadcn/ui non initialisé** | Repli **Tailwind** appliqué (composants stylés manuellement avec la palette du projet). Choix pour éviter un `init` fragile et garder P2 100 % fonctionnelle. shadcn pourra être ajouté plus tard **sans refonte**. |
| Stockage du JWT | `localStorage` (simple, adapté à un projet académique — limite connue et assumée). |
| Déconnexion | Purement côté client (pas d'endpoint serveur : JWT *stateless*). |
| Express 5 | Le backend tourne sous Express 5 (installé par défaut). Aucune incompatibilité rencontrée. |

---

## 9. Structure des dossiers (rappel)

```
server/
├── config/db.js            # pool PostgreSQL
├── middleware/             # auth, roles, validate, errorHandler
├── models/usersModel.js    # SQL users
├── controllers/            # authController
├── routes/                 # auth, health
├── utils/                  # jwt, AppError
└── server.js               # point d'entrée (:5000)

client/src/
├── api/axios.js            # instance HTTP + intercepteurs
├── context/AuthContext.jsx # état d'authentification
├── components/             # ProtectedRoute, Layout
├── pages/                  # Login, Accueil, Profil, Placeholder, NotFound
└── App.jsx                 # routeur
```

---

## 10. Prochaine étape — Phase 3

**Cœur métier : les demandes** — création (brouillon), soumission, liste filtrée par rôle,
page détail, et gestion des pièces jointes. Toutes les nouvelles routes s'appuieront sur les
middlewares `auth` + `roles` déjà en place : **la sécurité ne sera pas retouchée**.

Référence à venir : `P3_PLAN_*.md`.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 21/07/2026 | 1.0 | Rédaction de la note d'avancement P2 |
