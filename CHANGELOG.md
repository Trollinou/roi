# Changelog

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
