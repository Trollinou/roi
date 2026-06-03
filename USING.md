# Comment utiliser le plugin ROI

## Shortcodes

### Afficher les exercices

Pour afficher les exercices, utilisez le shortcode suivant:

`[roi_exercices]`

Ce shortcode affichera un sélecteur de difficulté et de catégorie, ainsi qu'un bouton pour commencer les exercices.

### Afficher un échiquier interactif

Pour afficher un échiquier interactif n'importe où sur votre site (article, page, widget), utilisez le shortcode :

`[chess_board]`

#### Attributs disponibles pour le shortcode :
- `fen` : Position de départ au format FEN (ex: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`).
- `orientation` : Orientation de l'échiquier (`white` ou `black`).
- `playerColor` : Couleur jouable par l'utilisateur (`both`, `white`, ou `black`).
- `viewOnly` : Empêche le glisser-déposer des pièces si réglé sur `true` (par défaut).
- `useStockfish` : Active le jeu contre l'intelligence artificielle Stockfish (`true` ou `false`).
- `stockfishElo` : Force du CPU (de 1320 à 2800 ELO).
- `showEvaluationBar` : Affiche la barre d'avantage en temps réel (`true` ou `false`).
- `showThreats` : Affiche les menaces sous forme de flèches/cercles (`true` ou `false`).
- `coordinates` : Affiche les coordonnées des cases (`true` ou `false`).
- `freeMode` : Active le mode libre permettant de bouger toutes les pièces sans règle de tour de jeu (`true` ou `false`).

## Rôles

Ce plugin ajoute les capacités suivantes au rôle "Entraineur":

*   Gestion des leçons
*   Gestion des exercices
*   Gestion des cours

## Sauvegarde et Restauration

La sauvegarde et la restauration de la base de données d'apprentissage sont gérées par le plugin DAME.
