# Phase 5 – Plan détaillé des Notifications & Tableaux de bord

> **Durée** : 7 jours (J1 → J7, Semaine 5)
> **Objectif** : chaque acteur est informé de ce qui le concerne (notifications) et dispose
> d'une vue synthétique adaptée à son rôle (tableaux de bord). L'administrateur peut gérer
> les comptes utilisateurs.
> **Références amont** : [`API.md`](API.md) §7/§8/§9, [`ECRANS.md`](ECRANS.md) §2.2/2.7,
> [`DATABASE.md`](DATABASE.md) `notifications`, [`WORKFLOW.md`](WORKFLOW.md) (source des notifications)

---

## Sommaire

1. [Périmètre & résultat attendu](#1-périmètre--résultat-attendu)
2. [Découpage des 7 jours](#2-découpage-des-7-jours)
3. [J1 – Backend : notifications](#3-j1--backend--notifications)
4. [J2 – Backend : statistiques & KPIs](#4-j2--backend--statistiques--kpis)
5. [J3 – Backend : gestion des utilisateurs](#5-j3--backend--gestion-des-utilisateurs)
6. [J4 – Frontend : cloche de notifications](#6-j4--frontend--cloche-de-notifications)
7. [J5 – Frontend : tableau de bord Administrateur](#7-j5--frontend--tableau-de-bord-administrateur)
8. [J6 – Frontend : dashboards Demandeur & Juriste + gestion des utilisateurs](#8-j6--frontend--dashboards-demandeur--juriste--gestion-des-utilisateurs)
9. [J7 – Tests & clôture](#9-j7--tests--clôture)
10. [Checklist globale de sortie P5](#10-checklist-globale-de-sortie-p5)

---

## 1. Périmètre & résultat attendu

### Ce que P5 contient

| Inclus | Exclu (→ phase) |
|---|---|
| API de lecture des notifications + cloche | Export PDF/CSV (**P6**) |
| Tableau de bord Admin (4 graphiques + KPIs) | Commentaires, mentions (**P6**) |
| Dashboard Demandeur (ses compteurs) | Dark mode, QR code (**P6**) |
| Dashboard Juriste (sa charge de travail) | |
| Gestion des utilisateurs (CRUD Admin) | |

> **Rappel P4** : les notifications sont **déjà écrites** en base par le moteur de transitions.
> P5 ne fait que construire la **lecture** (API + cloche). On ne touche pas à l'écriture.

### Le test de réussite de la phase

```
1. Après une transition, le destinataire voit le compteur de la cloche augmenter
2. Cliquer une notification la marque "lue" et ouvre la demande concernée
3. L'Admin voit 4 graphiques + les KPIs (délai moyen, taux validation/rejet)
4. Le Demandeur voit ses compteurs par statut ; le Juriste sa charge de travail
5. L'Admin crée un compte -> la personne peut se connecter
6. Un compte désactivé ne peut plus se connecter
7. Chaque rôle voit SON dashboard et uniquement le sien
```

### Nouvelle dépendance

Frontend : **`chart.js`** + **`react-chartjs-2`** (graphiques du dashboard Admin).
Backend : aucune nouvelle dépendance (agrégations SQL natives).

---

## 2. Découpage des 7 jours

```
J1            J2            J3            J4            J5            J6            J7
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Notif.   │  │ Stats +  │  │ Users    │  │ Cloche   │  │ Dashboard│  │ Dashboards│ │ Tests +  │
│ API      │─▶│ KPIs     │─▶│ CRUD     │─▶│ (polling)│─▶│ Admin    │─▶│ Dem./Jur.│─▶│ tag      │
│ lecture  │  │ (SQL agg)│  │ (Admin)  │  │          │  │ (Chart.js)│ │ + Users  │  │ phase-5  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
   BACKEND ────────────────────────────────────────────▶  FRONTEND ──────────────▶  VALIDATION
```

| Jour | Tâches | Livrable |
|---|---|---|
| J1 | `GET /notifications`, `PUT /:id/lue`, `PUT /tout-lu` | API notifications |
| J2 | `GET /stats/admin`, `GET /stats/demandeur`, `GET /stats/juriste` | KPIs testés |
| J3 | `GET/POST/PUT /users`, `PUT /users/:id/desactiver` | CRUD utilisateurs |
| J4 | `NotificationBell` (compteur + dropdown + polling 30 s) | Cloche fonctionnelle |
| J5 | Dashboard Admin (4 graphiques Chart.js + cartes KPIs) | Tableau de bord Admin |
| J6 | Dashboards Demandeur & Juriste + page Gestion des utilisateurs | Vues par rôle |
| J7 | Tests (isolation, exactitude KPIs, désactivation) + tag | Phase clôturée |

---

## 3. J1 – Backend : notifications

### 3.1 Compléter le modèle

`models/notificationsModel.js` (déjà créé en P4 pour l'écriture) reçoit ses fonctions de **lecture** :

| Fonction | Requête |
|---|---|
| `listerParUser(userId, limite)` | notifications du user, plus récentes d'abord |
| `compterNonLues(userId)` | `COUNT(*) WHERE user_id=$1 AND lue=FALSE` |
| `marquerLue(id, userId)` | `UPDATE ... SET lue=TRUE WHERE id=$1 AND user_id=$2` |
| `marquerToutLu(userId)` | `UPDATE ... SET lue=TRUE WHERE user_id=$1 AND lue=FALSE` |

> **Contrôle de propriété en SQL** : `marquerLue` filtre **sur `user_id`** dans la clause WHERE.
> Ainsi un utilisateur ne peut pas marquer lue la notification d'un autre (0 ligne affectée → 404).

### 3.2 Les endpoints

| Endpoint | Réponse |
|---|---|
| `GET /api/notifications` | `{ items: [...20 dernières], nonLues: <int> }` |
| `PUT /api/notifications/:id/lue` | 200 · 404 si la notif n'appartient pas au user |
| `PUT /api/notifications/tout-lu` | 200 + nombre marqué |

Chaque notification renvoyée inclut `demande_id` pour permettre la navigation au clic.

### 3.3 Fichiers
```
server/
├── controllers/notificationsController.js
└── routes/notifications.js          # monté sur /api/notifications
```
Montage dans `server.js` : `app.use('/api/notifications', require('./routes/notifications'));`

### ✅ Critères de sortie J1
- [ ] `GET /notifications` renvoie les notifs du user + le compte de non-lues
- [ ] `PUT /:id/lue` sur la notif d'un autre → 404 (aucune fuite)
- [ ] `PUT /tout-lu` remet toutes les non-lues du user à lues
- [ ] Aucune notification d'autrui n'est jamais visible

---

## 4. J2 – Backend : statistiques & KPIs

### 4.1 Dashboard Admin — `GET /api/stats/admin`

Toutes les données en **agrégations SQL** (pas de calcul en JS sur des listes) :

| Donnée | Calcul |
|---|---|
| `parStatut` | `GROUP BY statut` |
| `parTheme` | `GROUP BY theme` |
| `parSensibilite` | `GROUP BY degre_sensibilite` |
| `evolutionMensuelle` | `GROUP BY date_trunc('month', date_creation)` sur 6 mois |
| `delaiMoyenJours` | `AVG(date_traitement - date_soumission)` sur les clôturées |
| `tauxValidation` | `Validée / (Validée + Rejetée)` |
| `tauxRejet` | `Rejetée / (Validée + Rejetée)` |
| `enRetard` | soumises/en cours depuis > N jours et non clôturées |
| `totalDemandes` | `COUNT(*)` |

> **Garde-fou** : protéger les divisions (si aucune demande clôturée, `tauxValidation = 0`,
> pas une division par zéro).

### 4.2 Dashboard Demandeur — `GET /api/stats/demandeur`

Restreint à **ses** demandes (`WHERE demandeur_id = req.user.id`) :
`parStatut`, `total`, et `recentes` (5 dernières).

### 4.3 Dashboard Juriste — `GET /api/stats/juriste`

Vue « charge de travail » :
- `aTraiter` : nombre de demandes **Soumise** (en attente de prise en charge, non nominatif)
- `mesEnCours` : demandes **En cours** dont `juriste_id = req.user.id`
- `mesTraitees` : Validée/Rejetée par ce juriste
- `recentesATraiter` : liste des soumises les plus anciennes (à traiter en priorité)

### 4.4 Fichiers
```
server/
├── models/statsModel.js
├── controllers/statsController.js
└── routes/stats.js
```

### ✅ Critères de sortie J2
- [ ] Chaque bloc de `stats/admin` correspond au jeu de démo (vérification manuelle)
- [ ] Les taux ne provoquent jamais de division par zéro
- [ ] `stats/demandeur` ne compte que ses demandes
- [ ] `stats/juriste` distingue « à traiter » (global) et « mes dossiers » (nominatif)
- [ ] Rôle vérifié : un demandeur sur `/stats/admin` → 403

---

## 5. J3 – Backend : gestion des utilisateurs

### 5.1 Endpoints (tous réservés ADMIN)

| Endpoint | Description |
|---|---|
| `GET /api/users` | Liste paginée + filtres `role`, `actif` — **sans `password_hash`** |
| `POST /api/users` | Création : `{ nom, prenom, email, password, role, structure? }` — mot de passe haché (bcrypt 12) |
| `PUT /api/users/:id` | Modifie `nom`, `prenom`, `role`, `structure` |
| `PUT /api/users/:id/desactiver` | `{ actif: boolean }` — bascule activer/désactiver |

### 5.2 Règles

- **Jamais de suppression physique** (intégrité des FK : un user est référencé par des demandes,
  de l'historique, des notifications). La désactivation remplace la suppression.
- **Email unique** : à la création, si l'email existe déjà → **409**.
- **Auto-protection** : un admin ne peut pas se désactiver lui-même (éviter de se verrouiller dehors) → **400**.
- Le `password_hash` n'apparaît **jamais** dans une réponse.
- Réutiliser `usersModel` (P2) en l'étendant plutôt que de dupliquer.

### 5.3 Fichiers
```
server/
├── controllers/usersController.js
└── routes/users.js
```
(le modèle `usersModel.js` de P2 est complété : `list`, `create`, `update`, `setActif`)

### ✅ Critères de sortie J3
- [ ] CRUD complet fonctionnel, réservé ADMIN (JURISTE/DEMANDEUR → 403)
- [ ] Email dupliqué → 409
- [ ] Un admin ne peut pas se désactiver → 400
- [ ] Aucune réponse ne contient `password_hash`
- [ ] Un compte fraîchement créé peut se connecter ; désactivé, il ne peut plus (lien avec P2)

---

## 6. J4 – Frontend : cloche de notifications

`components/NotificationBell.jsx` — placée dans la `Navbar` (emplacement réservé depuis P2) :

| Aspect | Comportement |
|---|---|
| Icône | Cloche avec **badge** du nombre de non-lues (masqué si 0) |
| Rafraîchissement | **Polling toutes les 30 s** (`setInterval`, nettoyé au démontage) |
| Clic sur la cloche | Ouvre un **dropdown** des 20 dernières notifications |
| Clic sur une notification | `PUT /:id/lue` puis navigation vers `/demandes/:demande_id` |
| « Tout marquer comme lu » | `PUT /tout-lu` + rafraîchissement |
| Notification lue / non lue | Distinction visuelle (fond, pastille) |
| État vide | « Aucune notification » |

> **Sobriété du polling** : un seul `setInterval` par montage, nettoyé dans le `return` du
> `useEffect`. Ne pas empiler les intervalles à chaque rendu.

### ✅ Critères de sortie J4
- [ ] Le badge affiche le bon nombre de non-lues
- [ ] Après une transition (autre onglet/rôle), le compteur se met à jour dans les 30 s
- [ ] Cliquer une notif la marque lue et ouvre la bonne demande
- [ ] « Tout marquer comme lu » remet le badge à 0
- [ ] Pas de fuite d'intervalle (vérifié : un seul timer actif)

---

## 7. J5 – Frontend : tableau de bord Administrateur

### 7.1 Installer Chart.js
```bash
cd client && npm install chart.js react-chartjs-2
```

### 7.2 Page Accueil pour l'ADMIN (remplace le placeholder de `Accueil.jsx`)

| Zone | Contenu |
|---|---|
| **Bandeau KPIs** | 4 cartes `StatCard` : Total · Délai moyen (jours) · % Validées · En retard |
| **Graphique 1** | Donut — répartition par statut |
| **Graphique 2** | Barres — nombre par thème |
| **Graphique 3** | Donut — répartition par sensibilité |
| **Graphique 4** | Courbe — évolution mensuelle des demandes |

- Composant `StatCard` (déjà prévu, à créer ici) : titre, valeur, icône.
- Couleurs des graphiques **cohérentes** avec `StatutBadge` (même palette de statuts).
- États : chargement (skeleton), données vides (message clair par graphique).

### 7.3 Structure
`Accueil.jsx` bascule sur un composant par rôle : `<DashboardAdmin/>`, `<DashboardJuriste/>`,
`<DashboardDemandeur/>` (créés en J5/J6). Garde le code lisible plutôt qu'un gros `if`.

### ✅ Critères de sortie J5
- [ ] Les 4 KPIs affichent des valeurs cohérentes avec la base
- [ ] Les 4 graphiques se rendent sans erreur console
- [ ] Un demandeur/juriste n'accède jamais à ce dashboard (routage + 403 API)
- [ ] Responsive : les graphiques se réorganisent sur mobile

---

## 8. J6 – Frontend : dashboards Demandeur & Juriste + gestion des utilisateurs

### 8.1 Dashboard Demandeur (`DashboardDemandeur.jsx`)
```
┌──────────────────────────────────────────────┐
│ Bonjour {prénom}            [+ Nouvelle demande]│
├──────────────────────────────────────────────│
│ [Brouillon n][Soumise n][En cours n][Clôt. n]  │  ← StatCards cliquables (→ liste filtrée)
├──────────────────────────────────────────────│
│ Mes 5 dernières demandes (table condensée)     │
└──────────────────────────────────────────────┘
```
Données : `GET /stats/demandeur`. Les cartes de compteur mènent vers `/demandes?statut=…`.

### 8.2 Dashboard Juriste (`DashboardJuriste.jsx`)
```
┌──────────────────────────────────────────────┐
│ [À traiter n][Mes dossiers en cours n][Traités n]│
├──────────────────────────────────────────────│
│ File d'attente : demandes soumises (plus         │
│ anciennes en premier) → clic = prise en charge   │
└──────────────────────────────────────────────┘
```
Données : `GET /stats/juriste`.

### 8.3 Page Gestion des utilisateurs (`Utilisateurs.jsx`, remplace le placeholder)
```
┌──────────────────────────────────────────────┐
│ Utilisateurs              [+ Nouvel utilisateur]│
│ Filtres: [Rôle▼][Actif▼]                        │
├────┬──────────────┬──────────┬────────┬────────│
│ Nom│ Email        │ Rôle     │ Actif  │ Actions │
├────┼──────────────┼──────────┼────────┼────────│
│ …  │              │[JURISTE] │  ✔     │[✎][⊘]  │
└──────────────────────────────────────────────┘
```
- **Dialog** de création/édition (réutiliser un pattern proche de `ConfirmDialog`).
- Bascule d'activation via un `Switch` ou bouton.
- Gestion d'erreur : email déjà pris (409) affiché **dans le dialog**.

### ✅ Critères de sortie J6
- [ ] Dashboard Demandeur : compteurs justes, cartes cliquables → liste filtrée
- [ ] Dashboard Juriste : file d'attente triée, prise en charge accessible
- [ ] CRUD utilisateurs complet depuis l'UI
- [ ] Création → connexion possible ; désactivation → connexion refusée

---

## 9. J7 – Tests & clôture

### 9.1 Notifications

| # | Test | Attendu |
|---|---|---|
| N1 | Transition → notification chez le bon destinataire | badge +1 |
| N2 | Marquer une notif d'autrui lue (API directe) | 404 |
| N3 | Clic notif → demande ouverte + notif lue | ✔ |
| N4 | « Tout marquer comme lu » | badge = 0 |

### 9.2 Statistiques (exactitude)

| # | Test | Méthode |
|---|---|---|
| S1 | `parStatut` = répartition réelle | comparer à `GROUP BY` manuel |
| S2 | `tauxValidation` correct | vérif. arithmétique sur le seed |
| S3 | Aucune demande clôturée → pas de division par zéro | vider les clôturées, appeler l'API |
| S4 | `stats/demandeur` ne fuit pas les demandes d'autrui | comparer deux demandeurs |
| S5 | Demandeur/Juriste sur `/stats/admin` | 403 |

### 9.3 Utilisateurs

| # | Test | Attendu |
|---|---|---|
| U1 | Non-admin sur `/users` | 403 |
| U2 | Créer avec email existant | 409 |
| U3 | Créer un compte → login | 200 |
| U4 | Désactiver → login | 401 (lien P2) |
| U5 | Admin se désactive lui-même | 400 |
| U6 | Réponses sans `password_hash` | ✔ |

### 9.4 Isolation des dashboards (navigateur)
Se connecter successivement en admin / juriste / demandeur : chacun voit **son** dashboard,
la cloche fonctionne pour chacun.

### 9.5 Clôture
- [ ] Restaurer le jeu de démo (`db:reset` avec `ON_ERROR_STOP=1`, vérifier le code retour)
- [ ] Nettoyer `server/uploads/`
- [ ] Aucun `console.log` de debug ; pas de fuite d'intervalle de polling
- [ ] Note d'avancement `NOTE_AVANCEMENT_P5.md`
- [ ] Bilan dans [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md)
- [ ] Commit + push + tag `phase-5`

---

## 10. Checklist globale de sortie P5

### Backend
- [ ] Notifications : liste + compteur + marquer lue (propriété contrôlée en SQL)
- [ ] Stats : admin (agrégations + KPIs sans division par zéro), demandeur, juriste
- [ ] Users : CRUD Admin, désactivation (jamais de suppression), email unique, auto-protection
- [ ] Tous les nouveaux endpoints derrière `auth` (+ `roles` selon le cas)

### Frontend
- [ ] `NotificationBell` (badge + dropdown + polling propre)
- [ ] Dashboard Admin (KPIs + 4 graphiques Chart.js)
- [ ] Dashboards Demandeur & Juriste
- [ ] Page Gestion des utilisateurs (CRUD + dialogs)
- [ ] `Accueil.jsx` route vers le bon dashboard selon le rôle

### Tests
- [ ] Notifications N1-N4 · Stats S1-S5 · Users U1-U6
- [ ] Isolation des dashboards par rôle (navigateur)

### Décision de passage en P6
> P6 (Finitions & Optionnelles) démarre quand toutes les cases sont vertes.
> À ce stade, **toutes les fonctionnalités obligatoires (EF01→EF24) sont livrées** : P6 se
> concentre sur la consolidation, le responsive, la démo, et les optionnelles (dark mode,
> export CSV/PDF, commentaires…).

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 21/07/2026 | 1.0 | Création du plan détaillé de la Phase 5 |
