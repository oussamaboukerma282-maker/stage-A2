# ECRANS — Arborescence & Interfaces

> **Livrable P0.4** · Décrit toutes les pages React, la navigation, et le contenu de chaque écran.
> Chaque écran référence les endpoints de [API.md](API.md) qu'il consomme.

---

## Sommaire

1. [Carte de navigation](#1-carte-de-navigation)
2. [Fiches d'écran](#2-fiches-décran)
3. [Tableau critique : actions de l'écran Détail](#3-tableau-critique--actions-de-lécran-détail)
4. [Composants réutilisables](#4-composants-réutilisables)

---

## 1. Carte de navigation

```
/login ................. Connexion (public)
   └─(succès)─▶ / ...... redirige vers le dashboard du rôle

/ ...................... Accueil / Dashboard (contenu selon rôle)
/demandes .............. Liste des demandes (filtrée selon rôle)
/demandes/nouvelle ..... Formulaire de création          [DEMANDEUR]
/demandes/:id .......... Détail + actions contextuelles   [tous, selon droits]
/profil ................ Profil + changement mot de passe [tous]
/utilisateurs .......... Gestion des comptes              [ADMIN]
/* ..................... Page 404
```

**Guards de navigation** (composant `<ProtectedRoute>`) :

| Route | Accès | Si non autorisé |
|---|---|---|
| `/login` | public | si déjà connecté → `/` |
| toutes les autres | authentifié | → `/login` |
| `/demandes/nouvelle` | DEMANDEUR | → `/` (message) |
| `/utilisateurs` | ADMIN | → `/` (message) |

---

## 2. Fiches d'écran

### 2.1 Login — `/login`

- **Rôles** : public
- **Wireframe**
```
        ┌─────────────────────────────┐
        │      Avis Juridiques         │
        │      Natixis — DAJ           │
        │                             │
        │   Email    [_____________]   │
        │   Mot de passe [_________]   │
        │                             │
        │        [ Se connecter ]      │
        │   (message d'erreur ici)     │
        └─────────────────────────────┘
```
- **Composants** : `Card`, `Input`, `Button` (shadcn), état d'erreur
- **Endpoints** : `POST /auth/login`
- **Comportement** : au succès, stocke token + user (AuthContext) et redirige vers `/`
- **États** : chargement (bouton désactivé + spinner), erreur (« Identifiants invalides »)

### 2.2 Dashboard / Accueil — `/`

Le contenu dépend du rôle connecté.

**DEMANDEUR** (EF20)
```
┌──────────────────────────────────────────────┐
│  Bonjour {prénom}          [+ Nouvelle demande]│
├──────────────────────────────────────────────│
│ [Brouillon 2][Soumise 1][En cours 3][Clôt. 5] │  ← StatCards
├──────────────────────────────────────────────│
│  Mes 5 dernières demandes (table condensée)    │
└──────────────────────────────────────────────┘
```
- **Endpoints** : `GET /stats/demandeur`

**JURISTE** — vue de travail
```
┌──────────────────────────────────────────────┐
│ [À traiter (Soumise) 3][Mes dossiers 4]        │
├──────────────────────────────────────────────│
│ Demandes soumises en attente de prise en charge│
└──────────────────────────────────────────────┘
```
- **Endpoints** : `GET /demandes?statut=Soumise`, `GET /demandes?statut=En cours`

**ADMIN** (EF16, EF19)
```
┌──────────────────────────────────────────────┐
│ [Total][Délai moyen][% Validées][En retard]    │  ← KPIs
├───────────────────────┬──────────────────────│
│ Donut par statut      │ Barres par thème       │  ← Chart.js
├───────────────────────┼──────────────────────│
│ Donut sensibilité     │ Courbe mensuelle       │
└───────────────────────┴──────────────────────┘
```
- **Endpoints** : `GET /stats/admin`
- **Composants** : `StatCard`, 4 graphiques `Chart.js`

### 2.3 Nouvelle demande — `/demandes/nouvelle`

- **Rôles** : DEMANDEUR
- **Wireframe**
```
┌──────────────────────────────────────────────┐
│  Nouvelle demande d'avis                       │
├──────────────────────────────────────────────│
│ Titre        [____________________________]    │
│ Thème        [ Procuration            ▼]       │
│ Sensibilité  [ Moyen ] (auto, modifiable)      │
│ Description  [____________________________]    │
│              [____________________________]    │
│ Pièce jointe [ Choisir un fichier ] (max 10Mo) │
│                                                │
│      [ Enregistrer brouillon ]  [ Soumettre ]  │
└──────────────────────────────────────────────┘
```
- **Composants** : `Input`, `Select`, `Textarea`, `FileUpload`, `Button`
- **Endpoints** : `POST /demandes` (+ `POST /demandes/:id/piece-jointe` si fichier)
  ; « Soumettre » enchaîne `POST /demandes/:id/soumettre`
- **Logique** : au changement de thème, la sensibilité se met à jour automatiquement (modifiable ensuite)
- **États** : validation inline, barre de progression d'upload, toast succès/erreur

### 2.4 Liste des demandes — `/demandes`

- **Rôles** : tous (contenu filtré serveur)
- **Wireframe**
```
┌──────────────────────────────────────────────┐
│ Filtres: [Statut▼][Thème▼][Du__][Au__][Rech.] │
├────┬─────────────┬────────┬──────────┬────────│
│ ID │ Titre       │ Thème  │ Sensib.  │ Statut │
├────┼─────────────┼────────┼──────────┼────────│
│ 12 │ Procuration │ Proc.  │ Moyen    │[Soumise]│
│ …  │             │        │          │        │
├──────────────────────────────────────────────│
│              ◀ Page 1/3 ▶                      │
└──────────────────────────────────────────────┘
```
- **Composants** : `Select` (filtres), `Table`, `StatutBadge`, pagination
- **Endpoints** : `GET /demandes?statut=&theme=&date_debut=&date_fin=&page=`
- **Interaction** : clic sur une ligne → `/demandes/:id`
- **États** : chargement (skeleton), vide (« Aucune demande »), erreur

### 2.5 Détail d'une demande — `/demandes/:id`

- **Rôles** : tous (DEMANDEUR : propriétaire) — **contrôle serveur**
- **Wireframe**
```
┌──────────────────────────────────────────────┐
│ #12  Procuration client X          [Statut]    │
├───────────────────────────────┬──────────────│
│ Thème, Sensibilité, Demandeur  │  ACTIONS      │
│ Description…                   │ (selon rôle   │
│ Pièce jointe [Télécharger]     │  et statut —  │
│ Avis juridique (si validée)    │  voir §3)     │
│ Motif rejet (si rejetée)       │               │
├───────────────────────────────┴──────────────│
│ Journal d'activité (Timeline)                  │
│  • 12/07 09:00 — Soumise par …                 │
│  • 12/07 10:30 — Prise en charge par …         │
└──────────────────────────────────────────────┘
```
- **Composants** : `StatutBadge`, `Timeline`, `ConfirmDialog`, `Button`, `Badge`
- **Endpoints** : `GET /demandes/:id`, `GET /demandes/:id/historique`,
  + endpoints de transition selon l'action, `GET /demandes/:id/piece-jointe`
- **Cœur de l'écran** : les boutons d'action dépendent du couple (rôle, statut) → **§3**

### 2.6 Profil — `/profil`

- **Rôles** : tous
- **Contenu** : infos du compte (lecture) + formulaire de changement de mot de passe
- **Composants** : `Card`, `Input`, `Button`
- **Endpoints** : `GET /auth/me`, `PUT /auth/password`
- **États** : validation (nouveau ≥ 8 car.), toast succès, erreur « ancien mot de passe incorrect »

### 2.7 Gestion des utilisateurs — `/utilisateurs`

- **Rôles** : ADMIN
- **Wireframe**
```
┌──────────────────────────────────────────────┐
│ Utilisateurs            [+ Nouvel utilisateur] │
│ Filtres: [Rôle▼][Actif▼]                       │
├────┬──────────────┬──────────┬────────┬───────│
│ Nom│ Email        │ Rôle     │ Actif  │ Actions│
├────┼──────────────┼──────────┼────────┼───────│
│ …  │              │[JURISTE] │  ✔     │[✎][⊘] │
├──────────────────────────────────────────────│
│              ◀ Page 1/2 ▶                      │
└──────────────────────────────────────────────┘
```
- **Composants** : `Table`, `Dialog` (création/édition), `Select`, `Switch` (actif), `Badge`
- **Endpoints** : `GET /users`, `POST /users`, `PUT /users/:id`, `PUT /users/:id/desactiver`
- **États** : chargement, vide, erreur email déjà pris (409 → message dans le dialog)

### 2.8 Page 404 — `/*`

- Message « Page introuvable » + lien retour vers `/`.

---

## 3. Tableau critique : actions de l'écran Détail

C'est la traduction directe de la [matrice de permissions du CDC §3](../CDC_Avis_Juridiques_PERN_V2.docx)
et de [WORKFLOW.md](WORKFLOW.md). Les boutons affichés dépendent du couple **(rôle, statut)**.

| Statut ↓ / Rôle → | DEMANDEUR (propriétaire) | JURISTE | ADMIN |
|---|---|---|---|
| **Brouillon** | Modifier · Soumettre · Annuler | *(demande invisible)* | *(demande invisible)* |
| **Soumise** | *(lecture seule)* | Prendre en charge | Prendre en charge |
| **En cours** | *(lecture seule)* | Demander complément · Modifier thème · Valider · Rejeter | idem Juriste |
| **Complément demandé** | Modifier · Compléter (resoumettre) | *(lecture seule)* | *(lecture seule)* |
| **Validée** | *(lecture seule)* | *(lecture seule)* | *(lecture seule)* |
| **Rejetée** | *(lecture seule)* | *(lecture seule)* | *(lecture seule)* |
| **Annulée** | *(lecture seule)* | *(lecture seule)* | *(lecture seule)* |

**Règle d'implémentation** : ce tableau est encodé côté client pour l'affichage,
**mais l'autorisation réelle est vérifiée côté serveur** à chaque appel. Le client
ne fait que masquer des boutons ; le serveur, lui, refuse (403/409) toute action illégale.

---

## 4. Composants réutilisables

| Composant | Utilisé dans | Props principales | Rôle |
|---|---|---|---|
| `ProtectedRoute` | Router | `roles[]`, `children` | Garde d'accès par rôle |
| `Layout` + `Navbar` | toutes les pages (sauf Login) | — | Structure + navigation selon rôle |
| `StatutBadge` | Liste, Détail, Dashboards | `statut` | Badge coloré (7 couleurs) |
| `NotificationBell` | Navbar | — (autonome) | Cloche + compteur + dropdown + polling 30 s |
| `Timeline` | Détail | `evenements[]` | Journal d'activité vertical |
| `FileUpload` | Nouvelle demande, Complément | `onUpload, maxSize, accept` | Upload + barre de progression |
| `ConfirmDialog` | Détail (valider/rejeter/complément) | `titre, champTexte?, onConfirm` | Confirmation + saisie (avis/motif/commentaire) |
| `StatCard` | Dashboards | `titre, valeur, icone` | Carte de KPI |

**Couleurs des statuts (`StatutBadge`)** — cohérentes avec le diagramme d'état :

| Statut | Couleur |
|---|---|
| Brouillon | gris/violet clair |
| Soumise | bleu |
| En cours | ambre |
| Complément demandé | orange |
| Validée | vert |
| Rejetée | rouge |
| Annulée | gris |

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 17/07/2026 | 1.0 | Création — navigation, 8 écrans, tableau rôle×statut, composants |
