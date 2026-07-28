# ROI - Ressources et Organisation pour l’Initiation aux échecs

**Version :** 1.3.1
**Auteur :** Etienne Gagnon
**Licence :** GPL v2 ou ultérieure
**WordPress Requis :** 6.9.1+
**PHP Requis :** 8.4+

## Description

Le plugin "ROI - Ressources et Organisation pour l’Initiation aux échecs" est un système de gestion de l'apprentissage (LMS) complet, conçu pour l'enseignement des échecs dans un environnement WordPress. Il fournit un cadre robuste pour la création, la gestion et la diffusion de leçons, d'exercices et de cours d'échecs. Le plugin inclut un bloc d'échiquier interactif sophistiqué, alimenté par Stockfish, `chessops` et **Chessground** (l'échiquier Lichess), permettant des démonstrations, des exercices libres et des parties joueur contre IA.

Ce plugin a été développé en suivant les meilleures pratiques de WordPress en matière de sécurité, de performance et de maintenabilité, et dispose d'une architecture orientée objet (POO) complète.


## Dépendances

Ce plugin nécessite que le plugin **DAME** soit installé et activé. Le plugin se désactivera automatiquement si la dépendance DAME n'est pas satisfaite.

## Installation

1.  **Télécharger le plugin :** Obtenez le fichier zip du plugin.
2.  **Téléverser sur WordPress :** Accédez à votre tableau de bord d'administration WordPress, allez dans `Extensions` > `Ajouter`, et cliquez sur `Téléverser une extension`.
3.  **Sélectionner et Installer :** Choisissez le fichier zip téléchargé et cliquez sur `Installer maintenant`.
4.  **Activer :** Une fois l'installation terminée, cliquez sur `Activer l'extension`.
5.  **Vérifier les dépendances :** Assurez-vous que le plugin **DAME** est installé et activé.

## Fonctionnalités Principales

### Système de Gestion de l'Apprentissage (LMS)

*   **Types de Publication Personnalisés :**
    *   **Leçons (`roi_lecon`) :** Créez des leçons d'échecs détaillées avec du texte, des images et des échiquiers intégrés.
    *   **Exercices (`roi_exercice`) :** Concevez des questions interactives à choix multiples ou vrai/faux, souvent accompagnées d'un échiquier pour le contexte.
    *   **Cours (`roi_cours`) :** Construisez des parcours d'apprentissage structurés en assemblant des leçons et des exercices dans un ordre précis.
    *   **Parties (`roi_partie`) :** Historique et enregistrement des parties d'échecs jouées par les membres depuis la PWA.
*   **API REST de Sauvegarde des Parties :** 
    *   Expose une route sécurisée `POST /wp-json/roi/v1/games` permettant d'enregistrer les détails d'une partie (ID de membre, difficulté, aides, annulations, PGN, durée et date de fin).
*   **Système de Difficulté Unifié :** Attribuez un niveau de difficulté (de "Très Facile" à "Expert") à tout le contenu, permettant un apprentissage filtré.
*   **Constructeur de Cours Visuel :** Une interface intuitive à double liste pour glisser-déposer des leçons et des exercices dans un cours.
*   **Suivi de la Progression des Utilisateurs :** Les membres connectés peuvent marquer les leçons comme terminées. (Note : Les fonctionnalités de suivi complètes sont gérées par le plugin DAME).
*   **Interface d'Exercices Interactifs :** Un shortcode `[roi_exercices]` qui génère un système de quiz public avec des retours immédiats.

### Bloc d'Échiquier Interactif (`roi/chessboard`)

*   **Modes Multiples :**
    *   **Démonstration :** Un échiquier statique pour afficher des positions.
    *   **Mode libre (Free Move) :** Permet le déplacement libre et alterné/consécutif des pièces pour la mise en place et la résolution de problèmes sans restriction de tour.
    *   **Partie vs IA :** Jouez contre le moteur Stockfish intégré avec une force ELO réglable, une boîte de dialogue de démarrage et une barre d'évaluation dynamique.
*   **Éditeur de FEN Visuel :** Un outil puissant dans l'éditeur pour créer visuellement n'importe quelle position sur l'échiquier. L'éditeur fournit une validation FEN en temps réel.
*   **Haute Personnalisation :** Contrôlez l'orientation de l'échiquier, les coordonnées et les menaces.
*   **Moteur Robuste :** Propulsé par `chessops` pour la logique de jeu et `Chessground` pour le rendu, garantissant un comportement moderne, tactile et fiable.

### Administration

*   **Sauvegarde et Restauration du Contenu :** Une page d'administration dédiée pour exporter tout le contenu pédagogique (leçons, exercices, cours, catégories) dans un fichier `.json.gz` et le restaurer, prévenant ainsi la perte de données.

## API REST

Le plugin expose plusieurs points de terminaison REST sous le namespace `/wp-json/roi/v1` :

### 1. Exercices
*   **Liste des exercices :** `GET /wp-json/roi/v1/exercices`
    *   **Description :** Récupère la liste de tous les exercices publiés, triés selon leur ordre d'affichage.
    *   **Format de réponse :**
        ```json
        [
          {
            "id": 123,
            "titre": "Mat en 2 coups",
            "type": 1,
            "niveau": 2,
            "chapitre": "Les bases",
            "couleur": "#ff0000"
          }
        ]
        ```
*   **Exercice individuel :** `GET /wp-json/roi/v1/exercice/<id>`
    *   **Description :** Récupère les détails d'un exercice spécifique.
    *   **Format de réponse :**
        ```json
        {
          "id": 123,
          "titre": "Mat en 2 coups",
          "type": 1,
          "niveau": 2,
          "chapitre": "Les bases",
          "couleur": "#ff0000",
          "config": { ... }
        }
        ```

### 2. Parties
*   **Enregistrer une partie :** `POST /wp-json/roi/v1/games`
    *   **Description :** Enregistre une partie jouée depuis la PWA (authentification requise).
    *   **Paramètres :** `member_id` (int), `difficulty_level` (int), `hints_count` (int), `takebacks_count` (int), `pgn` (string), `duration` (int), `game_date` (string).

### 3. Stockfish
*   **Servir Stockfish WASM :** `GET /wp-json/roi/v1/stockfish-wasm`
    *   **Description :** Distribue le fichier WebAssembly de Stockfish avec le type MIME correct (`application/wasm`).

## Comment Utiliser

### Création de Contenu

1.  Accédez au menu **Apprentissage** dans le tableau de bord d'administration de WordPress.
2.  Sélectionnez **Leçons**, **Exercices**, ou **Cours** pour créer du nouveau contenu.
3.  Utilisez les champs personnalisés pour définir la difficulté et d'autres détails pertinents.
4.  Pour les cours, utilisez la meta box **Constructeur de Cours** pour assembler votre programme.

### Utilisation du Bloc Échiquier

1.  Dans l'éditeur de blocs, ajoutez un nouveau bloc et recherchez "Gutenberg Chessboard" (ou "Échiquier").
2.  Utilisez les contrôles de la barre latérale du bloc (l'Inspecteur) pour configurer l'apparence et le mode de jeu.
3.  Utilisez l'éditeur visuel à l'intérieur du bloc pour définir les positions de pièces souhaitées, ou collez une chaîne FEN valide.

### Shortcodes

*   `[roi_exercices]`: Affiche le système d'exercices interactifs sur n'importe quelle page ou article.
*   `[chess_board fen="..." freeMode="true" ...]`: Affiche l'échiquier via shortcode.

## Développement et Structure des Fichiers

Le plugin est organisé dans les répertoires principaux suivants :

*   `/assets`: Contient les fichiers CSS et JS publics et d'administration de ROI.
*   `/src`: Contient les sources React et Gutenberg du bloc `roi/chessboard`.
*   `/build`: Contient les assets compilés du bloc d'échecs (CSS, JS, et les workers Stockfish).
*   `/includes`: La logique principale du plugin, structurée selon le standard PSR-4 (namespace `ROI\`).
*   `/includes/Admin`: Fichiers relatifs à la zone d'administration de WordPress (metaboxes, menus, backup).
*   `/includes/Core`: Bootstrap, assets, rôles et activation/désactivation.
*   `/includes/CPT`: Fichiers de classes pour chaque Custom Post Type.
*   `/includes/Services`: Logique métier du plugin (complétion, handlers).
*   `/includes/chess`: Intégration du moteur d'échecs (shortcodes, templates PHP).
*   `/roi.php`: Le fichier principal du plugin (contient l'autoloader SPL).

### Processus de Build

Les composants de l'échiquier sont intégrés via le package local `eg-chessboard` et compilés à l'aide de `@wordpress/scripts` avec la commande suivante :
```bash
npm run build
```

## Changelog

### 1.1.1 - 2026-06-04
*   **Réorganisation des Metaboxes Partie :** Panneau latéral pour les données et zone centrale pour le lecteur interactif.
*   **Lecteur PGN Interactif :** Boutons pas-à-pas et liste cliquable des coups.
*   **Correction et robustesse :** Résolution du bug de hauteur de l'échiquier et décodage/normalisation du PGN.

### 1.1.0 - 2026-06-04
*   **Refonte complète en POO :** Logique globale réécrite sous namespace `ROI\`, SPL autoloader natif et typage strict PHP 8.4.
*   **Découpage granulaire :** Fichiers individuels par Custom Post Type, organisation par modules.
*   **Script de packaging :** Version Node.js multiplateforme pour le build et la compression.

### 1.0.7 - 2026-06-04
*   **CPT Parties (`roi_partie`) :** Enregistrement d'un nouveau type de contenu personnalisé pour stocker les parties jouées.
*   **API REST de sauvegarde :** Route `POST /roi/v1/games` sécurisée.

### 1.0.6 - 2026-06-03
*   **Remplacement complet de l'échiquier :** Intégration de `gutemberg-chessboard` basé sur **Chessground** et **chess.js**.

