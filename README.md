# ROI - Ressources et Organisation pour l’Initiation aux échecs

**Version:** 1.0.4
**Author:** Etienne Gagnon
**License:** GPL v2 or later
**Requires WordPress:** 6.8+
**Requires PHP:** 8.2+

## Description

The "ROI - Ressources et Organisation pour l’Initiation aux échecs" (Resources and Organization for Chess Initiation) plugin is a comprehensive Learning Management System (LMS) designed for chess education within a WordPress environment. It provides a robust framework for creating, managing, and delivering chess lessons, exercises, and courses. The plugin includes a sophisticated interactive chessboard block powered by Stockfish, `chess.js`, and `cm-chessboard`, allowing for demonstrations, exercises, and player-vs-AI games.

This plugin was developed following WordPress best practices for security, performance, and maintainability.

## Dependencies

This plugin requires the **DAME** plugin to be installed and activated. The plugin will automatically deactivate itself if the DAME dependency is not met.

## Installation

1.  **Download the plugin:** Obtain the plugin zip file.
2.  **Upload to WordPress:** Navigate to your WordPress admin dashboard, go to `Plugins` > `Add New`, and click `Upload Plugin`.
3.  **Select and Install:** Choose the downloaded zip file and click `Install Now`.
4.  **Activate:** Once the installation is complete, click `Activate Plugin`.
5.  **Verify Dependencies:** Ensure the **DAME** plugin is installed and activated.

## Key Features

### Learning Management System (LMS)

*   **Custom Post Types:**
    *   **Lessons (`roi_lecon`):** Create detailed chess lessons with text, images, and embedded chessboards.
    *   **Exercises (`roi_exercice`):** Design interactive multiple-choice or true/false questions, often featuring a chessboard for context.
    *   **Courses (`roi_cours`):** Build structured learning paths by assembling lessons and exercises in a specific order.
*   **Unified Difficulty System:** Assign a difficulty level (from "Very Easy" to "Expert") to all content, allowing for filtered learning.
*   **Visual Course Builder:** An intuitive dual-list interface to drag-and-drop lessons and exercises into a course.
*   **User Progression Tracking:** Logged-in members can mark lessons as complete. (Note: Full tracking features are managed by the DAME plugin).
*   **Interactive Exercise Interface:** A shortcode `[roi_exercices]` that generates a public-facing quiz system with immediate feedback.

### Interactive Chessboard Block (`roi/chessboard`)

*   **Multiple Modes:**
    *   **Demonstration:** A static board to display positions.
    *   **Exercise:** Allows free movement of pieces for setting up and solving puzzles.
    *   **Game vs. AI:** Play against the integrated Stockfish engine with adjustable ELO strength.
*   **Visual FEN Editor:** A powerful in-editor tool to visually create any board position. The editor provides real-time FEN validation and error messaging.
*   **High Customization:** Control board orientation, piece style, border type, coordinates, and color schemes.
*   **Robust Engine:** Powered by `chess.js` for game logic and `cm-chessboard` for rendering, ensuring accurate and reliable behavior.

### Administration

*   **Content Backup & Restore:** A dedicated admin page to export all learning content (lessons, exercises, courses, categories) to a `.json.gz` file and restore it, preventing data loss.

## How to Use

### Creating Content

1.  Navigate to the **Apprentissage** menu in the WordPress admin dashboard.
2.  Select **Leçons**, **Exercices**, or **Cours** to create new content.
3.  Use the custom fields to set the difficulty and other relevant details.
4.  For courses, use the **Constructeur de Cours** meta box to assemble your curriculum.

### Using the Chessboard Block

1.  In the block editor, add a new block and search for "Échiquier".
2.  Use the block's sidebar controls (the Inspector) to configure the board's appearance and functionality.
3.  Use the visual editor within the block to set the desired piece positions, or paste a valid FEN string.

### Shortcodes

*   `[roi_exercices]`: Displays the interactive exercise system on any page or post.
*   `[chess_board fen="..." enableEngine="true" ...]`: A legacy shortcode is available for rendering the chessboard. However, using the Gutenberg block is recommended.

## Development & File Structure

The plugin is organized into the following main directories:

*   `/admin`: Contains files related to the WordPress admin area, such as menu pages, meta boxes, and the backup/restore functionality.
*   `/assets`: Holds public-facing CSS and JS files.
*   `/includes`: The core logic of the plugin.
    *   `/chess`: Contains all chess-related functionality, including the Gutenberg block source (`/blocks`), the front-end JS app (`/assets`), PHP class (`class-chess-engine.php`), and third-party libraries (`/vendor`).
*   `/roi.php`: The main plugin file.
*   `/webpack.config.js`: Configuration for the `@wordpress/scripts` build process for the Gutenberg block.

### Build Process

The project uses `@wordpress/scripts` to compile the Gutenberg block assets. To modify the block's JavaScript or CSS:

1.  Navigate to the plugin's root directory in your terminal.
2.  Run `npm install` to install dependencies.
3.  Run `npm run build` to compile the source files from `includes/chess/blocks/chessboard/src` into the `includes/chess/blocks/chessboard/build` directory.

## Changelog

### 1.0.4 - 2025-10-23
*   **Major Chessboard Block Improvement:**
    *   Integrated `chess.js` for robust board state management and FEN validation.
    *   **Position Editor:** Allows creating custom positions (even "illegal" ones), validates FEN in real-time with detailed error messages, and makes Stockfish activation conditional on FEN validity.
    *   **Frontend View:** Fixed critical bugs related to pawn promotion, move validation in exercise mode, and visual glitches after an illegal move.

### 1.0.3 - 2025-10-22
*   **Chessboard Block Improvement:**
    *   The Stockfish engine level selector now displays a user-friendly ELO estimate (e.g., "1200-1400") instead of a numeric value (0-20).
    *   Refactored the block's code structure to follow WordPress conventions, improving maintainability.

### 1.0.2 - 2025-10-22
*   **Chessboard Block Improvement:**
    *   The "Color" option (board orientation) is now always visible.
    *   Added a "Show Coordinates" option.
    *   Reorganized block settings.
    *   Fixed a bug with coordinate display on the public page.

### 1.0.0 - 2025-09-15
*   Initial release of the plugin.
