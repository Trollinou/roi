<?php
/**
 * Chess Engine Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class Roi_Chess_Engine {
    
    private static $instance = null;
    private $plugin_url;
    private $plugin_path;
    
    public static function get_instance($plugin_url, $plugin_path) {
        if (null === self::$instance) {
            self::$instance = new self($plugin_url, $plugin_path);
        }
        return self::$instance;
    }
    
    private function __construct($plugin_url, $plugin_path) {
        $this->plugin_url = $plugin_url;
        $this->plugin_path = $plugin_path;
        
        // Hooks
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('init', array($this, 'register_block'));
        add_shortcode('chess_board', array($this, 'render_chessboard'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
    }
    
    public function register_block() {
        register_block_type( $this->plugin_path . 'includes/chess/blocks/chessboard/build', array(
            'render_callback' => array( $this, 'render_block' ),
        ) );
    }

    public function enqueue_block_editor_assets() {
        $chess_url = $this->plugin_url . 'includes/chess/';

        wp_localize_script('roi-chessboard-editor-script', 'roiChessEditor', array(
			'assetsUrl' => $chess_url . 'vendor/cm-chessboard/assets/',
			'chessboardUrl' => $chess_url . 'vendor/cm-chessboard/src/Chessboard.js',
		));
    }
    
    public function render_block($attributes) {
        return $this->render_chessboard($attributes);
    }
    
    public function enqueue_assets() {
        $chess_url = $this->plugin_url . 'includes/chess/';
        
        wp_enqueue_style(
            'cm-chessboard',
            $chess_url . 'vendor/cm-chessboard/assets/chessboard.css',
            array(),
            ROI_VERSION
        );
        
        wp_enqueue_style(
            'cm-chessboard-markers',
            $chess_url . 'vendor/cm-chessboard/assets/extensions/markers/markers.css',
            array('cm-chessboard'),
            ROI_VERSION
        );
        
        wp_enqueue_style(
            'cm-chessboard-arrows',
            $chess_url . 'vendor/cm-chessboard/assets/extensions/arrows/arrows.css',
            array('cm-chessboard'),
            ROI_VERSION
        );
        
        wp_enqueue_style(
            'cm-chessboard-promotion',
            $chess_url . 'vendor/cm-chessboard/assets/extensions/promotion-dialog/promotion-dialog.css',
            array('cm-chessboard'),
            ROI_VERSION
        );
        
        wp_enqueue_style(
            'roi-chess-style',
            $chess_url . 'assets/css/chessboard-style.css',
            array('cm-chessboard'),
            ROI_VERSION
        );
        
        wp_enqueue_script(
            'roi-chess-app',
            $chess_url . 'assets/js/chessboard-app.js',
            array(),
            ROI_VERSION,
            true
        );
        
        add_filter('script_loader_tag', array($this, 'add_module_type'), 10, 3);
        
        wp_localize_script('roi-chess-app', 'chessEngineData', array(
            'pluginUrl' => $chess_url,
            'assetsUrl' => $chess_url . 'vendor/cm-chessboard/assets/',
            'chessboardSrc' => $chess_url . 'vendor/cm-chessboard/src/Chessboard.js',
            'chessJsSrc' => $chess_url . 'vendor/chess.js/chess.js',
            'stockfishPath' => $chess_url . 'vendor/stockfish/stockfish.js',
            'stockfishWasmPath' => $chess_url . 'vendor/stockfish/stockfish.wasm',
            'translations' => array(
                'engineThinking' => __('Le moteur réfléchit...', 'roi'),
                'yourTurn' => __('À vous de jouer', 'roi'),
                'checkmate' => __('Échec et mat!', 'roi'),
                'stalemate' => __('Pat!', 'roi'),
                'draw' => __('Nulle!', 'roi'),
                'selectPromotion' => __('Sélectionnez une pièce', 'roi'),
            )
        ));
    }
    
    public function add_module_type($tag, $handle, $src) {
        if ('roi-chess-app' === $handle || 'roi-chess-app-editor' === $handle) {
            $tag = '<script type="module" src="' . esc_url($src) . '" id="' . $handle . '-js"></script>';
        }
        return $tag;
    }
    
    public function render_chessboard($atts) {
        $atts = shortcode_atts(array(
            'fen' => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            'orientation' => 'white',
            'engineElo' => 1200,
            'enableEngine' => 'false',
            'enableMoves' => 'true',
            'borderType' => 'frame',
            'showCoordinates' => true,
            'pieces' => 'standard',
            'cssClass' => 'chessboard-js',
        ), $atts, 'chess_board');
        
        $board_id = 'chessboard-' . uniqid();
        $enable_engine = filter_var($atts['enableEngine'], FILTER_VALIDATE_BOOLEAN);
        $enable_moves = filter_var($atts['enableMoves'], FILTER_VALIDATE_BOOLEAN);
        
        ob_start();
        include $this->plugin_path . 'includes/chess/templates/chessboard.php';
        return ob_get_clean();
    }
}
