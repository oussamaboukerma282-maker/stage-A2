# Guide de compréhension — Soutenance

> **But de ce document** : te permettre de comprendre **tout** le projet, en profondeur, comme
> si tu l'avais écrit ligne par ligne. Il est fait pour être lu plusieurs fois d'ici le 16 août.
> À la fin, tu dois pouvoir répondre à n'importe quelle question du jury avec tes propres mots.
>
> **Comment l'utiliser** : lis une partie, ferme le document, et essaie de ré-expliquer à voix
> haute. Si tu bloques, relis. La partie 9 (questions du jury) est à travailler en dernier.

---

## Sommaire

1. [La vision : le problème et la solution](#1-la-vision--le-problème-et-la-solution)
2. [Le vocabulaire à maîtriser absolument](#2-le-vocabulaire-à-maîtriser-absolument)
3. [L'architecture globale](#3-larchitecture-globale)
4. [La base de données](#4-la-base-de-données)
5. [Le backend, couche par couche](#5-le-backend-couche-par-couche)
6. [L'authentification et la sécurité](#6-lauthentification-et-la-sécurité)
7. [Le moteur de workflow — le cœur du projet](#7-le-moteur-de-workflow--le-cœur-du-projet)
8. [Le frontend React](#8-le-frontend-react)
9. [Les fonctionnalités, une par une](#9-les-fonctionnalités-une-par-une)
10. [Questions probables du jury + réponses](#10-questions-probables-du-jury--réponses)

---

## 1. La vision : le problème et la solution

### Le problème métier (l'histoire à raconter au jury)

La **Direction des Affaires Juridiques (DAJ)** de Natixis Algeria reçoit des demandes d'avis
juridiques de la part des agences et directions de la banque. **Avant**, tout passait par des
**emails non structurés** : pas de format défini, pas de suivi, pas d'historique, aucune
visibilité sur qui traite quoi ni sur les délais.

**Conséquences** : perte d'information, impossible de mesurer la charge de travail, aucune
traçabilité des décisions (problème grave dans une banque, secteur très réglementé).

### La solution

Une **application web** qui centralise tout : chaque demande a un formulaire structuré, un
**statut** clair, un **historique** complet, des **notifications**, et des **tableaux de bord**.
Trois types d'utilisateurs (le Demandeur, le Juriste, l'Administrateur) chacun avec ses droits.

> **Phrase de synthèse à retenir** : « J'ai digitalisé un processus qui se faisait par email en
> une application web avec un workflow structuré, une traçabilité complète et une gestion des
> rôles, dans le respect des contraintes de confidentialité d'une banque. »

### Pourquoi la stack PERN ?

**PERN = PostgreSQL + Express + React + Node.js.** C'est une stack **JavaScript de bout en bout** :
le même langage (JavaScript) côté serveur et côté navigateur. Avantages à dire au jury :

| Brique | Rôle | Pourquoi ce choix |
|---|---|---|
| **PostgreSQL** | Base de données | Relationnel (données très structurées et liées), robuste, gratuit, gère les transactions (essentiel pour la traçabilité) |
| **Express** | Framework du serveur | Léger, standard de fait pour les API en Node.js |
| **React** | Interface | Composants réutilisables, application fluide (une seule page qui se met à jour) |
| **Node.js** | Environnement d'exécution | Permet d'exécuter du JavaScript côté serveur ; un seul langage à maîtriser |

> Le premier projet (chez Natixis) était en **Oracle APEX**. Le second passage impose de **refaire
> avec d'autres outils** — d'où PERN. À dire si on te demande pourquoi tu as changé.

---

## 2. Le vocabulaire à maîtriser absolument

Si tu es à l'aise avec ces mots, tu parais maître de ton sujet. Apprends ces définitions **avec
tes propres mots** :

| Terme | Définition simple |
|---|---|
| **Client / Serveur** | Le *client* = le navigateur (React). Le *serveur* = le programme qui répond (Express). Ils communiquent par le réseau. |
| **API REST** | Une « porte d'entrée » du serveur : un ensemble d'URL (`/api/demandes`, `/api/auth/login`) que le client appelle pour lire ou modifier des données. REST = une convention pour organiser ces URL. |
| **Endpoint** | Une URL précise de l'API + une méthode (GET, POST…). Ex : `POST /api/demandes`. |
| **JSON** | Le format texte d'échange des données entre client et serveur. Ex : `{ "titre": "…", "statut": "Soumise" }`. |
| **GET / POST / PUT / DELETE** | Les *méthodes HTTP* : GET = lire, POST = créer, PUT = modifier, DELETE = supprimer. |
| **Requête / Réponse** | Le client envoie une *requête*, le serveur renvoie une *réponse* (avec un code : 200 = OK, 401 = pas connecté, 403 = interdit, 404 = introuvable, 409 = conflit). |
| **JWT** | *JSON Web Token* : un « ticket » signé que le serveur donne au client à la connexion, et que le client représente à chaque requête pour prouver qui il est. |
| **Middleware** | Une fonction qui s'exécute **avant** le traitement d'une requête (ex : vérifier le token, vérifier le rôle). |
| **Transaction** | Un groupe d'opérations sur la base qui réussissent **toutes ensemble ou pas du tout**. |
| **Hachage (bcrypt)** | Transformer un mot de passe en une empreinte irréversible, pour ne jamais le stocker en clair. |
| **Composant (React)** | Un morceau d'interface réutilisable (un bouton, un tableau, une page). |
| **State / Props** | *State* = les données internes d'un composant qui changent. *Props* = les données qu'un composant reçoit de son parent. |

---

## 3. L'architecture globale

### Les 3 tiers (3 couches)

L'application est découpée en **trois parties indépendantes** qui communiquent :

```
┌──────────────────┐   requêtes HTTP    ┌──────────────────┐   requêtes SQL   ┌──────────────┐
│   FRONTEND       │   (JSON + token)   │   BACKEND        │   (via driver)   │  BASE DE     │
│   React (port    │ ─────────────────▶ │   Express/Node   │ ───────────────▶ │  DONNÉES     │
│   3000)          │ ◀───────────────── │   (port 5000)    │ ◀─────────────── │  PostgreSQL  │
│   = l'interface  │   réponses JSON    │   = la logique   │   résultats      │  (port 5432) │
└──────────────────┘                    └──────────────────┘                  └──────────────┘
       le navigateur                        le cerveau                          la mémoire
```

**Analogie du restaurant** (très utile pour le jury) :
- Le **frontend** = la salle et le serveur qui prend la commande (ce que voit le client).
- Le **backend** = la cuisine qui prépare et applique les règles (ce qu'on ne voit pas).
- La **base de données** = le garde-manger où tout est stocké.

### Le flux d'une requête, tracé de bout en bout

Exemple : **un juriste valide une demande.** Suis le chemin, c'est LA chose à savoir raconter.

```
1. Le juriste clique sur « Valider » dans le navigateur (React).
2. React envoie une requête :  POST /api/demandes/3/valider  + le token JWT + { avis_juridique: "..." }
3. Express reçoit la requête. Elle traverse les middlewares :
      - auth      : le token est-il valide ? → oui, on sait que c'est le juriste #2
      - (validation du corps : l'avis fait-il au moins 10 caractères ?)
4. Le controller appelle le moteur de workflow.
5. Le moteur ouvre une TRANSACTION et vérifie : la transition "En cours → Validée" est-elle permise
   pour un juriste ? → oui. Puis il écrit dans 3 tables (demande, historique, notification).
6. Il valide la transaction (COMMIT).
7. Express renvoie une réponse JSON : { success: true, data: { ...la demande validée... } }.
8. React reçoit la réponse et rafraîchit l'écran : le statut passe à "Validée".
```

> Si tu sais raconter ce parcours, tu montres que tu comprends **comment tout s'articule**.

### Principe fondamental : la logique est côté serveur

Le frontend **ne décide de rien d'important**. Il affiche, il masque des boutons, mais **toutes
les règles** (qui a le droit de faire quoi, quelles transitions sont permises) sont vérifiées
**côté serveur**. Pourquoi ? Parce qu'un utilisateur mal intentionné peut contourner le navigateur
(ouvrir la console, appeler l'API directement). **Le serveur est la seule barrière de confiance.**

---

## 4. La base de données

### Pourquoi une base relationnelle (et pas un simple fichier / Excel) ?

Nos données sont **très structurées et liées entre elles** : une demande appartient à un
utilisateur, a un historique, des notifications… Une base **relationnelle** (PostgreSQL) gère ces
liens avec des **clés**, garantit la **cohérence** (on ne peut pas créer une demande sans
demandeur), et sait faire des **transactions**. Un fichier Excel ne garantit rien de tout ça.

### Les 5 tables

```
users ──────< demande_avis >────── users        (une demande a 1 demandeur et 0/1 juriste)
                  │
                  ├──< historique_statuts        (les changements de statut, immuables)
                  ├──< notifications             (les alertes internes)
                  └──< commentaires              (le fil de discussion — optionnel)
```

| Table | Contient | Points clés |
|---|---|---|
| `users` | Les comptes (nom, email, `password_hash`, `role`, `actif`) | Le mot de passe n'est **jamais** en clair, seulement son *hash* bcrypt |
| `demande_avis` | Les demandes (titre, thème, description, sensibilité, **statut**, pièce jointe, dates) | La colonne `statut` est le cœur du workflow |
| `historique_statuts` | Chaque changement de statut (ancien → nouveau, qui, quand) | **Immuable** : on ajoute, on ne modifie/supprime jamais → traçabilité |
| `notifications` | Les alertes (destinataire, message, lue ou non) | Écrites automatiquement par le serveur |
| `commentaires` | Le fil de discussion sur une demande | Optionnel (conçu dès le début, activé en Phase 6) |

### Les mots-clés de base à connaître

- **Clé primaire (PK)** : l'identifiant unique d'une ligne (`id`). Comme un numéro de sécurité sociale.
- **Clé étrangère (FK)** : une colonne qui pointe vers la clé primaire d'une autre table.
  Ex : `demande_avis.demandeur_id` pointe vers `users.id`. C'est ce qui crée le **lien**.
- **Contrainte CHECK** : une règle que la base fait respecter. Ex : `statut` ne peut valoir que
  l'une des 7 valeurs autorisées. Impossible d'insérer un statut inventé.
- **NOT NULL / UNIQUE** : « obligatoire » / « pas de doublon » (ex : deux comptes ne peuvent pas
  avoir le même email).

### Le double rôle de `users` (question piège possible)

La même table `users` sert **deux fois** pour une demande : une fois comme **demandeur**
(`demandeur_id`) et une fois comme **juriste** (`juriste_id`). C'est normal : ce sont deux rôles
différents joués par des personnes de la même table.

### Deux décisions à savoir justifier

- **On ne supprime jamais physiquement** un utilisateur ni une demande. On **désactive**
  (`actif = false`). Pourquoi ? Parce qu'ils sont référencés par des demandes, de l'historique…
  Supprimer casserait ces liens et la traçabilité.
- **Le degré de sensibilité est calculé automatiquement** selon le thème (ex : « Moyens de
  paiements » → Confidentiel). C'est une **règle métier** centralisée côté serveur.

---

## 5. Le backend, couche par couche

### L'architecture « en couches » (MVC adapté)

Le backend est organisé en **couches**, chacune avec une seule responsabilité. Une requête les
traverse dans l'ordre. C'est ce qui rend le code propre et maintenable.

```
Requête HTTP
   │
   ▼
routes/        → définit l'URL (« /api/demandes ») et enchaîne les middlewares
   │
   ▼
middleware/    → contrôles transverses : auth (token), roles (permissions), validation, upload
   │
   ▼
controllers/   → l'orchestration : lit la requête, appelle le model/service, formate la réponse
   │
   ▼
services/      → la logique métier complexe (ex : le moteur de workflow)
   │
   ▼
models/        → le SEUL endroit qui parle à la base (les requêtes SQL)
   │
   ▼
PostgreSQL
```

**Règles d'or de cette organisation** (à citer, ça fait pro) :
- Un **controller** ne contient jamais de SQL → il passe par un **model**.
- Un **model** ne contient jamais de logique HTTP (pas de `req`/`res`).
- Chaque entité a ses fichiers : `routes/demandes.js`, `controllers/demandesController.js`,
  `models/demandesModel.js`.

**Pourquoi séparer ainsi ?** Pour que ce soit **testable**, **réutilisable** et **facile à
modifier**. Si demain la base change, on ne touche qu'aux `models`. Si une règle change, qu'aux
`services`. C'est le principe de **séparation des responsabilités**.

### Exemple concret tracé : `GET /api/demandes` (lister les demandes)

1. `routes/demandes.js` : la route `GET /` est protégée par le middleware `auth`, puis appelle
   `controller.lister`.
2. `controllers/demandesController.js` → `lister` : lit les filtres de la requête (statut, thème…)
   et appelle `demandesModel.list(req.user, filtres)`.
3. `models/demandesModel.js` → `list` : construit la requête SQL. **Ici se joue la règle de
   visibilité** : si l'utilisateur est un DEMANDEUR, on ajoute `WHERE demandeur_id = <lui>` ; sinon
   (juriste/admin) on exclut les brouillons. **Le filtrage est fait en SQL, jamais côté client.**
4. Le model renvoie les lignes, le controller les met dans `{ success: true, data: [...] }`.

### Le format de réponse uniforme

Toutes les réponses ont la **même forme** (défini dans `helpers/response.js`) :
- Succès : `{ "success": true, "data": ... }`
- Erreur : `{ "success": false, "error": { "code": "...", "message": "..." } }`

**Pourquoi ?** Pour que le frontend traite toutes les réponses de la même manière. Cohérence =
moins de bugs.

### La gestion d'erreurs centralisée

Au lieu de gérer les erreurs partout, il y a **un seul** middleware `errorHandler` à la fin. Les
controllers « lèvent » une erreur typée (`AppError`), et ce middleware la transforme en réponse
propre. Un utilitaire `asyncHandler` évite de répéter `try/catch` partout.

---

## 6. L'authentification et la sécurité

C'est un sujet que le jury adore. Sois solide dessus.

### bcrypt : le hachage des mots de passe

On ne stocke **jamais** un mot de passe en clair. À la création d'un compte, on le passe dans
**bcrypt**, qui produit une **empreinte irréversible** (un « hash »). Exemple :
`Demo2026!` → `$2b$12$kkvD0...` (impossible de revenir en arrière).

À la connexion, bcrypt **compare** le mot de passe saisi au hash stocké. Si ça correspond, c'est bon.

- **Pourquoi irréversible ?** Si la base est volée, les mots de passe restent protégés.
- **« salt factor 12 »** : bcrypt ajoute du « sel » (des données aléatoires) et répète le calcul
  2¹² fois pour rendre les attaques par force brute très lentes.

### JWT : prouver son identité à chaque requête

Problème : le protocole HTTP est **sans mémoire** — le serveur ne se souvient pas de qui tu es
d'une requête à l'autre. Solution : le **JWT (JSON Web Token)**.

```
1. Connexion réussie → le serveur crée un JWT : un jeton qui contient { id, role, nom }
   et qui est SIGNÉ avec une clé secrète que seul le serveur connaît.
2. Le client stocke ce jeton et l'envoie à CHAQUE requête, dans l'en-tête :
   Authorization: Bearer <le jeton>
3. À chaque requête, le middleware "auth" vérifie la signature. Si elle est valide,
   il sait qui tu es (req.user = { id, role, ... }) sans avoir besoin de mémoire.
```

- **La signature** garantit que personne ne peut fabriquer ou modifier un faux jeton (il faudrait
  la clé secrète).
- **Expiration** : le jeton expire au bout de 24h → si volé, il ne dure pas éternellement.
- **« stateless » (sans état)** : le serveur n'a pas besoin de stocker les sessions → simple et
  scalable.

### Les deux middlewares de protection

- **`auth`** : vérifie le token et remplit `req.user`. Sans token valide → **401** (non authentifié).
- **`roles('ADMIN')`** : vérifie que l'utilisateur a le bon rôle. Sinon → **403** (interdit).
  Exemple : `router.get('/users', auth, roles('ADMIN'), ...)` → seuls les admins listent les users.

### Les principes de sécurité appliqués (à réciter)

| Principe | Ce qu'on a fait |
|---|---|
| Mots de passe | Hachés avec bcrypt, jamais en clair, jamais renvoyés par l'API |
| Autorisation | Vérifiée **côté serveur** sur chaque route (le client ne fait que masquer) |
| Injection SQL | **Requêtes paramétrées** (`$1, $2`) partout → impossible d'injecter du code |
| Messages de login | **Génériques** (« Identifiants invalides ») → on ne dit pas si c'est l'email ou le mot de passe qui est faux (anti-énumération) |
| Upload de fichiers | Type et taille vérifiés, nom remplacé par un identifiant unique, dossier non public |

> **Injection SQL — à comprendre** : si on construisait la requête en collant le texte de
> l'utilisateur (`"WHERE email = '" + saisie + "'"`), un pirate pourrait saisir `' OR '1'='1` pour
> tout récupérer. Avec des **requêtes paramétrées**, la saisie est traitée comme une simple valeur,
> jamais comme du code. On l'a testé : ça renvoie une erreur, aucune fuite.

---

## 7. Le moteur de workflow — le cœur du projet

**C'est LA partie qui impressionne un jury.** Si tu ne dois maîtriser qu'une chose, c'est ça.

### Qu'est-ce qu'un workflow / une machine à états ?

Une demande passe par une **suite d'états (statuts)** bien définis, et on ne peut passer d'un état
à l'autre que par des **transitions autorisées**. C'est une **machine à états**.

Les **7 statuts** : `Brouillon → Soumise → En cours → Complément demandé → Validée / Rejetée / Annulée`.

```
             ┌────────────┐
     Annuler │ BROUILLON  │ Soumettre
      ┌──────┴─────┬──────┘
      ▼            ▼
  [ANNULÉE]    [SOUMISE]
                   │ Prise en charge (juriste)
                   ▼
             ┌───────────┐   Demander complément
   ┌─────────│ EN COURS  │◀──────────────┐
   │         └─────┬─────┘               │
   ▼  Valider /    │   Compléter et      │
[COMPLÉMENT       │   renvoyer          │
 DEMANDÉ] ─────────┘                     │
                   │ Valider / Rejeter
                   ▼
          [VALIDÉE] / [REJETÉE]
```

### La matrice de transitions (la source unique de vérité)

Dans `services/workflow.js`, on définit **explicitement** quelles transitions sont permises, par
qui, et avec quelles données obligatoires. Exemple simplifié :

```
En cours → Validée   : rôles [JURISTE, ADMIN], donnée obligatoire : avis_juridique
En cours → Rejetée   : rôles [JURISTE, ADMIN], donnée obligatoire : motif_rejet
Brouillon → Soumise  : rôle [DEMANDEUR propriétaire]
Validée → n'importe  : INTERDIT (état terminal)
```

Sur les **49 combinaisons possibles** (7 statuts × 7), seules **7 sont autorisées**. Tout le reste
est refusé automatiquement.

### La règle d'or : un seul endroit modifie le statut

**Aucun** autre fichier ne modifie la colonne `statut` directement. Tout passe par la fonction
`executerTransition` du moteur. **Pourquoi ?** Pour garantir qu'à chaque changement de statut, on
fait **toujours** les trois écritures ensemble (statut + historique + notification). Si on
autorisait des `UPDATE` directs ailleurs, on casserait la traçabilité sans s'en apercevoir.

### L'ordre des contrôles (détail qui montre la rigueur)

`executerTransition` vérifie, **dans cet ordre** :
1. La demande existe ? → sinon **404**
2. La transition est-elle dans la matrice ? → sinon **409** (conflit)
3. Le rôle est-il autorisé ? → sinon **403**
4. Est-ce le propriétaire (si requis) ? → sinon **403**
5. La donnée obligatoire est-elle là ? → sinon **400**

> **Pourquoi vérifier le statut (409) AVANT le rôle (403) ?** Pour donner un message juste : un
> juriste qui tente de valider une demande **déjà validée** reçoit « la demande est clôturée »
> (409), pas un « accès interdit » (403) trompeur.

### L'atomicité : la transaction (concept clé)

Chaque transition fait **trois écritures** dans la base :
1. `UPDATE demande_avis` (le nouveau statut + les champs liés + les dates)
2. `INSERT historique_statuts` (la trace)
3. `INSERT notifications` (l'alerte au bon destinataire)

Ces trois écritures sont enfermées dans une **TRANSACTION** :

```
BEGIN         (on ouvre)
   UPDATE ...
   INSERT historique ...
   INSERT notification ...
COMMIT        (on valide TOUT d'un coup)   — ou ROLLBACK (on annule TOUT) si une étape échoue
```

**Pourquoi ?** Pour ne **jamais** avoir un état incohérent : par exemple un statut changé mais
sans trace dans l'historique. C'est **tout ou rien**. C'est exactement ce qu'il faut pour la
traçabilité d'une banque.

### La gestion de la concurrence (bonus qui impressionne)

Que se passe-t-il si **deux juristes** cliquent « Prendre en charge » **en même temps** ? On
utilise un **verrou** (`SELECT ... FOR UPDATE`) au début de la transaction : le premier passe, le
second attend, puis constate que le statut a déjà changé et reçoit un **409**. Résultat : un seul
juriste assigné, une seule ligne d'historique. On l'a **testé** : ça marche.

---

## 8. Le frontend React

### C'est quoi React, en une phrase ?

Une bibliothèque pour construire des interfaces à partir de **composants** réutilisables. L'appli
est une **SPA (Single Page Application)** : une seule page HTML se charge, puis React met à jour le
contenu sans recharger la page → fluide et rapide.

### Les concepts React à connaître

| Concept | Explication |
|---|---|
| **Composant** | Une fonction qui renvoie de l'interface (du « JSX », qui ressemble à du HTML). Ex : `StatutBadge`, `NotificationBell`. |
| **Props** | Les données qu'un composant reçoit de son parent. Ex : `<StatutBadge statut="Validée" />`. |
| **State (`useState`)** | Les données internes qui changent et déclenchent un ré-affichage. Ex : la liste des demandes. |
| **Effet (`useEffect`)** | Du code qui s'exécute à un moment précis (ex : charger les données au montage de la page). |
| **Contexte (`useContext`)** | Un moyen de partager une donnée dans toute l'appli sans la passer de main en main. On l'utilise pour l'authentification et le thème. |

### L'organisation du frontend

```
client/src/
├── api/axios.js        → l'outil qui parle au backend (ajoute le token, gère les erreurs 401)
├── context/
│   ├── AuthContext     → qui est connecté, login/logout, mémorisé même après un rafraîchissement
│   └── ThemeContext    → mode clair / sombre
├── components/         → les briques réutilisables (Navbar, StatutBadge, cloche, modales, Timeline…)
├── pages/              → les écrans (Login, Demandes, Détail, Dashboards, Utilisateurs…)
└── App.jsx             → le routeur : quelle page pour quelle URL, avec quelle protection
```

### Trois mécanismes importants à savoir expliquer

**1. L'intercepteur Axios** (`api/axios.js`)
Axios est l'outil qui envoie les requêtes. On l'a configuré pour **automatiquement** :
- ajouter le token JWT à **chaque** requête (on n'a pas à y penser à chaque appel) ;
- si le serveur répond **401** (session expirée), déconnecter et renvoyer au login.

**2. Le contexte d'authentification** (`AuthContext`)
Il garde en mémoire l'utilisateur connecté. Au **rafraîchissement de la page (F5)**, il redemande
le profil au serveur (`GET /auth/me`) grâce au token stocké → l'utilisateur **reste connecté**.
C'est ce qu'on appelle la **réhydratation**.

**3. Les routes protégées** (`ProtectedRoute`)
Un composant qui entoure les pages : si tu n'es pas connecté → redirection vers `/login` ; si ton
rôle n'est pas autorisé (ex : un demandeur qui tape `/utilisateurs`) → redirection vers l'accueil.
**Rappel** : ce n'est qu'un confort visuel ; la vraie protection est côté serveur.

### Les rôles affichent des choses différentes

- L'**accueil** (`Accueil.jsx`) aiguille vers le bon tableau de bord selon le rôle.
- La **page détail** d'une demande affiche des **boutons différents** selon le couple
  (rôle, statut) — c'est la traduction visuelle de la matrice du workflow. Ex : un juriste sur une
  demande « En cours » voit « Valider / Rejeter / Demander complément » ; un demandeur ne les voit pas.

---

## 9. Les fonctionnalités, une par une

Pour chaque fonctionnalité : **ce que ça fait**, **comment techniquement**, **le fichier clé**.

### Authentification (Phase 2)
- **Quoi** : login, déconnexion, changement de mot de passe, 3 rôles.
- **Comment** : `POST /auth/login` vérifie via bcrypt et renvoie un JWT ; les middlewares `auth`
  et `roles` protègent les routes ; côté React, `AuthContext` + intercepteur Axios.

### Gestion des demandes (Phase 3)
- **Quoi** : créer un brouillon, le modifier, joindre un fichier, le soumettre, consulter.
- **Comment** : CRUD classique. La **règle de visibilité** est en SQL (un demandeur ne voit que
  les siennes). La **sensibilité** est calculée automatiquement selon le thème.

### Pièces jointes (Phase 3)
- **Quoi** : joindre un PDF/DOCX/image (max 10 Mo), le télécharger, le supprimer.
- **Comment** : **Multer** reçoit le fichier, le stocke sur le disque avec un **nom unique
  (UUID)**, et enregistre les *métadonnées* (nom d'origine, taille, type) en base. Le dossier
  `/uploads` **n'est pas public** : on y accède seulement via une route qui vérifie les droits.
- **Piège de sécurité à citer** : si on servait `/uploads` publiquement, n'importe qui devinant un
  nom de fichier pourrait le télécharger sans contrôle. On l'a évité.

### Workflow & traçabilité (Phase 4)
- **Quoi** : le cycle de vie complet + l'historique + le journal d'activité.
- **Comment** : le **moteur de transitions** (partie 7). L'historique est **immuable**. Le journal
  d'activité (la « Timeline » sur la page détail) est simplement l'affichage de cet historique.

### Notifications (Phase 5)
- **Quoi** : une cloche avec un compteur ; on est prévenu quand une demande nous concerne.
- **Comment** : les notifications sont **écrites automatiquement par le moteur** à chaque
  transition. La cloche (`NotificationBell`) les lit et se rafraîchit toutes les 30 secondes
  (**polling**). Cliquer une notification la marque « lue » et ouvre la demande.

### Tableaux de bord (Phase 5)
- **Quoi** : chaque rôle a sa vue. L'admin a 4 graphiques + des indicateurs (KPIs).
- **Comment** : les chiffres sont calculés en **SQL agrégé** (`GROUP BY`, `COUNT`, `AVG`) côté
  serveur (pas en JavaScript sur des listes). Les graphiques sont dessinés avec **Chart.js**.
  Garde-fou : les taux ne provoquent jamais de division par zéro.

### Gestion des utilisateurs (Phase 5)
- **Quoi** : l'admin crée/modifie des comptes, les active/désactive.
- **Comment** : CRUD réservé au rôle ADMIN. **Jamais de suppression physique** (désactivation).
  Un admin **ne peut pas se désactiver lui-même** (auto-protection).

### Les optionnelles (Phase 6)
- **Mode sombre** : un `ThemeContext` bascule une classe `dark` sur la page ; Tailwind applique
  automatiquement les couleurs sombres. Persisté dans le navigateur.
- **Export CSV** : le serveur génère un fichier CSV des demandes (avec un « BOM UTF-8 » pour que
  les accents s'affichent bien dans Excel).
- **Commentaires** : un fil de discussion sur chaque demande (table `commentaires`).
- **Export PDF + QR code** : le serveur génère un PDF de la fiche (avec **pdfkit**) et y intègre un
  **QR code** (avec **qrcode**) qui pointe vers la demande en ligne.
- **Téléchargement du tableau de bord** : côté navigateur, on récupère les graphiques en image
  (fonction native de Chart.js) et on assemble un **rapport PDF** avec **jsPDF**.

---

## 10. Questions probables du jury + réponses

Entraîne-toi à répondre **à voix haute**, avec tes mots.

**Q : Pourquoi avoir choisi cette architecture (PERN) ?**
> Parce que le besoin est une application web de gestion avec des données très structurées et
> liées. PostgreSQL gère ces liens et les transactions (essentiel pour la traçabilité). Node/Express
> pour une API légère, React pour une interface fluide. Et c'est du JavaScript de bout en bout, donc
> un seul langage à maîtriser.

**Q : Comment gérez-vous la sécurité ?**
> Mots de passe hachés avec bcrypt, authentification par JWT, autorisations vérifiées côté serveur
> à chaque route, requêtes SQL paramétrées contre l'injection, et messages de connexion génériques.
> Le principe clé : le frontend ne fait que masquer, la vraie barrière est le serveur.

**Q : Qu'est-ce qui garantit qu'une demande ne peut pas passer dans un état incohérent ?**
> Un moteur de transitions unique : toute la logique est dans un seul fichier, avec une matrice des
> transitions autorisées. Et chaque transition écrit le statut, l'historique et la notification dans
> une seule transaction — c'est tout ou rien, donc jamais d'incohérence.

**Q : Que se passe-t-il si deux juristes traitent la même demande en même temps ?**
> J'utilise un verrou en base (SELECT FOR UPDATE) dans la transaction. Le premier passe, le second
> reçoit une erreur 409. Un seul juriste est assigné. Je l'ai testé.

**Q : Pourquoi ne pas supprimer les utilisateurs ?**
> Parce qu'ils sont référencés par des demandes, de l'historique, des notifications. Les supprimer
> casserait ces liens et la traçabilité. On désactive à la place.

**Q : Comment l'utilisateur reste-t-il connecté après un rafraîchissement ?**
> Le token JWT est stocké dans le navigateur. Au chargement, l'application redemande le profil au
> serveur avec ce token (réhydratation). Tant que le token est valide, l'utilisateur reste connecté.

**Q : C'est quoi une transaction, concrètement ?**
> Un groupe d'écritures en base qui réussissent toutes ensemble ou pas du tout. On ouvre (BEGIN),
> on écrit, et soit on valide tout (COMMIT), soit on annule tout (ROLLBACK) si une étape échoue.

**Q : Comment les statistiques sont-elles calculées ?**
> En SQL agrégé directement dans la base (GROUP BY, COUNT, AVG), pas en JavaScript. C'est plus
> rapide et plus fiable. Les graphiques sont ensuite dessinés avec Chart.js côté navigateur.

**Q : Qu'est-ce qui différencie ce projet du premier (Oracle APEX) ?**
> Même besoin métier, mais refait avec une stack moderne open-source (PERN), un workflow plus
> détaillé (7 statuts, 3 rôles), une vraie séparation frontend/backend, et des fonctionnalités
> supplémentaires (notifications, tableaux de bord, exports).

**Q : Quelle a été la partie la plus difficile ?**
> Le moteur de workflow : garantir que chaque transition soit à la fois sécurisée (bon rôle),
> cohérente (transition autorisée) et atomique (statut + historique + notification ensemble). C'est
> là que j'ai le plus appris, notamment sur les transactions et la gestion de la concurrence.

**Q : Que améliorerais-tu avec plus de temps ?**
> Les mentions @ dans les commentaires, une recherche plein-texte, des pièces jointes multiples, et
> pourquoi pas des tests automatisés pour sécuriser les évolutions futures.

---

## Conseils pour le jour J

- **Raconte une histoire** : le problème (emails) → la solution → une démo → les choix techniques.
- **Assume tes choix** : « J'ai choisi X **parce que** Y ». Un choix justifié vaut mieux qu'une
  fonctionnalité de plus.
- **Sois honnête sur les limites** : citer ce que tu ferais avec plus de temps montre de la maturité.
- **Si tu ne sais pas** : « Je ne l'ai pas implémenté, mais voici comment je m'y prendrais… ».
- **Maîtrise le parcours d'une requête** (partie 3) et **le moteur de workflow** (partie 7) : ce
  sont les deux sujets qui prouvent que tu comprends vraiment.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 27/07/2026 | 1.0 | Création du guide de compréhension pour la soutenance |
