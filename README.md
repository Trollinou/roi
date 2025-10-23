# ROI - Ressources et Organisation pour l’Initiation aux échecs

**Version:** 1.0.4
**Auteur:** Etienne Gagnon
**Licence:** GPL v2 or later

## Description

Ce plugin contient toute la partie portant sur l'apprentissage avec les cours, exercices et leçons, les catégories dédié à l'apprentissage, la sauvegarde/restauration de la base apprentissage.

Ce plugin a été développé en suivant les meilleures pratiques de WordPress en matière de sécurité, de performance, de maintenabilité et d'évolutivité.

## Dépendances

Ce plugin est dépendant du plugin DAME. Vous devez avoir le plugin DAME installé et activé pour que ce plugin fonctionne.

## Prérequis

*   **WordPress :** 6.8 ou supérieur
*   **PHP :** 8.2 ou supérieur

## Fonctionnalités Principales

### Module Pédagogique (Échecs)

*   **Contenus Pédagogiques :** Gestion de Leçons, Exercices et Cours avec un système de difficulté unifié.
*   **Constructeur de Cours :** Interface visuelle pour assembler des leçons et des exercices en un parcours pédagogique.
*   **Suivi de Progression :** Les entraîneurs peuvent suivre les leçons complétées par les membres.
*   **Exercices Interactifs :** Interface publique pour s'entraîner sur les exercices avec feedback immédiat.
*   **Sauvegarde et Restauration :** Outil pour sauvegarder et restaurer l'ensemble du contenu pédagogique.

### Sauvegarde Automatique

Vous pouvez configurer l'heure de la sauvegarde journalière dans la section "Paramètres de sauvegarde" de la page d'options.

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
