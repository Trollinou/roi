# Changelog

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

## 1.0.5 - 2025-11-01

*   **Amélioration de l'interface de l'éditeur du bloc Échiquier :**
    *   Remplacement des bandes de sélection de pièces statiques par une boîte de dialogue popup moderne et intuitive.
    *   La popup s'affiche désormais uniquement lors d'un clic gauche sur une case vide, libérant le clic droit pour de futures fonctionnalités.
    *   L'expérience utilisateur est plus fluide et l'interface de l'éditeur est moins encombrée.
*   **Refonte majeure de l'interface de l'éditeur du bloc Échiquier :**
    *   **Interface épurée :** L'éditeur n'affiche plus que l'échiquier, supprimant le titre, la notation FEN et autres textes pour un aperçu fidèle au rendu final ("What You See Is What You Get").
    *   **Nouvelles extensions interactives :** Intégration des extensions `arrows`, `markers` et `right-click-annotator` de `cm-chessboard`, permettant de dessiner des flèches et de marquer des cases directement dans l'éditeur.
    *   **Contrôles dans la barre latérale :**
        *   Les boutons "Position initiale" et "Échiquier vide" sont remplacés par une liste déroulante plus compacte.
        *   Ajout de contrôles précis (cases à cocher) pour gérer les droits de roque pour les blancs et les noirs, organisés dans un tableau pour un affichage stable et compact.
    *   **Amélioration de l'expérience utilisateur (UX) :**
        *   Un premier clic sur le bloc non sélectionné se contente de le sélectionner, permettant l'accès aux paramètres sans déclencher d'action sur l'échiquier.
        *   Le menu de sélection des pièces ne s'ouvre que si le bloc est déjà sélectionné.
        *   Le menu se ferme automatiquement lorsque le bloc perd le focus, garantissant une interface propre.
    *   **Technique et corrections :**
        *   L'échiquier est désormais entièrement responsive dans l'éditeur et s'adapte à la taille de son conteneur.
        *   Correction de multiples avertissements de dépréciation des composants WordPress (`SelectControl`, `TextControl`, etc.) pour assurer la compatibilité future.
        *   Correction de bugs liés à la fermeture et au rafraîchissement visuel du menu de sélection des pièces.

## 1.0.4 - 2025-10-23

*   **Amélioration majeure du bloc Échiquier :**
    *   Intégration de la bibliothèque `chess.js` pour une gestion robuste et professionnelle de l'état de l'échiquier et de la notation FEN.
    *   **Éditeur de position :**
        *   Permet la création de positions personnalisées, même si elles sont "illégales" au sens des échecs (ex: 3 fous), sans faire planter l'éditeur.
        *   Valide en temps réel la notation FEN et affiche des messages d'erreur détaillés et clairs pour aider à la correction.
        *   L'activation du moteur Stockfish est désormais conditionnelle à la validité de la FEN, empêchant son utilisation avec des positions incompatibles.
    *   **Visualisation (Front-end) :**
        *   Correction d'un bug majeur qui empêchait la promotion des pions de fonctionner correctement.
        *   Correction d'une régression où le mode "exercice" (sans moteur) n'appliquait plus les règles du jeu. Les mouvements légaux sont de nouveau validés.
        *   Correction d'un bug visuel où les pièces se superposaient après une tentative de mouvement illégal.
        *   Correction d'un bug où l'IA pouvait jouer le premier coup à la place du joueur si une position personnalisée commençait par le trait au joueur.
    *   **Nouvelle fonctionnalité :**
        *   Ajout d'un sélecteur "Trait" dans l'éditeur pour choisir qui a le prochain coup (Blancs ou Noirs), offrant un contrôle total sur la FEN.

## 1.0.3 - 2025-10-22

*   **Amélioration du bloc Échiquier :**
    *   Le sélecteur de niveau du moteur Stockfish affiche désormais une estimation ELO conviviale (par exemple, "1200-1400") au lieu d'une valeur numérique (0-20), à la fois dans l'éditeur et sur la page publique.
    *   Refonte de la structure du code du bloc pour suivre les conventions de WordPress, en séparant la logique de l'éditeur (`edit.js`) de l'enregistrement du bloc (`index.js`) pour une meilleure maintenabilité.

## 1.0.2 - 2025-10-22

*   **Amélioration du bloc Échiquier :**
    *   L'option "Couleur" (orientation de l'échiquier) est désormais toujours visible, indépendamment de l'activation du moteur Stockfish.
    *   Ajout d'une nouvelle option "Afficher les coordonnées" pour contrôler la visibilité des coordonnées sur l'échiquier.
    *   Réorganisation des paramètres du bloc pour une expérience utilisateur plus intuitive.
    *   Correction d'un bug où l'option "Afficher les coordonnées" n'était pas appliquée sur la page publique.

## 1.0.0 - 2025-09-15

*   Première version du plugin.
*   Séparation du code LMS du plugin DAME.
*   Création des CPTs: Leçon, Exercice, Cours.
*   Création de la taxonomie: Catégorie d'échecs.
*   Création des shortcodes pour afficher les exercices.
*   Mise en place de la sauvegarde/restauration de la base de données d'apprentissage.
*   Mise en place de la gestion des rôles et des capacités pour le LMS.
