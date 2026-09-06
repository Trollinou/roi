# Changelog

## [Unreleased]

*   **Validation Manuelle & Entraînement Club (`Progression_Controller.php`, `StudentDetailModal.jsx`, `SuiviApp.jsx`, `AddStudentModal.jsx`) :**
    *   **Réutilisation & Extension de `POST /roi/v1/progression` :** Prise en charge du paramètre `student_id` pour les entraîneurs/administrateurs (`check_entraineur_permissions`), avec validation granulaire par `element_id` ou de l'ensemble d'un cours via `course_id`.
    *   **Traçabilité Club :** Enregistrement des validations manuelles avec `source: 'club'`, `time_spent: 0`, `attempts: 1`. Affichage du badge `Club` sur les éléments validés dans la vue détaillée.
    *   **Bouton d'Action Réversible « Effectuer » / « Réinitialiser » :** Sur chaque ligne d'exercice/leçon non complétée, affichage d'un bouton vert « Effectuer » pour valider la réalisation au club en un clic, qui bascule automatiquement en « ↺ Réinitialiser » dès validation.
    *   **Validation Complète de Cours :** Ajout du bouton vert « ✓ Valider le cours » dans l'en-tête de chaque cours de la modale détaillée et d'un raccourci rapide « ✓ » sur la carte générale de l'élève.
    *   **Ajout d'Élève au Suivi (« ＋ Ajouter un élève ») & Fiabilisation du Rattachement :** Intégration d'un bouton dans le bandeau supérieur ouvrant une modale interactive (`AddStudentModal`). Affichage enrichi des candidats avec date de naissance et nom du représentant légal (`legal_rep`). Résolution rigoureuse du compte utilisateur WP par compte propre, métadonnées ou emails des représentants légaux (suppression du fallback erroné `post_author`).
    *   **Retrait d'un Élève du Suivi :** Ajout de la route REST `POST /roi/v1/progression/retirer-eleve` et d'un bouton « 🗑 Retirer de la liste de suivi » dans le pied de page de la modale détaillée avec confirmation explicite.
    *   **Liens Directs de Vérification :** Rendu cliquable de tous les identifiants affichés (`Adhérent #ID` vers `/wp-admin/post.php?post=ID`, `Compte WP #ID` et `Rattaché à : ... (#ID)` vers `/wp-admin/user-edit.php?user_id=ID`).
    *   **Dédoublonnage des Comptes Parents :** Masquage automatique de la clé brute historique `_roi_element_valide` sur les comptes conteneurs parentaux dès lors que des profils de membres adhérents (`_roi_element_valide_member_*`) sont suivis.
    *   **Persistance des Élèves avec 0 Élément Validé :** Maintien dans le tableau de bord des élèves ayant une identité suivie même sans exercice complété (ex: après réinitialisation totale ou nouvel ajout).

## [1.4.7] - 2026-08-31

*   **Suivi Approfondi des Élèves & Chronométrage des Exercices (`Progression_Controller.php`, `StudentDetailModal.jsx`, `SuiviApp.jsx`, `Suivi_Page.php`) :**
    *   **Vue Détaillée par Élève (Modale Interactive) :** Déclenchement au clic sur la Card d'un élève ou via le lien `🔍 Détails`. Affiche le taux global, le temps cumulé, des filtres rapides (*Tous / Validés / À faire*), ainsi que l'arborescence complète organisée par Niveau, Chapitre et Cours avec accordéons repliables.
    *   **Alignement Structuré (Grille CSS) :** Présentation en colonnes parfaitement alignées (Type & Titre avec décodage d'entités HTML, Statut & Date de complétion, Chronomètre & Moyenne du groupe, Bouton d'action).
    *   **Mesure & Comparaison des Temps :** Enregistrement du temps passé (`time_spent`) et des tentatives dans `_roi_element_valide_{identity}`. Calcul dynamique des moyennes du groupe et affichage d'indicateurs visuels de vitesse (⚡ *Rapide*, *Moyenne*, ⏱ *Plus long*).
    *   **Réinitialisation Granulaire :** Support du paramètre `element_id` sur la route `POST /roi/v1/progression/reset` permettant à l'entraîneur de réinitialiser un exercice/leçon individuel sans réinitialiser tout le cours.
    *   **Robustesse du Défilement & Cache Busting :** Défilement vertical fluide de la modale (`overflow-y: auto`, `min-height: 0`) et cache-busting automatique des assets via `filemtime`.

*   **Mutualisation de Stockfish & Allègement du Plugin (`ChessEngine.php`, `view.jsx`, `webpack.config.js`) :**
    *   **Délégation à DAME-PWA :** Suppression des binaires physiques locaux `stockfish.js` et `stockfish.wasm` (~7.3 Mo) dans `assets/js/` ainsi que des tâches de copie Webpack associées.
    *   **Suppression du Contrôleur REST :** Élimination de `Stockfish_Controller.php` et de la route `/wp-json/roi/v1/stockfish-wasm` au profit de la gestion native des MIME types WASM par DAME-PWA.
    *   **Résolution Dynamique du Web Worker :** Consommation du filtre `dame_pwa_stockfish_worker_url` en PHP avec transmission au front-end via `wp_localize_script('roi-public-chessboard-view', 'roiChessConfig')` et attribut HTML `data-stockfish-worker-url`.

## [1.4.6] - 2026-08-30

*   **Aperçus PGN & Filtrage des Shapes d'Annotation (`controls.js`, `FenEditor.jsx`) :**
    *   **Isolation Stricte des Annotations Racine :** Correction de la réapparition des formes graphiques (`[%csl ...]`, `[%cal ...]`) de l'ensemble de la partie sur l'échiquier d'aperçu initial lors du collage d'un PGN (Exercices Type 4 et Type 3). L'extraction via `parsePgn` filtre et n'affiche désormais que les formes de la position de départ (`game.comments` à la racine avant tout coup).
    *   **Alignement de l'Éditeur FEN (`parsePgnOrFen`) :** Application du même filtrage strict sur l'import de PGN dans la modale d'édition FEN / Diagramme.


## [1.4.5] - 2026-08-30

*   **Composants Auteur PGN & Validation (`PgnInput.php`, `controls.js`, `type-3.js`, `type-4.js`) :**
    *   **Contrôle Visuel de Validité PGN (`updatePgnStatus`, `checkPgnStatus`) :** Ajout d'un bandeau de statut temps réel sous chaque champ de saisie PGN (vert pour séquence valide avec coups, jaune si position seule sans coup solution détecté, rouge si format invalide).
    *   **Aperçus Dynamiques Statiques (`extractFenOrientationAndShapes`) :** Extraction robuste des positions FEN personnalisées (y compris partielles), orientation dynamique selon le trait et restitution visuelle des formes et flèches initiales (`[%csl ...]`, `[%cal ...]`).
    *   **Synchronisation et Cohérence UI :** Intégration homogène dans les constructeurs Type 3 (ABCDaire Tactique) et Type 4 (La Partie dont tu es le Héros).

## [1.4.4] - 2026-08-30

*   **Exercice Type 4 La Partie dont tu es le Héros (`TypePartieHeros.php`, `type-4.js`, `Contenu_Controller.php`) :**
    *   **Refonte du Constructeur Auteur (Étude PGN Unique) :** Simplification radicale de la saisie via un champ `PgnInput` unique (textarea 8 lignes et modale d'édition interactive PGN) pour accueillir une étude PGN complète avec annotations de flèches `[%cal ...]` et variantes.
    *   **Aperçu Visuel Statique Épuré :** Restriction de l'extraction des formes (`[%cal ...]`, `[%csl ...]`) au seul commentaire initial avant le coup 1 dans `type-4.js` et `type-3.js`, évitant d'afficher toutes les flèches des coups futurs sur la position de départ.
    *   **Sécurisation API REST (`GET /roi/v1/contenu/<id>`) :** Prise en charge universelle du format de configuration (tableau PHP, chaîne JSON, unslashed ou fallback `raw_json`).
    *   **Contrat JSON Épuré :** Format standard `{ consigne: "...", pgn: "..." }` allégeant la saisie entraîneur et déléguant l'analyse interactive au moteur PWA runtime.

*   **Exercice Type 3 ABCDaire Tactique — Série de 4 Mini-PGN (`TypeABCDaire.php`, `type-3.js`, `main.js`) :**
    *   **Refonte du Constructeur Auteur (Série de 4 PGN) :** Remplacement de l'ancien constructeur à échiquier unique par une saisie en série de 4 Mini-PGN avec `PgnInput` (zone de texte et bouton modal d'édition interactive PGN).
    *   **Support direct des exports PGN (Lichess, etc.) :** Possibilité de coller directement un PGN complet (contenant les en-têtes `[SetUp "1"] [FEN "..."]`, les coups, commentaires et annotations de shapes `[%csl ...] [%cal ...]`).
    *   **Aperçus Visuels Statiques avec Shapes :** Intégration de 4 échiquiers d'aperçu non-interactifs affichant la position de départ avec orientation automatique selon le trait initial de la FEN (`cburnett` / `brown`) et restitution en direct des formes annotées (`[%csl ...]`, `[%cal ...]`).
    *   **Synchronisation du Contrat JSON :** Format standard `{ consigne: "Trouver le meilleur coup.", exercices: [ { pgn: "..." }, ... ] }` avec rétrocompatibilité sur les anciens enregistrements FEN.

## [1.4.3] - 2026-08-25

*   **Gestion des Playlists de Cours & Intégrité des Données (`Builder.php`, `Parcours_Controller.php`) :**
    *   **Nettoyage Automatique des Playlists :** Ajout des écouteurs `wp_trash_post` et `before_delete_post` pour purger automatiquement les leçons et exercices supprimés ou mis à la corbeille de l'ensemble des cours (`_roi_cours_playlist`).
    *   **Filtrage Dynamique API REST (`GET /roi/v1/parcours`) :** Sécurisation de l'endpoint pour ne retourner que les éléments de playlist effectivement publiés (`publish`), évitant tout lien orphelin ou erreur de chargement dans la PWA.
    *   **Décodage Sécurisé du JSON de Configuration (`Contenu_Controller.php`, `Parcours_Controller.php`) :** Ajout d'un fallback `wp_unslash()` garantissant le décodage sans faille des configurations JSON d'exercices et de playlists même en présence d'antislashes d'échappement en base de données.

*   **Standardisation des Thèmes & Aperçus d'Exercices (`eg-chessboard` v1.6.4, `type-2.js`, `type-8.js`, `TypePopEchecs.php`, `TypeVisionChecs.php`) :**
    *   **Jeu de Pièces & Plateau par Défaut :** Standardisation des styles universels par défaut sur `cburnett` (pièces) et `brown` (fond bois classique).
    *   **Restauration Visuelle des Pièces dans les Aperçus :** Injection des classes de conteneur `.main-wrap`, `.fit-container`, `.piece-set-cburnett` et `.board-theme-brown` sur les conteneurs d'aperçu statique des constructeurs Type 2 (Pop'Echecs) et Type 8 (Vision'checs), résolvant le masquage des sprites de pièces.

*   **Exercice Type 2 Pop'Echecs — Série de 4 Diagrammes (`TypePopEchecs.php`, `type-2.js`) :**
    *   **Saisie en Série de 4 Diagrammes :** Refonte de l'interface d'administration pour permettre la configuration d'une série de 4 diagrammes avec consignes individuelles et FEN/shapes dédiés pour chaque position.
    *   **Aperçus Visuels Directs :** Intégration de 4 plateaux de prévisualisation non-interactifs synchronisés avec les contrôles FEN et shapes.
    *   **Standard d'Architecture Découplé (CMS / Runtime) :** Établissement du modèle d'architecture où ROI stocke les données échiquéennes pures (FEN + Shapes, ou PGN avec annotations) et les consignes de l'auteur, tandis que le moteur client PWA interprète le diagramme (détection automatique de la pièce via le cercle bleu, masquage/révélation des shapes et orientation selon le trait).

*   **Constructeur d'Exercices Admin (`src/admin-exercice-builder/main.js`) :**
    *   **Fiabilisation de la Validation des Champs Obligatoires (`checkRequiredFields`) :** Correction du blocage intempestif de la sauvegarde (`lockPostSaving`) lors de l'édition d'exercices existants (notamment lors de la modification de FEN sur le Type 9 Parcours) en vérifiant l'état Gutenberg (`getEditedPostAttribute`, `getCurrentPost`) et les métaboxes classiques du DOM (`#roi_chapitrediv`, `tax_input[roi_chapitre]`, `#post-title-0`, `.editor-post-title__input`). Ajout d'écouteurs d'événements `change` sur les sélecteurs de chapitre pour synchroniser dynamiquement la validation.

*   **Architecture, Typage Strict PHP 8.4 & Optimisations Backend :**
    *   **Enums Typés PHP 8.4 dans les Métaboxes (`Manager.php`) :** Remplacement de la génération HTML statique des 16 types d'exercices et des niveaux de difficulté par les Enums typés `\ROI\Enums\Exercice_Type::cases()` et `\ROI\Enums\Exercice_Niveau::cases()`. Validation stricte lors de la sauvegarde et du filtre `wp_insert_post_data` via `Exercice_Type::tryFrom()` et `Exercice_Niveau::tryFrom()`.
    *   **Centralisation des CPT & Taxonomies (`CPT\Manager`) :** Création de la classe `\ROI\CPT\Manager` centralisant l'initialisation modulaire des Custom Post Types (`Lecon`, `Exercice`, `Cours`, `Partie`) et de la taxonomie `Chapitre_Taxonomy`, avec refactorisation du point d'entrée `Plugin.php`.
    *   **Optimisation des Requêtes SQL Anti-doublons (`Games_Controller.php`) :** Ajout de `'no_found_rows' => true` et `'cache_results' => false` lors de la vérification de doublons PGN afin de supprimer la surcharge SQL `SQL_CALC_FOUND_ROWS` sur les requêtes d'existence.
    *   **Endpoint REST Paginé de Consultation des Parties (`GET /roi/v1/games`) :** Ajout de la route `GET /roi/v1/games` avec pagination (`page`, `per_page`), filtrage optionnel par `member_id`, contrôle d'accès unifié `Permissions_Helper::check_apprentissage_access()` et retour structuré des métadonnées de pagination.
*   **Outillage & Automatisation du Versioning :**
    *   **Script de Synchronisation Multi-fichiers (`scripts/version-sync.cjs`) :** Création du script Node.js natif synchronisant la version sémantique sur l'en-tête `roi.php`, la constante `ROI_VERSION`, le fichier `package.json`, l'ensemble des fichiers `block.json` Gutenberg (`chessboard`, `diagramme`, `pgn`) et effectuant la bascule automatique de la section `[Unreleased]` du `CHANGELOG.md` vers la version ciblée.
    *   **Commande npm :** Intégration de la commande `npm run version-sync` dans `package.json`.

*   **Correctifs de Navigation & d'Interactivité PGN (`PgnViewer`, `PgnEditor` & Bloc Gutenberg `roi/pgn`) :**
    *   **Visualiseur de parties admin (`assets/js/admin-partie-viewer.js`) :** Remplacement de la lecture erronée de `boardAPI.boardState` par l'API publique `boardAPI.getHistoryViewerState()`, et simplification des actions de navigation avec les méthodes natives `boardAPI.viewNext()`, `boardAPI.viewPrevious()`, `boardAPI.viewStart()`, `boardAPI.stopViewingHistory()`.
    *   **Déblocage des événements de clic (Calques SVG Chessground) :** Correction des styles CSS dans `src/blocks/chessboard/style.css`, `src/components/PgnEditor/PgnEditor.css` et `assets/css/admin-style.css` en appliquant `pointer-events: none !important;` et `position: absolute;` sur l'ensemble des calques vectoriels (`.cg-custom-below`, `.cg-shapes-below`, `.cg-custom-svgs`, `.cg-shapes`, `cg-auto-pieces`) pour éviter le masquage et l'interception intempestive des clics au-dessus des boutons de navigation.
    *   **Priorité d'empilement `z-index` :** Élévation du contexte d'empilement des barres et boutons de navigation (`.pgn-navigation-bar`, `.pgn-nav-btn`) avec `position: relative; z-index: 10/11; pointer-events: auto !important;` directement dans `PgnEditor.jsx`, `PgnEditor.css` et `admin-style.css`.
    *   **Enregistrement des feuilles de style du bloc Gutenberg PGN (`src/blocks/pgn/block.json` & `index.js`) :** Déclaration de `"editorStyle": "file:./index.css"` et `"style": "file:./index.css"` dans `block.json`, import des CSS nécessaires dans `index.js` et `admin-fen-editor.js`, et confinement du plateau de prévisualisation (`overflow: hidden; position: relative`).
    *   **Boutons de prévisualisation du bloc PGN (`src/blocks/pgn/edit.js`) :** Ajout des écouteurs `onClick` reliés à l'instance `EgBoardCore` pour permettre la navigation dans le PGN en mode prévisualisation.
*   **Correctifs d'Intégration `eg-chessboard` (FenEditor & PgnEditor) :**
    *   **Résolution de la récursion infinie (`RangeError: Maximum call stack size exceeded`) :** Ajout d'une garde de comparaison FEN (`positionRef`) dans `syncPositionFromBoard` et sécurisation du `useEffect` d'orientation dans `FenEditor.jsx`.
    *   **Restauration des SVG vectoriels des pièces (`pieceSet` & `boardTheme`) :** Application des classes de conteneur `.piece-set-cburnett` et `.board-theme-brown` sur le wrapper `.main-wrap` et sur la palette de pièces `PiecePalette.jsx`.
    *   **Normalisation du DOM Chessground & Enfilement CSS :** Imbrication directe de l'élément de référence Chessground dans `.main-board` (alignée sur le composant React officiel d'`eg-chessboard`), enfilement de la feuille de style `admin-fen-editor.css` dans `Assets.php` et fiabilisation du calcul des `bounds` / `redraw(true)` via `ResizeObserver` dans `useChessBoard.js`.

## [1.4.1] - 2026-08-18

*   **Intégration Réactive & Simplification `eg-chessboard` :**
    *   **Front-end Échiquier (`src/blocks/chessboard/view.jsx`) :** Exploitation de l'état unifié `getState()` (`turnColor`, `isCheck`, `isGameOver`) dans `updateStatus()` pour éliminer les appels impératifs redondants. Mise à jour de `newEmit()` pour écouter l'événement `turn-change` et le payload enrichi `Move` (`val.turnColor`, `val.ply`), assurant une synchronisation parfaite des pendules et du moteur Stockfish.
    *   **Éditeur PGN (`src/components/PgnEditor/PgnEditor.jsx`) :** Simplification de la méthode `syncPositionData()` en lisant directement `state.ply` exposé par `getState()` pour la mise à jour des plies lors des navigations et ajouts de coups.
    *   **Bloc Éditeur Gutenberg (`src/blocks/chessboard/edit.jsx`) :** Suppression du contournement par `Proxy` sur `boardStateRef` au profit du callback natif `onStateChange` synchronisant `setBoardState()` via `getState()`.

## [1.4.0] - 2026-08-14

*   **Conformité Qualité & Standards de Code (PHPCS / WPCS) :**
    *   **Nettoyage & Correction globale (100% PHPCS) :** Résolution complète des 182 erreurs et 17 avertissements signalés par `composer lint` sur 57 fichiers (0 erreur, 0 avertissement).
    *   **Configuration WPCS (`phpcs.xml`) :** Intégration du standard officiel WordPress avec configuration du text domain `roi`, version minimale de WordPress ciblée à 6.7 et exclusion des dossiers compilés (`/build/`).
    *   **Exclusion sur Mesure du Nommage WP :** Désactivation de la règle `WordPress.Files.FileName` dans `phpcs.xml` pour préserver le standard d'architecture PSR-4 / PascalCase requis par le projet.
    *   **Sécurisation & Échappement :** Échappement systématique des sorties HTML (`esc_html`, `esc_attr`, `esc_textarea`, cast d'index `(int)`), assainissement et découplage sécurisé des entrées `$_POST` avec `wp_unslash()`, et annotations ciblées `phpcs:ignore` pour les accès intentionnels et sécurisés par le contexte (REST API / Gutenberg).
    *   **Internationalisation & Commentaires :** Ajout des commentaires traducteurs `/* translators: ... */` pour toutes les chaînes `sprintf`, correction des fonctions dépréciées (`gmdate()`, `wp_json_encode()`), et harmonisation de la ponctuation de l'ensemble des commentaires inline.
    *   **Sécurisation de la Désinstallation (`uninstall.php`) :** Préparation et échappement sécurisé des identifiants SQL, renommage de la variable `$taxonomy` en `$roi_taxonomy` pour éviter d'écraser la globale WP et ajout d'annotations de suppression ciblées pour les requêtes directes SQL de désinstallation.

*   **Refactorisation des Éditeurs (`FenEditor` & `PgnEditor`) — Architecture, Colocation & Hooks :**
    *   **Colocation de Composants :** Restructuration de `FenEditor` et `PgnEditor` dans des sous-répertoires dédiés `src/components/FenEditor/` et `src/components/PgnEditor/` intégrant des barrels d'export `index.js` pour maintenir une rétrocompatibilité d'import totale.
    *   **Extraction des CSS :** Suppression des balises `<style>` intégrées et déportation du code CSS dans `FenEditor.css` et `PgnEditor.css`.
    *   **Composants UI Partagés (Dumb Components) :** Isolation du bloc d'annotations couleur dans `DrawingLegend` (`src/components/DrawingLegend/`) et de la palette de pièces/gomme dans `PiecePalette` (`src/components/FenEditor/PiecePalette.jsx`).
    *   **Externalisation Logique Métier :** Externalisation de la fonction pure `ensurePgnFenHeader` vers l'utilitaire `src/utils/chessUtils.js`.
    *   **Custom Hook `useChessBoard` :** Création du Hook personnalisé `src/hooks/useChessBoard.js` orchestrant l'instanciation de `BoardCore`, le suivi dynamique du redimensionnement via `ResizeObserver` et le nettoyage propre au démontage.
    *   **Sécurité des API Impératives & ESLint 9 :** Maintien rigoureux des méthodes `forwardRef` / `useImperativeHandle` (`redrawBoard`, `getDiagram`, `setDiagram`), préservation de la JSDoc originale et validation 100% conforme à ESLint 9 / Prettier.

*   **Éditeur PGN (`PgnEditor.jsx`) — Support des Variantes PGN & Modes Métiers :**
    *   **Prise en charge des Sous-Variantes :** Intégration complète du moteur d'arborescence PGN de `eg-chessboard` (v1.3.5+). Possibilité de créer, naviguer, promouvoir (`promoteVariation`) et supprimer (`deleteVariation`) des branches de sous-variantes à tout demi-coup de l'historique.
    *   **Mode Lecteur vs Mode Éditeur :** Ajout d'une barre de commutation permettant d'alterner entre le *Mode Lecteur* (`readOnly: true` : navigation sans altération et formes éphémères) et le *Mode Éditeur* (`readOnly: false` : création de sous-variantes et persistance des annotations).
    *   **Panneau d'Arborescence & Navigation :** Affichage dynamique de la liste des sous-variantes à la position courante, compteur réactif de demi-coups (`Coup X / Y`) et bouton d'accès direct au coup en direct (`⏭️`).

## 1.3.6 - 2026-08-09

*   **Exercices — Type 8 (Vision'checs) — Refonte 4 Diagrammes & Aperçus Visuels :**
    *   **Structure à 4 Diagrammes :** Évolution du Type 8 (Vision'checs) pour gérer 4 diagrammes par exercice au lieu d'une position unique. Suppression de la saisie manuelle de description, des cases départ/arrivée, de la solution SAN et du plateau de saisie de coup.
    *   **Coups attendus & Annotations visuelles :** Le ou les coups attendus sont désormais matérialisés directement par des flèches bleues (`brush: "blue"`) dessinées sur le diagramme via `FenEditor`, complétées par d'autres formes visuelles d'explication (cercles, flèches).
    *   **Aperçus statiques non-interactifs (`TypeVisionChecs.php` & `type-8.js`) :** Ajout d'un plateau d'échiquier d'aperçu sous chaque `FenInput` (Diagrammes 1 à 4) en mode `viewOnly: true` pour valider visuellement la position et les annotations sans interaction possible.
    *   **Orientation dynamique selon le trait FEN :** L'orientation de chaque plateau d'aperçu est automatiquement déterminée d'après le trait de sa FEN (`getActiveColorFromFen`), positionnant les Blancs en bas pour le trait aux Blancs (`w`) et les Noirs en bas pour le trait aux Noirs (`b`).
    *   **Correction de l'orientation dans le Builder :** Utilisation systématique de `getOrientationColor()` dans les handlers du builder (Types 8, 2 et 3) au lieu de la lecture brute du libellé textuel `"Blanc"` / `"Noir"`, résolvant l'affichage d'un échiquier inversé.
    *   **Contrat JSON REST API (`Contenu_Controller.php`) :** L'endpoint REST `/wp-json/roi/v1/contenu/<id>` (et `/exercice/<id>`) expose désormais la clé `config.diagrammes` (tableau des 4 diagrammes `{ fen, couleur_joueur, shapes }`) pour consommation par la PWA.

*   **Exercices — Type 1 (100 Commandements) Multi-QCM :**
    *   **Support des séries de QCM :** Évolution de l'exercice de Type 1 (100 Commandements) pour gérer une série de plusieurs QCMs par exercice (au lieu d'un QCM unique).
    *   **Back-Office WordPress (`Type100Commandements.php`) :** Ajout d'une interface d'administration dynamique permettant d'ajouter et de supprimer des QCMs avec numérotation et ré-indexation automatique. Prise en charge de la rétrocompatibilité (conversion automatique des anciens exercices avec QCM unique vers la structure multi-QCM).
    *   **Constructeur JS (`type-1.js`) :** Mise à jour du script du builder pour sérialiser le tableau `qcms` dans le JSON de configuration (`#roi_config_json`), et gestion de la ré-indexation dynamique des champs et boutons radio de sélection de la bonne réponse.
    *   **API REST (`Contenu_Controller.php`) :** L'endpoint REST `/wp-json/roi/v1/contenu/<id>` expose désormais la clé `config.qcms` contenant le tableau des QCMs (chacun composé d'une `question`, d'un tableau `reponses` de 3 choix et de l'index de la `bonne_reponse`).

## 1.3.5 - 2026-08-08

*   **Améliorations de l'Éditeur & du Constructeur de Cours (`roi_cours`) :**
    *   **Ordonnancement et Rendu des Metaboxes :** Renommage de la metabox `#pageparentdiv` en *"Ordre des cours"*, masquage du sous-libellé *"Ordre"* et suppression du menu déroulant hiérarchique parent par l'ajustement `'hierarchical' => false` dans `includes/CPT/Cours.php`.
    *   **Positionnement Réactif :** Alignement strict de la colonne latérale dans l'ordre : *Publier* → *Ordre des cours* → *Niveau du cours* → *Chapitres*.
    *   **Design Harmonisé des Éléments de Playlist :** Alignement du rendu visuel des cartes de la Playlist sur celui du Catalogue (affichage complet des badges de niveau `Niv. X`, de type `LEÇON`/`EXERCICE`, de la couleur thématique du chapitre et de la croix de suppression).
    *   **Formatage Anti-Rupture (`&nbsp;` & `nowrap`) :** Utilisation d'un espace insécable entre `Niv.` et son numéro (`Niv.&nbsp;X`) et application de `white-space: nowrap; flex-shrink: 0;` sur les badges pour éviter tout saut de ligne involontaire lorsque le titre de l'élément s'étale sur plusieurs lignes.
    *   **Tri Multi-Critères par Défaut (Liste Admin) :** Implémentation du filtre SQL `posts_clauses` dans `includes/Admin/Columns.php` appliquant le tri par défaut : *Niveau croissant* → *Ordre de progression du Chapitre* → *Ordre (`menu_order` croissant)*.
    *   **Prise en charge REST API de Gutenberg (`_roi_lecon_niveau`) :** Résolution du bug de réinitialisation du niveau à `1` dans l'éditeur de Leçon en déclarant `'custom-fields'` dans les supports du CPT et en sortant l'instanciation des gestionnaires de métadonnées (`Settings`, `Manager`, `Builder`) du bloc `if (is_admin())` dans `includes/Core/Plugin.php`.


*   **Gestionnaire Unifié de Diagramme (`FenInput` & `FenEditor`) :**
    *   **Refonte `FenInput` :** Conversion du composant en gestionnaire de Diagramme complet (`FEN + Shapes`). Remplacement du menu déroulant d'orientation par un champ non modifiable calculé dynamiquement d'après le trait de la FEN ("Blanc" ou "Noir") et ajout d'un badge de synthèse des formes (`"X ◯ - Y ➔"`). Réinitialisation automatique des formes à `"0 ◯ - 0 ➔"` lors de la saisie directe d'une FEN texte.
    *   **Orientation Automatique `FenEditor` :** Suppression du sélecteur d'orientation dans `FenEditor`. L'échiquier pivote désormais automatiquement en fonction du trait (Blancs ou Noirs) pour offrir une vue toujours orientée côté apprenant.
    *   **Paires d'API Diagramme (`getDiagram` / `setDiagram`) :** Prise en charge native et exposition des méthodes `getDiagram()` et `setDiagram(diagram)` sur `FenEditor` et `FenInput` pour la lecture/écriture unifiée de l'objet `{ fen, orientation, shapes }`.
    *   **Correction de la Persistance des Formes :** Correction de l'extraction des formes dans `FenEditor` pour préserver intégralement les cercles (◯) et les flèches (➔) dessinés par l'utilisateur lors de la validation (`handleApply`) et intégration du stockage des formes dans le Builder Type 2 (`Pop'Echecs`).
    *   **Ajustement UX/UI :** Réduction des espacements verticaux sous le titre *OPTIONS DE POSITION* dans `FenEditor`.

*   **Refactorisation Maintenabilité, Performances & Conformité `AGENTS.md` :**
    *   **Optimisation des Performances SQL/Hooks :** Suppression de l'exécution en boucle des méthodes `Roles::add_capabilities_to_roles()` et `Chapitre_Taxonomy::seed_terms()` sur l'action `init` lors de chaque requête HTTP. Migration exclusive dans l'hook d'activation `Activator::activate`.
    *   **Enregistrement des CPTs & Réécriture :** Inscription préalable des CPTs et taxonomies avant le `flush_rewrite_rules()` lors de l'activation du plugin.
    *   **Plage des Niveaux de Difficulté (1 à 4) :** Ajustement des niveaux de difficulté de 1 à 4 (suppression des niveaux 5 et 6). Les boucles, validations et l'Enum PHP 8.4 `Exercice_Niveau` sont restreints entre 1 et 4.
    *   **Typage Strict & Enums PHP 8.4 :** Création des Backed Enums `Exercice_Type` (16 types), `Chapitre_Couleur` (codes Hex) et `Exercice_Niveau` (1 à 4), ainsi que du DTO `readonly` `Exercice_Config_DTO`.
    *   **Compatibilité PSR-4 & Linux :** Maintien du dossier `includes/Chess/` en PascalCase et alignement des instructions `include` dans `ChessEngine.php` (`includes/Chess/templates/chessboard.php`). Création du template d'affichage de l'échiquier.
    *   **API REST Standardisée :** Migration de l'enregistrement des contrôleurs REST vers le hook natif `rest_api_init`. Création de `Permissions_Helper` pour la centralisation de l'autorisation d'accès au module Apprentissage et utilisation de `wp_date()`.
    *   **Assets & Packaging :** 
        *   Lecture dynamique des dépendances et des versions à partir des fichiers `.asset.php` générés par Webpack.
        *   Suppression du fichier JS legacy obsolète `assets/js/admin-script.js`.
        *   Maintien strict des noms originaux des bibliothèques Web Workers `stockfish.js` et `stockfish.wasm` dans `assets/js/`.
        *   Normalisation des handles scripts/styles avec le préfixe `roi-`.
        *   Création de `.eslintrc.json` (ES2021), alignement de `phpstan.neon` (PHP 8.4 Level 6) et correction de `.distignore` pour inclure la documentation de production (`README.md`, `CHANGELOG.md`, `USING.md`).
    *   **Désinstallation Propre :** Nettoyage complet des options (`roi_plugin_version`, `roi_apprentissage_allowed_roles`) et de tous les CPTs (`roi_lecon`, `roi_exercice`, `roi_cours`, `roi_partie`) dans `uninstall.php`.

*   **Nettoyage & Santé du Code (Code Health Improvement) :**
    *   **Suppression du code mort :** Retrait de la fonction obsolète `roi_chess_pieces_shortcodes_filter()` dans `roi.php` qui appelait une classe `\ROI\Shortcodes\Shortcodes` inexistante, ainsi que du bouchon de test associé dans `tests/phpstan/bootstrap.php`.
    *   **Architecture & Conformité PSR-4 :** Suppression du fichier procédural orphelin `includes/cron.php`, non inclus et non référencé dans le plugin.
    *   **Typage Strict :** Ajout de la déclaration `declare(strict_types=1);` dans `uninstall.php` et `tests/phpstan/bootstrap.php`.

*   **Intégration & Refactoring `eg-chessboard` v1.3.1 :**
    *   **Modes Métiers Typés (`mode`) :** Prise en charge des modes `'editor'`, `'study'` et `'game'` sur toutes les instances d'échiquiers du plugin.
    *   **Composants Métiers (`FenEditor` & `PgnEditor`) :** Configuration de `mode: "editor"` dans `FenEditor` (déplacement libre, tolérance FEN constructeur, persistance automatique des formes et détection universelle des promotions sur 1ère/8ème rangée) et `mode: "study"` dans `PgnEditor` (synchronisation native des formes PGN `[%cal]`/`[%cpl]` et navigation dans les sous-variantes).
    *   **Blocs Gutenberg & Admin Builder :** Attribution de `mode: 'editor'` pour le bloc diagramme et les modales FEN/sélecteurs, `mode: 'study'` pour le bloc PGN, et `mode: 'game'` pour le bloc d'affichage front-end `chessboard` et les solveurs d'exercices (`type-2`, `type-3`, `type-8`).
    *   **Exercices Visuels (Type 3) :** Activation de `preserveShapesOnPositionChange: true` sur le Builder d'exercice Type 3 pour maintenir affichées les formes cibles/consignes pendant l'exécution des coups.
    *   **Interface & Promotion :** Mise à jour de la modale de promotion 1:1 (`PromotionDialog`) et harmonisation de la palette CSS.

*   **Améliorations Éditeur FEN (`FenEditor`) :**
    *   **Orientation dynamique :** Rotation réactive de l'échiquier lors du changement d'orientation (Blancs / Noirs) afin d'afficher la couleur sélectionnée en bas de l'écran.
    *   **Zone d'importation FEN :** Ajout d'un champ de saisie et d'un bouton de chargement placés au-dessus de la palette de pièces.
    *   **Déplacement libre multi-couleurs :** Activation du mode libre (`freeMode: true`) dans l'état `BoardCore` pour permettre le déplacement sans restriction de tour de toutes les pièces blanches et noires.
    *   **Fenêtre de promotion interactive :** Écoute de `onStateChange` et affichage de l'overlay de promotion (`PromotionDialog`) lors de la pose ou du déplacement d'un pion sur la 1ère ou 8ème rangée.
    *   **Dimensionnement Container Queries (`cqw`) :** Ajout de `container-type: inline-size;` sur le conteneur principal de l'échiquier pour assurer l'affichage et les proportions exactes des boutons de promotion.

*   **Migration de `chess.js` vers `chessops` :**
    *   Remplacement complet de la dépendance `chess.js` par `chessops` dans tout le plugin.
    *   Utilisation de la fonction utilitaire native `getFinalFenFromPgn` exposée par `eg-chessboard` v1.2.0+.
    *   Mise à jour des scripts d'administration (`admin-fen-editor.js`, `type-4.js`), des métadonnées du bloc `roi/chessboard` (`block.json`) et de la documentation.

*   **Nouveau Type d'Exercice (Type 10 : Echec'éval) :**
    *   **Back-office PHP :** Création de `TypeEchecEval.php` (`ROI\Metaboxes\Exercice\Types\TypeEchecEval`) et enregistrement dans `Manager.php` pour la configuration de la FEN de départ, la couleur du joueur, le thème, les questions dynamiques (types `yesno` et `evaluation`, réponses attendues et explications), la séquence de coups à jouer et l'explication PGN finale.
    *   **Administration JS :** Création de `type-10.js` pour la gestion dynamique des questions d'évaluation, la sélection réactive du type de réponse et des options attendues, l'interaction avec la modale FEN `openFenEditor` (FEN et `shapes`) et la synchronisation temps réel du contrat JSON. Retrait de `'10'` de `visualTypes`, mise à jour de `main.js` et compilation du bundle d'assets.


*   **Nouveau Type d'Exercice (Type 16 : Destination finale) :**
    *   **Back-office PHP :** Création de `TypeDestinationFinale.php` (`ROI\Metaboxes\Exercice\Types\TypeDestinationFinale`) et enregistrement dans `Manager.php` pour la saisie de la consigne, de la position FEN de départ, de la couleur du joueur, de la liste ordonnée des étapes textuelles et de la solution PGN finale.
    *   **Administration JS :** Création de `type-16.js` pour la gestion dynamique du tableau d'étapes textuelles, l'interaction avec la modale FEN `openFenEditor` et la synchronisation en temps réel du contrat JSON. Retrait de `'16'` de `visualTypes`, mise à jour de `main.js` et compilation du bundle d'assets.

*   **Nouveau Type d'Exercice (Type 15 : Jugement final) :**
    *   **Back-office PHP :** Création de `TypeJugementFinal.php` (`ROI\Metaboxes\Exercice\Types\TypeJugementFinal`) et enregistrement dans `Manager.php` pour la saisie de la consigne, de la position FEN, de la couleur du joueur, des 3 scénarios PGN (avec sélection de la bonne réponse) et de la solution PGN finale.
    *   **Administration JS :** Création de `type-15.js` pour la gestion des 3 scénarios, l'interaction avec la modale FEN `openFenEditor` et la synchronisation du contrat JSON. Intégration dans `main.js` et compilation des assets.

*   **Nouveau Type d'Exercice (Type 14 : Cap ou pas cap ?) :**
    *   **Back-office PHP :** Création de `TypeCapOuPasCap.php` (`ROI\Metaboxes\Exercice\Types\TypeCapOuPasCap`) et enregistrement dans `Manager.php` pour la saisie de la consigne, du type de réponse (`qcm` ou `move`) et de 5 diagrammes (FEN, couleur du joueur, options QCM avec boutons radio et explications, coup SAN et explication d'erreur).
    *   **Administration JS :** Création de `type-14.js` pour la gestion de l'état local des 5 diagrammes (`{ fen, couleur_joueur, shapes, qcm_choix, qcm_bonne_reponse, move_san, move_explication }`), l'interaction avec la modale FEN `openFenEditor`, la bascule dynamique d'affichage des blocs QCM / Move et la synchronisation en temps réel du JSON de configuration. Mise à jour de `main.js` et compilation du bundle d'assets.

*   **Nouveau Type d'Exercice (Type 13 : Ouvre'boîte) :**
    *   **Back-office PHP :** Création de `TypeOuvreBoite.php` (`ROI\Metaboxes\Exercice\Types\TypeOuvreBoite`) et enregistrement dans `Manager.php` pour la saisie d'une position FEN, de la couleur du joueur, de la question, de 3 choix de réponses (texte, coup SAN, explication) et de l'index de la bonne réponse.
    *   **Administration JS :** Création de `type-13.js` pour la gestion de la position FEN et des tracés `shapes`, l'interaction avec la modale FEN `openFenEditor` et la synchronisation en temps réel du contrat JSON de configuration. Retrait de `'13'` du tableau `visualTypes`, mise à jour de `main.js` et compilation du bundle d'assets.

*   **Nouveau Type d'Exercice (Type 12 : Qui-suis-je ?) :**
    *   **Back-office PHP :** Création de `TypeQuiSuisJe.php` (`ROI\Metaboxes\Exercice\Types\TypeQuiSuisJe`) et enregistrement dans `Manager.php` pour la saisie des indices et la configuration des 3 types de réponse (Pièce, Case, QCM).
    *   **Administration JS :** Création de `type-12.js` pour la gestion dynamique des indices, la bascule d'affichage des blocs de réponse, la sélection interactive sur échiquier vide (`EgBoardCore`) et la synchronisation automatique de la configuration JSON. Intégration dans `main.js` et compilation du bundle d'assets.

*   **Nouveau Type d'Exercice (Type 11 : Class'échecs) :**
    *   **Back-office PHP :** Création de `TypeClassEchecs.php` (`ROI\Metaboxes\Exercice\Types\TypeClassEchecs`) et enregistrement dans `Manager.php` pour la saisie de la consigne et de 5 positions ordonnées.
    *   **Administration JS :** Création de `type-11.js` pour la gestion de l'état local des 5 positions (`{ fen, couleur_joueur, shapes }`), l'interaction avec la modale FEN `openFenEditor` et la synchronisation automatique du champ JSON de configuration. Mise à jour de `main.js` pour intégrer l'initialisation et la visibilité du Type 11.

## 1.3.3 - 2026-07-27

*   **Intégration Native & Refactoring `eg-chessboard` v1.2.0 :**
    *   Élimination complète de tous les hacks, contournements de typage et accès aux membres privés (`board.state`, `game.constructor`, `drawable.shapes`).
    *   Suppression du monkey-patching `updateCommentAndShapes` au profit de l'option native `preserveShapesOnPositionChange: true`.
    *   Utilisation directe des méthodes publiques officielles `redraw(true)`, `getPlacementFen()`, `getFinalFenFromPgn()`, `getCurrentComment()`, `getShapes()` et `destroy()`.

## 1.3.2 - 2026-07-22

*   **Nouveaux Types d'Exercices :**
    *   Implémentation du type 9 : Parcours (avec variante standard, pacman et stealth).
    *   Intégration du type 8 : Vision'checs dans l'éditeur de position.
*   **Persistance de l'Éditeur FEN (`FenEditor`) :**
    *   Correction du bug de perte des annotations / tracés de formes (shapes) lors de la pose d'une pièce ou d'un déplacement (drag-and-drop) en ignorant l'effacement automatique de Chessground via le suivi du bouton de souris pressé.

## 1.3.1 - 2026-07-19

*   **Nouveau Types d'Exercices :** 
    *   Implénetation du type 7 : La MArche du Héros.

## 1.3.0 - 2026-07-18

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

