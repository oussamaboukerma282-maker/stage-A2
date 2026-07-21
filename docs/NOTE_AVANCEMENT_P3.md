# Note d'avancement — Phase 3 (Cœur métier : les demandes)

> **Projet** : Gestion des Avis Juridiques (application PERN — Natixis DAJ)
> **Phase** : P3 — Cœur métier : les demandes
> **Statut** : ✅ **Terminée** — tag Git `phase-3`
> **Date** : 21/07/2026
> **Auteur** : BOUKERMA Oussama (CESI Exia A2)
> **Public visé** : tout développeur rejoignant le projet

---

## 1. Objet de ce document

Cette note explique **ce qui a été réalisé pendant la Phase 3**, comment les données circulent,
et surtout **quelles règles de sécurité et de visibilité** ont été mises en place. Elle complète
[`NOTE_AVANCEMENT_P2.md`](NOTE_AVANCEMENT_P2.md) (authentification).

Détail de la planification : [`P3_PLAN_DEMANDES.md`](P3_PLAN_DEMANDES.md).

---

## 2. En une phrase

P3 rend l'application **fonctionnelle sur son métier de base** : un Demandeur crée une demande,
y joint un fichier, la soumet ; un Juriste la voit apparaître et consulte son détail.
**Le traitement (validation, rejet, complément) reste en Phase 4.**

---

## 3. Ce qui a été réalisé

### 3.1 Backend

| Élément | Fichier | Rôle |
|---|---|---|
| Règle métier | `config/themes.js` | Table thème → degré de sensibilité (source unique) |
| Accès données | `models/demandesModel.js` | Requêtes SQL, **filtrage de visibilité**, pagination |
| Logique | `controllers/demandesController.js` | Contrôles d'accès, règles, orchestration |
| Routes | `routes/demandes.js` | 8 endpoints + validations `express-validator` |
| Upload | `middleware/upload.js` | Multer : UUID, 10 Mo, contrôle MIME **et** extension |
| Helper | `helpers/response.js` → `okPaginated` | Format de réponse paginée |

### 3.2 Frontend

| Élément | Fichier | Rôle |
|---|---|---|
| Badge statut | `components/StatutBadge.jsx` | 7 statuts, 7 couleurs, réutilisable |
| Upload | `components/FileUpload.jsx` | Sélection + validation client + barre de progression |
| Liste | `pages/Demandes.jsx` | Filtres (dans l'URL), pagination, états vide/erreur |
| Création | `pages/NouvelleDemande.jsx` | Brouillon ou soumission directe + sensibilité auto |
| Détail | `pages/DemandeDetail.jsx` | Consultation complète + téléchargement PJ |

---

## 4. API livrée en P3

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/demandes` | authentifié | Liste **filtrée par rôle** + filtres + pagination |
| POST | `/demandes` | DEMANDEUR | Crée un brouillon |
| GET | `/demandes/:id` | authentifié | Détail (contrôle de propriété) |
| PUT | `/demandes/:id` | DEMANDEUR propriétaire | Modifie (statuts modifiables uniquement) |
| POST | `/demandes/:id/soumettre` | DEMANDEUR propriétaire | Brouillon → Soumise |
| POST | `/demandes/:id/piece-jointe` | DEMANDEUR propriétaire | Envoie une pièce jointe |
| GET | `/demandes/:id/piece-jointe` | authentifié (selon droits) | Télécharge (nom d'origine restitué) |
| DELETE | `/demandes/:id/piece-jointe` | DEMANDEUR propriétaire | Supprime fichier + métadonnées |

**Réponse paginée** : `{ success: true, data: [...], pagination: { page, totalPages, totalItems } }`

---

## 5. Les règles à connaître absolument

### 5.1 Visibilité des demandes (appliquée **en SQL**, jamais côté client)

| Rôle | Ce qu'il voit |
|---|---|
| **DEMANDEUR** | **Uniquement ses propres demandes** (tous statuts) |
| **JURISTE / ADMIN** | Toutes les demandes **sauf les brouillons** |

> Un brouillon n'est pas soumis : il appartient au demandeur seul. Le rendre visible
> violerait la confidentialité du travail en cours.

### 5.2 Statuts modifiables

Une demande n'est modifiable (contenu et pièce jointe) que si son statut est
**Brouillon** ou **Complément demandé**, et seulement par **son propriétaire**.
Toute autre tentative → **409** (statut) ou **403** (propriété).

### 5.3 Degré de sensibilité automatique

| Thème | Sensibilité |
|---|---|
| Procuration | Moyen |
| Révision dossier juridique | Confidentiel |
| Moyens de paiements | Confidentiel |
| Clôture de compte | Moyen |
| Autre problématique | Faible |

Calculé **côté serveur** (`config/themes.js`). Le demandeur peut ajuster la valeur proposée ;
elle reste contrainte aux trois valeurs légales.

### 5.4 Pièces jointes — points de vigilance

- Nom sur disque = **UUID** (évite collisions et noms exotiques).
- Contraintes : **10 Mo max**, PDF/DOCX/PNG/JPG, vérification **MIME + extension**
  (le MIME envoyé par le client est falsifiable).
- ⚠️ **Le dossier `/uploads` n'est PAS servi en statique.** L'accès passe uniquement par la
  route contrôlée — sinon quiconque devinant un UUID téléchargerait un fichier sans contrôle
  de droits. **Ne jamais ajouter `express.static` sur ce dossier.**
- Remplacer une pièce jointe supprime l'ancien fichier du disque.

---

## 6. Tests réalisés (résultats)

**Cloisonnement des données** (testé via l'API directe, pas seulement l'UI)

| Test | Attendu | Obtenu |
|---|---|---|
| Demandeur B ouvre une demande de A | 403 | ✅ |
| Juriste ouvre un brouillon | 403 | ✅ |
| Demandeur B télécharge la PJ de A | 403 | ✅ |
| Demandeur B modifie la demande de A | 403 | ✅ |
| Propriétaire ouvre la sienne | 200 | ✅ |

**Visibilité** : juriste 13/15 (0 brouillon) · demandeur1 : 6 · demandeur2 : 5 ✅

**Règles métier** : les 5 thèmes → bonne sensibilité ✅ · modification d'une Soumise → 409 ✅ ·
re-soumission → 409 ✅ · description trop courte → 400 ✅ · juriste qui crée → 403 ✅

**Fichiers** : PDF → 201 ✅ · 15 Mo → `FILE_TOO_LARGE` ✅ · `.exe` → `FILE_TYPE` ✅ ·
remplacement supprime l'ancien ✅ · suppression vide disque + colonnes ✅

**Parcours navigateur** : connexion demandeur → création avec sensibilité auto (Confidentiel)
→ soumission → apparition immédiate chez le juriste (avec colonne « Demandeur ») ✅

---

## 7. Dette technique connue (à traiter en P4)

> **La soumission (transition T1) est incomplète.**
> `POST /demandes/:id/soumettre` écrit directement `statut='Soumise'` + `date_soumission`,
> **sans créer de ligne d'historique ni de notification**.
>
> C'était un choix assumé : sans cette transition, aucune demande ne serait visible côté Juriste
> en P3. **La première tâche de P4** est de la refactorer pour passer par le moteur de transitions
> (`services/workflow.js`), avec les 3 écritures en **une seule transaction**
> (UPDATE + historique + notification).

---

## 8. Pièges rencontrés (utile pour les tests)

Deux « échecs » observés pendant les tests venaient de **l'environnement de test**, pas du code :

| Symptôme | Cause | Solution |
|---|---|---|
| Thèmes accentués rejetés via curl | Le shell mange l'UTF-8 dans `-d '...'` | Passer le JSON par un fichier : `--data-binary @fichier.json` |
| `curl: (26)` sur `-F "fichier=@/tmp/x.pdf;type=..."` | Conversion de chemin MSYS (Git Bash) | `export MSYS_NO_PATHCONV=1` + chemin Windows |
| Seed partiellement appliqué | Sortie masquée → erreur invisible | Lancer avec `-v ON_ERROR_STOP=1` et **vérifier le code retour** |

---

## 9. Comment tester rapidement

```bash
npm run db:reset     # 15 demandes, 6 comptes
npm run dev          # backend :5000 + frontend :3000
```

Connexion `demandeur1@natixis.dz` / `Demo2026!` :
1. **Demandes** → 6 demandes (les vôtres)
2. **+ Nouvelle demande** → changer le thème : la sensibilité se met à jour seule
3. Remplir, joindre un PDF, **Soumettre**
4. Se déconnecter, se reconnecter en `juriste1@natixis.dz` → la demande apparaît en tête,
   avec la colonne « Demandeur » (invisible pour un demandeur)

---

## 10. Prochaine étape — Phase 4

**Workflow & Traçabilité** : moteur de transitions (les 8 transitions T1→T8), historique
immuable, journal d'activité, et actions contextuelles sur la page détail
(prise en charge, complément, validation, rejet). Les emplacements sont déjà réservés
dans `DemandeDetail.jsx`.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 21/07/2026 | 1.0 | Rédaction de la note d'avancement P3 |
