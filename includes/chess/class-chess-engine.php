<?php
/**
 * Chess Engine Integration
 *
 * @package ROI
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Roi_Chess_Engine
 *
 * Manages the integration of the chess engine, including the Gutenberg block,
 * shortcode, and all necessary asset enqueueing for both the front-end and
 * the block editor.
 */
class Roi_Chess_Engine {
    
    /**
     * The single instance of the class.
     *
     * @var Roi_Chess_Engine|null
     */
    private static $instance = null;

    /**
     * The plugin's base URL.
     *
     * @var string
     */
    private $plugin_url;

    /**
     * The plugin's base path.
     *
     * @var string
     */
    private $plugin_path;
    
    /**
     * Gets the single instance of the class.
     *
     * @param string $plugin_url  The plugin's base URL.
     * @param string $plugin_path The plugin's base path.
     * @return Roi_Chess_Engine The single instance of the class.
     */
    public static function get_instance($plugin_url, $plugin_path) {
        if (null === self::$instance) {
            self::$instance = new self($plugin_url, $plugin_path);
        }
        return self::$instance;
    }
    
    /**
     * Private constructor to prevent direct instantiation.
     *
     * @param string $plugin_url  The plugin's base URL.
     * @param string $plugin_path The plugin's base path.
     */
    private function __construct($plugin_url, $plugin_path) {
        $this->plugin_url = $plugin_url;
        $this->plugin_path = $plugin_path;
        
        // Hooks
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('init', array($this, 'register_block'));
        add_shortcode('chess_board', array($this, 'render_chessboard'));
    }
    
    /**
     * Registers the Gutenberg block for the chessboard.
     *
     * @since 1.0.0
     * @return void
     */
    public function register_block() {
        register_block_type( $this->plugin_path . 'includes/chess/dist', array(
            'render_callback' => array( $this, 'render_block' ),
        ) );
    }

    /**
     * Renders the chessboard block on the front-end.
     *
     * This function serves as the render callback for the Gutenberg block,
     * passing the block's attributes to the main rendering function.
     *
     * @since 1.0.0
     * @param array $attributes The attributes of the block.
     * @return string The HTML output of the chessboard.
     */
    public function render_block($attributes) {
        return $this->render_chessboard($attributes);
    }
    
    /**
     * Enqueues front-end scripts and styles for the chessboard.
     *
     * @since 1.0.0
     * @return void
     */
    public function enqueue_assets() {
        $chess_url = $this->plugin_url . 'includes/chess/';
        
        wp_enqueue_style(
            'gutemberg-chessboard-style',
            $chess_url . 'dist/style.css',
            array(),
            ROI_VERSION
        );
        
        wp_enqueue_script(
            'gutemberg-chessboard-view',
            $chess_url . 'dist/gutemberg-chessboard-view.js',
            array('wp-element'),
            ROI_VERSION,
            true
        );
    }
    
    /**
     * Renders the chessboard using a template file.
     *
     * This function processes the shortcode or block attributes, sets default values,
     * and includes a template file to generate the final HTML for the chessboard.
     *
     * @since 1.0.0
     * @param array $atts The attributes for the chessboard.
     * @return string The HTML output of the chessboard.
     */
    public function render_chessboard($atts) {
        $atts = shortcode_atts(array(
            'fen' => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            'orientation' => 'white',
            'playerColor' => 'both',
            'viewOnly' => 'true',
            'useStockfish' => 'false',
            'stockfishElo' => 1500,
            'showEvaluationBar' => 'false',
            'showThreats' => 'false',
            'coordinates' => 'true',
            'freeMode' => 'false',
        ), $atts, 'chess_board');
        
        $board_id = 'chessboard-' . uniqid();
        $use_stockfish = filter_var($atts['useStockfish'], FILTER_VALIDATE_BOOLEAN);
        $show_evaluation_bar = filter_var($atts['showEvaluationBar'], FILTER_VALIDATE_BOOLEAN);
        $view_only = filter_var($atts['viewOnly'], FILTER_VALIDATE_BOOLEAN);
        $show_threats = filter_var($atts['showThreats'], FILTER_VALIDATE_BOOLEAN);
        $coordinates = filter_var($atts['coordinates'], FILTER_VALIDATE_BOOLEAN);
        $free_mode = filter_var($atts['freeMode'], FILTER_VALIDATE_BOOLEAN);
        
        ob_start();
        include $this->plugin_path . 'includes/chess/templates/chessboard.php';
        return ob_get_clean();
    }
}
