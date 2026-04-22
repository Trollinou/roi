<?php
declare(strict_types=1);

namespace ROI\Services\Chess;

/**
 * Service de gestion du moteur d'échecs.
 */
final class Engine {

    /** @var string URL du dossier des librairies externes */
    private string $lib_url;

    public function __construct() {
        $this->lib_url  = ROI_PLUGIN_URL . 'includes/lib/';
    }

    /**
     * Initialisation des hooks.
     */
    public function init(): void {
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
        add_action( 'init', [ $this, 'register_block' ] );
        add_shortcode( 'chess_board', [ $this, 'render_chessboard' ] );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_block_editor_assets' ] );
    }

    /**
     * Enregistre le bloc Gutenberg.
     */
    public function register_block(): void {
        // Le bloc est maintenant compilé dans le dossier build/ à la racine
        register_block_type( ROI_PLUGIN_DIR . 'build/blocks/chessboard', [
            'render_callback' => [ $this, 'render_block' ],
        ] );
    }

    /**
     * Assets pour l'éditeur de blocs.
     */
    public function enqueue_block_editor_assets(): void {
        // Enregistrer les styles cm-chessboard pour l'éditeur
        wp_enqueue_style( 'roi-cm-chessboard', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/chessboard.css', [], ROI_VERSION );
        wp_enqueue_style( 'roi-cm-chessboard-markers', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/extensions/markers/markers.css', [ 'roi-cm-chessboard' ], ROI_VERSION );
        wp_enqueue_style( 'roi-cm-chessboard-arrows', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/extensions/arrows/arrows.css', [ 'roi-cm-chessboard' ], ROI_VERSION );
        wp_enqueue_style( 'roi-cm-chessboard-promotion', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/extensions/promotion-dialog/promotion-dialog.css', [ 'roi-cm-chessboard' ], ROI_VERSION );

        // Localisation des chemins pour le script d'édition
        wp_localize_script( 'roi-chessboard-editor-script', 'roiChessEditor', [
            'pluginUrl' => ROI_PLUGIN_URL,
        ] );
    }

    /**
     * Callback de rendu pour le bloc.
     * 
     * @param array<string, mixed> $attributes
     */
    public function render_block( array $attributes ): string {
        return $this->render_chessboard( $attributes );
    }

    /**
     * Enqueue des assets front-end.
     */
    public function enqueue_assets(): void {
        // Styles des librairies
        wp_enqueue_style( 'roi-cm-chessboard', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/chessboard.css', [], ROI_VERSION );
        wp_enqueue_style( 'roi-cm-chessboard-markers', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/extensions/markers/markers.css', [ 'roi-cm-chessboard' ], ROI_VERSION );
        wp_enqueue_style( 'roi-cm-chessboard-arrows', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/extensions/arrows/arrows.css', [ 'roi-cm-chessboard' ], ROI_VERSION );
        wp_enqueue_style( 'roi-cm-chessboard-promotion', ROI_PLUGIN_URL . 'build/cm-chessboard-assets/extensions/promotion-dialog/promotion-dialog.css', [ 'roi-cm-chessboard' ], ROI_VERSION );
        
        // Style de l'application (compilé depuis SCSS)
        wp_enqueue_style( 'roi-chess-style', ROI_PLUGIN_URL . 'assets/css/chessboard-style.css', [ 'roi-cm-chessboard' ], ROI_VERSION );

        // Scripts - Utiliser la version compilée par Webpack
        wp_enqueue_script( 'roi-chess-app', ROI_PLUGIN_URL . 'build/chessboard-app.js', [ 'wp-element' ], ROI_VERSION, true );

        wp_localize_script( 'roi-chess-app', 'chessEngineData', [
            'pluginUrl'         => ROI_PLUGIN_URL,
            'stockfishPath'     => $this->lib_url . 'stockfish/stockfish.js',
            'stockfishWasmPath' => $this->lib_url . 'stockfish/stockfish.wasm',
            'translations'      => [
                'engineThinking'  => __( "Le moteur réfléchit...", "roi" ),
                'yourTurn'        => __( "À vous de jouer", "roi" ),
                'checkmate'       => __( "Échec et mat!", "roi" ),
                'stalemate'       => __( "Pat!", "roi" ),
                'draw'            => __( "Nulle!", "roi" ),
                'selectPromotion' => __( "Sélectionnez une pièce", "roi" ),
            ]
        ] );
    }

    /**
     * Rendu de l'échiquier (Shortcode & Bloc).
     * 
     * @param array<string, mixed> $atts
     */
    public function render_chessboard( array $atts ): string {
        $atts = shortcode_atts( [
            'fen'             => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            'orientation'     => 'white',
            'engineElo'       => 1200,
            'enableEngine'    => 'false',
            'enableMoves'     => 'true',
            'borderType'      => 'frame',
            'showCoordinates' => true,
            'pieces'          => 'standard',
            'cssClass'        => 'chessboard-js',
        ], $atts, 'chess_board' );

        $board_id      = 'chessboard-' . uniqid();
        $enable_engine = filter_var( $atts['enableEngine'], FILTER_VALIDATE_BOOLEAN );
        $enable_moves  = filter_var( $atts['enableMoves'], FILTER_VALIDATE_BOOLEAN );

        ob_start();
        include ROI_PLUGIN_DIR . 'templates/chessboard.php';
        return ob_get_clean();
    }
}
