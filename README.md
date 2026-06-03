# ROI - Ressources et Organisation pour l’Initiation aux échecs

**Version :** 1.0.6
**Auteur :** Etienne Gagnon
**Licence :** GPL v2 ou ultérieure
**WordPress Requis :** 6.8+
**PHP Requis :** 8.2+

## Description

Le plugin "ROI - Ressources et Organisation pour l’Initiation aux échecs" est un système de gestion de l'apprentissage (LMS) complet, conçu pour l'enseignement des échecs dans un environnement WordPress. Il fournit un cadre robuste pour la création, la gestion et la diffusion de leçons, d'exercices et de cours d'échecs. Le plugin inclut un bloc d'échiquier interactif sophistiqué, alimenté par Stockfish, `chess.js` et **Chessground** (l'échiquier Lichess), permettant des démonstrations, des exercices libres et des parties joueur contre IA.

Ce plugin a été développé en suivant les meilleures pratiques de WordPress en matière de sécurité, de performance et de maintenabilité.

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
*   **Moteur Robuste :** Propulsé par `chess.js` pour la logique de jeu et `Chessground` pour le rendu, garantissant un comportement moderne, tactile et fiable.

### Administration

*   **Sauvegarde et Restauration du Contenu :** Une page d'administration dédiée pour exporter tout le contenu pédagogique (leçons, exercices, cours, catégories) dans un fichier `.json.gz` et le restaurer, prévenant ainsi la perte de données.

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

*   `/admin`: Contient les fichiers relatifs à la zone d'administration de WordPress.
*   `/assets`: Contient les fichiers CSS et JS publics de ROI.
*   `/includes`: La logique principale du plugin.
*   `/includes/chess`: Contient les fonctionnalités liées aux échecs, avec les assets pré-compilés du bloc sous `/dist/`.
*   `/roi.php`: Le fichier principal du plugin.

### Processus de Build

Les composants de l'échiquier sont désormais compilés en amont dans le dépôt indépendant de `gutemberg-chessboard` via Vite, puis copiés dans le dossier `/includes/chess/dist/`.

## Changelog

### 1.0.6 - 2026-06-03
*   **Remplacement complet de l'échiquier :** Intégration de `gutemberg-chessboard` basé sur **Chessground** et **chess.js**.
*   **Contrôles frontend visiteurs** : Boutons Nouvelle partie, Retourner le plateau, Annuler le coup.
*   **Dialogue de configuration** : Choix de la couleur et ELO pour les parties contre Stockfish.
*   **Mode libre** : Possibilité de déplacer les pièces des deux camps sans blocage.

### 1.0.5 - 2025-11-01
*   **Amélioration de l'interface de l'éditeur du bloc Échiquier :** Popup moderne de placement de pièces, extensions interactives de tracé de flèches.
    *   Réorganisation des paramètres du bloc.
    *   Correction d'un bug sur l'affichage des coordonnées sur la page publique.

### 1.0.0 - 2025-09-15
*   Première version du plugin.
