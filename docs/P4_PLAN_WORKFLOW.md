# Phase 4 – Plan détaillé du Workflow & de la Traçabilité

> **Durée** : 7 jours (J1 → J7, Semaine 4)
> **Objectif** : le cycle de vie complet d'une demande fonctionne, **chaque transition est
> contrôlée, atomique et historisée**, et aucune transition interdite n'est possible.
> **⚠️ C'est la phase la plus critique du projet** : c'est ici que se joue l'intégrité des données.
> **Références amont** : [`WORKFLOW.md`](WORKFLOW.md) (spécification des 8 transitions),
> [`API.md`](API.md) §4, [`ECRANS.md`](ECRANS.md) §3, [`DATABASE.md`](DATABASE.md) `historique_statuts`

---

## Sommaire

1. [Périmètre & résultat attendu](#1-périmètre--résultat-attendu)
2. [Découpage des 7 jours](#2-découpage-des-7-jours)
3. [J1 – Le moteur de transitions](#3-j1--le-moteur-de-transitions)
4. [J2 – Les transitions du demandeur (T1, T2, T5)](#4-j2--les-transitions-du-demandeur)
5. [J3 – Les transitions du juriste (T3, T4, T6, T7, T8)](#5-j3--les-transitions-du-juriste)
6. [J4 – Historique & verrouillage terminal](#6-j4--historique--verrouillage-terminal)
7. [J5 – Frontend : actions contextuelles](#7-j5--frontend--actions-contextuelles)
8. [J6 – Frontend : journal d'activité & parcours demandeur](#8-j6--frontend--journal-dactivité--parcours-demandeur)
9. [J7 – Tests de refus & clôture](#9-j7--tests-de-refus--clôture)
10. [Checklist globale de sortie P4](#10-checklist-globale-de-sortie-p4)

---

## 1. Périmètre & résultat attendu

### Ce que P4 contient

| Inclus | Exclu (→ phase) |
|---|---|
| Moteur de transitions centralisé (T1→T8) | Affichage des notifications, cloche (**P5**) |
| Historique immuable de chaque transition | Tableaux de bord, KPIs (**P5**) |
| **Écriture** des notifications en base | Gestion des utilisateurs (**P5**) |
| Journal d'activité (Timeline) sur le détail | Export PDF/CSV, commentaires (**P6**) |
| Actions contextuelles par (rôle, statut) | |
| Verrouillage définitif des statuts terminaux | |

> **Notifications** : P4 les **écrit** en base (c'est un effet de bord de chaque transition,
> indissociable de la transaction). P5 construira l'**interface** pour les consulter.

### Le test de réussite de la phase

```
1. Parcours nominal   : Brouillon → Soumise → En cours → Validée
2. Parcours complément: En cours → Complément demandé → En cours → Validée
3. Parcours rejet     : En cours → Rejetée
4. Parcours annulation: Brouillon → Annulée
5. CHAQUE transition interdite testée renvoie 403 ou 409
6. Valider sans avis / rejeter sans motif / complément sans commentaire → 400
7. Chaque transition apparaît dans l'historique avec le bon acteur et le bon horodatage
8. Une demande clôturée est TOTALEMENT non modifiable
```

### Rappel de la machine à états

```
                    ┌────────────┐
             ┌──────│  BROUILLON │──────┐
        T2   │      └─────┬──────┘   T1 │ Soumettre
      Annuler│            ▼             │
             ▼      ┌─────────┐         │
      ┌────────────┐│ SOUMISE │         │
      │  ANNULÉE   │└────┬────┘         │
      │ (terminal) │  T3 │ Prise en charge (Juriste/Admin)
      └────────────┘     ▼
     T4 Complément  ┌───────────┐
   ┌────────────────│  EN COURS │
   │                │           │
   ▼    T5 complété └─────┬─────┘
┌──────────────────┐  T6  │  T7
│ COMPLÉMENT       │──────┘  │
│ DEMANDÉ          │ Valider │ Rejeter
└──────────────────┘    │    │
                        ▼    ▼
                  ┌──────────┐ ┌──────────┐
                  │ VALIDÉE  │ │ REJETÉE  │
                  │(terminal)│ │(terminal)│
                  └──────────┘ └──────────┘
```

---

## 2. Découpage des 7 jours

```
J1            J2            J3            J4            J5            J6            J7
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ MOTEUR   │  │ T1 T2 T5 │  │ T3 T4    │  │Historique│  │ Actions  │  │ Journal  │  │ Tests de │
│ de       │─▶│ Demandeur│─▶│ T6 T7 T8 │─▶│+ verrou  │─▶│contextu- │─▶│d'activité│─▶│ refus +  │
│transition│  │ (dette   │  │ Juriste  │  │ terminal │  │ elles    │  │+ parcours│  │ tag      │
│          │  │  P3 !)   │  │          │  │          │  │          │  │ demandeur│  │ phase-4  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
   BACKEND ────────────────────────────────────────────▶   FRONTEND ──────────────▶  VALIDATION
```

| Jour | Tâches | Livrable |
|---|---|---|
| J1 | `services/workflow.js` : matrice, transaction, effets de bord | Moteur testé unitairement |
| J2 | **Refactor T1 (dette P3)** + T2 (annuler) + T5 (compléter) | Transitions demandeur |
| J3 | T3 (prise en charge), T4 (complément), T6 (valider), T7 (rejeter), T8 (thème) | Transitions juriste |
| J4 | `GET /:id/historique` + verrouillage terminal global | Traçabilité complète |
| J5 | Actions contextuelles + dialogs de confirmation | Traitement depuis l'UI |
| J6 | Composant `Timeline` + interface « compléter le dossier » | Journal visible |
| J7 | Campagne de tests (dont les 42 transitions interdites) + tag | Phase clôturée |

---

## 3. J1 – Le moteur de transitions

> **Principe fondateur** : **une seule** source de vérité pour les transitions.
> Aucun controller ne modifie `statut` directement — tous passent par le service.

### 3.1 Structure de la matrice

`server/services/workflow.js` :

```js
const TRANSITIONS = {
  'Brouillon':            { 'Soumise':            { roles: ['DEMANDEUR'], proprietaire: true },
                            'Annulée':            { roles: ['DEMANDEUR'], proprietaire: true } },
  'Soumise':              { 'En cours':           { roles: ['JURISTE','ADMIN'] } },
  'En cours':             { 'Complément demandé': { roles: ['JURISTE','ADMIN'], requis: 'commentaire' },
                            'Validée':            { roles: ['JURISTE','ADMIN'], requis: 'avis_juridique' },
                            'Rejetée':            { roles: ['JURISTE','ADMIN'], requis: 'motif_rejet' } },
  'Complément demandé':   { 'En cours':           { roles: ['DEMANDEUR'], proprietaire: true } },
  // États terminaux : aucune sortie
  'Validée': {}, 'Rejetée': {}, 'Annulée': {}
};
```

### 3.2 La fonction unique `executerTransition`

Signature : `executerTransition(demandeId, nouveauStatut, user, donnees)`

**Séquence de contrôle (dans cet ordre)** :

| # | Contrôle | Erreur si échec |
|---|---|---|
| 1 | La demande existe | 404 `NOT_FOUND` |
| 2 | La transition `statutActuel → nouveauStatut` existe dans la matrice | **409** `INVALID_TRANSITION` |
| 3 | Le rôle de l'utilisateur est autorisé | **403** `FORBIDDEN` |
| 4 | Si `proprietaire: true`, l'utilisateur est le demandeur | **403** `FORBIDDEN` |
| 5 | Le champ `requis` est présent et valide | **400** `VALIDATION` |

> **Ordre volontaire** : on vérifie le statut (409) **avant** le rôle (403). Ainsi, un juriste qui
> tente de valider une demande déjà validée reçoit un 409 explicite, pas un 403 trompeur.

### 3.3 Atomicité — la règle R1

Les **trois écritures** se font dans **une seule transaction PostgreSQL** :

```
BEGIN
  1. UPDATE demande_avis  (statut + champs associés + dates)
  2. INSERT INTO historique_statuts  (ancien, nouveau, user, commentaire)
  3. INSERT INTO notifications  (0, 1 ou N destinataires)
COMMIT   -- ou ROLLBACK total si une étape échoue
```

**Implémentation** : obtenir un client dédié via `pool.connect()`, `BEGIN` / `COMMIT` / `ROLLBACK`
dans un `try/catch/finally`, et **toujours** libérer le client (`client.release()`).

### 3.4 Table des effets de bord

| Transition | Champs mis à jour | Destinataires de la notification |
|---|---|---|
| T1 Soumise | `date_soumission` | **tous** les JURISTE + ADMIN |
| T2 Annulée | — | aucun |
| T3 En cours | `juriste_id` = acteur | le demandeur |
| T4 Complément demandé | `commentaire_complement` | le demandeur |
| T5 En cours (retour) | — | le juriste en charge |
| T6 Validée | `avis_juridique`, `date_traitement` | le demandeur |
| T7 Rejetée | `motif_rejet`, `date_traitement` | le demandeur |

### 3.5 Fichiers à créer

```
server/
├── services/workflow.js          # matrice + executerTransition
├── models/historiqueModel.js     # INSERT + SELECT (jamais UPDATE/DELETE)
└── models/notificationsModel.js  # INSERT (l'API de lecture arrive en P5)
```

### ✅ Critères de sortie J1
- [ ] La matrice couvre les **7 transitions autorisées** et **rien d'autre**
- [ ] `executerTransition` applique les 5 contrôles dans le bon ordre
- [ ] Les 3 écritures sont dans une transaction unique (ROLLBACK vérifié en provoquant une erreur)
- [ ] Aucun controller ne touche `statut` directement

---

## 4. J2 – Les transitions du demandeur

### 4.1 ⚠️ Première tâche : rembourser la dette P3

`POST /demandes/:id/soumettre` (T1) écrit actuellement `statut='Soumise'` **en direct**,
sans historique ni notification. **À refactorer immédiatement** pour passer par
`executerTransition(id, 'Soumise', user)`.

**Vérification du remboursement** :
- [ ] Soumettre une demande crée **1 ligne** dans `historique_statuts`
- [ ] Soumettre crée **N notifications** (une par juriste/admin actif)
- [ ] Le code de `demandesController.soumettre` ne contient plus d'`UPDATE` de statut

### 4.2 T2 — Annuler un brouillon

`POST /demandes/:id/annuler` · DEMANDEUR propriétaire · statut `Brouillon` → `Annulée`.
Aucune donnée requise, aucune notification.

### 4.3 T5 — Compléter un dossier

`POST /demandes/:id/completer` · DEMANDEUR propriétaire · `Complément demandé` → `En cours`.
Notification au **juriste en charge** (`juriste_id`).

> Le demandeur peut modifier sa demande (PUT, déjà autorisé en P3 pour ce statut) **avant**
> d'appeler `completer`. La transition ne fait que rebasculer le statut.

### ✅ Critères de sortie J2
- [ ] Dette P3 remboursée (historique + notifications sur T1)
- [ ] T2 et T5 fonctionnels avec leurs effets de bord
- [ ] Un non-propriétaire sur T1/T2/T5 → 403

---

## 5. J3 – Les transitions du juriste

| Endpoint | Transition | Corps requis | Effets |
|---|---|---|---|
| `POST /:id/prendre-en-charge` | T3 | — | `juriste_id` = acteur · notifie le demandeur |
| `POST /:id/complement` | T4 | `commentaire` (10-2000) | `commentaire_complement` · notifie le demandeur |
| `POST /:id/valider` | T6 | `avis_juridique` (10-5000) | `avis_juridique`, `date_traitement` · notifie |
| `POST /:id/rejeter` | T7 | `motif_rejet` (10-2000) | `motif_rejet`, `date_traitement` · notifie |
| `PUT /:id/theme` | T8 | `theme` | `theme` + **sensibilité recalculée** · statut `En cours` uniquement |

**T8 est hors machine à états** : elle ne change pas le statut. Elle écrit tout de même une ligne
d'historique avec le commentaire « Thème modifié » (traçabilité).

### Point de vigilance — concurrence (règle R4)
Si deux juristes appellent `prendre-en-charge` simultanément : la pré-condition `statut='Soumise'`
est évaluée **à l'intérieur de la transaction**. Le premier commit passe, le second trouve
`En cours` et reçoit **409**. À vérifier explicitement en J7.

### ✅ Critères de sortie J3
- [ ] Les 5 endpoints fonctionnent avec leurs validations
- [ ] Valider sans avis / rejeter sans motif / complément sans commentaire → **400**
- [ ] Un DEMANDEUR sur l'une de ces routes → **403**
- [ ] `prendre-en-charge` sur une demande déjà prise → **409**

---

## 6. J4 – Historique & verrouillage terminal

### 6.1 `GET /demandes/:id/historique`

- **Accès** : authentifié, mêmes règles de lecture que le détail (demandeur = propriétaire).
- **Réponse** : liste chronologique `{ ancien_statut, nouveau_statut, commentaire, created_at, user: { prenom, nom, role } }`.
- **Tri** : `created_at ASC` (du plus ancien au plus récent — sens de lecture d'un journal).

### 6.2 Verrouillage terminal (règle R2)

Une demande **Validée / Rejetée / Annulée** doit être **totalement figée**. À vérifier sur
**toutes** les routes d'écriture existantes :

| Route | Comportement attendu sur statut terminal |
|---|---|
| `PUT /demandes/:id` | 409 (déjà couvert par `STATUTS_MODIFIABLES` en P3) |
| `POST /:id/piece-jointe` | 409 |
| `DELETE /:id/piece-jointe` | 409 |
| Toutes les transitions | 409 (matrice vide pour ces statuts) |
| `PUT /:id/theme` | 409 (statut `En cours` requis) |

> **Action concrète** : relire chaque route d'écriture de P3 et confirmer qu'aucune faille ne
> permet de modifier une demande clôturée. Ajouter un test dédié par route en J7.

### 6.3 Immuabilité de l'historique (règle R5)
Aucune route n'expose `UPDATE` ni `DELETE` sur `historique_statuts`. Le modèle ne doit
**contenir que** des fonctions `INSERT` et `SELECT`.

### ✅ Critères de sortie J4
- [ ] L'historique d'une demande validée montre ses 3 transitions dans l'ordre
- [ ] Un demandeur ne peut pas lire l'historique d'une demande d'autrui → 403
- [ ] Les 5 routes d'écriture renvoient 409 sur une demande clôturée
- [ ] `historiqueModel` n'expose aucun UPDATE/DELETE

---

## 7. J5 – Frontend : actions contextuelles

### 7.1 Le tableau qui pilote l'affichage

Reprendre **exactement** le tableau de [`ECRANS.md` §3](ECRANS.md) :

| Statut ↓ / Rôle → | DEMANDEUR (propriétaire) | JURISTE / ADMIN |
|---|---|---|
| **Brouillon** | Modifier · Soumettre · Annuler | *(demande invisible)* |
| **Soumise** | *(lecture seule)* | Prendre en charge |
| **En cours** | *(lecture seule)* | Complément · Modifier thème · Valider · Rejeter |
| **Complément demandé** | Modifier · Compléter | *(lecture seule)* |
| **Validée / Rejetée / Annulée** | *(lecture seule)* | *(lecture seule)* |

> **Rappel de principe** : ce tableau ne fait que **masquer des boutons**. L'autorisation réelle
> est celle du serveur. Ne jamais considérer l'UI comme une protection.

### 7.2 Composant `ConfirmDialog`

`components/ConfirmDialog.jsx` — modale réutilisable :
- Props : `titre`, `message`, `champTexte` (label + obligatoire ?), `onConfirm`, `onCancel`.
- Utilisée par : **Valider** (zone avis), **Rejeter** (zone motif), **Complément** (zone commentaire).
- Validation client : champ requis non vide et ≥ 10 caractères avant d'activer le bouton.
- Gestion d'erreur : si le serveur refuse, afficher le message **dans la modale** sans la fermer
  (l'utilisateur ne perd pas son texte).

### 7.3 Intégration dans `DemandeDetail.jsx`
Remplacer le bloc « emplacement réservé Phase 4 » par la zone **Actions** réelle.
Après chaque action réussie : recharger la demande **et** l'historique.

### ✅ Critères de sortie J5
- [ ] Les boutons affichés correspondent exactement au tableau (rôle × statut)
- [ ] Les 3 dialogs fonctionnent et refusent un champ vide
- [ ] Une erreur serveur s'affiche dans la modale sans perdre la saisie
- [ ] La page se rafraîchit après une transition réussie

---

## 8. J6 – Frontend : journal d'activité & parcours demandeur

### 8.1 Composant `Timeline`

`components/Timeline.jsx` — journal vertical chronologique :

```
● 12/07 09:00  Soumise            par Amel Meziane (Demandeur)
│
● 12/07 10:30  En cours           par Sarah Benali (Juriste)
│
● 13/07 14:00  Complément demandé par Sarah Benali (Juriste)
│              « Merci de joindre le contrat cadre. »
│
● 14/07 08:15  En cours           par Amel Meziane (Demandeur)
```

- Chaque entrée : pastille colorée (réutiliser les couleurs de `StatutBadge`), horodatage,
  libellé de transition, acteur + rôle, et le commentaire s'il existe.
- État vide : « Aucune activité enregistrée » (cas d'un brouillon jamais soumis).

### 8.2 Interface « compléter le dossier »

Quand le statut est **Complément demandé** et que l'utilisateur est le propriétaire :
1. Le commentaire du juriste est mis en évidence (bloc orange, déjà présent depuis P3).
2. Bouton **Modifier** → formulaire d'édition (réutiliser la page de création en mode édition).
3. Bouton **Compléter et renvoyer** → appelle `POST /:id/completer`.

### 8.3 Page d'édition
`pages/ModifierDemande.jsx` (ou réutilisation de `NouvelleDemande` avec un mode `edition`) :
pré-remplit les champs, appelle `PUT /demandes/:id`, gère la pièce jointe (ajout/remplacement/suppression).

### ✅ Critères de sortie J6
- [ ] La Timeline affiche l'historique complet avec acteurs et commentaires
- [ ] Le parcours complément est réalisable **entièrement depuis l'UI**
- [ ] La modification d'une demande fonctionne (contenu + pièce jointe)

---

## 9. J7 – Tests de refus & clôture

### 9.1 Les 4 parcours nominaux (navigateur, bout en bout)

| # | Parcours | Étapes |
|---|---|---|
| P1 | **Nominal** | Demandeur crée → soumet · Juriste prend en charge → valide |
| P2 | **Complément** | … → Juriste demande complément · Demandeur modifie → complète · Juriste valide |
| P3 | **Rejet** | … → Juriste rejette avec motif |
| P4 | **Annulation** | Demandeur crée un brouillon → annule |

Pour chacun : vérifier le statut final, l'historique complet, et les notifications créées en base.

### 9.2 Tests de refus — **le cœur de la validation**

**Transitions interdites** (échantillon représentatif des 42 cases ✘ de la matrice) :

| # | Tentative | Attendu |
|---|---|---|
| R1 | Soumise → Validée (saut d'étape) | 409 |
| R2 | Brouillon → En cours | 409 |
| R3 | Validée → En cours (rouvrir) | 409 |
| R4 | Rejetée → Validée | 409 |
| R5 | Annulée → Soumise | 409 |
| R6 | Complément demandé → Validée | 409 |
| R7 | Soumise → Soumise (double soumission) | 409 |

**Refus de rôle** :

| # | Tentative | Attendu |
|---|---|---|
| R8 | Demandeur valide sa propre demande | 403 |
| R9 | Demandeur prend en charge | 403 |
| R10 | Juriste soumet la demande d'un autre | 403 |
| R11 | Demandeur B annule le brouillon de A | 403 |

**Validations de données** :

| # | Tentative | Attendu |
|---|---|---|
| R12 | Valider sans `avis_juridique` | 400 |
| R13 | Rejeter sans `motif_rejet` | 400 |
| R14 | Complément sans `commentaire` | 400 |
| R15 | Commentaire de 3 caractères | 400 |

**Verrouillage terminal** :

| # | Tentative sur une demande Validée | Attendu |
|---|---|---|
| R16 | `PUT /demandes/:id` | 409 |
| R17 | Ajouter une pièce jointe | 409 |
| R18 | Supprimer la pièce jointe | 409 |
| R19 | Modifier le thème | 409 |

**Atomicité & concurrence** :

| # | Test | Attendu |
|---|---|---|
| R20 | Deux `prendre-en-charge` simultanés | 1 succès, 1 × 409 · **un seul** `juriste_id` |
| R21 | Provoquer une erreur en cours de transaction | ROLLBACK : **aucune** écriture partielle |

### 9.3 Vérifications d'intégrité en base

```sql
-- Aucune demande clôturée sans date de traitement
SELECT COUNT(*) FROM demande_avis
 WHERE statut IN ('Validée','Rejetée') AND date_traitement IS NULL;   -- attendu 0

-- Aucune demande En cours sans juriste assigné
SELECT COUNT(*) FROM demande_avis
 WHERE statut = 'En cours' AND juriste_id IS NULL;                     -- attendu 0

-- Cohérence : dernier statut de l'historique = statut courant
SELECT d.id FROM demande_avis d
  JOIN LATERAL (SELECT nouveau_statut FROM historique_statuts h
                 WHERE h.demande_id = d.id ORDER BY created_at DESC LIMIT 1) dernier ON TRUE
 WHERE d.statut <> dernier.nouveau_statut AND d.statut <> 'Brouillon'; -- attendu 0 ligne
```

### 9.4 Clôture
- [ ] Restaurer le jeu de démo (`npm run db:reset` avec `ON_ERROR_STOP=1`, vérifier le code retour)
- [ ] Nettoyer `server/uploads/` des fichiers de test
- [ ] Aucun `console.log` de debug
- [ ] Note d'avancement `NOTE_AVANCEMENT_P4.md`
- [ ] Bilan dans [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md) — **confirmer le remboursement de la dette P3**
- [ ] Commit + push + tag `phase-4`

---

## 10. Checklist globale de sortie P4

### Moteur
- [ ] `services/workflow.js` : source **unique** des transitions
- [ ] 5 contrôles dans l'ordre (existence → statut → rôle → propriété → données)
- [ ] 3 écritures en **une transaction** · ROLLBACK vérifié
- [ ] Aucun controller ne modifie `statut` directement

### Endpoints
- [ ] T1 soumettre (**dette P3 remboursée**) · T2 annuler · T5 compléter
- [ ] T3 prendre-en-charge · T4 complément · T6 valider · T7 rejeter · T8 thème
- [ ] `GET /:id/historique`

### Frontend
- [ ] Actions contextuelles conformes au tableau (rôle × statut)
- [ ] `ConfirmDialog` (valider / rejeter / complément)
- [ ] `Timeline` du journal d'activité
- [ ] Parcours complément réalisable depuis l'UI · page de modification

### Tests
- [ ] 4 parcours nominaux (P1-P4)
- [ ] **21 tests de refus** (R1-R21) tous verts
- [ ] 3 requêtes d'intégrité en base à 0

### Décision de passage en P5
> P5 (Notifications & Tableaux de bord) démarre quand toutes les cases sont vertes.
> Les notifications sont **déjà écrites** en base par le moteur : P5 construira l'API de lecture,
> la cloche, et les tableaux de bord qui s'appuient sur l'historique produit ici.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 21/07/2026 | 1.0 | Création du plan détaillé de la Phase 4 |
