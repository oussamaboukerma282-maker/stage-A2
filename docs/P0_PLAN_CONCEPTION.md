# Phase 0 – Plan détaillé de Conception & Architecture

> **Durée** : 3 jours (J1, J2, J3)
> **Objectif** : produire l'intégralité des documents de conception qui guideront le développement des phases P1 à P6. À la fin de P0, plus aucune décision structurante ne reste ouverte : coder devient de l'exécution.
> **Référence amont** : `CDC_Avis_Juridiques_PERN_V2.docx` + `docs/PLAN_DE_PHASES.md`

---

## Sommaire

1. [Organisation des 3 jours](#1-organisation-des-3-jours)
2. [J1 – Données & Workflow (P0.1 + P0.2)](#2-j1--données--workflow)
3. [J2 – API & Écrans (P0.3 + P0.4)](#3-j2--api--écrans)
4. [J3 – Conventions, Seed & Revue finale (P0.5 + P0.6 + revue)](#4-j3--conventions-seed--revue-finale)
5. [Checklist globale de sortie P0](#5-checklist-globale-de-sortie-p0)

---

## 1. Organisation des 3 jours

### 1.1 Principe de construction

Les livrables s'enchaînent dans un ordre **logique de dépendance** — chaque document s'appuie sur le précédent :

```
J1 matin      J1 après-midi    J2 matin       J2 après-midi   J3 matin        J3 après-midi
┌──────────┐  ┌────────────┐   ┌───────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ P0.1     │─▶│ P0.2       │──▶│ P0.3      │─▶│ P0.4       │─▶│ P0.5+P0.6  │─▶│ REVUE      │
│ Modèle   │  │ Matrice de │   │ Contrat   │  │ Écrans &   │  │ Conventions│  │ Croisement │
│ données  │  │ transitions│   │ d'API     │  │ navigation │  │ + Seed     │  │ CDC↔docs   │
└──────────┘  └────────────┘   └───────────┘  └────────────┘  └────────────┘  └────────────┘
```

**Pourquoi cet ordre ?**
- Le **modèle de données** est la fondation : tout le reste y fait référence.
- La **matrice de transitions** dépend des colonnes de `demande_avis` (statut, juriste_id, dates…).
- Le **contrat d'API** expose les données et les transitions : impossible de l'écrire avant.
- Les **écrans** consomment l'API : chaque écran liste les endpoints qu'il appelle.
- Les **conventions et le seed** formalisent ce qui a émergé pendant les 4 premiers livrables.
- La **revue finale** vérifie la cohérence de l'ensemble contre le CDC.

### 1.2 Récapitulatif des livrables

| Tâche | Livrable | Emplacement | Durée estimée |
|---|---|---|---|
| P0.1 | Modèle de données définitif | `docs/DATABASE.md` + `database/schema.sql` | 0,5 j |
| P0.2 | Matrice de transitions | `docs/WORKFLOW.md` | 0,5 j |
| P0.3 | Contrat d'API | `docs/API.md` | 0,5 j |
| P0.4 | Arborescence des écrans | `docs/ECRANS.md` | 0,5 j |
| P0.5 | Conventions de code | `docs/CONVENTIONS.md` | 0,25 j |
| P0.6 | Jeu de données de test | `database/seed.sql` | 0,25 j |
| – | Revue de cohérence finale | Mise à jour des docs + tag `phase-0` | 0,5 j |

---

## 2. J1 – Données & Workflow

### 2.1 P0.1 – Modèle de données définitif (matin)

#### Étape 1 : Dictionnaire de données (1 h 30)

Pour **chacune des 5 tables**, remplir un tableau exhaustif colonne par colonne :

| À définir pour chaque colonne | Exemple pour `demande_avis.statut` |
|---|---|
| Nom exact | `statut` |
| Type PostgreSQL précis | `VARCHAR(50)` |
| Nullable ? | NON |
| Valeur par défaut | `'Brouillon'` |
| Contrainte | `CHECK (statut IN ('Brouillon','Soumise','En cours','Complément demandé','Validée','Rejetée','Annulée'))` |
| Description métier | Position de la demande dans le workflow |
| Qui peut l'écrire | Le moteur de workflow uniquement (jamais un UPDATE direct) |

**Les 5 tables à documenter :**

1. `users` — 9 colonnes (id, nom, prenom, email, password_hash, role, structure, actif, created_at)
2. `demande_avis` — 18 colonnes (voir CDC §8.2)
3. `notifications` — 6 colonnes
4. `historique_statuts` — 7 colonnes
5. `commentaires` — 5 colonnes (optionnelle, mais conçue dès maintenant)

#### Étape 2 : Décisions de conception BD à trancher (1 h)

Chaque décision doit être **écrite avec sa justification** dans `DATABASE.md` :

| # | Décision | Options | À trancher |
|---|---|---|---|
| D1 | Statuts : VARCHAR + CHECK ou type ENUM PostgreSQL ? | ENUM plus strict / VARCHAR+CHECK plus simple à faire évoluer | Recommandé : VARCHAR + CHECK |
| D2 | Rôles : même question | idem | Recommandé : VARCHAR + CHECK |
| D3 | `ON DELETE` des FK ? | CASCADE / RESTRICT / SET NULL | Recommandé : RESTRICT partout (on ne supprime jamais physiquement, on désactive) |
| D4 | Index à créer | – | `demande_avis(statut)`, `demande_avis(demandeur_id)`, `demande_avis(juriste_id)`, `notifications(user_id, lue)`, `historique_statuts(demande_id)` |
| D5 | Timestamps : `TIMESTAMP` ou `TIMESTAMPTZ` ? | – | Recommandé : `TIMESTAMPTZ` (bonne pratique, aucun coût) |
| D6 | Emails : contrainte de format ? | CHECK regex / validation applicative seule | Recommandé : validation applicative (express-validator), UNIQUE en BD |

#### Étape 3 : Écriture du `schema.sql` (1 h 30)

Règles d'écriture du script :

- En-tête de commentaire : projet, auteur, date, version
- `DROP TABLE IF EXISTS ... CASCADE` en tête (ordre inverse des dépendances) pour permettre le reset
- Tables créées dans l'ordre des dépendances : `users` → `demande_avis` → `notifications` / `historique_statuts` / `commentaires`
- Toutes les contraintes **nommées** (`CONSTRAINT fk_demande_demandeur FOREIGN KEY ...`) — les erreurs seront lisibles
- Les index à la fin du script
- Un commentaire SQL au-dessus de chaque table expliquant son rôle

**Test de validation** : le script doit s'exécuter 2 fois de suite sans erreur sur un PostgreSQL vierge (le DROP garantit l'idempotence).

#### Étape 4 : Schéma relationnel visuel (30 min)

Produire le MCD/MLD sous forme de diagramme (image `docs/img/mld.png`) montrant les 5 tables et leurs liens :

```
users 1───N demande_avis (demandeur_id)
users 1───N demande_avis (juriste_id, nullable)
users 1───N notifications
users 1───N historique_statuts
users 1───N commentaires
demande_avis 1───N notifications (nullable)
demande_avis 1───N historique_statuts
demande_avis 1───N commentaires
```

#### ✅ Critères de sortie P0.1

- [ ] `DATABASE.md` : dictionnaire complet des 5 tables + 6 décisions justifiées + diagramme
- [ ] `schema.sql` : s'exécute 2× de suite sans erreur
- [ ] Chaque colonne du CDC §8 est présente (aucune perte entre CDC et schéma)
- [ ] Les 5 index sont créés

---

### 2.2 P0.2 – Matrice de transitions (après-midi)

#### Étape 1 : Formaliser chaque transition (2 h)

Pour **chacune des 8 transitions**, remplir cette fiche type dans `WORKFLOW.md` :

```markdown
### T3 : Soumise → En cours (« Prise en charge »)

| Attribut | Valeur |
|---|---|
| Déclencheur | POST /api/demandes/:id/prendre-en-charge |
| Rôles autorisés | JURISTE, ADMIN |
| Pré-conditions | statut = 'Soumise' |
| Validations métier | aucune donnée supplémentaire requise |
| Effets sur demande_avis | statut='En cours', juriste_id=req.user.id |
| Ligne d'historique | ancien='Soumise', nouveau='En cours', user=juriste |
| Notification créée | destinataire=demandeur, message="Votre demande #N est en cours de traitement" |
| Erreurs possibles | 403 (mauvais rôle), 409 (statut incompatible), 404 |
```

**Les 8 transitions à documenter :**

| ID | Transition | Acteur |
|---|---|---|
| T1 | Brouillon → Soumise | Demandeur (propriétaire) |
| T2 | Brouillon → Annulée | Demandeur (propriétaire) |
| T3 | Soumise → En cours | Juriste / Admin |
| T4 | En cours → Complément demandé | Juriste / Admin (commentaire obligatoire) |
| T5 | Complément demandé → En cours | Demandeur (propriétaire) |
| T6 | En cours → Validée | Juriste / Admin (avis obligatoire) |
| T7 | En cours → Rejetée | Juriste / Admin (motif obligatoire) |
| T8 | *(hors machine)* Modification du thème | Juriste / Admin, uniquement statut 'En cours' |

#### Étape 2 : La matrice des interdits (45 min)

Construire le tableau croisé complet **7 statuts × 7 statuts** : chaque case = ✔ (transition + ID) ou ✘ (interdit). 49 cases, 7 autorisées, 42 interdites. C'est ce tableau qui servira à écrire les **tests de refus** en P4.

#### Étape 3 : Règles transverses (45 min)

Documenter dans `WORKFLOW.md` :

1. **Atomicité** : transition = 1 transaction PostgreSQL (UPDATE + INSERT historique + INSERT notification, ROLLBACK si échec)
2. **Verrouillage terminal** : Validée / Rejetée / Annulée = aucune écriture possible, à vie
3. **Propriété** : les transitions T1, T2, T5 exigent `demande.demandeur_id === req.user.id`
4. **Concurrence** : que se passe-t-il si 2 juristes prennent en charge en même temps ? → la transaction + la pré-condition sur le statut protègent naturellement (le 2e reçoit 409)
5. **Immuabilité de l'historique** : aucune route UPDATE/DELETE sur `historique_statuts`

#### ✅ Critères de sortie P0.2

- [ ] 8 fiches de transition complètes (T1→T8)
- [ ] Matrice 7×7 des transitions autorisées/interdites
- [ ] 5 règles transverses documentées
- [ ] Relecture croisée avec la matrice de permissions du CDC §3 : aucune contradiction

---

## 3. J2 – API & Écrans

### 3.1 P0.3 – Contrat d'API (matin)

#### Étape 1 : Conventions générales de l'API (45 min)

À fixer en tête de `API.md` :

| Sujet | Convention |
|---|---|
| Préfixe | `/api` |
| Format réponse succès | `{ "success": true, "data": ... }` |
| Format réponse erreur | `{ "success": false, "error": { "code": "...", "message": "..." } }` |
| Pagination | `?page=1` → réponse `{ data, pagination: { page, totalPages, totalItems } }` |
| Codes HTTP | 200 OK · 201 Créé · 400 Validation · 401 Non authentifié · 403 Interdit · 404 Introuvable · 409 Conflit d'état · 500 Serveur |
| Authentification | Header `Authorization: Bearer <JWT>` sur tout sauf `/api/auth/login` |
| Langue des messages d'erreur | Français (affichés tels quels dans l'UI) |

#### Étape 2 : Fiche par endpoint (2 h 30)

Pour **chacun des ~25 endpoints**, une fiche :

```markdown
### POST /api/demandes/:id/complement

- **Rôles** : JURISTE, ADMIN
- **Description** : demande un complément de dossier au demandeur (transition T4)
- **Corps** : { "commentaire": "string, obligatoire, 10-2000 caractères" }
- **Réponse 200** : { success: true, data: { demande mise à jour } }
- **Erreurs** : 400 commentaire manquant · 403 rôle · 404 · 409 statut ≠ 'En cours'
- **Effets de bord** : historique + notification au demandeur
- **Réf.** : T4 (WORKFLOW.md), EF11 (CDC)
```

**Inventaire des endpoints à documenter (24) :**

| Groupe | Endpoints |
|---|---|
| Auth (4) | login, me, password, (logout côté client) |
| Demandes CRUD (4) | GET liste, POST création, GET détail, PUT modification |
| Transitions (7) | soumettre, annuler, prendre-en-charge, complement, completer, valider, rejeter |
| Thème (1) | PUT theme |
| Fichiers (3) | POST upload, GET download, DELETE |
| Historique (1) | GET historique |
| Notifications (3) | GET liste, PUT lue, PUT tout-lu |
| Users admin (4) | GET, POST, PUT, PUT desactiver |
| Stats (2) | stats/admin, stats/demandeur |

#### Étape 3 : Table de traçabilité (30 min)

Tableau final : chaque endpoint ↔ exigence(s) CDC ↔ transition(s) ↔ écran(s) consommateur(s). C'est la preuve de couverture complète.

#### ✅ Critères de sortie P0.3

- [ ] Conventions générales fixées
- [ ] 24 fiches d'endpoint complètes
- [ ] Chaque EF01→EF24 du CDC est couverte par au moins un endpoint
- [ ] Chaque transition T1→T8 a son endpoint

### 3.2 P0.4 – Arborescence des écrans (après-midi)

#### Étape 1 : Carte de navigation (45 min)

```
/login
  └─ (succès) → / (accueil selon rôle)

/ ................ Dashboard (contenu selon rôle connecté)
/demandes ........ Liste (filtrée selon rôle)
/demandes/nouvelle Nouvelle demande        [DEMANDEUR]
/demandes/:id .... Détail + actions contextuelles
/profil .......... Profil + mot de passe
/utilisateurs .... Gestion des comptes     [ADMIN]
/*  .............. Page 404
```

#### Étape 2 : Fiche par écran (2 h 30)

Pour **chacun des 7 écrans**, documenter dans `ECRANS.md` :

1. **Rôles autorisés** et comportement si accès interdit (redirection)
2. **Wireframe ASCII** (zones de l'écran : où sont les filtres, la table, les boutons)
3. **Composants** utilisés (shadcn : Table, Dialog, Badge, Card… + composants maison : StatutBadge, Timeline, NotificationBell, FileUpload)
4. **Endpoints appelés** (au chargement + par action)
5. **États à gérer** : chargement (skeleton), vide (« Aucune demande »), erreur (toast)
6. **Variations par rôle** : ex. la page Détail affiche des boutons différents selon (rôle, statut) — inclure le tableau croisé exact

**Le tableau critique de l'écran Détail** (à produire absolument) :

| Statut ↓ / Rôle → | Demandeur (propriétaire) | Juriste | Admin |
|---|---|---|---|
| Brouillon | Modifier, Soumettre, Annuler | – (invisible) | – (invisible) |
| Soumise | (lecture) | Prendre en charge | Prendre en charge |
| En cours | (lecture) | Compléments, Modifier thème, Valider, Rejeter | idem Juriste |
| Complément demandé | Modifier, Resoumettre | (lecture) | (lecture) |
| Validée / Rejetée / Annulée | (lecture seule) | (lecture seule) | (lecture seule) |

#### Étape 3 : Inventaire des composants réutilisables (45 min)

| Composant | Utilisé dans | Props principales |
|---|---|---|
| `StatutBadge` | Liste, Détail, Dashboards | `statut` |
| `NotificationBell` | Navbar (toutes pages) | – (autonome, polling) |
| `Timeline` | Détail | `evenements[]` |
| `FileUpload` | Nouvelle demande, Complément | `onUpload, maxSize, types` |
| `ConfirmDialog` | Détail (valider/rejeter/complément) | `titre, champTexte?, onConfirm` |
| `StatCard` | Dashboards | `titre, valeur, icone` |
| `ProtectedRoute` | Router | `roles[]` |

#### ✅ Critères de sortie P0.4

- [ ] Carte de navigation complète avec guards par rôle
- [ ] 7 fiches d'écran avec wireframes
- [ ] Tableau croisé (rôle × statut) de l'écran Détail
- [ ] Inventaire des composants réutilisables
- [ ] Chaque endpoint de `API.md` est consommé par au moins un écran (sinon : endpoint inutile → supprimer)

---

## 4. J3 – Conventions, Seed & Revue finale

### 4.1 P0.5 – Conventions de code (matin, 2 h)

À fixer dans `CONVENTIONS.md` :

| Domaine | Convention à documenter |
|---|---|
| Langues | BD en français (cohérence CDC) · code JS en anglais · UI et messages d'erreur en français · commits en français |
| Nommage JS | `camelCase` variables/fonctions · `PascalCase` composants React · fichiers composants `PascalCase.jsx` |
| Structure serveur | 1 entité = 1 fichier par couche : `routes/demandes.js` → `controllers/demandesController.js` → `models/demandesModel.js` |
| SQL | Requêtes paramétrées **uniquement** (`$1, $2`) — jamais de concaténation (injection SQL) |
| Gestion d'erreurs serveur | Toute erreur passe par le middleware central ; les controllers utilisent try/catch + `next(err)` |
| Gestion d'erreurs client | Toast pour les erreurs d'action · état d'erreur pour les échecs de chargement |
| Variables d'environnement | Listées dans `.env.example` : `PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES, UPLOAD_DIR, MAX_FILE_SIZE, CORS_ORIGIN` |
| Git | Format des messages : `type: description` (feat, fix, docs, style, refactor, test) · branches `feat/...` |

### 4.2 P0.6 – Jeu de données de test (matin, 2 h)

Concevoir `database/seed.sql` avec un scénario **réaliste et démontrable** :

**Comptes (mot de passe unique de démo, ex. `Demo2026!`) :**

| Email | Rôle | Nom |
|---|---|---|
| admin@natixis.dz | ADMIN | Responsable DAJ |
| juriste1@natixis.dz | JURISTE | Juriste 1 |
| juriste2@natixis.dz | JURISTE | Juriste 2 |
| demandeur1@natixis.dz | DEMANDEUR | Agence Alger Centre |
| demandeur2@natixis.dz | DEMANDEUR | Direction Commerciale |
| demandeur3@natixis.dz | DEMANDEUR | Agence Oran |

**15 demandes couvrant tous les cas :**

| Répartition | Détail |
|---|---|
| 2 Brouillon | dont 1 avec PJ |
| 3 Soumise | thèmes variés (les juristes ont du travail en attente) |
| 3 En cours | réparties entre juriste1 et juriste2 |
| 2 Complément demandé | avec commentaires réalistes |
| 3 Validée | avec avis juridiques rédigés + historique complet |
| 1 Rejetée | avec motif |
| 1 Annulée | – |

**Cohérence obligatoire** : pour chaque demande non-brouillon, les lignes `historique_statuts` correspondantes doivent exister (une Validée a 3 lignes : soumission, prise en charge, validation) + les notifications associées. Les dates s'étalent sur 2 mois pour que la courbe mensuelle du dashboard ait du relief.

**Note technique** : les hash bcrypt seront générés par un petit script Node ponctuel (`node -e "console.log(require('bcrypt').hashSync('Demo2026!', 12))"`) et collés dans le seed.

### 4.3 Revue de cohérence finale (après-midi, 3 h)

C'est le **contrôle qualité de la conception**. Dérouler ces vérifications croisées :

| # | Vérification | Méthode |
|---|---|---|
| R1 | CDC → API | Chaque EF01→EF24 pointe vers ≥ 1 endpoint. Tableau de traçabilité complété |
| R2 | API → Écrans | Chaque endpoint est appelé par ≥ 1 écran (ou justifié : ex. download appelé par lien direct) |
| R3 | Workflow → API | Les 8 transitions ont leur endpoint ; la matrice 7×7 des interdits correspond aux erreurs 409 documentées |
| R4 | BD → API | Chaque colonne exposée dans une réponse API existe dans le schéma ; pas de champ fantôme |
| R5 | Permissions | La matrice CDC §3 = les rôles des fiches endpoint = le tableau (rôle × statut) de l'écran Détail. **Zéro contradiction** |
| R6 | Seed → Démo | Le jeu de données permet de dérouler le scénario de démo de P6 sans créer de données à la main |
| R7 | Orthographe/clarté | Relecture complète des 6 documents |

**Clôture de phase :**

- [ ] Corrections issues de la revue appliquées
- [ ] Bilan P0 rédigé en bas de `PLAN_DE_PHASES.md`
- [ ] Commit + push + tag git `phase-0`

---

## 5. Checklist globale de sortie P0

### Livrables

- [ ] `docs/DATABASE.md` — dictionnaire de données + décisions + diagramme MLD
- [ ] `database/schema.sql` — exécutable 2× sans erreur
- [ ] `docs/WORKFLOW.md` — 8 fiches de transition + matrice 7×7 + règles transverses
- [ ] `docs/API.md` — conventions + 24 fiches endpoint + traçabilité
- [ ] `docs/ECRANS.md` — navigation + 7 fiches écran + composants
- [ ] `docs/CONVENTIONS.md` — 8 domaines couverts
- [ ] `database/seed.sql` — 6 comptes + 15 demandes cohérentes avec historique

### Qualité

- [ ] Les 7 vérifications croisées R1→R7 passées
- [ ] Les 6 décisions BD (D1→D6) tranchées et justifiées par écrit
- [ ] Aucune contradiction entre les documents
- [ ] Tout est poussé sur GitHub, tag `phase-0` posé

### Décision de passage en P1

> La phase P1 (Fondations techniques) ne démarre que lorsque **toutes** les cases ci-dessus sont cochées. Si un point de conception s'avère erroné pendant le développement, on **met à jour le document concerné d'abord**, puis on code — les docs restent la source de vérité.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 17/07/2026 | 1.0 | Création du plan détaillé de la Phase 0 |
