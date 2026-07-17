# Gestion des Avis Juridiques – Stack PERN

Application web de gestion des demandes d'avis juridiques développée dans le cadre du stage A2 à Natixis Algeria (DAJ).

## Stack technique

- **PostgreSQL** – Base de données relationnelle
- **Express.js** – API REST backend
- **React.js** – Interface utilisateur (SPA)
- **Node.js** – Environnement serveur

## Structure du projet

```
stage-A2/
├── server/          # Backend Express + Node.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── config/
│   └── uploads/
├── client/          # Frontend React
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── api/
└── README.md
```

## Rôles

| Rôle | Description |
|------|-------------|
| Demandeur | Soumet et suit ses demandes |
| Juriste | Traite et valide les demandes |
| Administrateur | Gestion complète + tableau de bord |

## Workflow

`Brouillon` → `Soumise` → `En cours` → `Complément demandé` → `Validée / Rejetée / Annulée`

## Auteur

BOUKERMA Oussama – CESI Exia A2 – Stage Natixis Algeria 2026
