# Changelog

## 1.4.0 - 2026-07-18

*   **API REST Parcours :** Création du contrôleur `Parcours_Controller` pour exposer la route `GET /roi/v1/parcours` permettant d'obtenir l'arborescence complète des cours, playlists, chapitres, couleurs de chapitre et niveaux.
*   **Tri multi-critères :** Implémentation d'un tri strict sur le parcours par Niveau (ascendant), puis par Chapitre (ordre personnalisé de progression), et enfin par Ordre (menu_order ascendant).
*   **Correction et uniformisation de la progression :**
    - Ajout du point d'accès `GET /roi/v1/progression` permettant à l'élève de récupérer les éléments validés.
    - Uniformisation des rôles : Remplacement du rôle `'adherent'` obsolète par `'membre'` dans les vérifications et requêtes de progression.
    - Élargissement des permissions : Autorisation d'accès aux profils `membre`, `administrator`, `entraineur` et `staff`.

## 1.3.1 - 2026-07-17

*   **Alignement Visuel & UX des Éditeurs :** 
    *   Uniformisation de `PgnEditor` avec `FenEditor` : retrait de la barre d'outils de dessin au clic gauche au profit du dessin au clic droit/drag natif.
    *   Ajout d'un encart d'information "Annotations" explicatif sous l'échiquier.
    *   Désélection automatique et sortie du mode édition vers le mode prévisualisation lors du clic sur le bouton "Appliquer" ou "Valider" pour les deux blocs Gutenberg (`roi/diagramme` et `roi/pgn`).
*   **Ajustements de l'Éditeur PGN (`roi/pgn`) :**
    *   Déplacement du bloc "Importer un PGN" vers la colonne de droite, au-dessus du PGN en direct.
    *   Déplacement de la barre de navigation sous l'échiquier (dans les deux modes d'édition et de prévisualisation).
    *   Déplacement du bouton "Copier la FEN actuelle" juste au-dessus du bouton de validation.
    *   Boîte d'importation améliorée pour auto-détecter et charger aussi bien une FEN (créant un SetUp = 1) qu'un PGN standard.
    *   Épuration de la prévisualisation Gutenberg du bloc (plus de texte superflu, affichage uniquement de l'échiquier et de la barre de boutons).
*   **Corrections de bugs de navigation et d'entêtes (Upstream/BoardCore) :**
    *   Correction de la perte des entêtes PGN (headers) et de la FEN initiale lors des ajouts de commentaires ou tracés de formes.
    *   Correction du bug empêchant la navigation en arrière dans l'historique d'un PGN basé sur une FEN personnalisée.

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

## 1.2.0 - 2026-06-15
