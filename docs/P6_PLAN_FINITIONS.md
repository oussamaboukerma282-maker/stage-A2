# Phase 6 – Plan détaillé des Finitions, Optionnelles & Livraison

> **Durée** : 7 jours (J1 → J7, Semaine 6)
> **Objectif** : livrer une application **démontrable, robuste et documentée**. Consolider
> l'existant (le cœur passe avant tout), puis ajouter les fonctionnalités optionnelles **dans
> l'ordre valeur/effort**, et préparer la soutenance.
> **Règle directrice** : le cœur (EF01→EF24) est **déjà livré**. En cas d'arbitrage,
> on sacrifie une optionnelle, **jamais** la stabilité du cœur.
> **Références amont** : [`CDC_Avis_Juridiques_PERN_V2.docx`](../CDC_Avis_Juridiques_PERN_V2.docx) §5.2 (optionnelles),
> [`PLAN_DE_PHASES.md`](PLAN_DE_PHASES.md) §9

---

## Sommaire

1. [Périmètre & résultat attendu](#1-périmètre--résultat-attendu)
2. [Découpage des 7 jours](#2-découpage-des-7-jours)
3. [J1 – Consolidation & campagne de tests](#3-j1--consolidation--campagne-de-tests)
4. [J2 – Responsive & polissage UI](#4-j2--responsive--polissage-ui)
5. [J3 – OPT06 Dark mode + OPT05 Export CSV](#5-j3--opt06-dark-mode--opt05-export-csv)
6. [J4 – OPT01 Fil de commentaires](#6-j4--opt01-fil-de-commentaires)
7. [J5 – OPT03 Export PDF + OPT04 QR code](#7-j5--opt03-export-pdf--opt04-qr-code)
8. [J6 – Jeu de démo, documentation & README](#8-j6--jeu-de-démo-documentation--readme)
9. [J7 – Répétition de la démo & livraison](#9-j7--répétition-de-la-démo--livraison)
10. [Checklist globale de sortie P6](#10-checklist-globale-de-sortie-p6)

---

## 1. Périmètre & résultat attendu

### Deux blocs distincts

| Bloc | Contenu | Priorité |
|---|---|---|
| **Consolidation** (J1-J2, J6-J7) | Tests transverses, responsive, démo, doc | **Non négociable** |
| **Optionnelles** (J3-J5) | Dark mode, export CSV/PDF, QR code, commentaires | Selon le temps |

### Les optionnelles, par ordre valeur / effort

Ordre issu du CDC §9.2 (P3 plan) — on avance dans cet ordre, on s'arrête quand le temps manque :

| Priorité | Optionnelle | ID CDC | Effort | Dépendance |
|---|---|---|---|---|
| 1 | Mode sombre | OPT06 | 0,5 j | — |
| 2 | Export CSV (liste) | OPT05 | 0,5 j | — |
| 3 | Fil de commentaires | OPT01 | 1,5 j | table `commentaires` (déjà conçue) |
| 4 | Export PDF d'une fiche | OPT03 | 1 j | — |
| 5 | QR code dans le PDF | OPT04 | 0,5 j | OPT03 |

> **Non retenu** : OPT02 (mentions `@`) — dépend de OPT01 et coûte trop cher pour la valeur.
> À mentionner comme perspective, pas à développer.

### Le test de réussite de la phase

```
1. Les critères de sortie de P2→P5 repassent tous au vert (non-régression)
2. Chaque écran est utilisable sur mobile (375 px) sans débordement
3. Les optionnelles réalisées sont finies ET testées (pas de demi-fonctionnalité)
4. Un « clone frais » démarre en suivant uniquement le README
5. Le scénario de démo se déroule sans accroc, dans le temps imparti
```

### Nouvelles dépendances (seulement si l'optionnelle est faite)
Backend : `pdfkit` (OPT03), `qrcode` (OPT04). Frontend : aucune (dark mode = Tailwind natif).

---

## 2. Découpage des 7 jours

```
J1            J2            J3            J4            J5            J6            J7
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Consoli- │  │ Responsive│ │ Dark mode│  │ Commen-  │  │ Export   │  │ Démo +   │  │ Répét.   │
│ dation + │─▶│ + polis- │─▶│ + export │─▶│ taires   │─▶│ PDF +    │─▶│ doc +    │─▶│ démo +   │
│ tests    │  │ sage     │  │ CSV      │  │ (OPT01)  │  │ QR (OPT) │  │ README   │  │ tag final│
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
  CŒUR (obligatoire) ─────▶   OPTIONNELLES (si le temps le permet) ──▶   LIVRAISON ──────────────▶
```

| Jour | Bloc | Livrable |
|---|---|---|
| J1 | Consolidation | Tous les critères P2-P5 revérifiés |
| J2 | Consolidation | Application responsive + UI polie |
| J3 | Optionnel | Dark mode + export CSV |
| J4 | Optionnel | Fil de commentaires |
| J5 | Optionnel | Export PDF + QR code |
| J6 | Livraison | Jeu de démo + doc + README complet |
| J7 | Livraison | Démo répétée + tag `v1.0` |

---

## 3. J1 – Consolidation & campagne de tests

> **Objectif** : garantir qu'aucune régression ne s'est glissée pendant P2→P5, **avant**
> d'ajouter quoi que ce soit de nouveau.

### 3.1 Non-régression par rôle (navigateur)

Rejouer les parcours clés des phases précédentes, pour **chaque rôle** :

| Rôle | Parcours à revérifier |
|---|---|
| Demandeur | Login → créer → joindre PDF → soumettre → suivre → compléter un dossier retourné |
| Juriste | Login → file d'attente → prendre en charge → valider / rejeter / demander complément |
| Admin | Login → dashboard (graphiques) → gérer un utilisateur → tout ce que fait un juriste |

### 3.2 Re-tests de sécurité (rapides, API directe)

| # | Test | Attendu |
|---|---|---|
| 1 | Cloisonnement demandeur (voir/modifier la demande d'autrui) | 403 |
| 2 | Transition interdite (ex. valider une Soumise) | 409 |
| 3 | Rôle refusé (demandeur sur `/stats/admin`, `/users`) | 403 |
| 4 | Verrouillage terminal (modifier une demande clôturée) | 409 |
| 5 | Aucune réponse ne contient `password_hash` | ✔ |

### 3.3 Journalisation des anomalies
Noter chaque bug trouvé dans un tableau (fichier ou issue), le corriger, re-tester.
**Aucune optionnelle ne démarre tant que cette liste n'est pas vide.**

### ✅ Critères de sortie J1
- [ ] Les 3 parcours de rôle passent de bout en bout
- [ ] Les 5 re-tests de sécurité sont verts
- [ ] Zéro anomalie ouverte sur le cœur

---

## 4. J2 – Responsive & polissage UI

### 4.1 Responsive (breakpoints Tailwind)

Vérifier chaque écran à **375 px** (mobile), **768 px** (tablette), **1280 px** (desktop) :

| Écran | Points d'attention |
|---|---|
| Navbar | Menu lisible/repliable sur mobile, cloche accessible |
| Liste des demandes | Tableau scrollable horizontalement (`overflow-x-auto`), pas de débordement |
| Détail | Colonnes qui s'empilent, modales centrées |
| Formulaires | Champs pleine largeur, boutons accessibles |
| Dashboard Admin | Graphiques qui se réorganisent (grid → 1 colonne) |
| Utilisateurs | Tableau scrollable |

### 4.2 Polissage

| Élément | Action |
|---|---|
| États vides | Message clair partout (« Aucune demande », « Aucune notification ») |
| États de chargement | Spinner ou skeleton cohérent |
| Messages d'erreur | Tous en français, compréhensibles |
| Cohérence visuelle | Espacements, tailles de police, couleurs harmonisées |
| Titres de page | `<title>` et titres H1 cohérents |
| Favicon | Ajouter un favicon simple |

### ✅ Critères de sortie J2
- [ ] Aucun débordement horizontal sur mobile (375 px)
- [ ] Tous les états (vide, chargement, erreur) sont gérés
- [ ] Cohérence visuelle validée sur les écrans principaux

---

## 5. J3 – OPT06 Dark mode + OPT05 Export CSV

### 5.1 OPT06 — Mode sombre

Tailwind gère le dark mode nativement (`darkMode: 'class'` dans la config) :
1. Activer `darkMode: 'class'` dans `tailwind.config.js`.
2. Contexte `ThemeContext` : bascule clair/sombre, persistance en `localStorage`,
   application de la classe `dark` sur `<html>`.
3. Bouton de bascule dans la navbar (icône soleil/lune).
4. Passer les écrans principaux en revue et ajouter les variantes `dark:` là où c'est nécessaire
   (fonds, textes, bordures, cartes).

> **Piège** : ne pas oublier les modales, les dropdowns et les badges. Tester chaque écran
> dans les deux thèmes.

### 5.2 OPT05 — Export CSV de la liste

Backend `GET /api/demandes/export/csv` (ADMIN, ou réservé selon besoin) :
- Reprend les **mêmes filtres** que la liste (statut, thème, dates).
- Génère un CSV (en-têtes + lignes), `Content-Type: text/csv`,
  `Content-Disposition: attachment; filename="demandes.csv"`.
- **Encodage UTF-8 avec BOM** pour qu'Excel affiche correctement les accents.
- Échapper les champs contenant `;`, `"` ou retours à la ligne.

Frontend : bouton « Exporter CSV » sur la page liste (visible pour l'admin).

### ✅ Critères de sortie J3
- [ ] Bascule clair/sombre fonctionnelle et persistante
- [ ] Tous les écrans lisibles dans les deux thèmes (y compris modales)
- [ ] Export CSV : accents corrects dans Excel, filtres respectés

---

## 6. J4 – OPT01 Fil de commentaires

> La table `commentaires` a été **conçue dès la Phase 0** — il ne reste qu'à l'exploiter.

### 6.1 Backend

| Endpoint | Rôle | Description |
|---|---|---|
| `GET /api/demandes/:id/commentaires` | authentifié (droits de lecture de la demande) | Fil chronologique |
| `POST /api/demandes/:id/commentaires` | authentifié (lié à la demande) | `{ contenu }` (2-2000 car.) |

- `models/commentairesModel.js` : INSERT + SELECT (avec nom/rôle de l'auteur via jointure).
- **Contrôle d'accès** : mêmes règles que la lecture d'une demande — un demandeur ne commente
  que ses propres demandes ; un juriste/admin, celles qu'il peut voir.
- Une demande **clôturée** accepte-t-elle des commentaires ? **Décision** : non (cohérent avec
  le verrouillage terminal) → 409. À documenter.

### 6.2 Frontend

- Composant `FilCommentaires` sur la page détail (sous le journal d'activité) :
  liste des messages (auteur, rôle, date, contenu) + zone de saisie + bouton « Publier ».
- Distinction visuelle entre ses propres messages et ceux des autres.
- États : vide (« Aucun commentaire »), envoi en cours, erreur.

### ✅ Critères de sortie J4
- [ ] Publier un commentaire, le voir apparaître, rechargement OK
- [ ] Un demandeur ne peut pas commenter la demande d'un autre → 403
- [ ] Commentaire sur une demande clôturée → 409 (règle documentée)
- [ ] Fil lisible dans les deux thèmes (si dark mode fait en J3)

---

## 7. J5 – OPT03 Export PDF + OPT04 QR code

### 7.1 OPT03 — Export PDF d'une fiche

```bash
cd server && npm install pdfkit
```

`GET /api/demandes/:id/pdf` (droits de lecture de la demande) :
- Génère un PDF **structuré** de la fiche : en-tête (titre, #id, statut), informations
  (thème, sensibilité, demandeur, dates), description, avis/motif si présents,
  et le journal d'activité résumé.
- `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="demande-N.pdf"`.
- Soigner la mise en forme (police, marges, sections) — c'est un document « officiel ».

Frontend : bouton « Exporter en PDF » sur la page détail.

### 7.2 OPT04 — QR code dans le PDF

```bash
cd server && npm install qrcode
```

- Générer un QR code (via `qrcode`) pointant vers l'URL de la demande en ligne
  (`http://localhost:3000/demandes/:id`, ou une URL configurable).
- L'intégrer dans le PDF (coin supérieur ou pied de page) comme image data URI.
- Dépend d'OPT03 : ne se fait que si le PDF existe.

### ✅ Critères de sortie J5
- [ ] Le PDF généré est bien formé et complet (toutes les sections)
- [ ] Accents corrects dans le PDF
- [ ] Le QR code est présent et scannable (mène à la bonne demande)

---

## 8. J6 – Jeu de démo, documentation & README

### 8.1 Jeu de données de démonstration final

- Vérifier que `seed.sql` couvre un scénario **narratif** clair pour la soutenance :
  des demandes dans chaque statut, des historiques réalistes, des notifications, des dates
  étalées (pour que les graphiques aient du relief).
- Ajouter si besoin quelques demandes pour enrichir la démo (sans casser la cohérence).

### 8.2 Documentation

- **Mettre à jour** les docs de conception si des écarts sont apparus pendant le développement
  (API.md, ECRANS.md…). Les docs doivent refléter le code livré.
- Vérifier que chaque `NOTE_AVANCEMENT_PX.md` est à jour.
- Rédiger `NOTE_AVANCEMENT_P6.md` (optionnelles réalisées, écarts, état final).

### 8.3 README final

Le README doit permettre une **installation autonome** (« clone frais ») :
- Prérequis, installation pas à pas, `.env`, `db:reset`, `npm run dev`.
- Liste des fonctionnalités (obligatoires **et** optionnelles réalisées).
- Comptes de démo.
- Captures d'écran des écrans principaux (facultatif mais valorisant).
- Mention des technologies et de l'architecture.

### 8.4 Test « clone frais »
Sur un dossier vierge, suivre **uniquement** le README. Si l'application tourne au bout des
étapes, la documentation est validée.

### ✅ Critères de sortie J6
- [ ] Jeu de démo cohérent et narratif
- [ ] Docs de conception à jour (reflètent le code)
- [ ] README permettant un « clone frais » réussi
- [ ] `NOTE_AVANCEMENT_P6.md` rédigée

---

## 9. J7 – Répétition de la démo & livraison

### 9.1 Scénario de démo (à écrire et chronométrer)

Un déroulé fluide qui montre le projet en ~10 minutes :

1. **Contexte** (30 s) : le problème métier, la stack.
2. **Demandeur** : créer une demande, joindre un fichier, soumettre.
3. **Juriste** : la voir arriver (notification + file d'attente), prendre en charge,
   demander un complément.
4. **Demandeur** : recevoir la notification, compléter, renvoyer.
5. **Juriste** : valider avec un avis.
6. **Admin** : montrer le tableau de bord (graphiques, KPIs), la gestion des utilisateurs,
   la traçabilité (journal d'activité).
7. **Optionnelles** : dark mode, export PDF avec QR code, commentaires (selon ce qui est fait).

### 9.2 Préparation technique de la soutenance
- [ ] `npm run db:reset` juste avant (base propre et narrative)
- [ ] Vérifier que les deux serveurs démarrent proprement
- [ ] Navigateur prêt, comptes de démo mémorisés
- [ ] Plan B si un composant échoue (captures d'écran de secours)

### 9.3 Livraison finale
- [ ] Dépôt GitHub propre (pas de fichiers parasites, `.env` non commité)
- [ ] Tous les tags de phase présents (`phase-0` → `phase-6`)
- [ ] Tag **`v1.0`** sur le commit final
- [ ] README à jour en page d'accueil du dépôt

### ✅ Critères de sortie J7
- [ ] Scénario de démo répété et tenant dans le temps imparti
- [ ] Dépôt propre, tag `v1.0` posé
- [ ] Application démontrable de bout en bout

---

## 10. Checklist globale de sortie P6

### Consolidation (non négociable)
- [ ] Non-régression : parcours des 3 rôles OK
- [ ] Re-tests de sécurité (cloisonnement, transitions, rôles, verrouillage) verts
- [ ] Responsive sur mobile / tablette / desktop
- [ ] États vide / chargement / erreur gérés partout

### Optionnelles (selon le temps — chacune finie ET testée, ou retirée)
- [ ] OPT06 Dark mode
- [ ] OPT05 Export CSV
- [ ] OPT01 Fil de commentaires
- [ ] OPT03 Export PDF
- [ ] OPT04 QR code

### Livraison
- [ ] Jeu de démo narratif
- [ ] Documentation à jour + `NOTE_AVANCEMENT_P6.md`
- [ ] README « clone frais » validé
- [ ] Scénario de démo répété
- [ ] Dépôt propre, tag `v1.0`

### Définition de « projet terminé »
> Toutes les fonctionnalités **obligatoires** (EF01→EF24) livrées et testées ·
> les optionnelles réalisées sont **complètes** (aucune demi-fonctionnalité en démo) ·
> un tiers peut installer et lancer le projet avec le seul README ·
> la démo se déroule sans accroc.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 26/07/2026 | 1.0 | Création du plan détaillé de la Phase 6 |
