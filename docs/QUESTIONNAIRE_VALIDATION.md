# Questionnaire de validation de compréhension — Soutenance

> **But** : vérifier que tu maîtrises le projet sur ses dimensions **fonctionnelle, métier,
> produit, organisationnelle et stratégique** — pas seulement technique. C'est le terrain sur
> lequel un jury « métier / direction / client / utilisateur / décideur » te teste, et c'est là
> que se jouent les silences gênants.
>
> **Complémentaire** au `GUIDE_SOUTENANCE.md` (lui très technique). Ici, presque aucune ligne de
> code : on parle valeur, usages, responsabilités, risques, décisions.
>
> **Mode d'emploi** : pour chaque question, cache la réponse, réponds **à voix haute avec tes
> mots**, puis compare. Marque d'une croix les questions où tu as hésité — ce sont tes zones de
> risque. Vise à pouvoir répondre en 2-3 phrases claires, sans jargon inutile.
>
> **Légende** : 🟢 base · 🔵 compréhension profonde · ⚠️ piège/ambiguïté · 🎤 « si on me demande X »
> · 🎬 scénario concret · ✅ éléments de réponse · ❌ erreurs à éviter.

---

## Sommaire

1. [Vision générale du projet](#1-vision-générale-du-projet)
2. [Problème / besoin adressé](#2-problème--besoin-adressé)
3. [Objectifs du projet](#3-objectifs-du-projet)
4. [Valeur attendue et bénéfices](#4-valeur-attendue-et-bénéfices)
5. [Périmètre fonctionnel et limites actuelles](#5-périmètre-fonctionnel-et-limites-actuelles)
6. [Acteurs, utilisateurs et responsabilités](#6-acteurs-utilisateurs-et-responsabilités)
7. [Workflows et processus clés](#7-workflows-et-processus-clés)
8. [Règles métier importantes](#8-règles-métier-importantes)
9. [Données manipulées et cycle de vie](#9-données-manipulées-et-cycle-de-vie)
10. [Droits, rôles, permissions et gouvernance](#10-droits-rôles-permissions-et-gouvernance)
11. [Contraintes, risques et points de vigilance](#11-contraintes-risques-et-points-de-vigilance)
12. [Architecture fonctionnelle / organisationnelle](#12-architecture-fonctionnelle--organisationnelle)
13. [Hypothèses, décisions ouvertes et arbitrages](#13-hypothèses-décisions-ouvertes-et-arbitrages)
14. [Roadmap, phases suivantes et passage en production](#14-roadmap-phases-suivantes-et-passage-en-production)
15. [Questions difficiles ou critiques](#15-questions-difficiles-ou-critiques)

---

## 1. Vision générale du projet

**🟢 Q1.1 — En une phrase, c'est quoi ton projet ?**
✅ Une application web qui centralise et structure la gestion des demandes d'avis juridiques
entre les agences/directions d'une banque (Natixis Algeria) et sa Direction des Affaires
Juridiques (DAJ), en remplacement d'échanges par email non structurés.

**🟢 Q1.2 — Pour qui, et dans quel contexte ?**
✅ Pour la DAJ de Natixis Algeria et les employés qui la sollicitent. Contexte : stage CESI A2,
« deuxième passage » — le besoin métier avait déjà été traité en Oracle APEX chez Natixis ; ici je
le **refais avec une stack moderne open-source (PERN)**.

**🔵 Q1.3 — Quelle est la « colonne vertébrale » du produit, ce qui le tient ?**
✅ Le **workflow** : une demande suit un cycle de vie à statuts (Brouillon → Soumise → En cours →
Validée/Rejetée…), et **chaque changement de statut est contrôlé, tracé et notifié**. Tout le reste
(formulaire, tableaux de bord, notifications) gravite autour de ce cycle de vie.

**⚠️ Q1.4 — « Ce n'est pas juste un CRUD / un formulaire de plus ? »**
✅ Non : un CRUD stocke des données. Ici la valeur est dans les **règles de circulation** de la
demande (qui peut faire quoi, quand, dans quel ordre) et dans la **traçabilité opposable**. C'est un
outil de **processus**, pas un simple formulaire.

**🎤 Q1.5 — « Résume ton projet à un décideur en 20 secondes. »**
✅ « J'ai digitalisé un processus qui se faisait par email en une application web avec un workflow
structuré, une traçabilité complète et une gestion des rôles, dans le respect des contraintes de
confidentialité d'une banque. »

❌ **Erreurs à éviter** : commencer par la technique (« c'est une app PERN avec du JWT… ») ; réciter
la liste des technos avant d'avoir énoncé le **besoin**. Le jury métier veut d'abord le **pourquoi**.

---

## 2. Problème / besoin adressé

**🟢 Q2.1 — Quel problème concret résous-tu ?**
✅ Avant : les demandes d'avis juridiques circulaient par **emails non structurés** — pas de format
imposé, pas de suivi, pas d'historique, aucune visibilité sur qui traite quoi ni sur les délais.

**🔵 Q2.2 — Pourquoi ce problème est-il *grave*, spécifiquement dans une banque ?**
✅ Parce qu'une banque est un **secteur très réglementé** : l'absence de traçabilité des décisions
juridiques est un risque de conformité et d'audit. On ne peut pas prouver qui a rendu quel avis,
quand, sur quelle base. Le mail ne garantit ni l'intégrité ni la conservation.

**🔵 Q2.3 — Cite trois conséquences concrètes de l'ancien fonctionnement.**
✅ (1) **Perte d'information** (mails noyés, oubliés) ; (2) **impossible de mesurer la charge** de
travail des juristes et les délais ; (3) **aucune traçabilité** des décisions (problème de
conformité).

**⚠️ Q2.4 — « L'email, ça marchait ; pourquoi investir dans un outil ? »**
✅ L'email « marche » tant qu'on ne demande rien de plus que transmettre un message. Il **échoue**
dès qu'on veut : suivre un statut, retrouver l'historique, mesurer un délai, garantir qu'aucune
demande n'est perdue, prouver une décision. Le besoin n'est pas « communiquer » mais **piloter un
processus**.

**🎬 Q2.5 — Scénario : une agence conteste « j'avais bien envoyé ma demande il y a 3 semaines ».**
✅ Avant : parole contre parole, on fouille des boîtes mail. Avec l'appli : la demande a une **date
de soumission** horodatée, un **statut** visible par l'agence, et un **historique** qui montre
exactement où elle en est et qui l'a prise en charge. Le litige se règle en 10 secondes.

❌ **Erreurs à éviter** : décrire le problème comme purement technique (« les mails c'est pas une
base de données ») ; oublier l'angle **conformité/réglementaire** qui est le vrai déclencheur en
banque.

---

## 3. Objectifs du projet

**🟢 Q3.1 — Quels sont les objectifs principaux ?**
✅ (1) **Centraliser** les demandes dans un point unique ; (2) **structurer** le processus via un
workflow clair ; (3) garantir la **traçabilité** complète ; (4) donner de la **visibilité**
(statuts, notifications, tableaux de bord) ; (5) **cloisonner** l'accès selon les rôles.

**🔵 Q3.2 — Comment sais-tu que l'objectif est atteint ? Donne des critères mesurables.**
✅ 100 % des exigences obligatoires (EF01→EF24) livrées et testées ; parcours de démo complet sans
erreur ; chaque transition tracée dans l'historique ; chaque événement génère la bonne notification
au bon destinataire ; tableaux de bord recalculés depuis la base. (Ce sont les **critères de sortie**
de chaque phase.)

**⚠️ Q3.3 — Objectif *métier* vs objectif *pédagogique* : lequel sers-tu ?**
✅ Les deux, et il faut les distinguer. Objectif **métier** : outiller la DAJ. Objectif
**pédagogique/académique** : démontrer ma maîtrise d'une stack full-stack, d'un workflow sécurisé et
d'une démarche projet. Certaines décisions (ex : JWT en localStorage, notifications internes sans
email) sont des **choix assumés de périmètre académique**, pas des choix de production.

**🎤 Q3.4 — « Quel était TON objectif d'apprentissage ? »**
✅ Maîtriser un **moteur de workflow transactionnel** (le cœur), la **sécurité** applicative (auth,
rôles, cloisonnement) et une **démarche de projet structurée** en phases avec critères de sortie.

❌ **Erreurs à éviter** : confondre objectifs (le *quoi/pourquoi*) et fonctionnalités (le *comment*) ;
annoncer des objectifs invérifiables (« améliorer la productivité ») sans dire comment on le mesure.

---

## 4. Valeur attendue et bénéfices

**🟢 Q4.1 — Quelle valeur l'outil apporte-t-il, par acteur ?**
✅ **Demandeur** : suit ses demandes en temps réel, ne « perd » plus rien, sait quand agir.
**Juriste** : file d'attente claire, dossiers complets, moins d'allers-retours mail.
**DAJ/Direction** : pilotage (charge, délais, taux de validation/rejet) et **traçabilité opposable**.

**🔵 Q4.2 — Quel est le bénéfice le plus stratégique, s'il ne fallait en garder qu'un ?**
✅ La **traçabilité** : historique immuable de chaque décision. Dans une banque, c'est ce qui
transforme un échange informel en **preuve auditable**. Les gains de confort (notifications,
dashboards) sont secondaires face à ça.

**🔵 Q4.3 — En quoi les tableaux de bord créent-ils de la valeur de *décision* ?**
✅ Ils transforment des données opérationnelles en **indicateurs de pilotage** : répartition par
statut/thème/sensibilité, **délai moyen de traitement**, **taux de validation/rejet**, demandes en
retard. La DAJ peut arbitrer des priorités et justifier ses moyens (charge réelle chiffrée).

**⚠️ Q4.4 — « Quel est le ROI ? Peux-tu chiffrer le gain ? »**
✅ Honnêteté : je n'ai pas de mesure chiffrée en production (projet académique, pas de déploiement
réel ni de mesure avant/après). Le gain est **qualitatif et structurel** : suppression des pertes
d'information, réduction des allers-retours, traçabilité. Un vrai ROI se mesurerait après
déploiement (délai moyen avant/après, nb de demandes perdues → 0).

**🎬 Q4.5 — Scénario : la direction veut savoir « combien de demandes sensibles traite-t-on par mois ? ».**
✅ Avant : impossible sans compter des mails à la main. Avec l'appli : le tableau de bord donne la
répartition par **degré de sensibilité** et l'**évolution mensuelle** immédiatement.

❌ **Erreurs à éviter** : survendre un ROI chiffré que tu ne peux pas prouver ; présenter les
bénéfices comme purement « techniques » ; oublier que le bénéfice n°1 est la **conformité/traçabilité**.

---

## 5. Périmètre fonctionnel et limites actuelles

**🟢 Q5.1 — Qu'est-ce qui est DANS le périmètre livré ?**
✅ Auth + 3 rôles ; création/brouillon/soumission de demandes avec 1 pièce jointe ; workflow complet
à 7 statuts ; historique + journal d'activité ; notifications internes ; tableaux de bord par rôle ;
gestion des utilisateurs (admin). Plus 5 optionnelles : mode sombre, export CSV, fil de commentaires,
export PDF, QR code dans le PDF.

**🟢 Q5.2 — Qu'est-ce qui est HORS périmètre (assumé) ?**
✅ Pas d'**emails** (notifications **internes** seulement) ; pas de **temps réel** (polling 30 s, pas
de WebSocket) ; **une seule** pièce jointe par demande ; pas de **recherche plein-texte** ; pas
d'**authentification Active Directory** (contrairement à la version APEX) ; pas de **tests
automatisés** ; pas de déploiement en production.

**🔵 Q5.3 — Pourquoi ces limites sont des *choix* et pas des *oublis* ?**
✅ Elles sont **documentées et justifiées** dans le plan (décisions D-* et bilans de phase). Ex :
polling plutôt que WebSocket = « simple et suffisant » pour la volumétrie ; localStorage = « limite
connue et documentée » pour un projet académique. Un oubli n'est pas tracé ; un choix l'est.

**⚠️ Q5.4 — Piège : « Ton système envoie des mails aux juristes, non ? »**
✅ **Non.** Les notifications sont **internes** (cloche + compteur dans l'appli). La version Oracle
APEX chez Natixis, elle, envoyait des **emails via SMTP** — ne confonds pas les deux projets.
L'email est une **perspective** d'évolution.

**⚠️ Q5.5 — Piège : « On peut joindre plusieurs documents à une demande ? »**
✅ Actuellement **une seule** pièce jointe (remplacée si on en réuploade une). Les pièces jointes
**multiples** sont une évolution identifiée.

**🎤 Q5.6 — « Qu'est-ce que tu n'as PAS eu le temps de faire ? »**
✅ Les mentions @ dans les commentaires (optionnelle non retenue par arbitrage coût/valeur), la
recherche plein-texte, les PJ multiples, les tests automatisés, l'envoi d'emails. Je sais **comment**
je m'y prendrais pour chacune.

❌ **Erreurs à éviter** : prétendre que tout est fait ; confondre le périmètre PERN avec celui de la
version APEX (AD, SMTP, GED NFS) ; présenter une limite comme une faiblesse honteuse plutôt que comme
un arbitrage de périmètre.

---

## 6. Acteurs, utilisateurs et responsabilités

**🟢 Q6.1 — Qui sont les acteurs et que fait chacun ?**
✅ **Demandeur** (employé d'agence/direction) : crée, soumet et suit ses demandes.
**Juriste** (membre DAJ) : prend en charge, analyse, demande des compléments, valide ou rejette.
**Administrateur** (responsable DAJ) : tout ce que fait le juriste **+** gestion des comptes **+**
statistiques globales.

**🔵 Q6.2 — L'Admin est-il « au-dessus » du Juriste métier, ou différent ?**
✅ Il est **un sur-ensemble** : il a les droits métier du juriste **et** des droits de gouvernance
(comptes, stats globales). Dans les faits, c'est le **responsable de la DAJ**.

**⚠️ Q6.3 — Piège : « Un juriste peut-il créer une demande ? »**
✅ **Non.** Créer/soumettre une demande est réservé au **Demandeur propriétaire**. Un juriste qui
tente reçoit une erreur (403). Séparer « qui demande » de « qui traite » est une **règle métier**, pas
un détail technique.

**⚠️ Q6.4 — Piège : « Deux juristes peuvent-ils traiter la même demande ? »**
✅ Une demande est prise en charge par **un seul** juriste (`juriste_id`). Si deux cliquent « Prendre
en charge » en même temps, un seul gagne, l'autre est refusé (409). Cela évite le travail en double
et clarifie la **responsabilité** du dossier.

**🔵 Q6.5 — Le « Demandeur », c'est une personne ou une entité (agence) ?**
✅ Dans les données de démo, les demandeurs représentent des **entités** (Agence Alger Centre,
Direction Commerciale, Agence Oran) : le compte incarne l'initiateur côté métier. Chaque demande
reste rattachée à **un compte** identifié.

**🎬 Q6.6 — Scénario : un juriste part en congé avec 5 dossiers « En cours ».**
✅ Limite actuelle : pas de **réassignation** de dossier prévue dans le périmètre. Aujourd'hui l'admin
verrait ces dossiers dans les stats mais il n'y a pas de bouton « réassigner ». C'est une **évolution
pertinente** à mentionner (gouvernance de la charge).

❌ **Erreurs à éviter** : dire « l'admin est un juriste » sans préciser le **surplus** de droits ;
laisser croire qu'un demandeur peut traiter, ou qu'un juriste peut créer une demande.

---

## 7. Workflows et processus clés

**🟢 Q7.1 — Décris le cycle de vie nominal d'une demande.**
✅ **Brouillon** (saisie) → **Soumise** (envoyée à la DAJ) → **En cours** (un juriste l'a prise en
charge) → **Validée** (avis rendu) *ou* **Rejetée** (avec motif). Deux branches annexes :
**Annulée** (brouillon abandonné) et **Complément demandé** (le juriste renvoie au demandeur).

**🟢 Q7.2 — Les 7 statuts, dans l'ordre, et lesquels sont « terminaux » ?**
✅ Brouillon, Soumise, En cours, Complément demandé (états actifs) ; **Validée, Rejetée, Annulée**
(états **terminaux** = verrouillés, lecture seule définitive).

**🔵 Q7.3 — À quoi sert l'état « Complément demandé » ? Raconte le sous-processus.**
✅ Quand un dossier est incomplet, le juriste ne rejette pas : il **demande un complément** (avec un
commentaire obligatoire expliquant ce qui manque). La demande **repart au demandeur**, qui la
complète et la **resoumet** ; elle revient « En cours » chez le **même** juriste, notifié. C'est la
boucle qui évite les rejets « sèches » et fluidifie la collaboration.

**🔵 Q7.4 — Combien de transitions sont autorisées, et pourquoi si peu ?**
✅ **7 transitions autorisées sur 49** combinaisons possibles (7×7). Le reste est **interdit** par
conception : on ne veut pas qu'une demande saute des étapes ou revienne d'un état terminal. C'est ce
qui garantit un processus **maîtrisé et prévisible**.

**⚠️ Q7.5 — Piège : « Une demande validée par erreur, on peut la rouvrir ? »**
✅ **Non**, un état terminal est **verrouillé à vie** (aucune écriture possible). C'est un choix de
**traçabilité** : une décision juridique rendue ne se « défait » pas silencieusement. En cas
d'erreur, le processus métier serait de créer une **nouvelle** demande — et c'est une limite/évolution
à discuter (pas de mécanisme de correction prévu).

**⚠️ Q7.6 — Piège : « Le demandeur peut annuler une demande déjà en cours de traitement ? »**
✅ **Non.** L'annulation n'est possible qu'au stade **Brouillon**. Une fois soumise, la demande
appartient au processus DAJ ; seul le juriste peut la clôturer (validée/rejetée).

**🎬 Q7.7 — Scénario complet à raconter au jury (le « golden path ») :**
✅ Un demandeur crée une demande sur « Moyens de paiements » → soumet → tous les juristes sont
notifiés → juriste 1 la prend en charge (le demandeur est notifié) → il manque une pièce, il demande
un complément → le demandeur complète et resoumet → le juriste valide avec son avis → le demandeur
est notifié, le tableau de bord se met à jour. **Chaque étape est horodatée et tracée.**

❌ **Erreurs à éviter** : oublier les branches (Complément, Annulée) ; présenter le workflow comme
« quelques statuts » sans insister sur le fait que **les transitions interdites sont le vrai sujet** ;
dire qu'on peut « revenir en arrière » depuis un état terminal.

---

## 8. Règles métier importantes

**🟢 Q8.1 — Cite trois règles métier fortes du système.**
✅ (1) La **sensibilité** d'une demande est **calculée automatiquement** selon le thème ; (2) un état
terminal est **verrouillé** ; (3) valider/rejeter/demander un complément exige une **donnée
obligatoire** (avis / motif / commentaire).

**🔵 Q8.2 — Explique la règle de sensibilité automatique. Pourquoi l'automatiser ?**
✅ Le degré de sensibilité découle du **thème** :
Procuration → **Moyen**, Révision dossier juridique → **Confidentiel**, Moyens de paiements →
**Confidentiel**, Clôture de compte → **Moyen**, Autre → **Faible**.
On l'automatise pour garantir une **classification homogène** : on ne laisse pas chaque demandeur
juger « à la louche » la sensibilité d'un dossier bancaire. C'est une règle **centralisée côté
serveur** (source unique de vérité), donc non contournable.

**🔵 Q8.3 — Pourquoi un avis/motif obligatoire pour clôturer ?**
✅ Parce qu'une décision juridique **sans justification écrite** n'a aucune valeur de traçabilité. La
règle force la qualité : pas de validation « vide », pas de rejet sans motif opposable. Contrainte de
longueur (ex. avis 10–5000 caractères) pour éviter le « ok » lapidaire.

**⚠️ Q8.4 — Piège : « Le demandeur peut changer la sensibilité pour la faire passer inaperçue ? »**
✅ La sensibilité est **pré-remplie automatiquement**. Même si le formulaire la laisse ajustable à la
création, la règle de référence est côté serveur et le **thème** conditionne la classification ; et
c'est le **juriste** qui, en modifiant le thème pendant l'analyse, fait **recalculer** la sensibilité.
La classification n'est donc pas à la main discrétionnaire du demandeur.

**⚠️ Q8.5 — Piège : « Qui peut modifier une demande, et quand ? »**
✅ Seulement le **propriétaire**, et **uniquement** aux stades **Brouillon** ou **Complément
demandé**. Une demande Soumise ou En cours n'est plus modifiable par le demandeur (sinon on changerait
le dossier sous les yeux du juriste). Tentative → refus (409).

**🎬 Q8.6 — Scénario : un juriste requalifie une demande « Autre » en « Moyens de paiements ».**
✅ Il modifie le **thème** (action réservée au juriste, en statut En cours). La **sensibilité passe
automatiquement de Faible à Confidentiel**. Le système applique la règle métier sans intervention
manuelle : la reclassification est cohérente et tracée.

❌ **Erreurs à éviter** : présenter la sensibilité comme un champ libre ; oublier que la règle vit
**côté serveur** (donc non contournable par l'UI) ; dire qu'on peut modifier une demande à n'importe
quel statut.

---

## 9. Données manipulées et cycle de vie

**🟢 Q9.1 — Quelles sont les grandes catégories de données ?**
✅ Les **utilisateurs** (comptes/rôles), les **demandes** (le cœur), l'**historique** des changements
de statut, les **notifications**, et les **commentaires** (fil de discussion optionnel).

**🔵 Q9.2 — Quelle est la donnée la plus « précieuse » et pourquoi ?**
✅ L'**historique des statuts** : c'est la **mémoire opposable** du système. Il est **immuable** (on
ajoute, on ne modifie ni ne supprime jamais). C'est ce qui donne sa valeur juridique/conformité à
l'ensemble.

**🔵 Q9.3 — Quelles données décrivent une demande, au-delà du texte ?**
✅ Titre, thème, description, **degré de sensibilité**, **statut**, la pièce jointe, et surtout les
**dates clés** : création, soumission, traitement — plus les liens vers le **demandeur** et le
**juriste** en charge, et les champs de décision (avis juridique, motif de rejet, commentaire de
complément).

**⚠️ Q9.4 — Piège : « Quand vous supprimez un utilisateur, ses demandes disparaissent ? »**
✅ **On ne supprime jamais physiquement.** Un utilisateur est **désactivé** (`actif = false`).
Pourquoi ? Parce qu'il est référencé par des demandes, de l'historique, des notifications : le
supprimer casserait ces liens et **détruirait la traçabilité**. Un compte désactivé ne peut plus se
connecter mais ses données restent cohérentes.

**⚠️ Q9.5 — Piège : « L'historique, on peut le corriger s'il y a une erreur ? »**
✅ **Non par conception.** L'historique n'accepte que des **ajouts**. Aucune fonction ne permet de le
modifier ou de le supprimer. Un historique « corrigeable » ne serait plus une preuve.

**🎬 Q9.6 — Scénario : un auditeur demande « montrez-moi le parcours complet de la demande #12 ».**
✅ On ouvre la demande : le **journal d'activité (Timeline)** liste chaque transition — date, acteur,
action, commentaire — depuis la soumission jusqu'à la clôture. C'est l'affichage direct de
l'historique immuable.

❌ **Erreurs à éviter** : parler de « suppression » d'utilisateurs/demandes ; présenter l'historique
comme une simple table de logs modifiable ; oublier les **dates** (soumission/traitement) qui portent
la mesure des délais.

---

## 10. Droits, rôles, permissions et gouvernance

**🟢 Q10.1 — Comment les permissions sont-elles organisées ?**
✅ Par **rôle** (Demandeur / Juriste / Admin) **et** par **statut** de la demande. Ce qu'un
utilisateur peut faire dépend du **couple (rôle, statut)** : ex. un juriste voit « Valider / Rejeter /
Complément » seulement sur une demande **En cours**.

**🔵 Q10.2 — Deux dimensions de contrôle se combinent : lesquelles ?**
✅ (1) **L'autorisation par rôle** (a-t-il le droit d'invoquer cette action ?) ; (2) le **contrôle de
propriété** (un demandeur n'agit que sur **ses** demandes). Les deux sont vérifiées **côté serveur** ;
l'interface ne fait que **masquer** les boutons non pertinents.

**🔵 Q10.3 — Qu'est-ce qui relève de la *gouvernance* (pas juste du métier quotidien) ?**
✅ La **gestion des comptes** (création, rôle, activation/désactivation) et l'accès aux
**statistiques globales** : réservés à l'**Admin/responsable DAJ**. C'est le niveau « qui a le droit
d'exister dans le système et qui pilote ».

**⚠️ Q10.4 — Piège : « Si je cache le bouton dans l'interface, c'est sécurisé ? »**
✅ **Non.** Masquer un bouton est du **confort visuel**. La vraie barrière est **côté serveur** : même
en appelant directement l'API, une action non autorisée est refusée (403). Un utilisateur mal
intentionné peut contourner le navigateur ; il ne peut pas contourner le serveur.

**⚠️ Q10.5 — Piège : « Un admin peut-il se désactiver lui-même ? »**
✅ **Non**, garde-fou de gouvernance : un admin ne peut pas se retirer son propre accès (risque de se
verrouiller dehors, ou de laisser le système sans administrateur).

**🎬 Q10.6 — Scénario : un demandeur tape directement l'URL `/utilisateurs` (page admin).**
✅ Double protection : côté client il est **redirigé** vers l'accueil ; et même s'il appelait l'API
des utilisateurs, le serveur répond **403**. La donnée sensible (liste des comptes) ne fuit pas.

❌ **Erreurs à éviter** : dire « c'est sécurisé parce que le bouton est caché » (erreur rédhibitoire
pour un jury sécurité) ; oublier la dimension **propriété** en plus du rôle ; présenter l'admin comme
un « super-utilisateur sans limites » (il a des garde-fous).

---

## 11. Contraintes, risques et points de vigilance

**🟢 Q11.1 — Quelles étaient les grandes contraintes du projet ?**
✅ **Temps** (6 semaines, phases cadencées), **contexte bancaire** (confidentialité, traçabilité),
**refonte imposée** avec une nouvelle stack (PERN), et travail **en solo**.

**🔵 Q11.2 — Quel est le risque fonctionnel n°1, et comment tu le maîtrises ?**
✅ Une demande dans un **état incohérent** (statut changé sans trace, ou transition illégale). Maîtrise
: un **moteur de workflow unique** (source de vérité), une **matrice** des transitions autorisées, et
l'**atomicité** (statut + historique + notification écrits ensemble, ou rien).

**🔵 Q11.3 — Quels risques de *confidentialité* et comment sont-ils traités ?**
✅ Fuite de données entre demandeurs (traitée par le **cloisonnement** : chacun ne voit que ses
demandes) ; fuite de pièces jointes (dossier **non public**, accès contrôlé) ; mots de passe (jamais
en clair). Point de vigilance restant : **JWT en localStorage** (choix académique, moins robuste
qu'un cookie httpOnly en production).

**⚠️ Q11.4 — Piège : « Quel est le point faible que tu assumes ? »**
✅ Plusieurs, **documentés** : pas de tests automatisés (validation manuelle), notifications sans
email, JWT en localStorage, pas de temps réel. Ce sont des **limites de périmètre**, pas des bugs. Les
citer spontanément montre de la **maturité**.

**⚠️ Q11.5 — Piège : « Que se passe-t-il en cas de forte charge / beaucoup d'utilisateurs ? »**
✅ Le polling (30 s) et le mono-serveur suffisent pour la volumétrie d'une DAJ. À grande échelle, il
faudrait passer aux **WebSockets** pour les notifications et penser montée en charge (mise à l'échelle
du serveur, index déjà en place sur les colonnes clés). Ce n'est pas le cas d'usage cible ici.

**🎬 Q11.6 — Scénario : la base tombe en pleine transition de statut.**
✅ Grâce à la **transaction** (tout-ou-rien), soit les 3 écritures ont été validées ensemble, soit
**aucune** — jamais un statut modifié sans historique. Au pire, l'action est à refaire ; la base
reste **cohérente**.

❌ **Erreurs à éviter** : nier les limites ; présenter un risque sans sa **parade** ; confondre
« risque projet » (temps, solo) et « risque produit » (incohérence, fuite).

---

## 12. Architecture fonctionnelle / organisationnelle

**🟢 Q12.1 — Décris l'organisation générale sans jargon.**
✅ Trois parties : une **interface** (ce que voit l'utilisateur), un **cerveau côté serveur** (qui
applique toutes les règles), et une **mémoire** (la base de données). L'interface demande, le serveur
décide, la base conserve.

**🔵 Q12.2 — Principe d'organisation le plus important à retenir ?**
✅ « **La logique est côté serveur.** » L'interface n'a **aucun pouvoir de décision** : elle affiche et
masque, mais toutes les règles (droits, transitions, validations) sont appliquées et vérifiées par le
serveur, seule **barrière de confiance**.

**🔵 Q12.3 — Pourquoi ce découpage est un bon choix *organisationnel* (pas que technique) ?**
✅ Parce qu'il rend le système **maintenable** et **évolutif** : une règle métier change → un seul
endroit à toucher (le moteur) ; la base évolue → un seul endroit (l'accès données). Cela **limite les
régressions** et clarifie « où vit chaque responsabilité ».

**⚠️ Q12.4 — Piège : « Si le frontend masque un bouton, la règle est-elle dans le frontend ? »**
✅ **Non.** Le frontend **reflète** la règle (il masque par confort), mais la règle **existe et est
appliquée** côté serveur. Le masquage n'est qu'une **traduction visuelle** de la matrice de
permissions.

**🎤 Q12.5 — « Explique l'architecture à un non-technicien. »**
✅ L'analogie du **restaurant** : la salle = l'interface (ce que voit le client) ; la cuisine = le
serveur (là où on applique les règles, invisible) ; le garde-manger = la base (le stockage). Le client
ne cuisine jamais lui-même — il passe commande, la cuisine applique les règles.

❌ **Erreurs à éviter** : partir dans les détails techniques (ports, middlewares) face à un public
métier ; laisser entendre que « le site » contient les règles.

---

## 13. Hypothèses, décisions ouvertes et arbitrages

**🟢 Q13.1 — Cite une décision structurante et sa justification.**
✅ Ex : **notifications par polling (30 s) plutôt que WebSocket** → « simple et suffisant » pour la
volumétrie. Ou **VARCHAR + contrainte** plutôt qu'un type figé pour les statuts → plus **facile à
faire évoluer**. Chaque décision est écrite **avec sa raison**.

**🔵 Q13.2 — Donne un arbitrage où tu as sacrifié quelque chose pour autre chose.**
✅ L'optionnelle **« mentions @ »** a été **écartée** : coût (UI complexe) / valeur défavorable dans le
temps imparti. J'ai préféré **finir solidement** les autres optionnelles. Règle que je me suis fixée :
« une optionnelle commencée doit être finie et testée, sinon retirée » → **mieux 3 solides que 6 à
moitié**.

**🔵 Q13.3 — Quelle hypothèse fais-tu sur les utilisateurs / le contexte ?**
✅ Que la **volumétrie** est celle d'une DAJ (dizaines/centaines de demandes, pas des millions), que
les utilisateurs sont **internes** à la banque, et que l'**email** n'est pas indispensable à la V1
(la cloche interne suffit pour démarrer). Ces hypothèses justifient plusieurs choix de simplicité.

**⚠️ Q13.4 — Piège : « Pourquoi ne pas avoir réutilisé la version APEX de Natixis ? »**
✅ Parce que le cadre pédagogique (**deuxième passage**) impose de **refaire avec d'autres outils**. Ce
n'est pas un caprice : c'est l'objectif d'apprentissage. J'ai donc gardé le **même besoin métier** et
changé la **mise en œuvre**.

**⚠️ Q13.5 — Piège : « Pourquoi le code en anglais mais la base en français ? »**
✅ Décision de **conventions** assumée : base et colonnes en **français** (cohérence avec le cahier des
charges et le vocabulaire métier), code JavaScript en **anglais** (standard du milieu), interface et
messages d'erreur en **français** (pour l'utilisateur). Chaque couche parle la langue de son public.

**🎤 Q13.6 — « Une décision que tu regrettes ou que tu prendrais autrement ? »**
✅ Honnêteté maîtrisée : le **JWT en localStorage** — pratique en académique, mais en production je
partirais sur un **cookie httpOnly** (plus résistant au vol de token). Et j'aurais aimé intégrer des
**tests automatisés** plus tôt.

❌ **Erreurs à éviter** : présenter une décision sans sa raison ; dire « j'ai choisi X parce que c'est
mieux » (mieux **pourquoi** ?) ; être incapable de nommer un seul arbitrage (le jury veut voir que tu
as **choisi**, pas subi).

---

## 14. Roadmap, phases suivantes et passage en production

**🟢 Q14.1 — Comment le projet a-t-il été conduit ? (démarche)**
✅ En **7 phases** (P0 conception → P6 livraison), chacune avec des **critères de sortie** à valider
avant de passer à la suivante. La conception (P0) d'abord : « ne pas coder avant d'avoir un plan
précis ». Chaque phase se clôt par une **démo de validation** et un **bilan écrit**.

**🔵 Q14.2 — Quelles sont les évolutions prioritaires (la suite) ?**
✅ (1) **Notifications par email** (SMTP) ; (2) **recherche plein-texte** ; (3) **pièces jointes
multiples** ; (4) **mentions @** dans les commentaires ; (5) **tests automatisés** pour sécuriser les
évolutions. Ordre guidé par la **valeur métier** et la dépendance technique.

**🔵 Q14.3 — Que faudrait-il pour un vrai passage en production ?**
✅ **Hébergement** sécurisé + **HTTPS** ; **intégration à l'annuaire d'entreprise (Active Directory)**
pour l'authentification (comme la version APEX) ; **JWT en cookie httpOnly** ; **emails** ;
**sauvegardes** et plan de reprise ; **tests automatisés** ; éventuellement **montée en charge**. Bref,
passer d'un livrable académique fonctionnel à un service exploitable et supervisé.

**⚠️ Q14.4 — Piège : « C'est déployé et utilisé chez Natixis ? »**
✅ **Non** pour cette version PERN : c'est un **livrable académique** complet et démontrable, **pas**
mis en production. La version **APEX** (le premier projet) était, elle, développée **dans**
l'environnement Natixis. Distingue bien les deux.

**⚠️ Q14.5 — Piège : « Comment gères-tu les montées de version / la maintenance ? »**
✅ Le **découpage en couches** (interface / règles / données) localise chaque changement, et la
**documentation** (conception, workflow, API, écrans, bilans de phase) permet à un tiers de reprendre
le projet. Prochaine étape de robustesse : les **tests automatisés** pour éviter les régressions.

**🎬 Q14.6 — Scénario : la DAJ adopte l'outil et demande « ajoutez l'envoi d'email ». Que réponds-tu ?**
✅ « C'est prévu comme évolution prioritaire. Techniquement, le système notifie déjà en interne à
chaque transition ; il suffit de **brancher un envoi email** sur ces mêmes événements. Le point
d'attention est la **configuration SMTP** et le respect des règles de confidentialité (ne pas mettre
de contenu sensible dans le mail, seulement un lien vers la demande). »

❌ **Erreurs à éviter** : laisser croire que l'appli PERN tourne en production chez Natixis ; présenter
la roadmap comme une « liste de trucs en plus » sans logique de priorité ; oublier l'**AD/annuaire**
et les **emails** dans les prérequis de prod.

---

## 15. Questions difficiles ou critiques

> Les vraies questions « piège » d'un jury exigeant. Entraîne-toi à répondre **calmement** et à
> **assumer**.

**⚔️ Q15.1 — « Finalement, qu'est-ce que tu as vraiment apporté ? Ce genre d'outil existe déjà. »**
✅ Des outils de ticketing existent, oui. La valeur ici est l'**adaptation au métier juridique
bancaire** : workflow spécifique (avis/motif obligatoires, complément), **classification de
sensibilité** automatique, **traçabilité opposable** immuable, et **cloisonnement** strict. Ce n'est
pas un outil générique, c'est un processus métier outillé.

**⚔️ Q15.2 — « Ton projet est-il utile s'il n'est pas déployé ? »**
✅ Oui : c'est une **preuve de faisabilité complète et testée** d'un besoin réel, prête à être
industrialisée. Il démontre la maîtrise du besoin métier **et** de sa réalisation, et sert de **base
concrète** de discussion pour une mise en production.

**⚔️ Q15.3 — « Comment garantis-tu qu'une décision juridique ne peut pas être falsifiée après coup ? »**
✅ Trois mécanismes : l'**historique immuable** (aucun moyen de modifier/supprimer une trace), le
**verrouillage terminal** (une demande clôturée est en lecture seule à vie), et l'**atomicité**
(impossible de changer un statut sans laisser de trace). La falsification silencieuse est
**structurellement** empêchée.

**⚔️ Q15.4 — « Un juriste malhonnête pourrait-il valider sans laisser de trace ? »**
✅ Non : toute validation passe par le **moteur unique** qui écrit **en même temps** la décision,
l'historique (avec l'identité du juriste et l'horodatage) et la notification. Il n'existe **aucun
chemin** pour changer le statut sans historiser.

**⚔️ Q15.5 — « Et la conformité RGPD / protection des données ? »**
✅ Honnêteté cadrée : les données sont **internes** et **cloisonnées** (chacun ne voit que ce qui le
concerne), les mots de passe sont **hachés**, les pièces jointes **non publiques**. Un déploiement
réel exigerait en plus : politique de **conservation/purge**, **chiffrement** au repos, **journalisation
des accès**, et le cadre légal local. Je connais la **direction** à prendre, ce n'est pas fait en V1.

**⚔️ Q15.6 — « Pourquoi devrait-on te faire confiance sur la sécurité ? »**
✅ Parce que je ne me repose pas sur l'interface : **toutes** les règles sont vérifiées côté serveur,
je l'ai **testé** en attaquant directement l'API (accès à la demande d'autrui → refusé, rôle
insuffisant → refusé, transition interdite → refusée). La sécurité est **prouvée par les tests**, pas
affirmée.

**⚔️ Q15.7 — « Qu'est-ce qui te différencie d'un simple exécutant qui a suivi un tuto ? »**
✅ La **démarche** : conception d'abord, décisions **justifiées** et **arbitrées**, phases avec
critères de sortie, limites **assumées et documentées**, et une réflexion sur le **passage en
production**. J'ai construit un **processus**, pas recopié un exemple.

**⚔️ Q15.8 — « Si je te donne 2 semaines de plus, tu fais quoi en premier ? »**
✅ Les **tests automatisés** (pour sécuriser toute évolution future) puis l'**envoi d'email** (plus
forte valeur d'usage immédiate). Je priorise ce qui **réduit le risque** et ce qui **sert le plus
l'utilisateur**, dans cet ordre.

❌ **Erreurs à éviter (transversal)** : se braquer ou bafouiller sur une question critique ; répondre
« je ne sais pas » sec — préfère « je ne l'ai pas implémenté, mais voici comment je m'y prendrais » ;
sur-promettre ; dénigrer l'ancien fonctionnement (email) au lieu d'expliquer **pourquoi** il ne
suffit plus.

---

## Auto-évaluation finale (coche honnêtement)

Pour chaque thème, note-toi **/5** sur « je réponds sans hésiter, avec mes mots » :

| # | Thème | Note /5 | À retravailler |
|---|---|:---:|---|
| 1 | Vision générale | | |
| 2 | Problème / besoin | | |
| 3 | Objectifs | | |
| 4 | Valeur / bénéfices | | |
| 5 | Périmètre / limites | | |
| 6 | Acteurs / responsabilités | | |
| 7 | Workflows | | |
| 8 | Règles métier | | |
| 9 | Données / cycle de vie | | |
| 10 | Droits / gouvernance | | |
| 11 | Contraintes / risques | | |
| 12 | Architecture fonctionnelle | | |
| 13 | Hypothèses / arbitrages | | |
| 14 | Roadmap / production | | |
| 15 | Questions critiques | | |

> **Règle d'or le jour J** : raconte une **histoire** (problème → solution → démo → choix justifiés),
> **assume** tes décisions et tes limites, et ramène toujours une question technique à sa **valeur
> métier**. Un « pourquoi » bien répondu vaut dix fonctionnalités listées.

---

## Historique du document

| Date | Version | Modification |
|---|---|---|
| 11/08/2026 | 1.0 | Création — questionnaire de validation fonctionnel/métier/produit/stratégique (15 thèmes) |
