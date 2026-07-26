# Note d'avancement — Phase 5 (Notifications & Tableaux de bord)

> **Projet** : Gestion des Avis Juridiques (application PERN — Natixis DAJ)
> **Phase** : P5 — Notifications & Tableaux de bord
> **Statut** : ✅ **Terminée** — tag Git `phase-5`
> **Date** : 26/07/2026
> **Auteur** : BOUKERMA Oussama (CESI Exia A2)
> **Public visé** : tout développeur rejoignant le projet

---

## 1. Objet de ce document

P5 complète les **fonctionnalités obligatoires** du projet : chaque acteur est informé
(notifications) et dispose d'une vue synthétique (tableau de bord). L'administrateur gère
les comptes. À la fin de P5, **toutes les exigences EF01→EF24 sont livrées**.

Notes précédentes : [P2 Auth](NOTE_AVANCEMENT_P2.md) · [P3 Demandes](NOTE_AVANCEMENT_P3.md) · [P4 Workflow](NOTE_AVANCEMENT_P4.md)
Planification : [`P5_PLAN_DASHBOARDS.md`](P5_PLAN_DASHBOARDS.md)

---

## 2. En une phrase

Les notifications (déjà écrites par le moteur de P4) sont maintenant **lues** via une cloche
avec badge et polling ; chaque rôle a **son** tableau de bord ; l'admin gère les utilisateurs.

---

## 3. Ce qui a été réalisé

### 3.1 Backend

| Domaine | Fichiers | Rôle |
|---|---|---|
| Notifications (lecture) | `notificationsModel.js` (+ lecture), `notificationsController.js`, `routes/notifications.js` | Liste, compteur, marquer lu |
| Statistiques | `statsModel.js`, `statsController.js`, `routes/stats.js` | Agrégations SQL par rôle |
| Utilisateurs | `usersModel.js` (étendu), `usersController.js`, `routes/users.js` | CRUD Admin |

### 3.2 Frontend

| Élément | Fichier | Rôle |
|---|---|---|
| Cloche | `components/NotificationBell.jsx` | Badge + dropdown + polling 30 s |
| Carte KPI | `components/StatCard.jsx` | Valeur + libellé, cliquable |
| Dashboard Admin | `pages/dashboards/DashboardAdmin.jsx` | 4 KPIs + 4 graphiques Chart.js |
| Dashboard Demandeur | `pages/dashboards/DashboardDemandeur.jsx` | Compteurs + dernières demandes |
| Dashboard Juriste | `pages/dashboards/DashboardJuriste.jsx` | Charge de travail + file d'attente |
| Aiguillage | `pages/Accueil.jsx` | Route vers le bon dashboard selon le rôle |
| Utilisateurs | `pages/Utilisateurs.jsx` | Liste + création/édition + activation |

---

## 4. API livrée en P5

| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| GET | `/notifications` | authentifié | 20 dernières + nombre de non-lues |
| PUT | `/notifications/:id/lue` | destinataire | Marque une notification lue |
| PUT | `/notifications/tout-lu` | authentifié | Marque toutes les non-lues lues |
| GET | `/stats/admin` | ADMIN | KPIs + répartitions + évolution |
| GET | `/stats/demandeur` | DEMANDEUR | Ses compteurs + 5 dernières |
| GET | `/stats/juriste` | JURISTE, ADMIN | Charge de travail + file d'attente |
| GET | `/users` | ADMIN | Liste paginée + filtres |
| POST | `/users` | ADMIN | Création (mot de passe haché) |
| PUT | `/users/:id` | ADMIN | Modifie nom/prénom/rôle/structure |
| PUT | `/users/:id/desactiver` | ADMIN | Active / désactive |

---

## 5. Règles à connaître

### 5.1 Isolation des notifications (en SQL)
`marquerLue(id, userId)` filtre **sur `user_id` dans la clause WHERE** : si la notification
n'appartient pas au demandeur, 0 ligne est affectée → **404**. Un utilisateur ne peut jamais
toucher la notification d'un autre.

### 5.2 Statistiques : agrégations, pas de boucles JS
Tout est calculé en SQL (`GROUP BY`, `COUNT FILTER`, `AVG`, `date_trunc`). Les taux sont
**protégés contre la division par zéro** : sans demande clôturée, `tauxValidation = 0`.

### 5.3 Utilisateurs
- **Jamais de suppression physique** (FK RESTRICT) : la désactivation remplace la suppression.
- **Email unique** : création avec un email existant → **409**.
- **Auto-protection** : un admin ne peut pas se désactiver lui-même → **400**.
- Le `password_hash` n'apparaît **jamais** dans une réponse.

### 5.4 Polling de la cloche (piège React classique)
`NotificationBell` crée **un seul** `setInterval` (30 s) par montage, **nettoyé au démontage**
(`return () => clearInterval(timer)`). Ne jamais recréer l'intervalle à chaque rendu, sous peine
d'empiler les timers.

---

## 6. Tests réalisés

**Notifications** : isolation (marquer la notif d'autrui → 404) · tout-lu → badge 0 · dropdown
fonctionnel · clic sur une notif → marquée lue **et** ouverture de la demande concernée.

**Statistiques** : rôles (demandeur/juriste sur `/stats/admin` → 403) · exactitude vérifiée sur
le seed (15 demandes, délai moyen 3,1 j, validation 75 %, rejet 25 %) · pas de division par zéro.

**Utilisateurs** : non-admin → 403 · email dupliqué → 409 · pas de hash exposé · auto-désactivation
→ 400 · cycle complet créer → login → désactiver → login refusé → réactiver → login OK.

**Navigateur** : dashboard Admin (4 graphiques Chart.js rendus, **0 erreur console**),
Demandeur, Juriste ; cloche (badge, dropdown, navigation) ; page Utilisateurs (6 comptes).

---

## 7. Comment tester rapidement

```bash
npm run db:reset
npm run dev
```

1. **Admin** (`admin@natixis.dz` / `Demo2026!`) : accueil = tableau de bord avec KPIs + 4 graphiques ;
   menu **Utilisateurs** = gestion des comptes.
2. **Juriste** (`juriste1@natixis.dz`) : accueil = charge de travail + file d'attente à traiter.
3. **Demandeur** (`demandeur1@natixis.dz`) : accueil = compteurs + dernières demandes ; la **cloche**
   affiche un badge — cliquer une notification l'ouvre et la marque lue.

---

## 8. État du projet à la fin de P5

**Toutes les fonctionnalités obligatoires (EF01→EF24) sont livrées et testées** :
authentification, gestion des demandes, pièces jointes, workflow complet, traçabilité,
notifications, tableaux de bord, gestion des utilisateurs.

Ce qui reste (Phase 6) relève de la **consolidation et des options** : tests transverses,
responsive, jeu de démo final, documentation, puis les fonctionnalités optionnelles
(dark mode, export CSV/PDF, fil de commentaires…).

---

## 9. Prochaine étape — Phase 6

**Finitions & Optionnelles** : campagne de tests bout en bout tous rôles, polissage responsive,
préparation de la démo, et intégration des optionnelles par ordre de valeur/effort.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 26/07/2026 | 1.0 | Rédaction de la note d'avancement P5 |
