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

### 1. Consultation de sa progression (Élève / Membre)
* **Route :** `GET /wp-json/roi/v1/progression`
* **Sécurité :** Authentification requise. L'utilisateur connecté doit posséder l'un des rôles : `membre`, `entraineur`, `staff` ou `administrator`.
* **Header requis :** `X-Selected-Identity` contenant l'ID de l'identité active (ex: `member_123`).
* **Réponse JSON :** Un tableau d'IDs d'éléments (cours, leçons, exercices) validés par l'identité active : `[101, 105, 112]`.

### 2. Enregistrement d'une réussite (Élève / Membre ou Entraîneur Club)
* **Route :** `POST /wp-json/roi/v1/progression`
* **Paramètres Élève (autonome) :** `element_id` (int), `time_spent` (int, secondes écoulées - optionnel), `attempts` (int, nombre de tentatives - optionnel).
  * **Header requis :** `X-Selected-Identity` contenant l'ID de l'identité active (ex: `member_123`).
  * **Fonctionnement :** La réussite est ajoutée aux métadonnées de l'utilisateur sous la clé `_roi_element_valide_{identity_id}` pour isoler la progression de chaque membre de la famille. Si l'élément avait été validé sans durée, l'envoi ultérieur d'un temps met à jour l'entrée.
* **Paramètres Entraîneur (séance Club) :**
  * `student_id` (string/int, ex: `42___roi_element_valide_member_123`)
  * `element_id` (int, pour valider un exercice individuel via le bouton « Effectuer ») ou `course_id` (int, pour valider tous les exercices restants du cours via « Valider le cours ») ou `element_ids` (array).
  * **Sécurité :** Réservé aux entraîneurs et administrateurs (`check_entraineur_permissions`).
  * **Traçabilité :** Enregistré avec `source = 'club'`, `time_spent = 0`, `attempts = 1` sans chronométrage. Un badge `Club` s'affiche alors sur l'exercice dans le tableau de bord.

### 3. Consultation des progressions du groupe (Entraîneur)
* **Route :** `GET /wp-json/roi/v1/progression/groupe`
* **Sécurité :** Authentification requise. L'utilisateur connecté doit posséder le rôle `entraineur` ou `administrator`.
* **Fonctionnement :** Retourne les progressions de toutes les identités actives avec les métriques détaillées par élément (date de validation, temps passé, tentatives, source club/mobile) pour alimenter le tableau de bord et la vue détaillée de l'élève.
* **Réponse JSON :**
  ```json
  [
    {
      "id": "42___roi_element_valide_member_123",
      "display_id": 123,
      "nom": "Dupont",
      "prenom": "Jean",
      "display_name": "Jean Dupont",
      "elements_valides": [101, 105, 112],
      "details": {
        "101": { "date": "2026-08-30 17:20:00", "time_spent": 45, "attempts": 1, "source": "" },
        "105": { "date": "2026-09-06 14:00:00", "time_spent": 0, "attempts": 1, "source": "club" }
      }
    }
  ]
  ```

### 4. Réinitialisation de progression (Entraîneur)
* **Route :** `POST /wp-json/roi/v1/progression/reset`
* **Paramètres :** `student_id` (string/int), `course_id` (int, pour réinitialiser tout un cours) ou `element_id` (int, pour réinitialiser un seul exercice ou leçon de manière granulaire via le bouton « ↺ Réinitialiser »).
* **Sécurité :** Réservé aux entraîneurs et administrateurs.

### 5. Ajout d'un élève au suivi (Entraîneur & DAME)
* **Route Candidats :** `GET /wp-json/roi/v1/progression/candidats`
  * Retourne la liste des adhérents DAME (CPT `adherent`) qui ne sont pas encore suivis dans le tableau de bord.
* **Route Ajout :** `POST /wp-json/roi/v1/progression/ajouter-eleve`
  * **Paramètres :** `adherent_id` (int).
  * Associe l'adhérent au compte utilisateur correspondant (compte propre ou compte parent lié aux emails des représentants légaux) et initialise sa clé de suivi pour qu'il apparaisse immédiatement dans le tableau de bord.
* **Interface :** Bouton « ＋ Ajouter un élève » dans le bandeau supérieur de la page de suivi avec recherche textuelle, affichage de la date de naissance et du représentant légal.

### 6. Retrait d'un élève du suivi (Entraîneur)
* **Route :** `POST /wp-json/roi/v1/progression/retirer-eleve`
* **Paramètres :** `student_id` (string/int, ex: `42___roi_element_valide_member_123`).
* **Sécurité :** Réservé aux entraîneurs et administrateurs.
* **Fonctionnement :** Supprime la clé usermeta de suivi associée à cette identité pour la retirer du tableau de bord.
* **Interface :** Bouton « 🗑 Retirer de la liste de suivi » situé dans le pied de page de la modale détaillée de l'élève (avec confirmation explicite). Les badges `Adhérent #ID` et `Compte WP #ID` sont des liens directs cliquables vers les fiches DAME et profils WordPress pour vérification rapide.

## Arborescence des cours (PWA)

### 1. Récupération des cours et playlists
* **Route :** `GET /wp-json/roi/v1/parcours`
* **Sécurité :** Public.
* **Réponse JSON :** Un tableau de cours triés par Niveau (ascendant) > Chapitre (ordre personnalisé) > Ordre (menu_order ascendant) :
  ```json
  [
    {
      "id": 12,
      "titre": "Introduction aux pions",
      "niveau": 1,
      "playlist": [101, 105],
      "chapitre_nom": "Structure de Pions",
      "chapitre_couleur": "#FF0000",
      "ordre": 0
    }
  ]
  ```

## Configuration & Restrictions d'accès

### 1. Réglages du Back-office
Les administrateurs peuvent configurer les rôles autorisés à accéder au module d'apprentissage depuis **Apprentissage > Configuration** dans l'administration WordPress.

### 2. Récupération de la configuration (Public)
* **Route :** `GET /wp-json/roi/v1/config`
* **Sécurité :** Public.
* **Réponse JSON :**
  ```json
  {
    "apprentissage_allowed_roles": ["administrator", "staff", "entraineur", "editor", "membre"]
  }
  ```
