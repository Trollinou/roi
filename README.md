# ROI - Ressources et Organisation pour l’Initiation aux échecs

**Version :** 1.0.4
**Auteur :** Etienne Gagnon
**Licence :** GPL v2 ou ultérieure
**WordPress Requis :** 6.8+
**PHP Requis :** 8.2+

## Description

Le plugin "ROI - Ressources et Organisation pour l’Initiation aux échecs" est un système de gestion de l'apprentissage (LMS) complet, conçu pour l'enseignement des échecs dans un environnement WordPress. Il fournit un cadre robuste pour la création, la gestion et la diffusion de leçons, d'exercices et de cours d'échecs. Le plugin inclut un bloc d'échiquier interactif sophistiqué, alimenté par Stockfish, `chess.js` et `cm-chessboard`, permettant des démonstrations, des exercices et des parties joueur contre IA.

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
    *   **Exercice :** Permet le déplacement libre des pièces pour la mise en place et la résolution de problèmes.
    *   **Partie vs IA :** Jouez contre le moteur Stockfish intégré avec une force ELO réglable.
*   **Éditeur de FEN Visuel :** Un outil puissant dans l'éditeur pour créer visuellement n'importe quelle position sur l'échiquier. L'éditeur fournit une validation FEN en temps réel et des messages d'erreur.
*   **Haute Personnalisation :** Contrôlez l'orientation de l'échiquier, le style des pièces, le type de bordure, les coordonnées et les schémas de couleurs.
*   **Moteur Robuste :** Propulsé par `chess.js` pour la logique de jeu et `cm-chessboard` pour le rendu, garantissant un comportement précis et fiable.

### Administration

*   **Sauvegarde et Restauration du Contenu :** Une page d'administration dédiée pour exporter tout le contenu pédagogique (leçons, exercices, cours, catégories) dans un fichier `.json.gz` et le restaurer, prévenant ainsi la perte de données.

## Comment Utiliser

### Création de Contenu

1.  Accédez au menu **Apprentissage** dans le tableau de bord d'administration de WordPress.
2.  Sélectionnez **Leçons**, **Exercices**, ou **Cours** pour créer du nouveau contenu.
3.  Utilisez les champs personnalisés pour définir la difficulté et d'autres détails pertinents.
4.  Pour les cours, utilisez la meta box **Constructeur de Cours** pour assembler votre programme.

### Utilisation du Bloc Échiquier

1.  Dans l'éditeur de blocs, ajoutez un nouveau bloc et recherchez "Échiquier".
2.  Utilisez les contrôles de la barre latérale du bloc (l'Inspecteur) pour configurer l'apparence et les fonctionnalités de l'échiquier.
3.  Utilisez l'éditeur visuel à l'intérieur du bloc pour définir les positions de pièces souhaitées, ou collez une chaîne FEN valide.

### Shortcodes

*   `[roi_exercices]`: Affiche le système d'exercices interactifs sur n'importe quelle page ou article.
*   `[chess_board fen="..." enableEngine="true" ...]`: Un shortcode hérité est disponible pour afficher l'échiquier. Cependant, l'utilisation du bloc Gutenberg est recommandée.

## Développement et Structure des Fichiers

Le plugin est organisé dans les répertoires principaux suivants :

*   `/admin`: Contient les fichiers relatifs à la zone d'administration de WordPress, tels que les pages de menu, les meta boxes et la fonctionnalité de sauvegarde/restauration.
*   `/assets`: Contient les fichiers CSS et JS publics.
*   `/includes`: La logique principale du plugin.
    *   `/chess`: Contient toutes les fonctionnalités liées aux échecs, y compris la source du bloc Gutenberg (`/blocks`), l'application JS front-end (`/assets`), la classe PHP (`class-chess-engine.php`), et les bibliothèques tierces (`/vendor`).
*   `/roi.php`: Le fichier principal du plugin.
*   `/webpack.config.js`: Configuration pour le processus de build `@wordpress/scripts` pour le bloc Gutenberg.

### Processus de Build

Le projet utilise `@wordpress/scripts` pour compiler les assets du bloc Gutenberg. Pour modifier le JavaScript ou le CSS du bloc :

1.  Accédez au répertoire racine du plugin dans votre terminal.
2.  Exécutez `npm install` pour installer les dépendances.
3.  Exécutez `npm run build` pour compiler les fichiers source de `includes/chess/blocks/chessboard/src` dans le répertoire `includes/chess/blocks/chessboard/build`.

## Changelog

### 1.0.4 - 2025-10-23
*   **Amélioration majeure du bloc Échiquier :**
    *   Intégration de `chess.js` pour une gestion robuste de l'état de l'échiquier et de la validation FEN.
    *   **Éditeur de position :** Permet la création de positions personnalisées (même "illégales"), valide la FEN en temps réel avec des messages d'erreur détaillés, et conditionne l'activation de Stockfish à la validité de la FEN.
    *   **Visualisation (Front-end) :** Correction de bugs critiques sur la promotion des pions, la validation des mouvements en mode exercice, et les glitches visuels après un coup illégal.

### 1.0.3 - 2025-10-22
*   **Amélioration du bloc Échiquier :**
    *   Le sélecteur de niveau du moteur Stockfish affiche désormais une estimation ELO conviviale (par exemple, "1200-1400") au lieu d'une valeur numérique (0-20).
    *   Refonte de la structure du code du bloc pour suivre les conventions de WordPress, améliorant ainsi la maintenabilité.

### 1.0.2 - 2025-10-22
*   **Amélioration du bloc Échiquier :**
    *   L'option "Couleur" (orientation de l'échiquier) est désormais toujours visible.
    *   Ajout d'une option "Afficher les coordonnées".
    *   Réorganisation des paramètres du bloc.
    *   Correction d'un bug sur l'affichage des coordonnées sur la page publique.

### 1.0.0 - 2025-09-15
*   Première version du plugin.
