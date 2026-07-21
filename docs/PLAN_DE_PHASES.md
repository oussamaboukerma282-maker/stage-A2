# Plan de Phases – Projet Gestion des Avis Juridiques

> **Projet** : Application web de gestion des demandes d'avis juridiques (refonte PERN)
> **Auteur** : BOUKERMA Oussama – CESI Exia A2
> **Contexte** : Deuxième passage – Stage Natixis Algeria (Direction des Affaires Juridiques)
> **Durée totale** : 6 semaines (rythme 7j/7)
> **Référence** : `CDC_Avis_Juridiques_PERN_V2.docx`

---

## Sommaire

1. [Vision globale du projet](#1-vision-globale-du-projet)
2. [Vue d'ensemble des phases](#2-vue-densemble-des-phases)
3. [Phase 0 – Conception & Architecture](#3-phase-0--conception--architecture)
4. [Phase 1 – Fondations techniques](#4-phase-1--fondations-techniques)
5. [Phase 2 – Authentification & Sécurité](#5-phase-2--authentification--sécurité)
6. [Phase 3 – Cœur métier : les demandes](#6-phase-3--cœur-métier--les-demandes)
7. [Phase 4 – Workflow & Traçabilité](#7-phase-4--workflow--traçabilité)
8. [Phase 5 – Notifications & Tableaux de bord](#8-phase-5--notifications--tableaux-de-bord)
9. [Phase 6 – Finitions, Optionnelles & Livraison](#9-phase-6--finitions-optionnelles--livraison)
10. [Règles de gestion du projet](#10-règles-de-gestion-du-projet)
11. [Glossaire](#11-glossaire)

---

## 1. Vision globale du projet

### 1.1 Le besoin en une phrase

Permettre aux employés d'une banque de **soumettre des demandes d'avis juridiques** à la Direction des Affaires Juridiques (DAJ), et permettre aux juristes de **les traiter selon un workflow structuré et traçable**, en remplacement d'échanges email non structurés.

### 1.2 Les 3 acteurs

| Acteur | Qui c'est | Ce qu'il fait |
|---|---|---|
| **Demandeur** | Employé d'une agence ou direction | Crée, soumet et suit ses demandes |
| **Juriste** | Membre de la DAJ | Prend en charge, analyse, demande des compléments, valide ou rejette |
| **Administrateur** | Responsable DAJ | Tout ce que fait le Juriste + gestion des comptes + statistiques globales |

### 1.3 Le workflow central (machine à états)

```
                    ┌────────────┐
             ┌──────│  Brouillon │──────┐
             │      └─────┬──────┘      │
         Annuler          │ Soumettre   │
             │            ▼             │
      ┌──────▼─────┐ ┌─────────┐        │
      │  Annulée   │ │ Soumise │        │
      └────────────┘ └────┬────┘        │
                          │ Prise en charge (Juriste)
                          ▼
                    ┌───────────┐   Demander complément    ┌─────────────────────┐
                    │  En cours │─────────────────────────▶│ Complément demandé  │
                    │           │◀─────────────────────────│                     │
                    └─────┬─────┘   Dossier complété       └─────────────────────┘
                          │
              ┌───────────┴───────────┐
              │ Valider               │ Rejeter
              ▼                       ▼
        ┌──────────┐            ┌──────────┐
        │ Validée  │            │ Rejetée  │
        └──────────┘            └──────────┘
```

**Règle d'or** : toute transition non prévue dans ce schéma est **interdite et bloquée côté serveur**. Chaque transition est historisée (qui, quand, quoi) et déclenche une notification.

### 1.4 Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Base de données | **PostgreSQL 15+** | Stockage relationnel, contraintes d'intégrité |
| Backend | **Node.js 18+ / Express 4** | API REST, logique métier, sécurité |
| Frontend | **React 18 / Vite** | Interface SPA |
| Style | **Tailwind CSS + shadcn/ui** | Design system, composants accessibles |
| Auth | **JWT + bcrypt** | Tokens signés, mots de passe hachés |
| Fichiers | **Multer + stockage local `/uploads`** | Pièces jointes |
| Graphiques | **Chart.js** | Tableaux de bord |

### 1.5 Architecture globale

```
┌─────────────────────┐         ┌──────────────────────────┐         ┌──────────────────┐
│   CLIENT (React)    │  HTTP   │   SERVEUR (Express)      │   SQL   │   PostgreSQL     │
│   localhost:3000    │────────▶│   localhost:5000         │────────▶│   localhost:5432 │
│                     │  JSON   │                          │  (pg)   │                  │
│  - Pages            │◀────────│  - Routes (API REST)     │◀────────│  - 5 tables      │
│  - Composants       │  + JWT  │  - Middleware (auth,     │         │  - Contraintes   │
│  - Context (auth)   │         │    upload, validation)   │         │    FK/PK         │
│  - Axios            │         │  - Controllers           │         │                  │
└─────────────────────┘         │  - Models (requêtes SQL) │         └──────────────────┘
                                │          │               │
                                │          ▼               │
                                │  ┌───────────────┐       │
                                │  │  /uploads     │       │
                                │  │  (fichiers)   │       │
                                │  └───────────────┘       │
                                └──────────────────────────┘
```

**Principe** : le frontend ne contient **aucune logique métier critique**. Toutes les règles (transitions, permissions, validation) sont appliquées côté serveur. Le frontend ne fait qu'afficher ce que l'API l'autorise à afficher.

---

## 2. Vue d'ensemble des phases

| Phase | Nom | Durée | Semaine | Livrable principal |
|---|---|---|---|---|
| **P0** | Conception & Architecture | 3 jours | S0 (avant S1) | Dossier de conception complet |
| **P1** | Fondations techniques | 4 jours | S1 | Environnement + BD + serveur qui tourne |
| **P2** | Authentification & Sécurité | 7 jours | S2 | Login fonctionnel de bout en bout |
| **P3** | Cœur métier : les demandes | 7 jours | S3 | Création + consultation de demandes avec PJ |
| **P4** | Workflow & Traçabilité | 7 jours | S4 | Cycle de vie complet opérationnel |
| **P5** | Notifications & Dashboards | 7 jours | S5 | Notifications + 2 tableaux de bord |
| **P6** | Finitions & Livraison | 7 jours | S6 | Application livrée + démo + doc |

**Jalon de fin de phase** : chaque phase se termine par une **démo de validation** (même à soi-même) : on vérifie les critères de sortie avant de passer à la suivante. Une phase n'est pas finie tant que ses critères ne sont pas tous verts.

```
S0          S1          S2          S3          S4          S5          S6
├─ P0 ──┤   ├─── P1 ──┤ ├─── P2 ───┤ ├─── P3 ───┤ ├─── P4 ───┤ ├─── P5 ───┤ ├─── P6 ───┤
Conception  Fondations  Auth        Demandes    Workflow    Dashboards  Livraison
   📐          🏗️          🔐          📋          🔄          📊          🚀
```

---

## 3. Phase 0 – Conception & Architecture

> 🎯 **Objectif** : ne pas écrire une ligne de code applicatif avant d'avoir un plan précis. Cette phase produit les documents qui guideront tout le développement.

### 3.1 Tâches

| # | Tâche | Description | Livrable |
|---|---|---|---|
| P0.1 | Modèle de données définitif | Finaliser le schéma des 5 tables : colonnes, types, PK, FK, contraintes CHECK, index | `docs/DATABASE.md` + `database/schema.sql` |
| P0.2 | Matrice de transitions | Formaliser la machine à états : quelles transitions, quels rôles, quelles conditions, quels effets de bord (historique, notification) | `docs/WORKFLOW.md` |
| P0.3 | Contrat d'API | Lister tous les endpoints : méthode, URL, corps de requête, réponse, codes d'erreur, rôle requis | `docs/API.md` |
| P0.4 | Arborescence des écrans | Lister les pages React, leur contenu, la navigation entre elles, et quel rôle voit quoi | `docs/ECRANS.md` |
| P0.5 | Conventions de code | Nommage (français ou anglais ?), structure des dossiers, format des réponses API, gestion des erreurs | `docs/CONVENTIONS.md` |
| P0.6 | Jeu de données de test | Définir les comptes de démo (1 admin, 2 juristes, 3 demandeurs) et ~15 demandes d'exemple couvrant tous les statuts | `database/seed.sql` |

### 3.2 Décisions d'architecture à trancher dans cette phase

| Décision | Options | Recommandation |
|---|---|---|
| Outil de build React | Create React App / **Vite** | Vite (CRA est déprécié, Vite est le standard 2026) |
| Langue du code | Français / Anglais / Mixte | Tables et colonnes en français (cohérent avec le CDC), code JS en anglais, UI en français |
| Format des réponses API | Libre / Enveloppe standard | Enveloppe standard : `{ success, data, error }` partout |
| Stockage du JWT côté client | localStorage / Cookie httpOnly | localStorage (simple, suffisant pour un projet académique — limite connue et documentée) |
| Rafraîchissement des notifications | Polling / WebSocket | Polling toutes les 30s (simple et suffisant) ; WebSocket = hors périmètre |
| Transitions de statut | `PUT /demandes/:id` générique / **Actions nommées** | Actions nommées (`POST /demandes/:id/valider`) : chaque action a ses validations propres |

### 3.3 Critères de sortie (Definition of Done)

- [ ] Les 6 documents de `docs/` sont rédigés et relus
- [ ] Le `schema.sql` s'exécute sans erreur sur un PostgreSQL vierge
- [ ] Chaque exigence EF01→EF24 du CDC est rattachée à un endpoint API et à un écran
- [ ] La matrice de transitions couvre 100 % des cas (y compris les cas interdits)
- [ ] Le plan est poussé sur GitHub et partageable

---

## 4. Phase 1 – Fondations techniques

> 🎯 **Objectif** : à la fin de cette phase, un développeur peut cloner le repo, lancer 2 commandes, et avoir l'application (vide) qui tourne.

### 4.1 Tâches

| # | Tâche | Détail |
|---|---|---|
| P1.1 | Installation des outils | Node.js 18+, PostgreSQL 15+, pgAdmin, VS Code + extensions |
| P1.2 | Initialisation backend | `server/` : Express + dotenv + cors + structure MVC (routes/controllers/models/middleware/config) |
| P1.3 | Initialisation frontend | `client/` : Vite + React + Tailwind + shadcn/ui configurés, page de test qui s'affiche |
| P1.4 | Création de la base | Exécution de `schema.sql` + `seed.sql`, vérification dans pgAdmin |
| P1.5 | Connexion serveur ↔ BD | Pool `pg` configuré via `.env`, route de test `GET /api/health` qui interroge la BD |
| P1.6 | Connexion client ↔ serveur | Instance Axios configurée, appel de test depuis React vers `/api/health` |
| P1.7 | Scripts npm | `npm run dev` (les deux serveurs), scripts de reset de la BD |

### 4.2 Structure de dossiers cible

```
stage-A2/
├── docs/                    # Documents de conception (Phase 0)
│   ├── PLAN_DE_PHASES.md
│   ├── DATABASE.md
│   ├── WORKFLOW.md
│   ├── API.md
│   ├── ECRANS.md
│   └── CONVENTIONS.md
├── database/
│   ├── schema.sql           # Création des tables
│   └── seed.sql             # Données de test
├── server/
│   ├── config/db.js         # Pool PostgreSQL
│   ├── middleware/          # auth.js, roles.js, upload.js, validate.js, errors.js
│   ├── models/              # Requêtes SQL par entité
│   ├── controllers/         # Logique métier
│   ├── routes/              # Définition des endpoints
│   ├── uploads/             # Pièces jointes (gitignoré)
│   ├── .env.example         # Modèle de configuration
│   └── server.js
├── client/
│   ├── src/
│   │   ├── api/axios.js     # Instance configurée (baseURL + intercepteur JWT)
│   │   ├── context/AuthContext.jsx
│   │   ├── components/      # Composants réutilisables + shadcn/ui
│   │   ├── pages/           # Une page = un écran
│   │   └── App.jsx          # Routes + guards
│   └── ...config Vite/Tailwind
└── README.md
```

### 4.3 Critères de sortie

- [ ] `git clone` + `npm install` + `npm run dev` = application qui tourne
- [ ] `GET /api/health` renvoie `{ success: true, db: "connected" }`
- [ ] La page React affiche une donnée venant de l'API
- [ ] Les 5 tables existent avec les données de seed
- [ ] `.env.example` documenté (jamais de `.env` sur GitHub)

---

## 5. Phase 2 – Authentification & Sécurité

> 🎯 **Objectif** : un utilisateur se connecte, obtient un JWT, accède aux routes autorisées pour son rôle, et rien d'autre.

### 5.1 Tâches backend

| # | Tâche | Détail |
|---|---|---|
| P2.1 | `POST /api/auth/login` | Vérifie email + bcrypt.compare, renvoie JWT signé (payload : id, role, nom) + expiration 24h |
| P2.2 | Middleware `auth` | Vérifie le header `Authorization: Bearer <token>`, décode, attache `req.user` |
| P2.3 | Middleware `roles(...)` | `roles('ADMIN')`, `roles('JURISTE','ADMIN')` — renvoie 403 sinon |
| P2.4 | `GET /api/auth/me` | Renvoie le profil de l'utilisateur connecté |
| P2.5 | `PUT /api/auth/password` | Vérifie l'ancien mot de passe, valide le nouveau (8+ caractères), re-hash |
| P2.6 | Gestion d'erreurs centralisée | Middleware d'erreurs : format uniforme, pas de stack trace en production |

### 5.2 Tâches frontend

| # | Tâche | Détail |
|---|---|---|
| P2.7 | Page Login | Formulaire shadcn (email + mot de passe), gestion des erreurs, redirection selon rôle |
| P2.8 | AuthContext | Stocke user + token, expose `login()`, `logout()`, `isAuthenticated` |
| P2.9 | Intercepteur Axios | Ajoute le JWT à chaque requête ; si 401 → déconnexion + redirection login |
| P2.10 | Routes protégées | Composant `<ProtectedRoute roles={[...]}>` — redirige si non autorisé |
| P2.11 | Layout + Navbar | Structure commune : navigation selon rôle, bouton déconnexion, nom de l'utilisateur |
| P2.12 | Page Profil | Changement de mot de passe |

### 5.3 Règles de sécurité appliquées (issues du CDC §7)

- Mots de passe : bcrypt, salt factor 12
- JWT : HS256, secret dans `.env`, expiration 24h
- Toutes les routes API (sauf login) derrière le middleware `auth`
- Validation `express-validator` sur chaque input
- CORS restreint à `localhost:3000`
- Aucun message d'erreur ne révèle si c'est l'email ou le mot de passe qui est faux

### 5.4 Critères de sortie

- [ ] Les 6 comptes de démo peuvent se connecter
- [ ] Un token invalide/expiré → 401 → retour au login automatique
- [ ] Un Demandeur qui appelle une route Admin → 403 (testé avec Postman)
- [ ] Le changement de mot de passe fonctionne et l'ancien ne marche plus
- [ ] Rafraîchir la page ne déconnecte pas l'utilisateur

---

## 6. Phase 3 – Cœur métier : les demandes

> 🎯 **Objectif** : un Demandeur crée une demande (brouillon ou soumise directement), y joint un fichier, et la retrouve dans sa liste. Un Juriste voit toutes les demandes soumises.

### 6.1 Tâches backend

| # | Tâche | Détail |
|---|---|---|
| P3.1 | `POST /api/demandes` | Création en Brouillon ; validation des champs ; sensibilité calculée automatiquement selon le thème (Procuration→Moyen, Révision dossier juridique→Confidentiel, Moyens de paiements→Confidentiel, Clôture de compte→Moyen, Autre→Faible) |
| P3.2 | `GET /api/demandes` | Liste filtrée : un Demandeur ne voit QUE ses demandes (filtre serveur, pas client) ; Juriste/Admin voient tout sauf les brouillons des autres |
| P3.3 | Filtres & pagination | Query params : `?statut=&theme=&date_debut=&date_fin=&page=` — 20 résultats/page |
| P3.4 | `GET /api/demandes/:id` | Détail complet + contrôle d'accès (403 si ce n'est pas sa demande pour un Demandeur) |
| P3.5 | `PUT /api/demandes/:id` | Modification autorisée UNIQUEMENT en statut Brouillon ou Complément demandé, par le propriétaire |
| P3.6 | Upload PJ (Multer) | 1 fichier, types PDF/DOCX/PNG/JPG, max 10 Mo, nom UUID sur disque, métadonnées en BD |
| P3.7 | Download / Delete PJ | Téléchargement avec le nom original ; suppression physique + BD ; contrôle de droits |

### 6.2 Tâches frontend

| # | Tâche | Détail |
|---|---|---|
| P3.8 | Formulaire nouvelle demande | Titre, thème (select), description, sensibilité (pré-remplie auto, modifiable), upload avec barre de progression ; boutons « Enregistrer brouillon » et « Soumettre » |
| P3.9 | Liste des demandes | Table shadcn : colonnes ID, titre, thème, sensibilité, statut (badge coloré), date ; filtres + pagination |
| P3.10 | Page détail (lecture) | Toutes les infos + PJ téléchargeable ; les actions viendront en Phase 4 |
| P3.11 | Composant StatutBadge | Un badge coloré par statut (7 couleurs cohérentes, réutilisé partout) |

### 6.3 Critères de sortie

- [ ] Créer un brouillon, le retrouver, le modifier, y joindre un PDF
- [ ] La sensibilité se pré-remplit correctement pour les 5 thèmes
- [ ] Un fichier de 15 Mo ou un .exe est refusé avec un message clair
- [ ] Le Demandeur A ne peut pas voir la demande du Demandeur B (test API direct)
- [ ] Les filtres et la pagination fonctionnent

---

## 7. Phase 4 – Workflow & Traçabilité

> 🎯 **Objectif** : le cycle de vie complet fonctionne, chaque transition est contrôlée, historisée, et rien d'interdit n'est possible. **C'est la phase la plus critique du projet.**

### 7.1 Le moteur de transitions (conception centrale)

Un module serveur unique `services/workflow.js` :

```
TRANSITIONS = {
  Brouillon:            { Soumise: [DEMANDEUR], Annulée: [DEMANDEUR] },
  Soumise:              { "En cours": [JURISTE, ADMIN] },
  "En cours":           { "Complément demandé": [JURISTE, ADMIN],
                          Validée: [JURISTE, ADMIN],
                          Rejetée: [JURISTE, ADMIN] },
  "Complément demandé": { "En cours": [DEMANDEUR] },
}
```

Chaque transition exécute dans **une transaction PostgreSQL unique** :
1. Vérification : transition autorisée pour ce rôle + conditions métier remplies
2. `UPDATE demande_avis` (statut + champs associés : juriste_id, avis, motif, dates)
3. `INSERT INTO historique_statuts` (immuable)
4. `INSERT INTO notifications` (destinataire selon la transition)

Si une étape échoue → ROLLBACK complet.

### 7.2 Tâches backend

| # | Tâche | Conditions métier |
|---|---|---|
| P4.1 | `POST /:id/soumettre` | Champs obligatoires remplis ; date_soumission = NOW() |
| P4.2 | `POST /:id/annuler` | Brouillon uniquement, par le propriétaire |
| P4.3 | `POST /:id/prendre-en-charge` | Assigne juriste_id = l'utilisateur courant |
| P4.4 | `POST /:id/complement` | Commentaire **obligatoire** ; notification au Demandeur |
| P4.5 | `POST /:id/completer` | Par le propriétaire ; retour En cours ; notification au Juriste |
| P4.6 | `PUT /:id/theme` | Juriste/Admin modifie le thème après analyse |
| P4.7 | `POST /:id/valider` | Avis juridique **obligatoire** ; date_traitement = NOW() ; demande verrouillée |
| P4.8 | `POST /:id/rejeter` | Motif **obligatoire** ; date_traitement = NOW() ; demande verrouillée |
| P4.9 | `GET /:id/historique` | Chronologie complète des transitions |
| P4.10 | Verrouillage post-clôture | Validée/Rejetée/Annulée = lecture seule absolue (aucun UPDATE possible) |

### 7.3 Tâches frontend

| # | Tâche | Détail |
|---|---|---|
| P4.11 | Actions contextuelles sur la page détail | Les boutons affichés dépendent du couple (rôle, statut) — reflet exact de la matrice de permissions du CDC §3 |
| P4.12 | Dialogs de confirmation | Valider (avec zone avis), Rejeter (avec zone motif), Complément (avec zone commentaire) — shadcn Dialog |
| P4.13 | Timeline du journal d'activité | Composant vertical : date, acteur, action, commentaire — sur la page détail |
| P4.14 | Interface « compléter le dossier » | Le Demandeur voit le commentaire du Juriste, modifie sa demande, resoumet |

### 7.4 Critères de sortie

- [ ] Le parcours nominal complet passe : Brouillon → Soumise → En cours → Validée
- [ ] Le parcours complément passe : En cours → Complément demandé → En cours → Validée
- [ ] Les parcours Rejetée et Annulée passent
- [ ] **Chaque transition interdite testée renvoie 403** (ex : Demandeur qui valide, transition Soumise → Validée directe)
- [ ] Valider sans avis / rejeter sans motif / complément sans commentaire → 400
- [ ] Chaque transition apparaît dans l'historique avec le bon acteur
- [ ] Une demande clôturée est totalement non modifiable

---

## 8. Phase 5 – Notifications & Tableaux de bord

> 🎯 **Objectif** : chaque acteur est informé de ce qui le concerne et dispose d'une vue synthétique adaptée à son rôle.

### 8.1 Système de notifications (interne, sans email)

| Événement déclencheur | Destinataire | Message type |
|---|---|---|
| Demande soumise | Tous les Juristes + Admins | « Nouvelle demande #12 soumise par X » |
| Prise en charge | Le Demandeur | « Votre demande #12 est en cours de traitement » |
| Complément demandé | Le Demandeur | « Complément requis sur votre demande #12 » |
| Dossier complété | Le Juriste en charge | « La demande #12 a été complétée » |
| Validée / Rejetée | Le Demandeur | « Votre demande #12 a été validée/rejetée » |

**Mécanique** : cloche dans la navbar avec compteur de non-lues → dropdown des 10 dernières → clic = marquer lue + naviguer vers la demande. Rafraîchissement par polling (30 s).

### 8.2 Tâches

| # | Tâche | Détail |
|---|---|---|
| P5.1 | API notifications | `GET /api/notifications` (+ compteur non-lues), `PUT /api/notifications/:id/lue`, `PUT /api/notifications/tout-lu` |
| P5.2 | Composant NotificationBell | Cloche + badge compteur + dropdown + polling |
| P5.3 | API stats Admin | `GET /api/stats/admin` : répartition par statut, par thème, par sensibilité, évolution mensuelle, délai moyen de traitement, taux validation/rejet |
| P5.4 | Dashboard Admin | 4 graphiques Chart.js (donut statuts, barres thèmes, donut sensibilité, courbe mensuelle) + cartes KPIs |
| P5.5 | API stats Demandeur | `GET /api/stats/demandeur` : ses compteurs par statut, ses demandes récentes |
| P5.6 | Dashboard Demandeur | Cartes compteurs + liste des 5 dernières demandes + raccourci « Nouvelle demande » |
| P5.7 | CRUD utilisateurs (Admin) | `GET/POST/PUT /api/users` + désactivation (jamais de suppression physique : intégrité des FK) ; page Admin avec table + dialogs |
| P5.8 | Accueil unifié | La page d'accueil affiche le dashboard correspondant au rôle connecté |

### 8.3 Critères de sortie

- [ ] Chaque événement du tableau 8.1 génère bien sa notification au bon destinataire
- [ ] Le compteur de non-lues est exact et se met à jour
- [ ] Les KPIs recalculent correctement (vérification manuelle sur le jeu de données)
- [ ] L'Admin crée un compte, la personne peut se connecter ; un compte désactivé ne peut plus se connecter
- [ ] Chaque rôle voit son dashboard et uniquement le sien

---

## 9. Phase 6 – Finitions, Optionnelles & Livraison

> 🎯 **Objectif** : une application démontrable, robuste, documentée — et les optionnelles si le temps le permet.

### 9.1 Consolidation (priorité absolue, jours 1-3)

| # | Tâche | Détail |
|---|---|---|
| P6.1 | Campagne de tests manuels | Dérouler TOUS les critères de sortie des phases 2→5, par rôle, et corriger |
| P6.2 | Responsive | Vérification mobile/tablette de chaque écran (Tailwind breakpoints) |
| P6.3 | Polissage UI | Cohérence espacements, états vides (« Aucune demande »), loaders, messages d'erreur en français |
| P6.4 | Jeu de données de démo final | Données réalistes couvrant tous les statuts et tous les cas de figure pour la soutenance |
| P6.5 | Documentation | README complet (installation pas à pas), mise à jour des docs de conception si écarts |

### 9.2 Optionnelles (jours 4-6, dans cet ordre, uniquement si le cœur est stable)

| Priorité | Fonctionnalité | Effort estimé | Justification de l'ordre |
|---|---|---|---|
| 1 | **OPT06 – Dark mode** | 0,5 jour | Quasi gratuit avec Tailwind (`dark:`), effet démo fort |
| 2 | **OPT05 – Export CSV** | 0,5 jour | Simple : requête + génération côté serveur |
| 3 | **OPT01 – Fil de commentaires** | 1,5 jour | Table déjà conçue ; forte valeur métier |
| 4 | **OPT03 – Export PDF** (pdfkit) | 1 jour | Fiche demande formatée téléchargeable |
| 5 | **OPT04 – QR code dans le PDF** | 0,5 jour | Dépend d'OPT03 ; librairie `qrcode` |
| 6 | **OPT02 – Mentions @nom** | 1 jour | Dépend d'OPT01 ; le plus complexe côté UI |

**Règle** : une optionnelle commencée doit être finie et testée, sinon elle est retirée de la démo. Mieux vaut 3 optionnelles solides que 6 à moitié.

### 9.3 Préparation de la livraison (jour 7)

- [ ] Répétition de la démo complète (scénario écrit : un Demandeur soumet → le Juriste demande un complément → complété → validé → notifications + dashboards)
- [ ] Tag Git `v1.0` + repo GitHub propre (README, pas de fichiers parasites)
- [ ] Vérification : clone frais sur une autre machine → installation en suivant uniquement le README

### 9.4 Critères de sortie (= critères de livraison du projet)

- [ ] 100 % des exigences obligatoires EF01→EF24 fonctionnelles
- [ ] Zéro erreur console navigateur / serveur sur le parcours de démo
- [ ] README permettant une installation autonome
- [ ] Scénario de démo répété et chronométré
- [ ] Optionnelles réalisées : listées et démontrables

---

## 10. Règles de gestion du projet

### 10.1 Git

| Règle | Détail |
|---|---|
| Branche principale | `main` = toujours fonctionnelle |
| Branches de travail | `feat/nom-fonctionnalite` (ex : `feat/auth-jwt`, `feat/workflow`) — merge dans `main` quand la fonctionnalité est testée |
| Commits | Fréquents, messages clairs : `feat: ajout login JWT`, `fix: contrôle upload 10Mo`, `docs: contrat API` |
| Fréquence de push | Minimum 1 fois par jour (sauvegarde) |
| Jalons | Un tag par fin de phase : `phase-1`, `phase-2`… |

### 10.2 Suivi d'avancement

- Les cases à cocher de ce document servent de **tableau de bord d'avancement** : les cocher au fur et à mesure (le fichier vit sur GitHub).
- En fin de chaque phase : mini-bilan écrit en bas de ce fichier (ce qui a été fait, les écarts, les reports).

### 10.3 Gestion des imprévus

| Situation | Réaction |
|---|---|
| Une phase déborde de 1-2 jours | Prendre sur les jours optionnelles de P6 |
| Une phase déborde de 3+ jours | Réduire le périmètre optionnel, jamais le cœur |
| Un choix technique bloque (ex : shadcn) | Solution de repli documentée : composants Tailwind manuels |
| OneDrive perturbe git/node_modules | Déplacer le repo vers `C:\dev\stage-A2` (hors OneDrive) |

### 10.4 Traçabilité CDC ↔ Phases

| Exigence CDC | Phase |
|---|---|
| EF01, EF02, EF21 (auth, rôles, mot de passe) | P2 |
| EF03→EF09, EF23, EF24 (demandes, PJ, filtres) | P3 |
| EF10→EF14, EF17, EF18 (workflow, historique, journal) | P4 |
| EF15, EF16, EF19, EF20, EF22 (notifications, dashboards, users) | P5 |
| OPT01→OPT06 | P6 |

---

## 11. Glossaire

| Terme | Définition |
|---|---|
| **DAJ** | Direction des Affaires Juridiques |
| **CDC** | Cahier des charges |
| **PERN** | PostgreSQL + Express + React + Node.js |
| **JWT** | JSON Web Token — jeton signé prouvant l'identité de l'utilisateur |
| **bcrypt** | Algorithme de hachage de mots de passe |
| **SPA** | Single Page Application — le navigateur charge une seule page, React gère la navigation |
| **Middleware** | Fonction Express exécutée avant le controller (vérification token, rôle, upload…) |
| **Transition** | Passage d'un statut à un autre dans le workflow |
| **Transaction** | Ensemble d'opérations SQL exécutées en tout-ou-rien |
| **Seed** | Données initiales insérées en base pour développer et démontrer |
| **Polling** | Interrogation périodique du serveur (ici : notifications toutes les 30 s) |
| **shadcn/ui** | Bibliothèque de composants React copiés dans le projet (pas une dépendance) |

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 17/07/2026 | 1.0 | Création du plan de phases initial |

---

## Bilans de fin de phase

> *À remplir au fur et à mesure de l'avancement.*

### Bilan P0 – Conception ✅ Terminée (17/07/2026)

**Livrables produits :**

| Livrable | Fichier | État |
|---|---|---|
| Modèle de données | [`docs/DATABASE.md`](DATABASE.md) + [`database/schema.sql`](../database/schema.sql) | ✅ |
| Matrice de transitions | [`docs/WORKFLOW.md`](WORKFLOW.md) | ✅ |
| Contrat d'API | [`docs/API.md`](API.md) | ✅ |
| Arborescence des écrans | [`docs/ECRANS.md`](ECRANS.md) | ✅ |
| Conventions de code | [`docs/CONVENTIONS.md`](CONVENTIONS.md) | ✅ |
| Jeu de données de test | [`database/seed.sql`](../database/seed.sql) | ✅ |
| Modèles d'environnement | `server/.env.example`, `client/.env.example` | ✅ |

**Revue de cohérence (R1→R7) :**

| # | Vérification | Résultat |
|---|---|---|
| R1 | CDC → API : chaque EF01→EF24 couverte | ✅ 100 % (table de traçabilité API §10) |
| R2 | API → Écrans : chaque endpoint consommé | ✅ (colonne « Écran » de la traçabilité) |
| R3 | Workflow → API : 8 transitions = 8 endpoints ; matrice 7×7 = erreurs 409 | ✅ |
| R4 | BD → API : aucun champ exposé absent du schéma | ✅ |
| R5 | Permissions : CDC §3 = rôles endpoints = tableau (rôle×statut) écran Détail | ✅ Zéro contradiction |
| R6 | Seed → Démo : 15 demandes couvrant les 7 statuts + historique cohérent | ✅ |
| R7 | Relecture des 6 documents | ✅ |

**Décisions structurantes tranchées :** VARCHAR+CHECK (statuts/rôles), FK RESTRICT partout,
TIMESTAMPTZ, actions nommées pour les transitions, Vite, JWT en localStorage, polling 30 s
pour les notifications. (Détail et justifications dans `DATABASE.md §4`.)

**Point en suspens (à lever en P1) :** exécution réelle de `schema.sql` + `seed.sql` sur
PostgreSQL (non installé en P0). À valider dès la mise en place de l'environnement.

**→ Décision : passage en P1 (Fondations techniques) autorisé.**

### Bilan P1 – Fondations ✅ Terminée (19/07/2026)

**Environnement**
- Node v24, npm 11, Git 2.52 vérifiés.
- **PostgreSQL 17** installé via winget (service `postgresql-x64-17` en marche, démarrage automatique).
- Base `avis_juridiques` créée.

**Base de données**
- `schema.sql` exécuté **2× de suite sans erreur** → idempotence confirmée
  (point resté ouvert en P0, désormais **levé**).
- `seed.sql` chargé. Contrôles : 6 users, 15 demandes (répartition 2/3/3/2/3/1/1 par statut),
  28 lignes d'historique, 15 notifications, accents corrects.

**Backend**
- Squelette Express 5 en couches (config, helpers, middleware, routes) conforme aux conventions.
- `GET /api/health` : renvoie `{ success:true, data:{ status:"ok", db:"connected", time } }` (HTTP 200).
- Sans base : renvoie une **erreur 500 propre** (gestion d'erreurs centralisée prouvée).

**Frontend**
- React 18 + Vite 5 + Tailwind 3 : `npm run build` OK (84 modules, CSS Tailwind généré).
- Instance Axios centralisée ; page de test « API connectée ✓ ».
- Serveur de dev Vite sur `:3000` + **proxy `/api → :5000` fonctionnel** (testé HTTP 200).

**Intégration & doc**
- `package.json` racine : `npm run dev` (concurrently), `npm run db:reset`, `install:all`.
- README d'installation complet. `.gitignore` durci (`.env`, `node_modules`, uploads).

**Chaîne end-to-end validée** : Vite (:3000) → proxy → Express (:5000) → pg → PostgreSQL 17.

**Note** : shadcn/ui reporté à P2 (au moment de construire la vraie UI) ; Tailwind seul en P1,
solution de repli documentée.

**→ Décision : passage en P2 (Authentification & Sécurité) autorisé.**

### Bilan P2 – Authentification ✅ Terminée (21/07/2026)

**Livrables produits :**

| Domaine | Fichiers | État |
|---|---|---|
| Auth backend | `models/usersModel.js`, `controllers/authController.js`, `routes/auth.js` | ✅ |
| Sécurité | `middleware/auth.js`, `middleware/roles.js`, `middleware/validate.js`, `utils/jwt.js`, `utils/AppError.js` | ✅ |
| Auth frontend | `context/AuthContext.jsx`, `api/axios.js` (intercepteurs), `components/ProtectedRoute.jsx`, `components/Layout.jsx` | ✅ |
| Pages | `pages/Login.jsx`, `pages/Accueil.jsx`, `pages/Profil.jsx`, `pages/Placeholder.jsx`, `pages/NotFound.jsx`, `App.jsx` (routeur) | ✅ |

**Tests de sécurité (validés) :**

| # | Test | Résultat |
|---|---|---|
| S1 | Connexion des comptes de démo | ✅ 200 + token |
| S2 | Mauvais mot de passe | ✅ 401 « Identifiants invalides » (générique) |
| S3 | Email inexistant | ✅ 401 même message (anti-énumération) |
| S4 | Token bidon / invalide | ✅ 401 |
| S5 | Route protégée sans token | ✅ 401 |
| S6 | DEMANDEUR → route ADMIN | ✅ 403 |
| S7 | Injection SQL dans email | ✅ 400 (aucun 500, requêtes paramétrées) |
| S8 | `me` ne renvoie jamais `password_hash` | ✅ confirmé |
| S9 | F5 / rechargement complet | ✅ reste connecté (réhydratation `/auth/me`) |
| S10 | Déconnexion puis accès page protégée | ✅ redirection `/login` |

**Tests navigateur (bout en bout) :** login juriste → accueil, navbar conditionnée au rôle
(pas de lien « Utilisateurs » pour un juriste), guard `/utilisateurs` → redirection,
page Profil affichée, déconnexion → login. **Tous OK.**

**Changement de mot de passe (EF21) :** validé (change → 200, ancien → 401, nouveau → 200),
puis **seed restauré** (`Demo2026!` rétabli pour tous les comptes).

**Écart au plan :** shadcn/ui non initialisé — **repli Tailwind** appliqué (documenté dans le plan
P2 §5.1 et CONVENTIONS). Composants Tailwind propres avec la palette du projet. shadcn pourra
être ajouté plus tard sans refonte. Route de test temporaire `admin-test` supprimée en fin de phase.

**→ Décision : passage en P3 (Cœur métier : les demandes) autorisé.**

### Bilan P3 – Demandes ✅ Terminée (21/07/2026)

**Livrables produits :**

| Domaine | Fichiers | État |
|---|---|---|
| Règle métier | `config/themes.js` (thème → sensibilité) | ✅ |
| Accès données | `models/demandesModel.js` (visibilité par rôle en SQL) | ✅ |
| Logique | `controllers/demandesController.js` | ✅ |
| Routes | `routes/demandes.js` (8 endpoints) | ✅ |
| Upload | `middleware/upload.js` (Multer, UUID, 10 Mo, MIME+extension) | ✅ |
| Composants | `StatutBadge.jsx`, `FileUpload.jsx` | ✅ |
| Pages | `Demandes.jsx`, `NouvelleDemande.jsx`, `DemandeDetail.jsx` | ✅ |

**Tests validés :**

| Famille | Résultats |
|---|---|
| **Cloisonnement** | C2 (lecture demande d'autrui) → 403 · C3 (juriste ↔ brouillon) → 403 · C4 (téléchargement PJ d'autrui) → 403 · C5 (modification d'autrui) → 403 · propriétaire → 200 |
| **Visibilité** | Juriste : 13/15 (aucun brouillon) · Demandeur1 : 6 · Demandeur2 : 5 |
| **Sensibilité** | Les **5 thèmes** donnent le bon degré (accents inclus) |
| **Règles métier** | M2 modif. d'une Soumise → 409 · M3 re-soumission → 409 · M4 description courte → 400 · M5 juriste crée → 403 · thème invalide → 400 |
| **Fichiers** | F1 PDF → 201 · F2 15 Mo → `FILE_TOO_LARGE` · F3 `.exe` → `FILE_TYPE` · F4 remplacement supprime l'ancien · F5 suppression vide disque + colonnes |
| **Navigateur** | Création + sensibilité auto (Confidentiel) + soumission → visible chez le juriste avec colonne « Demandeur » ; filtres, pagination, badges colorés OK |

**Dette assumée (à traiter en P4)** : la soumission (T1) écrit directement `statut='Soumise'`
**sans historique ni notification**. Première tâche de P4 : la refactorer via le moteur de
transitions (transaction : UPDATE + historique + notification).

**Notes techniques** : deux faux positifs rencontrés pendant les tests, tous deux dus à
l'environnement de test et non au code — (1) accents mangés par l'interpolation shell dans curl
(résolu en passant le JSON par fichier UTF-8), (2) `curl -F` cassé par la conversion de chemin
MSYS (résolu avec `MSYS_NO_PATHCONV=1`). Le seed doit être lancé avec `ON_ERROR_STOP=1` et son
code retour vérifié, sans masquer la sortie.

**→ Décision : passage en P4 (Workflow & Traçabilité) autorisé.**

### Bilan P4 – Workflow
*(à venir)*

### Bilan P5 – Dashboards
*(à venir)*

### Bilan P6 – Livraison
*(à venir)*
