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

## Suivi des parties d'échecs (PWA)

Les parties jouées dans la PWA de Dame contre l'ordinateur sont automatiquement sauvegardées sous forme de publications de type **Partie** (`roi_partie`) pour les adhérents (les profils de représentants/parents ne sont pas enregistrés).

Chaque fiche de **Partie** contient :
* La date exacte de fin de partie.
* Le niveau ELO de l'ordinateur.
* Le nombre d'aides obtenues.
* Le nombre de retours en arrière (oups) effectués.
* La durée de la partie en secondes.
* Le PGN (historique de coups) complet.

Ces données sont transmises de manière sécurisée via l'API REST de sauvegarde (`POST /wp-json/roi/v1/games`). En cas de déconnexion réseau, la PWA stocke les parties localement et les synchronise automatiquement dès le retour en ligne.

## Suivi des progressions (PWA)

### 1. Enregistrement d'une réussite (Élève)
* **Route :** `POST /wp-json/roi/v1/progression`
* **Paramètres JSON :** `{"exercice_id": 123}`
* **Sécurité :** Authentification requise. L'utilisateur connecté doit posséder le rôle `adherent`.
* **Fonctionnement :** La réussite est ajoutée aux métadonnées de l'utilisateur sous la clé `_roi_exercice_reussi` (avec la date de validation).

### 2. Consultation des progressions (Entraîneur)
* **Route :** `GET /wp-json/roi/v1/progression/groupe`
* **Sécurité :** Authentification requise. L'utilisateur connecté doit posséder le rôle `entraineur` ou `administrator`.
* **Réponse JSON :** Retourne un tableau d'élèves (`adherent`) contenant leur ID, nom, prénom, et un tableau des ID d'exercices qu'ils ont validés :
  ```json
  [
    {
      "id": 42,
      "nom": "Dupont",
      "prenom": "Jean",
      "exercices": [101, 105, 112]
    }
  ]
  ```
