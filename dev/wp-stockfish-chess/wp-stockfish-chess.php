<?php
/**
 * Plugin Name:       WP Stockfish Chess
 * Description:       Joue aux échecs contre Stockfish (niveau débutant) via un shortcode [stockfish].
 * Version:           1.0.0
 * Author:            Etienne Gagnon
 */

if (!defined('ABSPATH')) {
    exit; // Accès direct interdit
}

function wps_stockfish_chess_shortcode() {
    // Le contenu HTML de notre jeu d'échecs
    $content = '
        <div id="wps-chess-container">
            <div id="board" style="width: 400px; max-width: 100%;"></div>
            <div id="game-info">
                <p>Statut : <span id="status">En attente de votre coup...</span></p>
                <button id="new-game-button">Nouvelle partie</button>
            </div>
        </div>
    ';
    return $content;
}
add_shortcode('stockfish', 'wps_stockfish_chess_shortcode');

function wps_enqueue_chess_assets() {
    // S'assurer que le shortcode est présent sur la page avant de charger les scripts
    if (is_a($GLOBALS['post'], 'WP_Post') && has_shortcode($GLOBALS['post']->post_content, 'stockfish')) {
        
        // --- LIENS CDN CORRIGÉS ---
        wp_enqueue_script('chess-js', 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js', array(), '0.10.3', true);
        wp_enqueue_script('chessboard-js', 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js', array('jquery'), '1.0.0', true);
        
        // --- Notre script de jeu ---
        wp_enqueue_script('wps-stockfish-game', plugin_dir_url(__FILE__) . 'js/game.js', array('jquery', 'chess-js', 'chessboard-js'), '1.1', true);

        // --- AJOUT DE wp_localize_script ---
        // Cette fonction passe des données de PHP à notre script JavaScript.
        // Nous créons un objet JS 'wpsStockfishData' qui contiendra l'URL du plugin.
        $data_to_pass = array(
            'plugin_url' => plugin_dir_url(__FILE__)
        );
        wp_localize_script('wps-stockfish-game', 'wpsStockfishData', $data_to_pass);

        // --- Styles CSS ---
        wp_enqueue_style('chessboard-css', 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css');
        wp_enqueue_style('wps-stockfish-style', plugin_dir_url(__FILE__) . 'css/style.css');
    }
}
add_action('wp_enqueue_scripts', 'wps_enqueue_chess_assets');