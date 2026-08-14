# Directives Agent & Règles projet

## 1. Outillage & MCP
- Interdiction d'utiliser `get_repository_content` sur la racine. Utiliser uniquement `search_code` ou `get_file_content` ciblés.
- Ne JAMAIS réécrire un fichier complet pour une modification. Fournir des diffs ou des fonctions isolées. Pas de disclaimers ni commentaires verbeux.

## 2. Stack Technique
- **Plugin** : `ROI` | Slug: `roi` | Prefix: `roi_` | Namespace: `ROI\` | Table: `{$wpdb->prefix}roi_`
- **WordPress** : 6.9.1 (Interactivity API, Transients, `apiVersion: 2` obligatoire pour les blocs Gutenberg avec Chessground/eg-chessboard).
- **PHP** : 8.4 avec `declare(strict_types=1);`. ZÉRO Composer en prod. Autoloader SPL natif dans `roi.php`.
- **JS / CSS** : ES2021 Vanilla (pas de jQuery), SCSS avec BEM. Compilés dans `build/` et `assets/css/`.

## 3. Architecture & Structure
- **PSR-4 / Namespaces** : Sub-folders dans `includes/` en PascalCase (`includes/Admin/`, `includes/CPT/`). Fichiers/classes en PascalCase.
- **Assets centralisés** : `assets/css/` et `assets/js/`. Naming: `{contexte}-{composant}.{ext}` (ex: `admin-settings.js`). Enqueue handles préfixés par `roi-`.
- **Complexité = Sous-dossier** : Si > 300-400 lignes, découper la classe/module dans un sous-dossier thématique avec le pattern Manager/Components. Une classe = Un fichier.

## 4. Règles Code & Sécurité
- **PHP 8.4** : Promoted properties, Enums typés, DTO `readonly`, strict return types. $wpdb->prepare obligatoire.
- **Sécurité WP** : Nonce + Capability checks (`manage_options`) systématiques. Input sanitization + Output escaping (`esc_html`, `esc_attr`).
- **Post Meta** : Attribut `name` HTML sans `_`, mais enregistrement meta BDD avec `_` (ex: `_roi_meta_key`).
- **Shortcodes** : Capturer `wp_editor()` via `ob_start()` / `ob_get_clean()`.

## 5. QA & Conformité
- Config PHPStan Level 6 (`phpstan.neon`) + ESLint WP (`.eslintrc.json`).
- Versionning sémantique synchronisé : `roi.php`, constante `ROI_VERSION`, `package.json`, `CHANGELOG.md`.