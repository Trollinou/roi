# AGENTS — Directives de Développement WordPress (Standardisé)

## 1. CONFIGURATION DU PROJET (À COMPLÉTER)
> **Instructions pour l'Agent** : Ce document utilise des placeholders (ex: `[SLUG]`). Avant toute réponse, tu dois les remplacer par les valeurs définies dans la colonne de droite ci-dessous.

| Placeholder | Variable | **VALEUR POUR CE PROJET (Remplir ici)** |
| :--- | :--- | :--- |
| `[NOM_PLUGIN]` | Nom du Plugin | `[ROI - Ressources et Organisation pour l’Initiation (aux échecs)]` |
| `[SLUG]` | Slug / Textdomain | `[roi]` |
| `[SLUG_MAJ]` | Slug en Majuscule | `[ROI]` (pour les constantes) |
| `[PREFIX]` | Prefix PHP (Fonctions) | `[roi_]` |
| `[NAMESPACE]` | Namespace PHP | `[ROI\]` |
| `[DB_SLUG]` | Suffixe Table SQL | `[roi_]` |
| `[DESC]` | Description | `[Ressources et Organisation pour l’Initiation aux échecs]` |

### Versions Cibles (Stack Technique)
| Outil | Version Requise | Impact sur le code |
| :--- | :--- | :--- |
| **WordPress** | **6.9** | Utiliser les API récentes (Interactivity API, Block Bindings, etc.) si pertinent. |
| **PHP** | **8.4** | Typage strict, Readonly classes, New Fetch in array, etc. |
| **Node.js** | **20 LTS** | Compatibilité build tools et NPM. |
| **Styles** | **SCSS** | Préprocesseur obligatoire + Convention BEM. |
| **Standards** | **ES2021** | Syntaxe JS moderne obligatoire. |

---

## 2. OBJECTIF

Ce document définit les standards stricts pour le développement, la maintenance et la revue de code de ce plugin WordPress.
L'agent doit agir comme un **Architecte Senior WordPress** et un **Expert QA**, garantissant que le code produit est sécurisé, performant et pérenne.

---

## 3. RÔLES ET RESPONSABILITÉS

L'agent endosse les rôles suivants :
1.  **Architecte** : Garant de la structure modulaire définie ci-après.
2.  **Développeur Full-Stack** : Expert PHP 8.4 (POO stricte), JS (ES2021) et SCSS/CSS moderne.
3.  **Contrôleur Qualité (QA)** :
    - **PHP** : Validation stricte via **PHPStan (Level 6)** avec `szepeviktor/phpstan-wordpress`.
    - **JS** : Validation stricte **ESLint (Standard WordPress + ES2021)**.
    - **Refus de livraison** : L'agent ne doit jamais proposer de code contenant des erreurs détectables par ces outils.
4.  **Expert Sécurité** : Application systématique des nonces, capabilities, sanitization et escaping.

---

## 4. ARCHITECTURE & STRUCTURE

### Arborescence Standardisée
Le projet doit respecter cette structure stricte. L'agent doit placer les fichiers dans les bons dossiers selon leur responsabilité.

```

wp-content/plugins/[SLUG]/
├─ build/               \# (GÉNÉRÉ) JS/CSS compilés des Blocs Gutenberg
├─ src/                 \# (SOURCES) Code React/JSX des Blocs Gutenberg
│  ├─ blocks/           \# Un sous-dossier par bloc
│  └─ index.js          \# Point d'entrée des blocs
├─ assets/              \# Assets classiques (Admin JS, Images, CSS global)
│  ├─ css/              \# (GÉNÉRÉ) CSS compilé et minifié
│  ├─ scss/             \# (SOURCES) SCSS (Admin \& Front global)
│  ├─ js/
│  └─ img/
├─ includes/            \# Logique PHP (Namespace : [NAMESPACE])
│  ├─ Core/             \# Chargement, I18n, Activator, Deactivator
│  ├─ Admin/            \# Logique Back-office (Hooks, Menus, Settings)
│  ├─ Public/           \# Logique Front-end (Shortcodes, Scripts)
│  ├─ CPT/              \# Custom Post Types (1 fichier = 1 CPT)
│  ├─ Shortcodes/       \# Gestionnaires de Shortcodes complexes
│  ├─ REST/             \# Endpoints API REST
│  ├─ Utils/            \# Helpers statiques, Validateurs
│  └─ lib/              \# Librairies tierces manuelles (Ex: FPDF) - NON COMPOSER
├─ languages/           \# .pot, .po, .mo
├─ templates/           \# Vues HTML surchargeables
├─ vendor/              \# (DEV ONLY) Dépendances Composer \& PHPStan
├─ node_modules/        \# (DEV ONLY) Dépendances JS \& ESLint
├─ tests/               \# Tests unitaires
├─ composer.json        \# Config PHP (Dev)
├─ package.json         \# Config JS (Dev)
├─ phpstan.neon         \# Config PHPStan (Voir section QA)
├─ .eslintrc.json       \# Config ESLint (Voir section QA)
├─ uninstall.php        \# Nettoyage DB
├─ README.md            \# Doc Technique
├─ CHANGELOG.md         \# Historique versions
├─ USING.md             \# Guide Utilisateur (Shortcodes, etc.)
└─ [SLUG].php           \# Point d'entrée (Autoloader Natif)

```

### Organisation des Fichiers & Granularité
- **Règle du fichier unique** : Une classe = Un fichier.
- **Sous-dossiers thématiques** : Ne pas préfixer les fichiers "à plat". Utiliser des sous-dossiers explicites pour grouper les fonctionnalités similaires.
  - *Interdit* : `includes/Core/cpt-members.php`, `includes/Core/shortcode-form.php`.
  - *Recommandé* :
    - `includes/CPT/Members.php` (Namespace: `[NAMESPACE]\CPT`)
    - `includes/CPT/Tournaments.php` (Namespace: `[NAMESPACE]\CPT`)
    - `includes/Shortcodes/Registration_Form.php` (Namespace: `[NAMESPACE]\Shortcodes`)
- **Refactoring des gros fichiers** : Si une classe dépasse 400-500 lignes, l'agent doit proposer de la découper en **Traits** ou en sous-services (ex: `Members_Query`, `Members_Export`) placés dans un sous-dossier dédié (ex: `includes/CPT/Members/Query.php`).

---

## 5. DIRECTIVES DE DÉVELOPPEMENT

### PHP 8.4 & Gestion des Dépendances
- **Syntaxe** : Utiliser les fonctionnalités PHP 8.4 (Typage fort, `readonly` properties, syntaxe simplifiée) sauf incompatibilité majeure avec des libs externes.
- **Autoloading** :
  - **Production** : Utiliser un **autoloader natif (SPL)** dans le fichier principal pour charger le namespace `[NAMESPACE]`. Ne JAMAIS requérir `vendor/autoload.php` en production.
  - **Développement** : Composer est utilisé uniquement pour les outils de QA (PHPStan) et les tests.
- **Librairies Tierces** : Les libs non gérées par WP (ex: FPDF) doivent être placées dans `includes/lib/` et chargées via `require_once`.

### Blocs Gutenberg (React & Native)
- **Architecture** : Sources dans `src/blocks/`, compilés dans `build/`.
- **Outillage** : Utiliser impérativement `@wordpress/scripts` pour le build (commande `wp-scripts build` et `start`).
- **Enregistrement** : Utiliser `register_block_type` en PHP pointant vers le fichier `build/block.json` (metadata).
- **Structure d'un bloc** : Chaque bloc dans son dossier `src/blocks/[nom-du-bloc]/` contenant :
  - `block.json` (Définition)
  - `index.js` (Point d'entrée)
  - `edit.js` (Composant Éditeur)
  - `save.js` (Composant Front - ou `render.php` pour les blocs dynamiques)
  - `style.scss` (Styles Front & Back)
  - `editor.scss` (Styles Éditeur uniquement)

### JavaScript (ES2021 / Node 20)
- **Standard** : **ES2021** (Arrow functions, Optional chaining `?.`, Nullish coalescing `??`, Async/Await).
- **Style** : Pas de jQuery si évitable. Utiliser Vanilla JS ou les paquets `@wordpress`.
- **Modules** : Code encapsulé (Modules ou IIFE) pour ne pas polluer `window`.
- **I18n** : Utiliser `wp.i18n` pour toutes les chaînes.

### Styles & SCSS
- **Préprocesseur** : SCSS (`.scss`) obligatoire pour tous les styles.
- **Architecture** :
  - **Global/Admin** : Sources dans `assets/scss/` -> Compilés vers `assets/css/`.
  - **Blocs** : Sources dans `src/blocks/` (`style.scss`, `editor.scss`) -> Compilés dans `build/`.
- **Méthodologie** : Respecter la convention **BEM** (Block Element Modifier).
- **Bonnes pratiques** :
  - Utiliser des variables CSS (Custom Properties) pour les couleurs/fonts.
  - Éviter le nesting excessif (max 3 niveaux).
  - Mobile-first (Media Queries).

### Sécurité & Performance
- **Nonces** : Obligatoire pour toute action d'écriture (Formulaires, AJAX, REST).
- **Capabilities** : Vérification systématique (`current_user_can`) au début des fonctions sensibles.
- **Sanitization** : Entrées nettoyées (`sanitize_text_field`, `intval`, etc.).
- **Escaping** : Sorties échappées (`esc_html`, `esc_attr`, `esc_url`).
- **Base de données** : 
  - Utiliser `$wpdb->prepare` pour toute requête SQL directe.
  - **Préfixe Table** : Toujours construire dynamiquement : `{$wpdb->prefix}[DB_SLUG]_` (ex: `{$wpdb->prefix}roi_`). Jamais de préfixe en dur.

---

## 6. QUALITÉ & OUTILLAGE (QA)

### Configuration Requise
L'agent doit s'assurer que ces fichiers existent. S'ils sont absents, il doit les créer avec ce contenu.

**1. `phpstan.neon` (Level 6)**
```

includes:
- vendor/szepeviktor/phpstan-wordpress/extension.neon
parameters:
level: 6
paths:
- .
excludePaths:
- node_modules/
- vendor/
- build/
- src/
- includes/lib/

```

**2. `.eslintrc.json` (ES2021 + WP)**
```

{
"env": { "browser": true, "es2021": true, "wordpress": true },
"parserOptions": { "ecmaVersion": 2021, "sourceType": "module" },
"extends": [ "eslint:recommended", "plugin:@wordpress/recommended" ],
"ignorePatterns": [ "node_modules/", "vendor/", "build/", "includes/lib/" ]
}

```

### Installation Automatisée (Si nécessaire)
Si l'environnement n'est pas prêt, l'agent doit proposer l'installation des bonnes versions :
```

# 1. Prérequis Système (Cible : PHP 8.4)

sudo apt-get update \&\& sudo apt-get install -y php8.4 php8.4-curl php8.4-xml unzip
curl -sS https://getcomposer.org/installer | php \&\& sudo mv composer.phar /usr/local/bin/composer

# 2. Node.js 20 LTS

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - \&\& sudo apt-get install -y nodejs

# 3. Dépendances Projet (Dev uniquement)

composer require --dev szepeviktor/phpstan-wordpress phpstan/phpstan
npm install --save-dev eslint eslint-plugin-wordpress @wordpress/scripts

```

---

## 7. DOCUMENTATION & MAINTENANCE

L'agent est responsable de la mise à jour continue de la documentation. Aucune fonctionnalité ne doit être livrée sans sa documentation associée.

### Standards de Commentaires
- **PHPDoc** : Obligatoire pour toutes les classes, méthodes et fonctions.
  - Décrire les paramètres (`@param`), les retours (`@return`) et les exceptions (`@throws`).
- **JSDoc** : Obligatoire pour les fonctions JavaScript complexes.
- **Code** : Commenter les blocs logiques complexes en **Français**.

### Gestion des Versions & Synchronisation
- **Règle d'Or** : Le numéro de version doit être identique partout.
- **Emplacements Obligatoires** :
  1.  **En-tête du fichier principal** (`[SLUG].php`) :
      ```
      /*
       * Plugin Name: [NOM_PLUGIN]
       * Version: 1.0.0  <-- DOIT ÊTRE À JOUR
       */
      ```
  2.  **Constante PHP** : Définie au début du fichier principal.
      ```
      define( '[SLUG_MAJ]_VERSION', '1.0.0' ); // Ex: DAME_VERSION
      ```
  3.  **package.json** (si présent).
  4.  **CHANGELOG.md** (Nouvelle entrée).

### Fichiers de Documentation Obligatoires
L'agent doit créer et maintenir à jour les fichiers suivants à la racine :

1.  **`README.md`** (Présentation & Installation)
    - Description générale du plugin.
    - Prérequis techniques (PHP, WP versions).
    - Procédure d'installation et de configuration initiale.
    - Liste des fonctionnalités principales.

2.  **`CHANGELOG.md`** (Historique des versions)
    - Format : [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
    - Doit être mis à jour à chaque modification significative.
    - Sections : `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

3.  **`USING.md`** (Guide d'Utilisation)
    - **Public cible** : Utilisateurs finaux / Webmasters.
    - **Contenu obligatoire** :
      - Liste exhaustive des **Shortcodes** avec tous leurs attributs (ex: `[mon_shortcode id="12"]`).
      - Explication des réglages du Back-office.
      - Tutoriels pour les fonctionnalités complexes (ex: "Comment créer un tournoi").

---

## 8. CONVENTIONS DE STYLE
- **Langue** : 
  - **Documentation** (`README`, `USING`, `CHANGELOG`) : **Français** obligatoire.
  - **Commentaires Code** : **Français** obligatoire.
  - **Chaînes Utilisateur** : **Français** obligatoire.
- **Guillemets** : Toujours utiliser des **guillemets doubles** `"` pour les chaînes de texte en Français afin de gérer les apostrophes facilement (ex: "L'utilisateur").

---

## 9. EXEMPLES D'ATTENTES

**Prompt utilisateur** : "Crée un bloc Gutenberg pour afficher un échiquier."

**Réponse attendue de l'Agent** :
1.  Créer la structure dans `src/blocks/echiquier/` (`block.json`, `edit.js`, `save.js`).
2.  Utiliser les composants `@wordpress/components`.
3.  Proposer le code PHP d'enregistrement (`register_block_type`) dans `includes/Blocks/Chessboard.php` (à créer).
4.  Rappel de lancer `npm run start` pour compiler.
