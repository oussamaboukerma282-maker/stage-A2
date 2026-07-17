-- =============================================================================
--  Projet   : Gestion des Avis Juridiques (PERN)
--  Fichier  : seed.sql — Jeu de données de démonstration
--  Auteur   : BOUKERMA Oussama — CESI Exia A2
-- -----------------------------------------------------------------------------
--  À exécuter APRÈS schema.sql, sur une base fraîchement créée.
--  Les identifiants (SERIAL) sont donc supposés séquentiels :
--    users        : 1 à 6
--    demande_avis : 1 à 15
--
--  Mot de passe de TOUS les comptes de démo : Demo2026!
--  (hash bcrypt, salt factor 12)
-- =============================================================================

-- Nettoyage des données (conserve la structure)
TRUNCATE TABLE commentaires, historique_statuts, notifications, demande_avis, users
    RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. UTILISATEURS (mot de passe : Demo2026!)
-- -----------------------------------------------------------------------------
INSERT INTO users (nom, prenom, email, password_hash, role, structure) VALUES
('Responsable', 'DAJ',      'admin@natixis.dz',      '$2b$12$kkvD0LIrZ2Wl/8SzpsTFSuZuAhcINwQ2vkLfxkC0hEG2heapKlZ/O', 'ADMIN',     'Direction des Affaires Juridiques'),
('Benali',      'Sarah',    'juriste1@natixis.dz',   '$2b$12$kkvD0LIrZ2Wl/8SzpsTFSuZuAhcINwQ2vkLfxkC0hEG2heapKlZ/O', 'JURISTE',   'Direction des Affaires Juridiques'),
('Haddad',      'Karim',    'juriste2@natixis.dz',   '$2b$12$kkvD0LIrZ2Wl/8SzpsTFSuZuAhcINwQ2vkLfxkC0hEG2heapKlZ/O', 'JURISTE',   'Direction des Affaires Juridiques'),
('Meziane',     'Amel',     'demandeur1@natixis.dz', '$2b$12$kkvD0LIrZ2Wl/8SzpsTFSuZuAhcINwQ2vkLfxkC0hEG2heapKlZ/O', 'DEMANDEUR', 'Agence Alger Centre'),
('Cherif',      'Yacine',   'demandeur2@natixis.dz', '$2b$12$kkvD0LIrZ2Wl/8SzpsTFSuZuAhcINwQ2vkLfxkC0hEG2heapKlZ/O', 'DEMANDEUR', 'Direction Commerciale'),
('Boudiaf',     'Nadia',    'demandeur3@natixis.dz', '$2b$12$kkvD0LIrZ2Wl/8SzpsTFSuZuAhcINwQ2vkLfxkC0hEG2heapKlZ/O', 'DEMANDEUR', 'Agence Oran');

-- -----------------------------------------------------------------------------
-- 2. DEMANDES (15) — couvre les 7 statuts
--    Rappel sensibilité : Procuration=Moyen, Révision dossier juridique=Confidentiel,
--    Moyens de paiements=Confidentiel, Clôture de compte=Moyen, Autre=Faible
-- -----------------------------------------------------------------------------

-- 2 BROUILLON (id 1, 2) — dont 1 avec pièce jointe
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, date_creation) VALUES
('Procuration pour client grand compte', 'Procuration', 'Demande d''analyse d''une procuration pour un client entreprise.', 'Moyen', 'Brouillon', 4, '2026-07-14 08:30:00+01');
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, date_creation,
                          piece_jointe_nom, piece_jointe_path, piece_jointe_type, piece_jointe_taille) VALUES
('Révision contrat de prêt', 'Révision dossier juridique', 'Révision d''un contrat de prêt avant signature.', 'Confidentiel', 'Brouillon', 5, '2026-07-15 10:00:00+01',
 'contrat_pret.pdf', 'uploads/seed-contrat-pret.pdf', 'application/pdf', 245760);

-- 3 SOUMISE (id 3, 4, 5)
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, date_creation, date_soumission) VALUES
('Clôture compte litigieux',        'Clôture de compte',      'Procédure de clôture d''un compte en litige.',            'Moyen',        'Soumise', 4, '2026-07-10 09:00:00+01', '2026-07-10 09:15:00+01'),
('Analyse moyen de paiement',       'Moyens de paiements',    'Validation juridique d''un nouveau moyen de paiement.',   'Confidentiel', 'Soumise', 5, '2026-07-11 14:00:00+01', '2026-07-11 14:20:00+01'),
('Question réglementaire diverse',  'Autre problématique',    'Interrogation sur un point réglementaire ponctuel.',      'Faible',       'Soumise', 6, '2026-07-12 11:00:00+01', '2026-07-12 11:05:00+01');

-- 3 EN COURS (id 6, 7, 8)
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, juriste_id, date_creation, date_soumission) VALUES
('Procuration succession',          'Procuration',            'Procuration dans le cadre d''une succession.',            'Moyen',        'En cours', 4, 2, '2026-07-05 09:00:00+01', '2026-07-05 09:30:00+01'),
('Révision garantie bancaire',      'Révision dossier juridique','Révision des clauses d''une garantie bancaire.',       'Confidentiel', 'En cours', 5, 3, '2026-07-06 10:00:00+01', '2026-07-06 10:10:00+01'),
('Clôture compte inactif',          'Clôture de compte',      'Clôture d''un compte inactif depuis 24 mois.',            'Moyen',        'En cours', 6, 2, '2026-07-07 15:00:00+01', '2026-07-07 15:20:00+01');

-- 2 COMPLÉMENT DEMANDÉ (id 9, 10)
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, juriste_id, commentaire_complement, date_creation, date_soumission) VALUES
('Moyen de paiement international',  'Moyens de paiements',    'Validation d''un moyen de paiement à l''international.',   'Confidentiel', 'Complément demandé', 4, 2, 'Merci de joindre le contrat cadre et les conditions générales.', '2026-06-28 09:00:00+01', '2026-06-28 09:30:00+01'),
('Procuration multi-comptes',        'Procuration',            'Procuration couvrant plusieurs comptes.',                 'Moyen',        'Complément demandé', 5, 3, 'Le périmètre des comptes concernés doit être précisé.',          '2026-06-30 14:00:00+01', '2026-06-30 14:15:00+01');

-- 3 VALIDÉE (id 11, 12, 13)
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, juriste_id, avis_juridique, date_creation, date_soumission, date_traitement) VALUES
('Clôture compte client décédé',    'Clôture de compte',      'Clôture suite au décès du titulaire.',                    'Moyen',        'Validée', 6, 2, 'Avis favorable. La clôture peut être réalisée sur présentation de l''acte de décès et de l''acte de notoriété.', '2026-06-01 09:00:00+01', '2026-06-01 09:20:00+01', '2026-06-04 16:00:00+01'),
('Procuration temporaire',          'Procuration',            'Procuration limitée dans le temps.',                      'Moyen',        'Validée', 4, 3, 'Avis favorable sous réserve d''une date d''expiration explicite mentionnée sur le mandat.', '2026-06-10 10:00:00+01', '2026-06-10 10:30:00+01', '2026-06-13 11:00:00+01'),
('Question sur secret bancaire',    'Autre problématique',    'Périmètre du secret bancaire dans un cas précis.',        'Faible',       'Validée', 5, 2, 'Avis rendu : le secret bancaire s''applique, sauf réquisition judiciaire dûment notifiée.', '2026-06-18 13:00:00+01', '2026-06-18 13:15:00+01', '2026-06-20 10:00:00+01');

-- 1 REJETÉE (id 14)
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, juriste_id, motif_rejet, date_creation, date_soumission, date_traitement) VALUES
('Révision dossier incomplet',      'Révision dossier juridique','Demande de révision sans pièces justificatives.',      'Confidentiel', 'Rejetée', 6, 3, 'Dossier rejeté : éléments contractuels manquants malgré la demande de complément.', '2026-06-05 09:00:00+01', '2026-06-05 09:10:00+01', '2026-06-09 15:00:00+01');

-- 1 ANNULÉE (id 15)
INSERT INTO demande_avis (titre, theme, description, degre_sensibilite, statut, demandeur_id, date_creation) VALUES
('Brouillon abandonné',             'Autre problématique',    'Demande créée puis abandonnée par le demandeur.',         'Faible',       'Annulée', 4, '2026-07-01 08:00:00+01');

-- -----------------------------------------------------------------------------
-- 3. HISTORIQUE DES STATUTS (cohérent avec chaque demande)
--    Brouillon : aucune ligne · Soumise : 1 · En cours : 2 ·
--    Complément : 3 · Validée/Rejetée : 3 · Annulée : 1
-- -----------------------------------------------------------------------------

-- Soumise (3,4,5) : Brouillon -> Soumise (par le demandeur)
INSERT INTO historique_statuts (demande_id, user_id, ancien_statut, nouveau_statut, created_at) VALUES
(3, 4, 'Brouillon', 'Soumise', '2026-07-10 09:15:00+01'),
(4, 5, 'Brouillon', 'Soumise', '2026-07-11 14:20:00+01'),
(5, 6, 'Brouillon', 'Soumise', '2026-07-12 11:05:00+01');

-- En cours (6,7,8)
INSERT INTO historique_statuts (demande_id, user_id, ancien_statut, nouveau_statut, created_at) VALUES
(6, 4, 'Brouillon', 'Soumise',  '2026-07-05 09:30:00+01'),
(6, 2, 'Soumise',   'En cours', '2026-07-05 11:00:00+01'),
(7, 5, 'Brouillon', 'Soumise',  '2026-07-06 10:10:00+01'),
(7, 3, 'Soumise',   'En cours', '2026-07-06 13:00:00+01'),
(8, 6, 'Brouillon', 'Soumise',  '2026-07-07 15:20:00+01'),
(8, 2, 'Soumise',   'En cours', '2026-07-08 09:00:00+01');

-- Complément demandé (9,10)
INSERT INTO historique_statuts (demande_id, user_id, ancien_statut, nouveau_statut, commentaire, created_at) VALUES
(9,  4, 'Brouillon', 'Soumise',             NULL, '2026-06-28 09:30:00+01'),
(9,  2, 'Soumise',   'En cours',            NULL, '2026-06-28 14:00:00+01'),
(9,  2, 'En cours',  'Complément demandé',  'Merci de joindre le contrat cadre et les conditions générales.', '2026-06-29 10:00:00+01'),
(10, 5, 'Brouillon', 'Soumise',             NULL, '2026-06-30 14:15:00+01'),
(10, 3, 'Soumise',   'En cours',            NULL, '2026-06-30 16:00:00+01'),
(10, 3, 'En cours',  'Complément demandé',  'Le périmètre des comptes concernés doit être précisé.', '2026-07-01 09:00:00+01');

-- Validée (11,12,13)
INSERT INTO historique_statuts (demande_id, user_id, ancien_statut, nouveau_statut, created_at) VALUES
(11, 6, 'Brouillon', 'Soumise',  '2026-06-01 09:20:00+01'),
(11, 2, 'Soumise',   'En cours', '2026-06-02 09:00:00+01'),
(11, 2, 'En cours',  'Validée',  '2026-06-04 16:00:00+01'),
(12, 4, 'Brouillon', 'Soumise',  '2026-06-10 10:30:00+01'),
(12, 3, 'Soumise',   'En cours', '2026-06-11 09:00:00+01'),
(12, 3, 'En cours',  'Validée',  '2026-06-13 11:00:00+01'),
(13, 5, 'Brouillon', 'Soumise',  '2026-06-18 13:15:00+01'),
(13, 2, 'Soumise',   'En cours', '2026-06-19 09:00:00+01'),
(13, 2, 'En cours',  'Validée',  '2026-06-20 10:00:00+01');

-- Rejetée (14)
INSERT INTO historique_statuts (demande_id, user_id, ancien_statut, nouveau_statut, commentaire, created_at) VALUES
(14, 6, 'Brouillon', 'Soumise',  NULL, '2026-06-05 09:10:00+01'),
(14, 3, 'Soumise',   'En cours', NULL, '2026-06-06 09:00:00+01'),
(14, 3, 'En cours',  'Rejetée',  'Dossier rejeté : éléments contractuels manquants malgré la demande de complément.', '2026-06-09 15:00:00+01');

-- Annulée (15)
INSERT INTO historique_statuts (demande_id, user_id, ancien_statut, nouveau_statut, created_at) VALUES
(15, 4, 'Brouillon', 'Annulée', '2026-07-02 08:30:00+01');

-- -----------------------------------------------------------------------------
-- 4. NOTIFICATIONS (représentatives du workflow)
-- -----------------------------------------------------------------------------

-- Prise en charge -> notifie le demandeur (demandes 6,7,8 en cours)
INSERT INTO notifications (user_id, demande_id, message, lue, created_at) VALUES
(4, 6, 'Votre demande #6 est en cours de traitement.', TRUE,  '2026-07-05 11:00:00+01'),
(5, 7, 'Votre demande #7 est en cours de traitement.', FALSE, '2026-07-06 13:00:00+01'),
(6, 8, 'Votre demande #8 est en cours de traitement.', FALSE, '2026-07-08 09:00:00+01');

-- Complément demandé -> notifie le demandeur (9,10)
INSERT INTO notifications (user_id, demande_id, message, lue, created_at) VALUES
(4, 9,  'Complément requis sur votre demande #9.',  FALSE, '2026-06-29 10:00:00+01'),
(5, 10, 'Complément requis sur votre demande #10.', FALSE, '2026-07-01 09:00:00+01');

-- Validée -> notifie le demandeur (11,12,13)
INSERT INTO notifications (user_id, demande_id, message, lue, created_at) VALUES
(6, 11, 'Votre demande #11 a été validée.', TRUE, '2026-06-04 16:00:00+01'),
(4, 12, 'Votre demande #12 a été validée.', TRUE, '2026-06-13 11:00:00+01'),
(5, 13, 'Votre demande #13 a été validée.', TRUE, '2026-06-20 10:00:00+01');

-- Rejetée -> notifie le demandeur (14)
INSERT INTO notifications (user_id, demande_id, message, lue, created_at) VALUES
(6, 14, 'Votre demande #14 a été rejetée.', FALSE, '2026-06-09 15:00:00+01');

-- Nouvelles demandes soumises -> notifient les juristes (exemple sur les 3 Soumise)
INSERT INTO notifications (user_id, demande_id, message, lue, created_at) VALUES
(2, 3, 'Nouvelle demande #3 soumise par Amel Meziane.',  FALSE, '2026-07-10 09:15:00+01'),
(3, 3, 'Nouvelle demande #3 soumise par Amel Meziane.',  FALSE, '2026-07-10 09:15:00+01'),
(2, 4, 'Nouvelle demande #4 soumise par Yacine Cherif.', FALSE, '2026-07-11 14:20:00+01'),
(3, 4, 'Nouvelle demande #4 soumise par Yacine Cherif.', FALSE, '2026-07-11 14:20:00+01'),
(2, 5, 'Nouvelle demande #5 soumise par Nadia Boudiaf.', FALSE, '2026-07-12 11:05:00+01'),
(3, 5, 'Nouvelle demande #5 soumise par Nadia Boudiaf.', FALSE, '2026-07-12 11:05:00+01');

-- =============================================================================
-- Fin du seed. Récapitulatif :
--   6 utilisateurs · 15 demandes (2 Brouillon, 3 Soumise, 3 En cours,
--   2 Complément, 3 Validée, 1 Rejetée, 1 Annulée)
--   Historique et notifications cohérents.
-- =============================================================================
