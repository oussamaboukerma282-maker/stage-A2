-- =============================================================================
--  Projet   : Gestion des Avis Juridiques (refonte PERN)
--  Fichier  : schema.sql — Création complète de la base de données
--  Auteur   : BOUKERMA Oussama — CESI Exia A2
--  SGBD     : PostgreSQL 15+
--  Version  : 1.0 (Phase 0 — Conception)
-- -----------------------------------------------------------------------------
--  Ce script est IDEMPOTENT : il peut être exécuté plusieurs fois de suite.
--  Les DROP en tête suppriment les tables dans l'ordre inverse des dépendances.
--  Ordre de création : users -> demande_avis -> (notifications,
--  historique_statuts, commentaires).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Réinitialisation (ordre inverse des dépendances)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS commentaires        CASCADE;
DROP TABLE IF EXISTS historique_statuts  CASCADE;
DROP TABLE IF EXISTS notifications       CASCADE;
DROP TABLE IF EXISTS demande_avis        CASCADE;
DROP TABLE IF EXISTS users               CASCADE;

-- =============================================================================
-- 1. TABLE users
--    Comptes des trois types d'acteurs : DEMANDEUR, JURISTE, ADMIN.
--    On ne supprime jamais physiquement un compte (intégrité des FK) :
--    le champ "actif" permet de désactiver un utilisateur.
-- =============================================================================
CREATE TABLE users (
    id             SERIAL        PRIMARY KEY,
    nom            VARCHAR(100)  NOT NULL,
    prenom         VARCHAR(100)  NOT NULL,
    email          VARCHAR(200)  NOT NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    role           VARCHAR(20)   NOT NULL DEFAULT 'DEMANDEUR',
    structure      VARCHAR(150),
    actif          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email  UNIQUE (email),
    CONSTRAINT ck_users_role   CHECK (role IN ('DEMANDEUR', 'JURISTE', 'ADMIN'))
);

-- =============================================================================
-- 2. TABLE demande_avis
--    Entité centrale. Porte le statut du workflow et une pièce jointe unique.
--    Le champ "statut" n'est modifié QUE par le moteur de workflow (service),
--    jamais par un UPDATE direct depuis un controller.
-- =============================================================================
CREATE TABLE demande_avis (
    id                      SERIAL        PRIMARY KEY,
    titre                   VARCHAR(250)  NOT NULL,
    theme                   VARCHAR(100)  NOT NULL,
    description             TEXT          NOT NULL,
    degre_sensibilite       VARCHAR(50)   NOT NULL,
    statut                  VARCHAR(50)   NOT NULL DEFAULT 'Brouillon',

    -- Acteurs
    demandeur_id            INTEGER       NOT NULL,
    juriste_id              INTEGER,                 -- NULL tant que non pris en charge

    -- Contenu métier produit par le juriste
    avis_juridique          TEXT,                    -- rempli à la validation
    commentaire_complement  TEXT,                    -- rempli à la demande de complément
    motif_rejet             TEXT,                    -- rempli au rejet

    -- Pièce jointe (une seule, stockée sur disque, métadonnées ici)
    piece_jointe_nom        VARCHAR(255),            -- nom original
    piece_jointe_path       VARCHAR(500),            -- chemin /uploads/<uuid>.<ext>
    piece_jointe_type       VARCHAR(100),            -- type MIME
    piece_jointe_taille     INTEGER,                 -- octets

    -- Dates du cycle de vie
    date_creation           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    date_soumission         TIMESTAMPTZ,             -- au passage Soumise
    date_traitement         TIMESTAMPTZ,             -- à la clôture (Validée/Rejetée)

    CONSTRAINT fk_demande_demandeur
        FOREIGN KEY (demandeur_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_demande_juriste
        FOREIGN KEY (juriste_id)   REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT ck_demande_statut CHECK (statut IN (
        'Brouillon', 'Soumise', 'En cours',
        'Complément demandé', 'Validée', 'Rejetée', 'Annulée'
    )),
    CONSTRAINT ck_demande_sensibilite CHECK (degre_sensibilite IN (
        'Faible', 'Moyen', 'Confidentiel'
    )),
    CONSTRAINT ck_demande_taille CHECK (
        piece_jointe_taille IS NULL OR piece_jointe_taille <= 10485760  -- 10 Mo
    )
);

-- =============================================================================
-- 3. TABLE notifications
--    Notifications internes (aucun email). Une notification cible un
--    utilisateur et référence en général la demande concernée.
-- =============================================================================
CREATE TABLE notifications (
    id          SERIAL        PRIMARY KEY,
    user_id     INTEGER       NOT NULL,
    demande_id  INTEGER,                            -- NULL possible (notif système)
    message     VARCHAR(500)  NOT NULL,
    lue         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notif_user
        FOREIGN KEY (user_id)    REFERENCES users(id)        ON DELETE RESTRICT,
    CONSTRAINT fk_notif_demande
        FOREIGN KEY (demande_id) REFERENCES demande_avis(id) ON DELETE RESTRICT
);

-- =============================================================================
-- 4. TABLE historique_statuts
--    Journal IMMUABLE des transitions de statut (INSERT uniquement).
--    Alimenté par le moteur de workflow, dans la même transaction que
--    l'UPDATE de demande_avis. Sert au journal d'activité (EF17, EF18).
-- =============================================================================
CREATE TABLE historique_statuts (
    id              SERIAL       PRIMARY KEY,
    demande_id      INTEGER      NOT NULL,
    user_id         INTEGER      NOT NULL,           -- auteur de la transition
    ancien_statut   VARCHAR(50),                     -- NULL à la création
    nouveau_statut  VARCHAR(50)  NOT NULL,
    commentaire     TEXT,                            -- commentaire éventuel
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hist_demande
        FOREIGN KEY (demande_id) REFERENCES demande_avis(id) ON DELETE RESTRICT,
    CONSTRAINT fk_hist_user
        FOREIGN KEY (user_id)    REFERENCES users(id)        ON DELETE RESTRICT
);

-- =============================================================================
-- 5. TABLE commentaires  (OPTIONNELLE — OPT01)
--    Fil de discussion interne sur une demande. Conçue dès la Phase 0,
--    activée seulement si la fonctionnalité optionnelle est développée.
-- =============================================================================
CREATE TABLE commentaires (
    id          SERIAL       PRIMARY KEY,
    demande_id  INTEGER      NOT NULL,
    auteur_id   INTEGER      NOT NULL,
    contenu     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_comm_demande
        FOREIGN KEY (demande_id) REFERENCES demande_avis(id) ON DELETE RESTRICT,
    CONSTRAINT fk_comm_auteur
        FOREIGN KEY (auteur_id)  REFERENCES users(id)        ON DELETE RESTRICT
);

-- =============================================================================
-- 6. INDEX
--    Optimisent les requêtes de liste, de filtrage et de comptage.
-- =============================================================================
CREATE INDEX idx_demande_statut       ON demande_avis (statut);
CREATE INDEX idx_demande_demandeur    ON demande_avis (demandeur_id);
CREATE INDEX idx_demande_juriste      ON demande_avis (juriste_id);
CREATE INDEX idx_demande_theme        ON demande_avis (theme);
CREATE INDEX idx_notif_user_lue       ON notifications (user_id, lue);
CREATE INDEX idx_hist_demande         ON historique_statuts (demande_id);
CREATE INDEX idx_comm_demande         ON commentaires (demande_id);

-- =============================================================================
-- Fin du script.
-- =============================================================================
