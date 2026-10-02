# Directives Agent & Règles projet

## 1. Outillage & MCP
- Interdiction d'utiliser `get_repository_content` sur la racine. Utiliser uniquement `search_code` ou `get_file_content` ciblés.
- Ne JAMAIS réécrire un fichier complet pour une modification. Fournir des diffs ou des fonctions isolées. Pas de disclaimers ni commentaires verbeux.

## 2. Stack Technique
- **Plugin** : `ROI` | Slug: `roi` | Prefix: `roi_` | Namespace: `ROI\` | Table: `{$wpdb->prefix}roi_`
- **WordPress** : 7.1 (Interactivity API avec `viewScriptModule`, Block Bindings API, `WP_HTML_Tag_Processor` via `ROI\Services\Html_Processor`, Transients).
- **Blocs Gutenberg** : `apiVersion: 2` obligatoire pour les blocs Gutenberg (`roi/chessboard`, `roi/diagramme`, `roi/pgn`) pour la compatibilité avec Chessground/eg-chessboard (interdiction de passer en v3).
- **PHP** : 8.4 avec `declare(strict_types=1);`. ZÉRO Composer en prod. Autoloader SPL natif dans `roi.php`.
- **Frontend** : TypeScript 5+ (TS / TSX / React 18 pour Gutenberg & Suivi), ES2021 Vanilla (pas de jQuery), SCSS avec BEM. Compilés dans `build/` et `assets/css/`.

## 2.1. Contrats d'API & Partage avec la PWA (dame-pwa)
- **Source Unique de Vérité (SSOT)** : Les types et contrats de données REST (`/wp-json/roi/v1/*`) et domaine échiquéen résident dans `roi/src/types/` et sont exportés via `package.json` (`roi-types`).
- **Consommation PWA** : `dame-pwa` consomme directement ces types via `"roi-types": "file:../roi"` et les réexporte via `pwa/src/types/roi.ts`.
- **Modifications Cross-Projet** : Toute modification de contrat REST ou de modèle doit être répercutée et validée sur des branches dédiées dans les deux dépôts (`roi` et `dame-pwa`).

## 2.2. Workflow & Méthodologie d'Implémentation
- **Phase 0 Obligatoire** : Toute nouvelle fonctionnalité ou refonte doit débuter par la création d'une branche Git dédiée (`feat/*`) et la validation de la baseline QA (`npm run typecheck` sur `roi` et `dame-pwa`) avant toute écriture de code.
- **Traçabilité & Documentation** : Renseigner systématiquement les nouveautés dans la section `[Unreleased]` du `CHANGELOG.md`.

## 3. Architecture & Structure
- **PSR-4 / Namespaces** : Sub-folders dans `includes/` en PascalCase (`includes/Admin/`, `includes/CPT/`). Fichiers/classes en PascalCase.
- **Complexité & Modularité** : Seuil d'alerte à ~500 lignes (ou multi-responsabilités avérées). Découper selon le principe SRP (Single Responsibility Principle) avec le pattern Manager/Components ou Custom Hooks en React. Éviter le sur-découpage artificiel (over-engineering). Une classe PHP = Un fichier.

## 4. Règles Code & Sécurité
- **PHP 8.4** : Promoted properties, Enums typés, DTO `readonly`, strict return types. $wpdb->prepare obligatoire.
- **Sécurité WP** : Nonce + Capability checks (`manage_options`) systématiques. Input sanitization + Output escaping (`esc_html`, `esc_attr`).
- **Post Meta** : Attribut `name` HTML sans `_`, mais enregistrement meta BDD avec `_` (ex: `_roi_meta_key`). Déclarer systématiquement `register_post_meta()` avec `show_in_rest` pour la compatibilité Block Bindings `core/post-meta`.
- **Shortcodes** : Capturer `wp_editor()` via `ob_start()` / `ob_get_clean()`.
- **Manipulation HTML** : Utiliser `WP_HTML_Tag_Processor` (via `ROI\Services\Html_Processor`) pour toute altération/injection d'attributs HTML côté serveur. Jamais de regex pour parser ou modifier du HTML.

## 5. QA & Conformité
- Config PHPStan Level 6 (`phpstan.neon`) + ESLint WP (`.eslintrc.json`) + TypeScript Check (`npm run typecheck`).
- Validation PWA conjointe : `npm run type-check` (`vue-tsc`) et `npm run build` dans `dame-pwa`.
- Versionning sémantique synchronisé : `roi.php`, constante `ROI_VERSION`, `package.json`, `CHANGELOG.md`.