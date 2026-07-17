# API — Contrat REST

> **Livrable P0.3** · Spécification de tous les endpoints du backend Express.
> Base URL : `http://localhost:5000/api`

---

## Sommaire

1. [Conventions générales](#1-conventions-générales)
2. [Auth](#2-auth)
3. [Demandes — CRUD](#3-demandes--crud)
4. [Demandes — Transitions](#4-demandes--transitions)
5. [Pièces jointes](#5-pièces-jointes)
6. [Historique](#6-historique)
7. [Notifications](#7-notifications)
8. [Utilisateurs (Admin)](#8-utilisateurs-admin)
9. [Statistiques](#9-statistiques)
10. [Table de traçabilité](#10-table-de-traçabilité)

---

## 1. Conventions générales

| Sujet | Convention |
|---|---|
| Préfixe | `/api` |
| Authentification | Header `Authorization: Bearer <JWT>` sur **tout sauf** `POST /api/auth/login` |
| Réponse succès | `{ "success": true, "data": <payload> }` |
| Réponse erreur | `{ "success": false, "error": { "code": "STRING", "message": "français" } }` |
| Pagination | Requête `?page=N` · Réponse `{ data: [...], pagination: { page, totalPages, totalItems } }` |
| Content-Type | `application/json` (sauf upload : `multipart/form-data`) |
| Langue des messages | Français (affichés tels quels dans l'UI) |

**Codes HTTP employés**

| Code | Sens |
|---|---|
| 200 | OK |
| 201 | Ressource créée |
| 400 | Validation échouée (données invalides) |
| 401 | Non authentifié (token absent / invalide / expiré) |
| 403 | Authentifié mais non autorisé (rôle ou propriété) |
| 404 | Ressource introuvable |
| 409 | Conflit d'état (transition illégale) |
| 500 | Erreur serveur |

**Codes d'erreur applicatifs** (`error.code`) : `VALIDATION`, `UNAUTHORIZED`,
`FORBIDDEN`, `NOT_FOUND`, `INVALID_TRANSITION`, `FILE_TOO_LARGE`, `FILE_TYPE`, `SERVER_ERROR`.

---

## 2. Auth

### POST /api/auth/login
- **Rôles** : public
- **Corps** : `{ "email": "string", "password": "string" }`
- **200** : `{ success, data: { token, user: { id, nom, prenom, role, structure } } }`
- **Erreurs** : 400 (champs manquants) · 401 (identifiants invalides **ou** compte désactivé — message générique « Identifiants invalides »)
- **Réf.** : EF01

### GET /api/auth/me
- **Rôles** : authentifié
- **200** : `{ success, data: { id, nom, prenom, email, role, structure } }`
- **Usage** : rétablir la session au rechargement de page
- **Réf.** : EF01

### PUT /api/auth/password
- **Rôles** : authentifié
- **Corps** : `{ "ancien": "string", "nouveau": "string (8+ car.)" }`
- **200** : `{ success, data: { message: "Mot de passe modifié" } }`
- **Erreurs** : 400 (nouveau trop court) · 401 (ancien incorrect)
- **Réf.** : EF21

> **Logout** : purement côté client (suppression du token). Pas d'endpoint serveur (JWT stateless).

---

## 3. Demandes — CRUD

### GET /api/demandes
- **Rôles** : authentifié
- **Filtrage par rôle (serveur)** :
  - DEMANDEUR → **uniquement ses** demandes
  - JURISTE / ADMIN → **toutes** les demandes **sauf les brouillons** des autres
- **Query** : `?statut=&theme=&date_debut=&date_fin=&page=1`
- **200** : `{ success, data: [ {demande…} ], pagination }`
- **Réf.** : EF08, EF09, EF23

### POST /api/demandes
- **Rôles** : DEMANDEUR
- **Corps** : `{ titre, theme, description, degre_sensibilite? }`
  (si `degre_sensibilite` absent → calculé auto selon le thème)
- **201** : `{ success, data: { demande créée en Brouillon } }`
- **Erreurs** : 400 (validation)
- **Réf.** : EF03, EF05

### GET /api/demandes/:id
- **Rôles** : authentifié (DEMANDEUR : propriétaire uniquement)
- **200** : `{ success, data: { demande + demandeur + juriste } }`
- **Erreurs** : 403 (pas sa demande) · 404
- **Réf.** : EF08

### PUT /api/demandes/:id
- **Rôles** : DEMANDEUR (propriétaire)
- **Pré-condition** : statut ∈ { Brouillon, Complément demandé }
- **Corps** : `{ titre?, theme?, description?, degre_sensibilite? }`
- **200** : `{ success, data: { demande modifiée } }`
- **Erreurs** : 400 · 403 · 404 · 409 (statut non modifiable)
- **Réf.** : EF03

---

## 4. Demandes — Transitions

> Chaque endpoint applique une transition de [WORKFLOW.md](WORKFLOW.md).
> Effets de bord communs : ligne d'historique + notification(s), en transaction.

| Endpoint | Transition | Rôles | Corps | Erreurs clés |
|---|---|---|---|---|
| `POST /api/demandes/:id/soumettre` | T1 | DEMANDEUR (prop.) | — | 400, 403, 409 |
| `POST /api/demandes/:id/annuler` | T2 | DEMANDEUR (prop.) | — | 403, 409 |
| `POST /api/demandes/:id/prendre-en-charge` | T3 | JURISTE, ADMIN | — | 403, 409 |
| `POST /api/demandes/:id/complement` | T4 | JURISTE, ADMIN | `{ commentaire }` | 400, 403, 409 |
| `POST /api/demandes/:id/completer` | T5 | DEMANDEUR (prop.) | — | 403, 409 |
| `POST /api/demandes/:id/valider` | T6 | JURISTE, ADMIN | `{ avis_juridique }` | 400, 403, 409 |
| `POST /api/demandes/:id/rejeter` | T7 | JURISTE, ADMIN | `{ motif_rejet }` | 400, 403, 409 |
| `PUT /api/demandes/:id/theme` | T8 | JURISTE, ADMIN | `{ theme }` | 400, 403, 409 |

**Réponse type (toutes)** : `200 { success, data: { demande mise à jour } }`
**Réf.** : EF10, EF11, EF12, EF13, EF14, EF24

---

## 5. Pièces jointes

### POST /api/demandes/:id/piece-jointe
- **Rôles** : DEMANDEUR (propriétaire)
- **Pré-condition** : statut ∈ { Brouillon, Complément demandé }
- **Corps** : `multipart/form-data`, champ `fichier`
- **Contraintes** : types PDF / DOCX / PNG / JPG · max **10 Mo**
- **201** : `{ success, data: { piece_jointe_nom, piece_jointe_taille, piece_jointe_type } }`
- **Erreurs** : 400 (`FILE_TYPE`) · 400 (`FILE_TOO_LARGE`) · 403 · 409
- **Réf.** : EF06

### GET /api/demandes/:id/piece-jointe
- **Rôles** : authentifié (DEMANDEUR : propriétaire)
- **200** : flux binaire, header `Content-Disposition: attachment; filename="<nom original>"`
- **Erreurs** : 403 · 404 (pas de PJ)
- **Réf.** : EF07

### DELETE /api/demandes/:id/piece-jointe
- **Rôles** : DEMANDEUR (propriétaire)
- **Pré-condition** : statut ∈ { Brouillon, Complément demandé }
- **200** : `{ success, data: { message } }` · supprime le fichier disque + vide les colonnes
- **Erreurs** : 403 · 404 · 409
- **Réf.** : EF07

---

## 6. Historique

### GET /api/demandes/:id/historique
- **Rôles** : authentifié (DEMANDEUR : propriétaire)
- **200** : `{ success, data: [ { ancien_statut, nouveau_statut, commentaire, created_at, user: {prenom, nom} } ] }`
- **Usage** : alimente la Timeline du journal d'activité
- **Réf.** : EF17, EF18

---

## 7. Notifications

### GET /api/notifications
- **Rôles** : authentifié
- **200** : `{ success, data: { items: [...], nonLues: <int> } }`
- **Réf.** : EF15

### PUT /api/notifications/:id/lue
- **Rôles** : authentifié (destinataire)
- **200** : `{ success, data: { message } }`
- **Erreurs** : 403 · 404
- **Réf.** : EF15

### PUT /api/notifications/tout-lu
- **Rôles** : authentifié
- **200** : `{ success, data: { message } }` — marque toutes les notifs du user comme lues
- **Réf.** : EF15

---

## 8. Utilisateurs (Admin)

### GET /api/users
- **Rôles** : ADMIN
- **Query** : `?role=&actif=&page=1`
- **200** : `{ success, data: [ {user sans password_hash} ], pagination }`
- **Réf.** : EF22

### POST /api/users
- **Rôles** : ADMIN
- **Corps** : `{ nom, prenom, email, password, role, structure? }`
- **201** : `{ success, data: { user créé } }` (password haché avant insert)
- **Erreurs** : 400 (validation) · 409 (email déjà utilisé)
- **Réf.** : EF22

### PUT /api/users/:id
- **Rôles** : ADMIN
- **Corps** : `{ nom?, prenom?, role?, structure? }`
- **200** : `{ success, data: { user modifié } }`
- **Erreurs** : 400 · 404
- **Réf.** : EF22

### PUT /api/users/:id/desactiver
- **Rôles** : ADMIN
- **Corps** : `{ actif: boolean }` (bascule activer / désactiver)
- **200** : `{ success, data: { user } }`
- **Note** : jamais de suppression physique (intégrité FK)
- **Réf.** : EF22

---

## 9. Statistiques

### GET /api/stats/admin
- **Rôles** : ADMIN
- **200** : `{ success, data: {
    parStatut: {...}, parTheme: {...}, parSensibilite: {...},
    evolutionMensuelle: [...], delaiMoyenJours: <float>,
    tauxValidation: <float>, tauxRejet: <float>, enRetard: <int>
  } }`
- **Réf.** : EF16, EF19

### GET /api/stats/demandeur
- **Rôles** : DEMANDEUR
- **200** : `{ success, data: { parStatut: {...}, recentes: [...] } }`
- **Réf.** : EF20

---

## 10. Table de traçabilité

Chaque exigence fonctionnelle du CDC est couverte par au moins un endpoint.

| Exigence CDC | Endpoint(s) | Écran(s) |
|---|---|---|
| EF01 Auth | `POST /auth/login`, `GET /auth/me` | Login |
| EF02 Rôles | middleware sur tous les endpoints | (transverse) |
| EF03 Création demande | `POST /demandes`, `PUT /demandes/:id` | Nouvelle demande |
| EF04 Soumission | `POST /demandes/:id/soumettre` | Nouvelle / Détail |
| EF05 Sensibilité auto | `POST /demandes` (logique serveur) | Nouvelle demande |
| EF06 Upload PJ | `POST /demandes/:id/piece-jointe` | Nouvelle / Détail |
| EF07 Download/Delete PJ | `GET`/`DELETE /demandes/:id/piece-jointe` | Détail |
| EF08 Liste filtrée par rôle | `GET /demandes`, `GET /demandes/:id` | Liste, Détail |
| EF09 Filtres | `GET /demandes?...` | Liste |
| EF10 Workflow | endpoints de transition T1–T8 | Détail |
| EF11 Complément | `POST /demandes/:id/complement` | Détail |
| EF12 Modif thème | `PUT /demandes/:id/theme` | Détail |
| EF13 Rédaction avis | `POST /demandes/:id/valider` | Détail |
| EF14 Validation/Rejet | `POST .../valider`, `.../rejeter` | Détail |
| EF15 Notifications | endpoints `/notifications` | Navbar (toutes pages) |
| EF16 Dashboard Admin | `GET /stats/admin` | Dashboard Admin |
| EF17 Historique | `GET /demandes/:id/historique` | Détail |
| EF18 Journal d'activité | `GET /demandes/:id/historique` | Détail |
| EF19 KPIs | `GET /stats/admin` | Dashboard Admin |
| EF20 Dashboard Demandeur | `GET /stats/demandeur` | Dashboard Demandeur |
| EF21 Changement mot de passe | `PUT /auth/password` | Profil |
| EF22 CRUD utilisateurs | endpoints `/users` | Gestion utilisateurs |
| EF23 Pagination | query `?page=` sur les listes | Liste, Utilisateurs |
| EF24 Annulation brouillon | `POST /demandes/:id/annuler` | Détail |

**Total endpoints : 24.** Couverture EF01→EF24 : **100 %**.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 17/07/2026 | 1.0 | Création — conventions, 24 endpoints, traçabilité complète |
