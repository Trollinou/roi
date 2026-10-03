# Directives Agent & Règles projet — ROI

## 1. Outillage & MCP
- Interdiction d'utiliser `get_repository_content` sur la racine. Utiliser uniquement `search_code` ou `get_file_content` ciblés.
- Ne JAMAIS réécrire un fichier complet pour une modification. Fournir des diffs ou des fonctions isolées. Pas de disclaimers ni commentaires verbeux.
- **Consolidation des scripts** : Tous les scripts d'outillage Node.js / packaging / synchronisation résident obligatoirement dans `scripts/` (aucun dossier `script/`).
- **Contrôle Qualité Pré-Packaging** : Le script de release (`scripts/package.cjs`) doit obligatoirement valider l'intégrité de la suite QA (`npm run typecheck`, `npm run lint`, `phpstan`) avant de générer l'archive de production.

## 2. Stack Technique
- **Plugin** : `ROI` | Slug: `roi` | Prefix: `roi_` | Namespace: `ROI\` | Table: `{$wpdb->prefix}roi_`
- **WordPress** : 7.1 (Interactivity API avec `viewScriptModule`, Block Bindings API, `WP_HTML_Tag_Processor` via `ROI\Services\Html_Processor`, Transients).
- **Options API & Autoload (WP 7.1)** : Spécifier impérativement le paramètre `'autoload' => false` lors de l'enregistrement (`add_option()`, `register_setting()`) de toute option volumineuse ou ponctuelle afin de préserver la mémoire du bootstrap WordPress.
- **Blocs Gutenberg** : `apiVersion: 2` obligatoire pour les blocs Gutenberg (`roi/chessboard`, `roi/diagramme`, `roi/pgn`) pour la compatibilité avec Chessground/eg-chessboard (interdiction de passer en v3).
- **PHP** : 8.4 avec `declare(strict_types=1);`.
  - Promoted properties, Enums typés, DTO `readonly`, strict return types.
  - Typage strict des paramètres : interdiction formelle des types implicites nullables (utiliser explicitement `?Type $param = null`).
  - ZÉRO Composer en prod. Autoloader SPL natif strict dans `roi.php`.
- **Frontend** : TypeScript 5+ (TS / TSX / React 18 pour Gutenberg & Suivi), ES2021 Vanilla (pas de jQuery), SCSS avec BEM. Compilés dans `build/` et `assets/css/`.

## 2.1. Contrats d'API & Partage avec la PWA (dame-pwa)
- **Source Unique de Vérité (SSOT)** : Les types et contrats de données REST (`/wp-json/roi/v1/*`) et domaine échiquéen résident dans `src/types/` et sont exportés via `package.json` (`roi-types`).
- **Isolation des Types** : Les types exportés dans `src/types/` doivent être rigoureusement isolés de tout runtime DOM ou dépendance WordPress.
- **Consommation PWA** : `dame-pwa` consomme directement ces types via `"roi-types": "file:../roi"` et les réexporte via `pwa/src/types/roi.ts`.
- **Modifications Cross-Projet** : Toute modification de contrat REST ou de modèle doit être répercutée et validée sur des branches dédiées dans les deux dépôts (`roi` et `dame-pwa`).

## 2.2. Workflow & Méthodologie d'Implémentation
- **Phase 0 Obligatoire** : Toute nouvelle fonctionnalité ou refonte doit débuter par la création d'une branche Git dédiée (`feat/*`) et la validation de la baseline QA (`npm run typecheck` sur `roi` et `dame-pwa`) avant toute écriture de code.
- **Traçabilité & Documentation** : Renseigner systématiquement les nouveautés dans la section `[Unreleased]` du `CHANGELOG.md`.

## 3. Architecture & Structure
- **PSR-4 / Namespaces** : Sous-dossiers dans `includes/` en PascalCase (`includes/Admin/`, `includes/CPT/`, `includes/DTO/`, `includes/Blocks/`, `includes/Chess/`, `includes/Services/`). Fichiers/classes en PascalCase.
- **Cycle de Vie Événementiel & Lazy Loading** :
  - **API REST** : Ne jamais instancier les contrôleurs de routes REST au bootstrap global. Encapsuler leur enregistrement dans le hook `rest_api_init`.
  - **Services d'Administration & Metaboxes** : Isoler strictement sous le bloc conditionnel `if ( is_admin() )`.
- **Complexité & Modularité** : Seuil d'alerte à ~400-500 lignes. Découper selon le principe SRP avec le pattern Manager/Components ou Custom Hooks en React. Une classe PHP = Un fichier.

## 4. Règles Code, BDD, Sécurité & Caching
- **Repositories & Object Cache (`wp_cache_*`)** :
  - Toute requête SQL personnalisée `$wpdb` (exercices, diagrammes, parties) doit interroger l'Object Cache WordPress (`wp_cache_get`) avant d'exécuter la requête, puis stocker le résultat (`wp_cache_set`) dans le groupe dédié `roi_chess`.
  - **Invalidation Déterministe** : Tout Repository doit écouter les hooks de mutation (`save_post_{cpt}`, `deleted_post`) pour purger atomiquement les clés de cache concernées (`wp_cache_delete`).
- **Validation Déclarative REST (WP 7.1)** : Déclarer systématiquement les règles de typage, `validate_callback` et `sanitize_callback` dans la structure `args` de `register_rest_route()`.
- **Requêtes BDD (`$wpdb`)** : `$wpdb->prepare` obligatoire. Parité stricte entre le tableau `$data` et les spécificateurs `$format`.
- **Manipulation HTML** : Utiliser `WP_HTML_Tag_Processor` (via `ROI\Services\Html_Processor`) pour toute altération/injection d'attributs HTML côté serveur. Jamais de regex pour parser ou modifier du HTML.
- **Sécurité WP** : Nonce + Capability checks (`manage_options`, `edit_posts`) systématiques. Input sanitization + Output escaping (`esc_html`, `esc_attr`).
- **Post Meta** : Attribut `name` HTML sans `_`, mais enregistrement meta BDD avec `_` (ex: `_roi_exercise_fen`). Déclarer systématiquement `register_post_meta()` avec `show_in_rest => true` pour la compatibilité Block Bindings `core/post-meta` et l'API REST.
- **Shortcodes** : Capturer `wp_editor()` via `ob_start()` / `ob_get_clean()`.

## 5. QA, Tests & Conformité
- **PHPStan** : `vendor/bin/phpstan analyze --debug --memory-limit=2G` (mode single-process `--debug` obligatoire et mémoire 2G).
- **PHPCS & Style** : `vendor/bin/phpcbf` pour auto-fix WPCS, suivi de `vendor/bin/phpcs` pour la validation stricte.
- **TypeScript & Build** : `npm run typecheck` (`tsc --noEmit`), `npm run build` (`wp-scripts build`).
- **Validation PWA conjointe** : `npm run type-check` (`vue-tsc`) et `npm run build` dans `dame-pwa`.
- **Versionning Sémantique Synchronisé** : `roi.php`, constante `ROI_VERSION`, `package.json`, `CHANGELOG.md` et `block.json` (synchronisés via `scripts/version-sync.cjs`).

## 6. Performance Frontend, Web Vitals & Compatibilité Safari
- **Rendu Virtuel & INP** :
  - Appliquer `content-visibility: auto; contain-intrinsic-size: ...;` sur les grilles de diagrammes et listes d'exercices répétées.
- **Overlays & Modales** :
  - Interdiction formelle de `backdrop-filter: blur(...)` sur les calques contenant des interactions/échiquiers.
  - Structure de positionnement : Modale racine en `position: fixed; inset: 0;`, isolation matérielle (`isolation: isolate;`, `transform: translateZ(0);`).