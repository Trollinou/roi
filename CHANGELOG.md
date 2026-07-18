# Changelog

## 1.3.0 - 2026-07-16

*   **Alignement Visuel & UX des Éditeurs :** 
    *   Uniformisation de `PgnEditor` avec `FenEditor` : retrait de la barre d'outils de dessin au clic gauche au profit du dessin au clic droit/drag natif.
    *   Ajout d'un encart d'information "Annotations" explicatif sous l'échiquier (sans aide textuelle superflue).
    *   Désélection automatique et sortie du mode édition vers le mode prévisualisation lors du clic sur le bouton "Appliquer" ou "Valider" pour les deux blocs Gutenberg (`roi/diagramme` et `roi/pgn`).
*   **Ajustements de l'Éditeur PGN (`roi/pgn`) :**
    *   Déplacement du bloc "Importer un PGN" vers la colonne de droite, au-dessus du PGN en direct.
    *   Déplacement de la barre de navigation sous l'échiquier (dans les deux modes d'édition et de prévisualisation).
    *   Déplacement du bouton "Copier la FEN actuelle" juste au-dessus du bouton de validation.
    *   Boîte d'importation améliorée pour auto-détecter et charger aussi bien une FEN (créant un SetUp = 1) qu'un PGN standard.
    *   Épuration de la prévisualisation Gutenberg du bloc (plus de texte superflu, affichage uniquement de l'échiquier et de la barre de boutons).
*   **Corrections de bugs de navigation et d'entêtes (Upstream/BoardCore) :**
    *   Correction de la perte des entêtes PGN (headers) et de la FEN initiale lors des ajouts de commentaires ou tracés de formes dans `BoardCore`.
    *   Correction du bug empêchant la navigation en arrière dans l'historique d'un PGN basé sur une FEN personnalisée.
*   **Blocs Gutenberg Diagramme & PGN :** Création et intégration de deux nouveaux blocs natifs :
    *   **Diagramme ROI (`roi/diagramme`)** : permettant d'intégrer des échiquiers statiques configurés via une position FEN et une orientation données, avec l'éditeur `window.RoiFenEditor`.
    *   **Partie PGN ROI (`roi/pgn`)** : pour l'affichage de parties complètes au format PGN à l'aide de l'éditeur `window.RoiPgnEditor`.
*   **Enregistrement PHP standardisé :** Création de `\ROI\Blocks\Manager` pour l'enregistrement propre et natif des configurations `block.json` depuis le dossier de build.
*   **Mise à jour Webpack :** Intégration des points d'entrée et gestion des copies des métadonnées de blocs.
*   **Éditeur de position FEN (Administration) :** Intégration d'un éditeur graphique React autonome pour configurer la FEN de départ d'un exercice directement depuis la metabox via une fenêtre modale.
*   **Découplage complet de Gutenberg :** Création d'un point d'entrée webpack isolé (`src/admin-fen-editor.js` et `eg-chessboard.css`) pour l'administration. L'éditeur FEN et `eg-chessboard` sont 100% indépendants du bloc Gutenberg `chessboard`, permettant de modifier ou supprimer le bloc sans casser l'administration.
*   **Plateau de travail épuré :** Remplacement de l'ancien plateau d'exercice par une instanciation directe et propre de `EgBoardCore` sans les surcharges Gutenberg (pendules, captures matérielles, etc.).
*   **Optimisation de l'agencement responsive :** Restructuration fixe de la modale (flexbox) et adaptation automatique de l'échiquier sur les écrans de faible hauteur (`@media (max-height: 750px)`) pour éliminer définitivement les barres de défilement et libérer de l'espace.
*   **Synchronisation de l'orientation :** Répercussion automatique de l'orientation sélectionnée dans la modale vers le champ d'orientation principal de l'exercice lors de la sauvegarde.
*   **Correctifs d'Assurance Qualité (QA) :** Résolution complète de 9 avertissements PHPStan et mise en place d'un linter ESLint (conforme à `AGENTS.md`).
*   **16 Types d'exercices :** Configuration complète de la liste avec 16 types d'exercices distincts.
*   **Champs de niveau et de chapitre :** Ajout des métadonnées de niveau (1 à 6), chapitre et couleur de chapitre dans la Metabox de l'exercice et sauvegarde sécurisée.
*   **Ordonnancement :** Ajout d'un champ numérique pour l'ordre d'affichage dans le chapitre.
*   **Triage dans l'API REST :** Les exercices retournés par l'API REST globale de listing sont triés selon l'ordre d'affichage et la réponse est allégée (sans la configuration JSON lourde).
*   **API REST Exercice individuel :** Modification de la clé de retour `title` en `titre` pour la faire correspondre à celle de l'API de liste (`obtenir_liste_exercices`).
*   **Suivi des progressions :** Création du contrôleur dédié `includes/REST/Progression.php` gérant la route `POST /wp-json/roi/v1/progression` (enregistrement d'une réussite par l'adhérent connecté sous la clé `_roi_exercice_reussi`) et la route `GET /wp-json/roi/v1/progression/groupe` (consultation groupée des réussites d'exercices réservée aux entraîeurs/administrateurs).
*   **API REST Parcours :** Création du contrôleur `Parcours_Controller` pour exposer la route `GET /roi/v1/parcours` permettant d'obtenir l'arborescence complète des cours, playlists, chapitres, couleurs de chapitre et niveaux.
*   **Tri multi-critères :** Implémentation d'un tri strict sur le parcours par Niveau (ascendant), puis par Chapitre (ordre personnalisé de progression), et enfin par Ordre (menu_order ascendant).
*   **Correction et uniformisation de la progression :**
    - Ajout du point d'accès `GET /roi/v1/progression` permettant à l'élève de récupérer les éléments validés.
    - Uniformisation des rôles : Remplacement du rôle `'adherent'` obsolète par `'membre'` dans les vérifications et requêtes de progression.
    - Élargissement des permissions : Autorisation d'accès aux profils `membre`, `administrator`, `entraineur` et `staff`.
*   **Configuration du Plugin :**
    - Création d'une page de configuration d'administration (sous Apprentissage > Configuration) pour sélectionner les rôles autorisés à accéder au module d'apprentissage (`roi_apprentissage_allowed_roles`).
    - Enregistrement de l'endpoint REST public `/roi/v1/config` renvoyant les rôles autorisés.
    - Modification de la méthode `obtenir_progression_groupe` pour récupérer tous les comptes utilisateurs ayant un rôle autorisé à la place du rôle unique `membre`.
    - Sécurisation de tous les endpoints REST (Parcours, Contenu, Progression) pour valider l'accès selon les rôles autorisés configurés.
*   **API REST & Tableau de Suivi (Isolation par Identité) :**
    - Prise en charge du header HTTP `X-Selected-Identity` pour stocker et lire la progression des leçons et exercices de manière étanche par profil (ex: `_roi_element_valide_{identity_id}`).
    - Amélioration de `obtenir_progression_groupe` pour lire toutes les progressions d'identités associées à chaque utilisateur et renvoyer des lignes séparées pour le tableau de suivi.
    - Ajout d'une clé de réponse `display_id` contenant le vrai ID adhérent (ou l'ID WP pour les profils virtuels admin) pour un affichage propre dans l'interface de suivi.
    - Mise à jour de la réinitialisation de progression (`reset_progression_cours`) pour décoder l'ID d'identité composite et vider uniquement sa progression isolée.

## 1.2.0 - 2026-06-15

*   **Migration vers `eg-chessboard` :** Remplacement complet de l'ancien dépôt `gutemberg-chessboard` par la bibliothèque partagée moderne `eg-chessboard` (basée sur Chessground et chess.js), déclarée comme dépendance locale (`file:`).
*   **Compilation WordPress intégrée :** Le bloc Gutenberg et son script de visualisation front-end sont désormais compilés localement via `@wordpress/scripts` dans `build/chessboard/`.
*   **Intégration Stockfish duale :** Support des configurations de moteurs d'analyse indépendants pour les blancs et les noirs, avec détection de la triple répétition de position.
*   **Nettoyage & Standardisation :** Renommage du bloc en `roi/chessboard`, des classes CSS en `.chessboard-block` et du textdomain de traduction en `roi`. Suppression de l'ancien sous-dossier `includes/chess/dist/` et du script obsolète `update-chessboard.cjs`.

## 1.1.1 - 2026-06-04

*   **Réorganisation des Metaboxes Partie :** Déplacement des métadonnées vers un panneau latéral (`side`) et intégration du visualiseur de PGN interactif en zone centrale (`normal`).
*   **Lecteur PGN Interactif :** Ajout de boutons de navigation pas-à-pas et d'une liste cliquable des coups.
*   **Correction du rendu Chessground :** Suppression des styles en ligne forçant la hauteur, rétablissant le ratio carré 1:1 de Chessground.
*   **Compatibilité et décodage PGN :** Intégration du décodage automatique des entités HTML et de la normalisation des espacements pour éviter les erreurs de parsing avec `chess.js`.

## 1.1.0 - 2026-06-04

*   **Refonte complète en POO :** Conversion de l'intégralité du code procédural du plugin vers une architecture orientée objet standardisée (classes sous le namespace `ROI\`, SPL autoloader natif, typage strict PHP 8.4).
*   **Découpage granulaire :** Séparation des Custom Post Types dans des fichiers de classe individuels (`Lecon`, `Exercice`, `Cours`, `Partie`), isolation de l'intégration du moteur d'échecs (`ChessEngine`), et centralisation des modules dans une classe principale de bootstrap (`Plugin`).
*   **Scripts npm multiplateformes :** Remplacement de `package.sh` par un script Node.js cross-platform (`package.cjs`) pour assurer le packaging sous Windows, macOS et Linux.
*   **Standardisation des assets :** Renomage des fichiers JS publics selon les normes `{contexte}-{composant}.js`.
*   **Contrôle anti-doublons (API) :** Implémentation d'une détection anti-doublons sur le endpoint `POST /roi/v1/games` bloquant les soumissions identiques (basé sur le couple Adhérent / PGN).
*   **Metabox Partie dédiée :** Création de la classe modulaire `Partie` pour afficher de manière structurée les métadonnées de jeu (Adhérent avec lien cliquable, ELO Stockfish, Aides, Oups, Durée formatée et PGN).
*   **Refactoring des Metaboxes :** Découpage de l'ancienne classe monolithique `Admin/Metaboxes.php` en classes isolées et typées (`Lecon.php`, `Exercice.php`, `Cours.php`) sous `includes/Metaboxes/` et migration des notices administratives vers `Admin/Menu.php`.
*   **Éditeur classique et CPT :** Désactivation de Gutenberg (`show_in_rest => false`) sur les CPT `roi_lecon`, `roi_exercice`, `roi_cours` et `roi_partie` pour restaurer l'éditeur classique, et masquage de l'éditeur de texte principal (`supports`) sur le CPT `roi_cours`.

## 1.0.7 - 2026-06-04


*   **CPT Parties (`roi_partie`) :** Enregistrement d'un nouveau type de contenu personnalisé pour stocker les parties jouées.
*   **API REST de sauvegarde :** Ajout d'une route `POST /roi/v1/games` sécurisée permettant de sauvegarder les parties terminées (ID adhérent, difficulté ELO, nombre d'aides et d'annulations, PGN, durée en secondes et date de fin de partie).
*   **Intégration et mode hors-ligne :** Gestion de la fin de partie définitive et mise en file d'attente locale (`localStorage`) avec synchronisation automatique au retour de la connexion réseau.

## 1.0.6 - 2026-06-03

*   **Remplacement complet de l'échiquier :**
    *   Remplacement de la bibliothèque `cm-chessboard` obsolète par le bloc moderne `gutemberg-chessboard` basé sur **Chessground** (l'échiquier Lichess) et **chess.js**.
    *   **Contrôles frontend visiteurs intégrés** : Ajout de boutons réactifs sous l'échiquier (Nouvelle partie, Retourner le plateau, Annuler le coup).
    *   **Mise en place d'un dialogue de configuration** : Permet au visiteur de choisir sa couleur et de régler sa force ELO au lancement d'une partie avec Stockfish.
    *   **Mode libre (Free Move)** : Ajout d'une option permettant aux blancs et aux noirs de jouer librement sans validation de tour stricte dans l'éditeur et sur le site (pratique pour l'élaboration de leçons).
    *   **Barre d'évaluation & Stockfish** : Intégration directe du moteur Stockfish avec barre d'évaluation dynamique.

