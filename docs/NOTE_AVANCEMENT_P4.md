# Note d'avancement — Phase 4 (Workflow & Traçabilité)

> **Projet** : Gestion des Avis Juridiques (application PERN — Natixis DAJ)
> **Phase** : P4 — Workflow & Traçabilité
> **Statut** : ✅ **Terminée** — tag Git `phase-4`
> **Date** : 21/07/2026
> **Auteur** : BOUKERMA Oussama (CESI Exia A2)
> **Public visé** : tout développeur rejoignant le projet

---

## 1. Objet de ce document

P4 est **la phase la plus critique du projet** : c'est elle qui garantit l'intégrité des données.
Cette note explique le fonctionnement du moteur de transitions, les règles qu'il applique, et
**ce qu'il ne faut surtout pas contourner**.

Notes précédentes : [P2 — Authentification](NOTE_AVANCEMENT_P2.md) · [P3 — Demandes](NOTE_AVANCEMENT_P3.md)
Spécification de référence : [`WORKFLOW.md`](WORKFLOW.md) · Planification : [`P4_PLAN_WORKFLOW.md`](P4_PLAN_WORKFLOW.md)

---

## 2. En une phrase

Le cycle de vie complet d'une demande fonctionne : chaque changement de statut passe par **un
moteur unique**, est **contrôlé**, **atomique**, **historisé** et **notifié** — et toute
transition non prévue est refusée.

---

## 3. La règle d'or

> ### ⚠️ Aucun code ne doit modifier la colonne `statut` en dehors de `services/workflow.js`.

C'est **la** règle à respecter pour toute évolution future. Le moteur garantit que les trois
écritures (demande + historique + notification) se font ensemble ou pas du tout. Un `UPDATE`
direct depuis un controller casserait la traçabilité sans que rien ne le signale.

Pour ajouter une transition : l'ajouter **dans la matrice** du moteur, pas ailleurs.

---

## 4. Le moteur de transitions

### 4.1 La matrice (source unique de vérité)

`server/services/workflow.js` :

| Depuis | Vers | Rôles autorisés | Donnée obligatoire |
|---|---|---|---|
| Brouillon | Soumise | DEMANDEUR (propriétaire) | — |
| Brouillon | Annulée | DEMANDEUR (propriétaire) | — |
| Soumise | En cours | JURISTE, ADMIN | — |
| En cours | Complément demandé | JURISTE, ADMIN | `commentaire` |
| En cours | Validée | JURISTE, ADMIN | `avis_juridique` |
| En cours | Rejetée | JURISTE, ADMIN | `motif_rejet` |
| Complément demandé | En cours | DEMANDEUR (propriétaire) | — |
| **Validée / Rejetée / Annulée** | **aucune sortie** | — | — |

**7 transitions autorisées sur 49 combinaisons possibles.** Tout le reste → **409**.

### 4.2 Ordre des contrôles (volontaire)

```
1. La demande existe ?              -> 404 NOT_FOUND
2. La transition est-elle permise ? -> 409 INVALID_TRANSITION
3. Le rôle est-il autorisé ?        -> 403 FORBIDDEN
4. Est-ce le propriétaire ?         -> 403 FORBIDDEN
5. La donnée requise est-elle là ?  -> 400 VALIDATION
```

> Le **statut est vérifié avant le rôle** : ainsi un juriste qui tente de valider une demande
> déjà validée reçoit un message clair (« la demande est clôturée ») plutôt qu'un 403 trompeur.

### 4.3 Atomicité

Chaque transition exécute dans **une seule transaction PostgreSQL** :

```
BEGIN
  SELECT ... FOR UPDATE        -- verrouille la ligne (protection contre la concurrence)
  UPDATE demande_avis          -- statut + champs associés + dates
  INSERT INTO historique_statuts
  INSERT INTO notifications    -- 0, 1 ou N destinataires
COMMIT                          -- ou ROLLBACK total
```

Le `FOR UPDATE` est ce qui rend la prise en charge concurrente sûre : si deux juristes cliquent
en même temps, le second attend, constate que le statut a changé, et reçoit **409**.

### 4.4 Effets de bord par transition

| Transition | Champs mis à jour | Notification envoyée à |
|---|---|---|
| Soumise | `date_soumission` | **tous** les juristes + admins |
| Annulée | — | personne |
| En cours (prise en charge) | `juriste_id` | le demandeur |
| Complément demandé | `commentaire_complement` | le demandeur |
| En cours (retour complément) | — | le juriste en charge |
| Validée | `avis_juridique`, `date_traitement` | le demandeur |
| Rejetée | `motif_rejet`, `date_traitement` | le demandeur |

> Les notifications sont **écrites** ici. L'interface pour les consulter (cloche, liste)
> sera construite en **Phase 5**.

---

## 5. API livrée en P4

| Méthode | Endpoint | Rôle | Corps requis |
|---|---|---|---|
| POST | `/demandes/:id/soumettre` | DEMANDEUR (prop.) | — |
| POST | `/demandes/:id/annuler` | DEMANDEUR (prop.) | — |
| POST | `/demandes/:id/prendre-en-charge` | JURISTE, ADMIN | — |
| POST | `/demandes/:id/complement` | JURISTE, ADMIN | `commentaire` (10-2000) |
| POST | `/demandes/:id/completer` | DEMANDEUR (prop.) | — |
| POST | `/demandes/:id/valider` | JURISTE, ADMIN | `avis_juridique` (10-5000) |
| POST | `/demandes/:id/rejeter` | JURISTE, ADMIN | `motif_rejet` (10-2000) |
| PUT | `/demandes/:id/theme` | JURISTE, ADMIN | `theme` (statut En cours) |
| GET | `/demandes/:id/historique` | authentifié (droits de lecture) | — |

---

## 6. Côté interface

### 6.1 Actions contextuelles

Les boutons affichés sur la page détail dépendent du couple **(rôle, statut)** :

| Statut | DEMANDEUR (propriétaire) | JURISTE / ADMIN |
|---|---|---|
| Brouillon | Modifier · Soumettre · Annuler | *(invisible)* |
| Soumise | *(lecture seule)* | Prendre en charge |
| En cours | *(lecture seule)* | Complément · Valider · Rejeter |
| Complément demandé | Modifier · Compléter et renvoyer | *(lecture seule)* |
| Validée / Rejetée / Annulée | *(aucune action)* | *(aucune action)* |

> ⚠️ **Ceci ne fait que masquer des boutons.** L'autorisation réelle est celle du serveur.
> Ne jamais considérer l'UI comme une protection.

### 6.2 Composants ajoutés

- **`ConfirmDialog`** — modale avec zone de texte obligatoire (min. 10 caractères, bouton
  désactivé en dessous). En cas d'erreur serveur, elle **reste ouverte** : la saisie n'est pas perdue.
- **`Timeline`** — journal d'activité vertical : transition, horodatage, acteur + rôle, commentaire.

---

## 7. Tests réalisés

**4 parcours complets** : nominal · complément (5 étapes) · rejet · annulation — tous avec
historique complet et ordonné.

**21 tests de refus**, tous conformes :

| Famille | Exemples | Résultat |
|---|---|---|
| Transitions interdites | Soumise→Validée, réouvrir une Validée, double soumission | **409** ✅ |
| Refus de rôle | Demandeur qui valide, juriste qui soumet, non-propriétaire qui annule | **403** ✅ |
| Validation données | Valider sans avis, complément de 3 caractères | **400** ✅ |
| Verrouillage terminal | 5 routes d'écriture sur une demande clôturée (testées avec **le vrai propriétaire**) | **409** ✅ |
| Concurrence | 2 prises en charge simultanées | 1×200 + 1×409, **un seul** juriste assigné ✅ |

**Intégrité en base** — 4 requêtes de contrôle, toutes à **0** :
clôturées sans `date_traitement` · « En cours » sans juriste · statut ≠ dernier historique ·
brouillon possédant un historique.

---

## 8. Défaut corrigé pendant la phase

> **Les scripts SQL pouvaient échouer silencieusement** et laisser la base à moitié peuplée.

**Cause** : sous Windows, `psql` déduit son encodage client du **codepage de la console** — qui
change selon que la sortie est redirigée ou non. Les accents de `seed.sql` étaient alors mal
interprétés, et la valeur `Complément demandé` ne satisfaisait plus la contrainte
`ck_demande_statut` → arrêt du script (exit 3) après seulement 8 demandes insérées.

**Correctif** : `SET client_encoding = 'UTF8';` ajouté en tête de `schema.sql` **et** `seed.sql`.
La solution vit dans les fichiers eux-mêmes, donc `npm run db:reset` est fiable quel que soit
l'appelant (terminal, script npm, CI).

**Bonne pratique à retenir** : lancer les scripts avec `-v ON_ERROR_STOP=1` et **vérifier le code
retour** ; ne jamais masquer la sortie d'un script de base de données.

---

## 9. Comment tester rapidement

```bash
npm run db:reset
npm run dev
```

Connexion `juriste1@natixis.dz` / `Demo2026!` :
1. Ouvrir la demande **#3** (Soumise) → seule action : **Prendre en charge**
2. Cliquer → le statut passe **En cours**, la juriste est assignée, les actions deviennent
   *Complément / Valider / Rejeter*, et le **journal d'activité** s'enrichit
3. Cliquer **Valider** → saisir moins de 10 caractères : le bouton reste **désactivé**
4. Saisir un avis complet → statut **Validée**, date de traitement renseignée,
   et **la section Actions disparaît** (verrouillage définitif)

Parcours complément : depuis *En cours*, cliquer **Demander un complément** → se reconnecter
en demandeur → **Modifier** puis **Compléter et renvoyer**.

---

## 10. Prochaine étape — Phase 5

**Notifications & Tableaux de bord** : les notifications sont **déjà écrites** en base par le
moteur — P5 construira l'API de lecture, la cloche dans la navbar, les tableaux de bord par rôle
et les KPIs (délai moyen, taux de validation), qui s'appuieront sur l'historique produit ici.
S'ajoutera la gestion des utilisateurs (CRUD Admin).

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 21/07/2026 | 1.0 | Rédaction de la note d'avancement P4 |
