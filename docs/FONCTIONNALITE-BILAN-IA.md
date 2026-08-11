# Compte rendu technique — Fonctionnalité « Bilan d'activité par IA »

> Application **Gestion des Avis Juridiques** — Natixis Algeria, Direction des Affaires Juridiques (DAJ)
> Stack : PostgreSQL · Express · React (Vite) · Node.js (PERN)

Ce document décrit le **code** et l'**architecture** de la fonctionnalité permettant à un administrateur
de générer, depuis le tableau de bord, une **synthèse managériale rédigée par IA** à partir des
statistiques agrégées de l'application, puis de l'exporter en **rapport PDF** (KPIs + analyse + graphiques).

---

## 1. Objectif et périmètre

| Élément | Description |
|---|---|
| **Besoin** | Transformer des statistiques brutes (compteurs, taux) en une analyse écrite exploitable par le management. |
| **Déclencheur** | Bouton « Générer le bilan » sur le tableau de bord administrateur. |
| **Sortie** | Un texte structuré (Synthèse / Tendances / Points d'attention / Recommandations) affiché à l'écran + un export **PDF complet**. |
| **Accès** | Réservé au rôle **ADMIN**. |
| **Fournisseur IA** | API OpenAI (`chat/completions`), modèle par défaut `gpt-4o-mini`. |

---

## 2. Principes d'architecture retenus

La fonctionnalité a été conçue autour de **quatre exigences non fonctionnelles** fortes, adaptées au
contexte bancaire :

1. **Confidentialité par conception** — seules des **données agrégées et anonymes** quittent l'application.
   Une *whitelist* explicite (`payloadAnonyme`) garantit qu'aucune donnée nominative ni contenu de demande
   ne peut être transmis, même si le modèle de statistiques évolue.
2. **Sécurité du secret** — la clé OpenAI vit **exclusivement côté serveur** (`.env`, non versionné).
   Le front n'appelle qu'une route interne ; il ne voit jamais la clé.
3. **Fiabilité** — appel réseau protégé par un **timeout** (AbortController, 30 s) et une **reprise
   automatique** ; dégradation **gracieuse** si la clé est absente ou si l'IA est injoignable.
4. **Vérité des chiffres** — les nombres sont **calculés par le SQL** applicatif ; l'IA se contente de
   *rédiger* l'analyse (température basse `0.3`), ce qui évite toute invention de valeur.

---

## 3. Vue d'ensemble (flux de données)

```
┌─────────────────────────┐        POST /api/stats/admin/bilan-ia (JWT, rôle ADMIN)
│  DashboardAdmin.jsx      │ ───────────────────────────────────────────────────────┐
│  (React)                 │                                                          │
│  • bouton « Générer »    │                                                          ▼
│  • panneau de synthèse   │                                           ┌──────────────────────────┐
│  • export « Rapport PDF »│                                           │ routes/stats.js          │
└─────────────▲────────────┘                                           │  auth → roles('ADMIN')   │
              │  { texte, modele, genereLe }                           └────────────┬─────────────┘
              │                                                                      ▼
              │                                                        ┌──────────────────────────┐
              │                                                        │ statsController.bilanIA  │
              │                                                        │  1. statsModel.admin()   │
              │                                                        │  2. genererBilan(stats)  │
              │                                                        └───────┬──────────┬───────┘
              │                                                                │          │
              │                                        agrégats SQL (Postgres) │          │ payload anonyme
              │                                                                ▼          ▼
              │                                                   ┌────────────────┐  ┌───────────────────────┐
              │                                                   │ models/        │  │ services/bilanIA.js   │
              │                                                   │ statsModel.js  │  │  • payloadAnonyme()   │
              │                                                   │ (GROUP BY,     │  │  • SYSTEM_PROMPT      │
              │                                                   │  FILTER, AVG)  │  │  • fetch OpenAI       │
              │                                                   └────────────────┘  └──────────┬────────────┘
              │                                                                                   │ HTTPS
              └───────────────────────────────────────────────────────────────────────  OpenAI  ◀┘
                                                                                     chat/completions
```

**Principe clé** : le contrôleur ne touche jamais à la base directement ni à OpenAI directement.
Il **orchestre** deux briques spécialisées (le *modèle* de stats et le *service* IA). C'est la même
séparation `route → controller → model/service` que le reste de l'application.

---

## 4. Détail du code — Backend

### 4.1 `server/services/bilanIA.js` (cœur de la fonctionnalité)

Service isolé, sans dépendance à Express (testable unitairement). Il expose `genererBilan(stats)`.

**a) Whitelist de confidentialité**

```js
function payloadAnonyme(stats) {
  return {
    totalDemandes: stats.totalDemandes,
    repartitionParStatut: stats.parStatut,
    repartitionParTheme: stats.parTheme,
    repartitionParSensibilite: stats.parSensibilite,
    evolutionMensuelle: stats.evolutionMensuelle,   // [{ mois: 'YYYY-MM', total: n }]
    delaiMoyenTraitementJours: stats.delaiMoyenJours,
    tauxValidationPct: stats.tauxValidation,
    tauxRejetPct: stats.tauxRejet,
    demandesEnRetard: stats.enRetard
  };
}
```

> **Décision d'architecture** : la fonction *reconstruit* explicitement l'objet envoyé, plutôt que de
> transmettre `stats` tel quel. Ainsi, tout nouveau champ ajouté au modèle de stats (ex. un jour un
> détail nominatif) n'est **pas** exposé automatiquement — il faudrait l'ajouter ici volontairement.

**b) Prompt système** — cadre le rôle du modèle, impose l'usage exclusif des chiffres fournis,
interdit l'invention, et fixe la structure Markdown de sortie (4 sections, ~350 mots).

**c) Appel réseau fiabilisé**

```js
// Timeout 30 s via AbortController
const appelUnique = async () => {
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), 30000);
  try {
    return await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
      body: corps,
      signal: ctrl.signal
    });
  } finally { clearTimeout(minuteur); }
};

// Reprise automatique (2 tentatives) sur erreur réseau transitoire
let reponse, derniereErreur;
for (let tentative = 1; tentative <= 2; tentative++) {
  try { reponse = await appelUnique(); break; }
  catch (err) { derniereErreur = err; logger.warn(`Appel OpenAI échoué (tentative ${tentative}/2)`, ...); }
}
```

**d) Gestion d'erreurs typée** (via `AppError`, mappée en codes HTTP par le middleware global) :

| Situation | Code HTTP | Code métier | Message utilisateur |
|---|---|---|---|
| Clé absente | `503` | `IA_INDISPONIBLE` | Génération IA non configurée. |
| Réseau injoignable (après reprise) | `502` | `IA_ERREUR` | Service d'IA injoignable. |
| Clé invalide (401 OpenAI) | `502` | `IA_ERREUR` | Clé OpenAI invalide ou expirée. |
| Réponse vide | `502` | `IA_ERREUR` | Réponse vide du service. |

Chaque cas est **journalisé via Winston** (`logger.warn` / `logger.error`), et le succès enregistre le
modèle et le nombre de tokens consommés.

### 4.2 `server/controllers/statsController.js`

```js
// POST /api/stats/admin/bilan-ia — synthèse rédigée par IA (agrégats anonymes uniquement)
const bilanIA = asyncHandler(async (req, res) => {
  const stats = await statsModel.admin();          // chiffres calculés par SQL
  const { texte, modele } = await genererBilan(stats);
  ok(res, { texte, modele, genereLe: new Date().toISOString() });
});
```

Le contrôleur reste **mince** : il enchaîne modèle → service et formate la réponse. Aucune logique
métier n'y est dupliquée.

### 4.3 `server/routes/stats.js`

```js
router.post('/admin/bilan-ia', roles('ADMIN'), ctrl.bilanIA);
```

Protégée par le middleware `auth` (JWT) déjà appliqué au routeur, puis par `roles('ADMIN')`.

### 4.4 Configuration `server/.env`

```
OPENAI_API_KEY=sk-...        # secret — jamais versionné (.env est git-ignoré)
OPENAI_MODEL=gpt-4o-mini     # modèle interchangeable sans toucher au code
```

---

## 5. Détail du code — Frontend (`DashboardAdmin.jsx`)

### 5.1 État local et appel

```js
const [bilan, setBilan] = useState(null);       // { texte, modele, genereLe }
const [genBilan, setGenBilan] = useState(false);
const [erreurBilan, setErreurBilan] = useState(null);

const genererBilan = async () => {
  setGenBilan(true); setErreurBilan(null);
  try {
    const res = await api.post('/stats/admin/bilan-ia');
    setBilan(res.data.data);
  } catch (err) {
    setErreurBilan(err.response?.data?.error?.message || "Échec de la génération du bilan.");
  } finally { setGenBilan(false); }
};
```

### 5.2 Rendu « Markdown-léger »

Un mini-parseur (`RenduBilan`) transforme le texte IA en React sans dépendance externe ni
`dangerouslySetInnerHTML` (sûr) : il gère les titres `## `, les puces `- ` et le gras `**...**`.

### 5.3 Export « Rapport PDF » (`telechargerBilanPDF`)

Construit un document **A4 multi-pages** avec `jsPDF` (import dynamique pour ne pas alourdir le bundle
initial) :

1. **En-tête** (titre + date + filet)
2. **Indicateurs clés** — les 4 KPIs (2×2)
3. **Analyse détaillée** — le texte IA, paginé (saut de page automatique)
4. **Graphiques** — les **4 graphiques Chart.js existants** du tableau de bord, réutilisés via leurs
   `ref` et composés sur fond blanc (`imageAvecFond`). Chaque image reçoit un **alias unique**
   (`graph-r-c`) pour empêcher la déduplication interne de jsPDF entre graphiques de mêmes dimensions.
5. **Pied de page** — mention de confidentialité + numéro de page, sur **chaque** page.

> **Réutilisation** : la fonction s'appuie sur les helpers déjà présents (`imageAvecFond`, refs de
> graphiques) qui servaient à l'export « Télécharger le rapport ». Aucune duplication de la logique de
> capture des graphiques.

---

## 6. Contrat d'API

**Requête**
```
POST /api/stats/admin/bilan-ia
Authorization: Bearer <JWT d'un ADMIN>
```

**Réponse `200`**
```json
{
  "success": true,
  "data": {
    "texte": "## Synthèse\n...",
    "modele": "gpt-4o-mini",
    "genereLe": "2026-08-11T18:30:01.000Z"
  }
}
```

**Exemple de charge utile envoyée à OpenAI** (intégralité — aucune donnée nominative) :
```json
{
  "totalDemandes": 72,
  "repartitionParStatut": { "Soumise": 13, "Validée": 18, "En cours": 15, "...": 0 },
  "repartitionParTheme": { "Révision dossier juridique": 17, "Clôture de compte": 16 },
  "repartitionParSensibilite": { "Confidentiel": 29, "Moyen": 27, "Faible": 16 },
  "evolutionMensuelle": [ { "mois": "2026-03", "total": 15 } ],
  "delaiMoyenTraitementJours": 5.2,
  "tauxValidationPct": 75,
  "tauxRejetPct": 25,
  "demandesEnRetard": 36
}
```

---

## 7. Fichiers concernés

| Fichier | Rôle | Nature |
|---|---|---|
| `server/services/bilanIA.js` | Service IA (whitelist, prompt, appel OpenAI, erreurs) | **Nouveau** |
| `server/controllers/statsController.js` | Orchestration stats → IA | Modifié |
| `server/routes/stats.js` | Route `POST /admin/bilan-ia` | Modifié |
| `server/.env` / `.env.example` | `OPENAI_API_KEY`, `OPENAI_MODEL` | Modifié |
| `client/src/pages/dashboards/DashboardAdmin.jsx` | Panneau + rendu + export PDF | Modifié |
| `README.md` | Documentation fonctionnelle | Modifié |

---

## 8. Choix techniques justifiés

| Choix | Raison |
|---|---|
| **`fetch` natif** (pas de SDK `openai`) | Node 18+ fournit `fetch` ; évite une dépendance supplémentaire pour un seul appel HTTP. |
| **Service séparé** du contrôleur | Testabilité, réutilisabilité, respect de la séparation des responsabilités du projet. |
| **Whitelist reconstruite** | Sécurité *fail-safe* : l'exposition de données est un acte explicite, jamais un défaut. |
| **Température `0.3`** | Réduit la créativité au profit de la fidélité aux chiffres. |
| **Modèle via variable d'env** | Changer `gpt-4o-mini` → autre modèle sans redéploiement de code. |
| **Timeout + reprise** | Absorbe les aléas réseau ; l'IA n'est pas un point de défaillance bloquant. |
| **Alias d'image jsPDF** | Corrige la déduplication d'images de mêmes dimensions dans le PDF. |

---

## 9. Perspective « production réelle »

En démonstration, la fonctionnalité utilise l'API OpenAI publique sur des **données de démonstration**.
Pour un déploiement réel chez Natixis, l'architecture reste identique — seul le **fournisseur** changerait :
il suffirait de pointer `OPENAI_URL` vers un **Azure OpenAI** maîtrisé par la banque, ou un **modèle
interne** (ex. Mistral/Llama auto-hébergé), pour respecter la souveraineté des données. Le reste du code
(whitelist, contrôleur, front) est déjà **agnostique du fournisseur**.
