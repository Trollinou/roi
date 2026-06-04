<?php
/**
 * Chess Engine Integration.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Chess;

/**
 * Class ChessEngine
 * Manages the integration of the chess engine.
 */
class ChessEngine {

	/**
	 * Single instance.
	 *
	 * @var ChessEngine|null
	 */
	private static ?ChessEngine $instance = null;

	/**
	 * Base URL.
	 *
	 * @var string
	 */
	private string $plugin_url;

	/**
	 * Base path.
	 *
	 * @var string
	 */
	private string $plugin_path;

	/**
	 * Get the single instance.
	 *
	 * @param string $plugin_url  Base URL.
	 * @param string $plugin_path Base path.
	 * @return ChessEngine
	 */
	public static function get_instance( string $plugin_url, string $plugin_path ): ChessEngine {
		if ( null === self::$instance ) {
			self::$instance = new self( $plugin_url, $plugin_path );
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * @param string $plugin_url  Base URL.
	 * @param string $plugin_path Base path.
	 */
	private function __construct( string $plugin_url, string $plugin_path ) {
		$this->plugin_url  = $plugin_url;
		$this->plugin_path = $plugin_path;

		// Hooks
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'init', [ $this, 'register_block' ] );
		add_shortcode( 'chess_board', [ $this, 'render_chessboard' ] );
	}

	/**
	 * Register Gutenberg block.
	 *
	 * @return void
	 */
	public function register_block(): void {
		register_block_type(
			$this->plugin_path . 'includes/chess/dist',
			[
				'render_callback' => [ $this, 'render_block' ],
			]
		);
	}

	/**
	 * Render Gutenberg block callback.
	 *
	 * @param array $attributes Block attributes.
	 * @return string HTML output.
	 */
	public function render_block( array $attributes ): string {
		return $this->render_chessboard( $attributes );
	}

	/**
	 * Enqueue scripts/styles.
	 *
	 * @return void
	 */
	public function enqueue_assets(): void {
		$chess_url = $this->plugin_url . 'includes/chess/';

		wp_enqueue_style(
			'gutemberg-chessboard-style',
			$chess_url . 'dist/style.css',
			[],
			ROI_VERSION
		);

		wp_enqueue_script(
			'gutemberg-chessboard-view',
			$chess_url . 'dist/gutemberg-chessboard-view.js',
			[ 'wp-element' ],
			ROI_VERSION,
			true
		);
	}

	/**
	 * Render chessboard layout.
	 *
	 * @param array|string $atts Shortcode / block attributes.
	 * @return string HTML output.
	 */
	public function render_chessboard( $atts ): string {
		$atts = shortcode_atts(
			[
				'fen'               => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				'orientation'       => 'white',
				'playerColor'       => 'both',
				'viewOnly'          => 'true',
				'useStockfish'      => 'false',
				'stockfishElo'      => 1500,
				'showEvaluationBar' => 'false',
				'showThreats'       => 'false',
				'coordinates'       => 'true',
				'freeMode'          => 'false',
			],
			$atts,
			'chess_board'
		);

		$board_id            = 'chessboard-' . uniqid();
		$use_stockfish       = filter_var( $atts['useStockfish'], FILTER_VALIDATE_BOOLEAN );
		$show_evaluation_bar = filter_var( $atts['showEvaluationBar'], FILTER_VALIDATE_BOOLEAN );
		$view_only           = filter_var( $atts['viewOnly'], FILTER_VALIDATE_BOOLEAN );
		$show_threats        = filter_var( $atts['showThreats'], FILTER_VALIDATE_BOOLEAN );
		$coordinates         = filter_var( $atts['coordinates'], FILTER_VALIDATE_BOOLEAN );
		$free_mode           = filter_var( $atts['freeMode'], FILTER_VALIDATE_BOOLEAN );

		ob_start();
		include $this->plugin_path . 'includes/chess/templates/chessboard.php';
		return (string) ob_get_clean();
	}
}
