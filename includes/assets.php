<?php
/**
 * Handles asset enqueuing for the ROI plugin.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Enqueues front-end scripts and styles.
 */
function roi_enqueue_public_assets() {
    // Enqueue the public-facing stylesheet.
    wp_enqueue_style(
        'roi-public-styles',
        plugin_dir_url( __FILE__ ) . '../public/css/roi-public-styles.css',
        array(),
        ROI_VERSION
    );
}
add_action( 'wp_enqueue_scripts', 'roi_enqueue_public_assets' );

/**
 * Enqueues scripts and styles for the Stockfish chessboard.
 */
function roi_enqueue_stockfish_assets() {
    // S'assurer que le shortcode est présent sur la page avant de charger les scripts
    if (is_a($GLOBALS['post'], 'WP_Post') && has_shortcode($GLOBALS['post']->post_content, 'roi_stockfish')) {

        // --- LIENS CDN CORRIGÉS ---
        wp_enqueue_script('chess-js', 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js', array(), '0.10.3', true);
        wp_enqueue_script('chessboard-js', 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js', array('jquery'), '1.0.0', true);

        // --- Notre script de jeu ---
        wp_enqueue_script('wps-stockfish-game', plugin_dir_url( __FILE__ ) . '../public/stockfish/js/game.js', array('jquery', 'chess-js', 'chessboard-js'), '1.1', true);

        // --- AJOUT DE wp_localize_script ---
        // Cette fonction passe des données de PHP à notre script JavaScript.
        // Nous créons un objet JS 'wpsStockfishData' qui contiendra l'URL du plugin.
        $data_to_pass = array(
            'plugin_url' => plugin_dir_url( __FILE__ ) . '../public/stockfish/'
        );
        wp_localize_script('wps-stockfish-game', 'wpsStockfishData', $data_to_pass);

        // --- Styles CSS ---
        wp_enqueue_style('chessboard-css', 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css');
        wp_enqueue_style('wps-stockfish-style', plugin_dir_url( __FILE__ ) . '../public/stockfish/css/style.css');
    }
}
add_action('wp_enqueue_scripts', 'roi_enqueue_stockfish_assets');
