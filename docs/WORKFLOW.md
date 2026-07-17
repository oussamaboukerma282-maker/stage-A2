# WORKFLOW — Machine à états des demandes

> **Livrable P0.2** · Définit le cycle de vie d'une demande et toutes les transitions.
> C'est la spécification que le service `server/services/workflow.js` implémentera en Phase 4.

---

## Sommaire

1. [Les 7 statuts](#1-les-7-statuts)
2. [Schéma de la machine à états](#2-schéma-de-la-machine-à-états)
3. [Fiches de transition (T1 à T8)](#3-fiches-de-transition)
4. [Matrice des transitions autorisées (7×7)](#4-matrice-des-transitions-autorisées)
5. [Règles transverses](#5-règles-transverses)

---

## 1. Les 7 statuts

| Statut | Nature | Description | Modifiable ? |
|---|---|---|---|
| **Brouillon** | initial | Demande en cours de saisie, non soumise | Oui (propriétaire) |
| **Soumise** | actif | Envoyée à la DAJ, en attente de prise en charge | Non |
| **En cours** | actif | Prise en charge par un juriste, en cours d'analyse | Non (sauf thème) |
| **Complément demandé** | actif | Renvoyée au demandeur pour compléments | Oui (propriétaire) |
| **Validée** | terminal | Avis rendu favorablement, dossier clos | **Non (verrouillé)** |
| **Rejetée** | terminal | Demande rejetée avec motif, dossier clos | **Non (verrouillé)** |
| **Annulée** | terminal | Brouillon annulé par le demandeur | **Non (verrouillé)** |

---

## 2. Schéma de la machine à états

```
                    ┌────────────┐
             ┌──────│  BROUILLON │──────┐
        T2   │      └─────┬──────┘      │  T1
      Annuler│         T1 │ Soumettre   │
             ▼            ▼             (propriétaire)
      ┌────────────┐ ┌─────────┐
      │  ANNULÉE   │ │ SOUMISE │
      │ (terminal) │ └────┬────┘
      └────────────┘   T3 │ Prise en charge (Juriste/Admin)
                          ▼
       T4 Complément ┌───────────┐        T5 Dossier complété
       ┌─────────────│  EN COURS │◀───────────────────────┐
       │             │           │                        │
       ▼             └─────┬─────┘                        │
┌──────────────────┐   T6  │  T7                    ┌──────────────────┐
│ COMPLÉMENT       │──────┤  ├──────────            │ (retour En cours)│
│ DEMANDÉ          │ T5    │  │                      └──────────────────┘
└──────────────────┘  Valider  Rejeter
                          │       │
                          ▼       ▼
                    ┌──────────┐ ┌──────────┐
                    │ VALIDÉE  │ │ REJETÉE  │
                    │(terminal)│ │(terminal)│
                    └──────────┘ └──────────┘

  T8 (hors machine) : modification du thème, possible uniquement en statut "En cours".
```

---

## 3. Fiches de transition

### T1 · Brouillon → Soumise (« Soumettre »)

| Attribut | Valeur |
|---|---|
| Endpoint | `POST /api/demandes/:id/soumettre` |
| Rôles autorisés | DEMANDEUR (propriétaire uniquement) |
| Pré-conditions | `statut = 'Brouillon'` ET `demandeur_id = req.user.id` |
| Validations métier | titre, thème, description, sensibilité non vides |
| Effets sur `demande_avis` | `statut='Soumise'`, `date_soumission=NOW()` |
| Historique | ancien=`'Brouillon'`, nouveau=`'Soumise'`, user=demandeur |
| Notification(s) | Destinataires = **tous les JURISTE + ADMIN** — « Nouvelle demande #N soumise par {prénom nom} » |
| Erreurs | 400 (champs manquants) · 403 (pas le propriétaire) · 404 · 409 (statut ≠ Brouillon) |
| Réf. | EF04 · [ECRANS.md](ECRANS.md) écran Nouvelle/Détail |

### T2 · Brouillon → Annulée (« Annuler »)

| Attribut | Valeur |
|---|---|
| Endpoint | `POST /api/demandes/:id/annuler` |
| Rôles autorisés | DEMANDEUR (propriétaire uniquement) |
| Pré-conditions | `statut = 'Brouillon'` ET `demandeur_id = req.user.id` |
| Validations métier | aucune |
| Effets sur `demande_avis` | `statut='Annulée'` |
| Historique | ancien=`'Brouillon'`, nouveau=`'Annulée'`, user=demandeur |
| Notification(s) | aucune |
| Erreurs | 403 · 404 · 409 |
| Réf. | EF24 |

### T3 · Soumise → En cours (« Prendre en charge »)

| Attribut | Valeur |
|---|---|
| Endpoint | `POST /api/demandes/:id/prendre-en-charge` |
| Rôles autorisés | JURISTE, ADMIN |
| Pré-conditions | `statut = 'Soumise'` |
| Validations métier | aucune |
| Effets sur `demande_avis` | `statut='En cours'`, `juriste_id=req.user.id` |
| Historique | ancien=`'Soumise'`, nouveau=`'En cours'`, user=juriste |
| Notification(s) | Destinataire = **demandeur** — « Votre demande #N est en cours de traitement » |
| Erreurs | 403 · 404 · 409 (déjà prise en charge / mauvais statut) |
| Réf. | EF10 |

### T4 · En cours → Complément demandé (« Demander un complément »)

| Attribut | Valeur |
|---|---|
| Endpoint | `POST /api/demandes/:id/complement` |
| Rôles autorisés | JURISTE, ADMIN |
| Pré-conditions | `statut = 'En cours'` |
| Validations métier | **commentaire obligatoire** (10–2000 caractères) |
| Effets sur `demande_avis` | `statut='Complément demandé'`, `commentaire_complement=<texte>` |
| Historique | ancien=`'En cours'`, nouveau=`'Complément demandé'`, commentaire=`<texte>`, user=juriste |
| Notification(s) | Destinataire = **demandeur** — « Complément requis sur votre demande #N » |
| Erreurs | 400 (commentaire manquant) · 403 · 404 · 409 |
| Réf. | EF11 |

### T5 · Complément demandé → En cours (« Compléter et resoumettre »)

| Attribut | Valeur |
|---|---|
| Endpoint | `POST /api/demandes/:id/completer` |
| Rôles autorisés | DEMANDEUR (propriétaire uniquement) |
| Pré-conditions | `statut = 'Complément demandé'` ET `demandeur_id = req.user.id` |
| Validations métier | la demande peut avoir été modifiée au préalable (PUT) ; aucune donnée requise ici |
| Effets sur `demande_avis` | `statut='En cours'` |
| Historique | ancien=`'Complément demandé'`, nouveau=`'En cours'`, user=demandeur |
| Notification(s) | Destinataire = **juriste en charge** (`juriste_id`) — « La demande #N a été complétée » |
| Erreurs | 403 · 404 · 409 |
| Réf. | EF10 |

### T6 · En cours → Validée (« Valider »)

| Attribut | Valeur |
|---|---|
| Endpoint | `POST /api/demandes/:id/valider` |
| Rôles autorisés | JURISTE, ADMIN |
| Pré-conditions | `statut = 'En cours'` |
| Validations métier | **avis juridique obligatoire** (10–5000 caractères) |
| Effets sur `demande_avis` | `statut='Validée'`, `avis_juridique=<texte>`, `date_traitement=NOW()` |
| Historique | ancien=`'En cours'`, nouveau=`'Validée'`, user=juriste |
| Notification(s) | Destinataire = **demandeur** — « Votre demande #N a été validée » |
| Erreurs | 400 (avis manquant) · 403 · 404 · 409 |
| Réf. | EF13, EF14 |

### T7 · En cours → Rejetée (« Rejeter »)

| Attribut | Valeur |
|---|---|
| Endpoint | `POST /api/demandes/:id/rejeter` |
| Rôles autorisés | JURISTE, ADMIN |
| Pré-conditions | `statut = 'En cours'` |
| Validations métier | **motif de rejet obligatoire** (10–2000 caractères) |
| Effets sur `demande_avis` | `statut='Rejetée'`, `motif_rejet=<texte>`, `date_traitement=NOW()` |
| Historique | ancien=`'En cours'`, nouveau=`'Rejetée'`, commentaire=`<motif>`, user=juriste |
| Notification(s) | Destinataire = **demandeur** — « Votre demande #N a été rejetée » |
| Erreurs | 400 (motif manquant) · 403 · 404 · 409 |
| Réf. | EF14 |

### T8 · Modification du thème (hors machine à états)

| Attribut | Valeur |
|---|---|
| Endpoint | `PUT /api/demandes/:id/theme` |
| Rôles autorisés | JURISTE, ADMIN |
| Pré-conditions | `statut = 'En cours'` |
| Validations métier | thème valide ; le degré de sensibilité est **recalculé** automatiquement |
| Effets sur `demande_avis` | `theme=<nouveau>`, `degre_sensibilite=<recalculé>` |
| Historique | facultatif (ligne d'historique avec commentaire « Thème modifié ») |
| Notification(s) | aucune |
| Erreurs | 400 · 403 · 404 · 409 |
| Réf. | EF12 |

---

## 4. Matrice des transitions autorisées

Lecture : **ligne = statut de départ**, **colonne = statut d'arrivée**.
✔ = transition autorisée (avec son identifiant) · ✘ = interdite (→ HTTP 409).

| De ↓ / Vers → | Brouillon | Soumise | En cours | Compl. dem. | Validée | Rejetée | Annulée |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Brouillon** | ✘ | ✔ T1 | ✘ | ✘ | ✘ | ✘ | ✔ T2 |
| **Soumise** | ✘ | ✘ | ✔ T3 | ✘ | ✘ | ✘ | ✘ |
| **En cours** | ✘ | ✘ | ✘ | ✔ T4 | ✔ T6 | ✔ T7 | ✘ |
| **Complément demandé** | ✘ | ✘ | ✔ T5 | ✘ | ✘ | ✘ | ✘ |
| **Validée** | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| **Rejetée** | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| **Annulée** | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |

**Bilan** : 7 transitions autorisées sur 49 cases. Les 3 dernières lignes (états terminaux)
sont entièrement interdites → base des **tests de refus** de la Phase 4.

---

## 5. Règles transverses

### R1 — Atomicité (transaction unique)
Chaque transition exécute, dans **une seule transaction PostgreSQL** :
1. `UPDATE demande_avis` (statut + champs associés)
2. `INSERT INTO historique_statuts`
3. `INSERT INTO notifications` (0, 1 ou N destinataires)

Si une étape échoue → **ROLLBACK** total. On n'a jamais un historique orphelin ni un statut changé sans trace.

### R2 — Verrouillage terminal
Une demande en statut **Validée / Rejetée / Annulée** est en **lecture seule définitive**.
Aucune route (ni transition, ni `PUT`, ni upload/suppression de PJ) ne peut la modifier.
Toute tentative → **409 Conflict**.

### R3 — Contrôle de propriété
Les transitions **T1, T2, T5** exigent `demande.demandeur_id === req.user.id`.
Un demandeur ne peut agir que sur ses propres demandes. Sinon → **403**.

### R4 — Gestion de la concurrence
Si deux juristes tentent `prendre-en-charge` simultanément : la pré-condition `statut='Soumise'`
est vérifiée **dans la transaction**. Le premier commit fait passer le statut à `En cours` ;
le second trouve `statut='En cours'` et reçoit **409**. Aucune donnée corrompue.

### R5 — Immuabilité de l'historique
`historique_statuts` n'accepte que des **INSERT**. Aucun endpoint n'expose UPDATE ou DELETE
sur cette table. C'est la garantie de traçabilité (EF17).

### R6 — Source unique de vérité
Toute la logique de transition vit dans `server/services/workflow.js`. Les controllers
**ne modifient jamais `statut` directement** : ils appellent le service. Cela évite la
duplication de règles et garantit que les 3 écritures (R1) sont toujours faites ensemble.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 17/07/2026 | 1.0 | Création — 8 transitions, matrice 7×7, 6 règles transverses |
