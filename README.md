# Gestion des Avis Juridiques – Application PERN

Application web de gestion des demandes d'avis juridiques développée dans le cadre du
stage A2 à Natixis Algeria (Direction des Affaires Juridiques).

**Stack** : PostgreSQL · Express.js · React.js · Node.js — avec Tailwind CSS et JWT.

---

## Prérequis

| Outil | Version |
|---|---|
| Node.js | 18 LTS ou supérieur |
| PostgreSQL | 15 ou supérieur (17 recommandé) |
| npm | fourni avec Node |
| Git | — |

Vérifier : `node -v`, `psql --version`, `git --version`.

---

## Installation

### 1. Cloner le dépôt
```bash
git clone https://github.com/oussamaboukerma282-maker/stage-A2.git
cd stage-A2
```

### 2. Configurer les variables d'environnement
```bash
# Backend
cp server/.env.example server/.env
# puis éditer server/.env : renseigner DATABASE_URL (mot de passe PostgreSQL) et JWT_SECRET

# Frontend
cp client/.env.example client/.env
```

### 3. Installer les dépendances (racine + backend + frontend)
```bash
npm run install:all
```

### 4. Créer et peupler la base de données
```bash
# Créer la base une première fois (via psql ou pgAdmin) :
#   CREATE DATABASE avis_juridiques;

# Puis charger le schéma + les données de démo :
npm run db:reset
```
> `db:reset` exécute `database/schema.sql` puis `database/seed.sql`.
> Nécessite que `psql` soit accessible dans le PATH
> (dossier `C:\Program Files\PostgreSQL\17\bin` sous Windows).

### 5. Lancer l'application
```bash
npm run dev
```
- Frontend : http://localhost:3000
- API : http://localhost:5000/api

---

## Scripts disponibles (racine)

| Commande | Effet |
|---|---|
| `npm run dev` | Lance backend **et** frontend simultanément |
| `npm run server` | Lance uniquement le backend (nodemon) |
| `npm run client` | Lance uniquement le frontend (Vite) |
| `npm run install:all` | Installe les dépendances des 3 niveaux |
| `npm run db:schema` | (Re)crée les tables |
| `npm run db:seed` | Charge les données de démo |
| `npm run db:reset` | `db:schema` puis `db:seed` |

---

## Comptes de démonstration

Tous les comptes utilisent le mot de passe : **`Demo2026!`**

| Email | Rôle |
|---|---|
| admin@natixis.dz | Administrateur |
| juriste1@natixis.dz | Juriste |
| juriste2@natixis.dz | Juriste |
| demandeur1@natixis.dz | Demandeur |
| demandeur2@natixis.dz | Demandeur |
| demandeur3@natixis.dz | Demandeur |

---

## Structure du projet

```
stage-A2/
├── database/     schema.sql + seed.sql
├── server/       API Express (config, middleware, routes, controllers, models, services)
├── client/       Frontend React (Vite + Tailwind)
├── docs/         Documents de conception (P0) et plans de phases
└── README.md
```

Documentation de conception : voir le dossier [`docs/`](docs/)
(modèle de données, workflow, contrat d'API, écrans, conventions).

---

## Auteur

BOUKERMA Oussama — CESI Exia A2 — Stage Natixis Algeria 2026
