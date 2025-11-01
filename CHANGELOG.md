# Changelog

## 1.0.5 - 2025-11-01

*   **Amélioration de l'interface de l'éditeur du bloc Échiquier :**
    *   Remplacement des bandes de sélection de pièces statiques par une boîte de dialogue popup moderne et intuitive.
    *   La popup s'affiche désormais uniquement lors d'un clic gauche sur une case vide, libérant le clic droit pour de futures fonctionnalités.
    *   L'expérience utilisateur est plus fluide et l'interface de l'éditeur est moins encombrée.

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
