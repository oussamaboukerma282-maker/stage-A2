# Phase 3 – Plan détaillé du Cœur métier : les demandes

> **Durée** : 7 jours (J1 → J7, Semaine 3)
> **Objectif** : un Demandeur crée une demande (brouillon), y joint un fichier, la soumet et la
> retrouve dans sa liste ; un Juriste voit toutes les demandes soumises et peut consulter leur
> détail. À la fin de P3, **les données métier circulent** — mais le workflow complet
> (validation, rejet, complément) reste en Phase 4.
> **Références amont** : [`API.md`](API.md) §3/§5, [`ECRANS.md`](ECRANS.md) §2.3/2.4/2.5,
> [`DATABASE.md`](DATABASE.md) table `demande_avis`, [`CONVENTIONS.md`](CONVENTIONS.md)

---

## Sommaire

1. [Périmètre & résultat attendu](#1-périmètre--résultat-attendu)
2. [Découpage des 7 jours](#2-découpage-des-7-jours)
3. [J1 – Modèle & lecture des demandes](#3-j1--modèle--lecture-des-demandes)
4. [J2 – Création, modification & sensibilité automatique](#4-j2--création-modification--sensibilité-automatique)
5. [J3 – Pièces jointes](#5-j3--pièces-jointes)
6. [J4 – Frontend : liste & filtres](#6-j4--frontend--liste--filtres)
7. [J5 – Frontend : formulaire de création](#7-j5--frontend--formulaire-de-création)
8. [J6 – Frontend : page détail (lecture)](#8-j6--frontend--page-détail-lecture)
9. [J7 – Tests, cloisonnement & clôture](#9-j7--tests-cloisonnement--clôture)
10. [Checklist globale de sortie P3](#10-checklist-globale-de-sortie-p3)

---

## 1. Périmètre & résultat attendu

### Ce que P3 contient

| Inclus | Exclu (→ phase) |
|---|---|
| Création de demande (brouillon) | Prise en charge, validation, rejet (**P4**) |
| Soumission simple (Brouillon → Soumise) | Complément demandé, historique, journal (**P4**) |
| Liste filtrée par rôle + filtres + pagination | Notifications (**P5**) |
| Page détail en **lecture** | Actions contextuelles de traitement (**P4**) |
| Upload / téléchargement / suppression de pièce jointe | Tableaux de bord et KPIs (**P5**) |
| Calcul automatique du degré de sensibilité | Export PDF/CSV, commentaires (**P6**) |

> **Note sur la soumission** : P3 implémente la transition **T1 (Brouillon → Soumise)** car sans
> elle, aucune demande ne serait visible côté Juriste. Elle sera **refactorée en P4** pour passer
> par le moteur de transitions (avec historique + notification). Ici, on écrit simplement
> `statut='Soumise'` + `date_soumission`.

### Le test de réussite de la phase

```
1. Un Demandeur crée un brouillon, le modifie, y joint un PDF
2. La sensibilité se calcule automatiquement selon le thème choisi
3. Il soumet → la demande apparaît chez le Juriste
4. Le Demandeur A ne voit PAS les demandes du Demandeur B (testé via API directe)
5. Un fichier de 15 Mo ou un .exe est refusé avec un message clair
6. Les filtres (statut, thème, dates) et la pagination fonctionnent
```

### Nouvelle dépendance

Backend : **`multer`** (upload) + **`uuid`** (noms de fichiers uniques).

---

## 2. Découpage des 7 jours

```
J1            J2              J3            J4            J5            J6            J7
┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Modèle + │  │ Création   │  │ Pièces   │  │ Liste +  │  │ Formu-   │  │ Détail   │  │ Tests +  │
│ GET liste│─▶│ + sensibi- │─▶│ jointes  │─▶│ filtres  │─▶│ laire    │─▶│ (lecture)│─▶│ tag      │
│ + détail │  │ lité auto  │  │ (Multer) │  │ (React)  │  │ création │  │          │  │ phase-3  │
└──────────┘  └────────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
   BACKEND ─────────────────────────────────▶  FRONTEND ──────────────────────────▶   VALIDATION
```

| Jour | Tâches | Livrable |
|---|---|---|
| J1 | `demandesModel` + `GET /demandes` (filtrage par rôle) + `GET /demandes/:id` | Lecture testée Postman |
| J2 | `POST /demandes`, `PUT /demandes/:id`, `POST /:id/soumettre`, sensibilité auto | Écriture testée |
| J3 | Multer, `POST/GET/DELETE /:id/piece-jointe` | Upload opérationnel |
| J4 | Page Liste + `StatutBadge` + filtres + pagination | Liste fonctionnelle |
| J5 | Page Nouvelle demande + `FileUpload` | Création depuis l'UI |
| J6 | Page Détail (lecture) | Consultation complète |
| J7 | Campagne de tests (dont cloisonnement) + bilan + tag | Phase clôturée |

---

## 3. J1 – Modèle & lecture des demandes

### 3.1 Fichiers à créer

```
server/
├── models/demandesModel.js
├── controllers/demandesController.js
├── routes/demandes.js
└── config/themes.js          # table thème → sensibilité (règle métier centralisée)
```

Montage dans `server.js` : `app.use('/api/demandes', require('./routes/demandes'));`

### 3.2 Règle de visibilité (le point le plus important de P3)

Le filtrage se fait **en SQL, côté serveur** — jamais côté client.

| Rôle | Ce qu'il voit |
|---|---|
| **DEMANDEUR** | **Uniquement ses propres demandes** (`demandeur_id = req.user.id`), tous statuts |
| **JURISTE / ADMIN** | Toutes les demandes **sauf les brouillons** (`statut <> 'Brouillon'`) |

> **Pourquoi exclure les brouillons** : un brouillon n'est pas encore soumis, il appartient
> au demandeur seul. Le rendre visible violerait la confidentialité du travail en cours.

### 3.3 `GET /api/demandes` — liste

- **Query params** : `statut`, `theme`, `date_debut`, `date_fin`, `page` (défaut 1).
- **Pagination** : 20 par page → réponse `{ data: [...], pagination: { page, totalPages, totalItems } }`.
- **Tri** : `date_creation DESC` (plus récentes en premier).
- **Jointure** : renvoyer le nom du demandeur (et du juriste si présent) pour l'affichage.

**Construction sûre de la requête** : les filtres se composent dynamiquement mais **toujours**
avec des paramètres numérotés (`$1, $2, …`) — jamais de concaténation de valeurs.

### 3.4 `GET /api/demandes/:id` — détail

- Contrôle d'accès : si `req.user.role === 'DEMANDEUR'` et `demande.demandeur_id !== req.user.id`
  → **403**. Si introuvable → **404**.
- Renvoie la demande complète + infos demandeur/juriste.

### ✅ Critères de sortie J1
- [ ] Un Demandeur ne reçoit que ses demandes (vérifié en base)
- [ ] Un Juriste ne voit aucun brouillon
- [ ] Accès au détail d'une demande d'autrui (Demandeur) → 403
- [ ] Pagination et tri corrects

---

## 4. J2 – Création, modification & sensibilité automatique

### 4.1 Règle métier : sensibilité déduite du thème

`config/themes.js` centralise la règle (voir [DATABASE.md §5.1](DATABASE.md)) :

| Thème | Sensibilité |
|---|---|
| Procuration | Moyen |
| Révision dossier juridique | Confidentiel |
| Moyens de paiements | Confidentiel |
| Clôture de compte | Moyen |
| Autre problématique | Faible |

Le serveur calcule la valeur si le client ne la fournit pas ; si le client en fournit une, elle
doit rester dans les valeurs légales (`Faible|Moyen|Confidentiel`) — sinon **400**.

### 4.2 `POST /api/demandes` — création (brouillon)

- **Rôle** : DEMANDEUR uniquement.
- **Corps** : `{ titre, theme, description, degre_sensibilite? }`.
- **Validations** : titre 3-250 car., thème dans la liste, description ≥ 10 car.
- **Effets** : insertion avec `statut='Brouillon'`, `demandeur_id = req.user.id`.
- **Réponse** : **201** + la demande créée.

### 4.3 `PUT /api/demandes/:id` — modification

- **Rôle** : DEMANDEUR **propriétaire**.
- **Pré-condition** : `statut ∈ { 'Brouillon', 'Complément demandé' }` — sinon **409**.
  (Le second cas servira en P4 ; on l'autorise dès maintenant.)
- Si le thème change, la sensibilité est **recalculée** (sauf valeur explicite fournie).

### 4.4 `POST /api/demandes/:id/soumettre` — transition T1 (version simple)

- **Rôle** : DEMANDEUR propriétaire · **Pré-condition** : `statut='Brouillon'` sinon **409**.
- **Validations métier** : titre, thème, description non vides.
- **Effets** : `statut='Soumise'`, `date_soumission=NOW()`.
- ⚠️ **Dette assumée** : pas encore d'historique ni de notification — **ajoutés en P4** lors du
  passage au moteur de transitions. À noter dans le bilan de phase.

### ✅ Critères de sortie J2
- [ ] Création → 201, statut Brouillon, rattachée au bon demandeur
- [ ] Sensibilité correcte pour les 5 thèmes
- [ ] Modification refusée si statut Soumise/En cours (409)
- [ ] Modification par un autre utilisateur → 403
- [ ] Soumission → statut Soumise + `date_soumission` renseignée

---

## 5. J3 – Pièces jointes

### 5.1 Configuration Multer

```bash
cd server && npm install multer uuid
```

`middleware/upload.js` — contraintes (voir [CDC EF06](API.md)) :

| Contrainte | Valeur |
|---|---|
| Destination | `server/uploads/` |
| Nom sur disque | `<uuid>.<extension>` (évite collisions et noms exotiques) |
| Taille max | **10 Mo** (`MAX_FILE_SIZE` du `.env`) |
| Types autorisés | PDF, DOCX, PNG, JPG/JPEG |
| Vérification | Type MIME **et** extension (le MIME client est falsifiable) |

Les métadonnées (`nom`, `path`, `type`, `taille`) sont stockées en base ; le fichier reste sur disque.

### 5.2 Les trois endpoints

| Endpoint | Rôle | Pré-condition | Effet |
|---|---|---|---|
| `POST /:id/piece-jointe` | DEMANDEUR propriétaire | statut modifiable | Enregistre le fichier + métadonnées. Si une PJ existait, **supprimer l'ancien fichier** |
| `GET /:id/piece-jointe` | tous (Demandeur : propriétaire) | PJ existante | Téléchargement avec le **nom original** (`Content-Disposition`) |
| `DELETE /:id/piece-jointe` | DEMANDEUR propriétaire | statut modifiable | Supprime le fichier disque **et** vide les colonnes |

### 5.3 Points de vigilance

- **Erreurs Multer** : intercepter `LIMIT_FILE_SIZE` → **400** `FILE_TOO_LARGE` avec message
  français clair ; type refusé → **400** `FILE_TYPE`.
- **Pas d'exposition statique** : le dossier `/uploads` **ne doit pas** être servi par
  `express.static` — l'accès passe uniquement par la route contrôlée (sinon n'importe qui
  devinant un UUID téléchargerait le fichier sans contrôle de droits).
- **Cohérence disque/base** : si l'insertion en base échoue après l'écriture du fichier,
  supprimer le fichier orphelin.

### ✅ Critères de sortie J3
- [ ] Upload PDF < 10 Mo → 201 + métadonnées en base
- [ ] Fichier 15 Mo → 400 `FILE_TOO_LARGE`
- [ ] Fichier `.exe` → 400 `FILE_TYPE`
- [ ] Téléchargement restitue le **nom d'origine**
- [ ] Un Demandeur ne peut pas télécharger la PJ d'un autre → 403
- [ ] Suppression retire le fichier **et** les colonnes

---

## 6. J4 – Frontend : liste & filtres

### 6.1 Composant `StatutBadge`

`components/StatutBadge.jsx` — badge coloré réutilisé partout
(couleurs de [ECRANS.md §4](ECRANS.md)) :

| Statut | Couleur |
|---|---|
| Brouillon | gris/violet clair |
| Soumise | bleu |
| En cours | ambre |
| Complément demandé | orange |
| Validée | vert |
| Rejetée | rouge |
| Annulée | gris |

### 6.2 Page Liste — `pages/Demandes.jsx`

Remplace le placeholder P2. Structure ([ECRANS.md §2.4](ECRANS.md)) :
- **Barre de filtres** : statut, thème, période (du/au) + bouton Réinitialiser.
- **Tableau** : ID, Titre, Thème, Sensibilité, Statut (badge), Date · clic sur ligne → détail.
- **Pagination** : précédent/suivant + indicateur « Page X / Y ».
- **États** : chargement (skeleton), **vide** (« Aucune demande »), erreur.

Les filtres sont poussés dans l'URL (query string) pour être partageables et survivre au F5.

### ✅ Critères de sortie J4
- [ ] La liste affiche les données réelles selon le rôle connecté
- [ ] Chaque filtre fonctionne, et se combinent entre eux
- [ ] Pagination opérationnelle
- [ ] États chargement / vide / erreur gérés

---

## 7. J5 – Frontend : formulaire de création

### 7.1 Composant `FileUpload`

`components/FileUpload.jsx` : sélection de fichier, affichage nom + taille,
**validation côté client** (type et taille) *en plus* de la validation serveur,
barre de progression (via `onUploadProgress` d'Axios), bouton de retrait.

### 7.2 Page `pages/NouvelleDemande.jsx`

Champs : titre, thème (select), sensibilité (**pré-remplie automatiquement** au changement de
thème, mais modifiable), description, pièce jointe.

**Deux actions** :
- « Enregistrer le brouillon » → `POST /demandes` (+ upload si fichier) → redirection vers le détail.
- « Soumettre » → `POST /demandes` puis `POST /:id/soumettre` → redirection vers la liste.

**Gestion d'erreurs** : validation inline par champ ; erreur serveur → toast, **formulaire préservé**
(ne jamais faire perdre la saisie).

### ✅ Critères de sortie J5
- [ ] Création d'un brouillon depuis l'UI
- [ ] La sensibilité se met à jour en changeant de thème
- [ ] Upload avec progression, refus client des types/tailles invalides
- [ ] Soumission directe fonctionnelle

---

## 8. J6 – Frontend : page détail (lecture)

`pages/DemandeDetail.jsx` — remplace le placeholder. Contenu ([ECRANS.md §2.5](ECRANS.md)) :

- **En-tête** : `#id`, titre, `StatutBadge`.
- **Bloc informations** : thème, sensibilité, demandeur, structure, dates, juriste en charge (si présent).
- **Description** complète.
- **Pièce jointe** : nom, taille, bouton **Télécharger** (+ Supprimer si le statut le permet et
  que l'utilisateur est le propriétaire).
- **Zone « Actions »** : **placeholder** en P3 — les boutons de traitement (prendre en charge,
  valider, rejeter…) arrivent en **P4**.
- **Zone « Journal d'activité »** : **placeholder** — arrive en **P4**.

Le Demandeur propriétaire voit aussi « Modifier » / « Soumettre » si le statut est Brouillon.

### ✅ Critères de sortie J6
- [ ] Le détail affiche toutes les informations
- [ ] Téléchargement de la PJ depuis la page
- [ ] Accès au détail d'une demande d'autrui → message d'erreur propre (pas d'écran blanc)
- [ ] Les emplacements Actions/Journal sont prêts pour P4

---

## 9. J7 – Tests, cloisonnement & clôture

### 9.1 Campagne de tests

**Cloisonnement des données (le plus critique)**

| # | Test | Attendu |
|---|---|---|
| C1 | Demandeur A liste ses demandes | Aucune demande de B |
| C2 | Demandeur A ouvre l'id d'une demande de B (**API directe**) | 403 |
| C3 | Juriste liste | Aucun brouillon |
| C4 | Demandeur A télécharge la PJ de B | 403 |
| C5 | Demandeur A modifie la demande de B | 403 |

**Règles métier**

| # | Test | Attendu |
|---|---|---|
| M1 | Les 5 thèmes → bonne sensibilité | ✔ |
| M2 | Modifier une demande Soumise | 409 |
| M3 | Soumettre une demande déjà Soumise | 409 |
| M4 | Créer sans titre / description trop courte | 400 |
| M5 | Un JURISTE tente de créer une demande | 403 |

**Fichiers**

| # | Test | Attendu |
|---|---|---|
| F1 | PDF valide | 201 |
| F2 | 15 Mo | 400 `FILE_TOO_LARGE` |
| F3 | `.exe` | 400 `FILE_TYPE` |
| F4 | Remplacement de PJ | ancien fichier supprimé du disque |
| F5 | Suppression | fichier + colonnes vidés |

**Parcours navigateur** : créer → modifier → joindre → soumettre → retrouver dans la liste →
ouvrir le détail → se connecter en juriste → la voir apparaître.

### 9.2 Clôture
- [ ] Restaurer le jeu de démo (`npm run db:reset`) et nettoyer `server/uploads/` des fichiers de test
- [ ] Pas de `console.log` de debug
- [ ] Note d'avancement P3 (`NOTE_AVANCEMENT_P3.md`) pour les autres développeurs
- [ ] Bilan dans [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md) — **mentionner la dette T1** (historique/notification à ajouter en P4)
- [ ] Commit + push + tag `phase-3`

---

## 10. Checklist globale de sortie P3

### Backend
- [ ] `GET /demandes` (filtrage par rôle, filtres, pagination) · `GET /demandes/:id`
- [ ] `POST /demandes` · `PUT /demandes/:id` · `POST /:id/soumettre`
- [ ] `POST` / `GET` / `DELETE /:id/piece-jointe`
- [ ] Sensibilité automatique centralisée dans `config/themes.js`
- [ ] Toutes les routes derrière `auth` (+ `roles` quand nécessaire)
- [ ] `/uploads` **non** servi en statique

### Frontend
- [ ] `StatutBadge`, `FileUpload`
- [ ] Page Liste (filtres + pagination + états)
- [ ] Page Nouvelle demande (brouillon / soumettre + upload)
- [ ] Page Détail en lecture, emplacements P4 réservés

### Tests
- [ ] Cloisonnement C1-C5 · Règles métier M1-M5 · Fichiers F1-F5
- [ ] Parcours navigateur complet

### Décision de passage en P4
> P4 (Workflow & Traçabilité) démarre quand toutes les cases sont vertes.
> **Première tâche de P4** : refactorer la soumission (T1) pour qu'elle passe par le moteur de
> transitions, avec écriture de l'historique et des notifications en transaction.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 21/07/2026 | 1.0 | Création du plan détaillé de la Phase 3 |
