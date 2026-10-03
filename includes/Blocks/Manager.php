<?php
/**
 * Gutenberg Blocks Manager.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Blocks;

/**
 * Class Manager
 * Handles the registration of all Gutenberg blocks.
 */
class Manager {

	/**
	 * Initialize the blocks registration hooks and bindings.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register_blocks' ) );
		( new Bindings_Manager() )->init();
	}

	/**
	 * Register Gutenberg blocks from build directory.
	 *
	 * @return void
	 */
	public function register_blocks(): void {
		$build_dir = ROI_PLUGIN_DIR . 'build/';
		register_block_type( $build_dir . 'diagramme' );
		register_block_type( $build_dir . 'pgn' );

		// WordPress 6.5+ / 7.x Interactivity API state initialization for diagramme and pgn blocks.
		if ( function_exists( 'wp_interactivity_state' ) ) {
			wp_interactivity_state(
				'roi/diagramme',
				array(
					'defaultFen'         => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
					'defaultOrientation' => 'white',
				)
			);

			wp_interactivity_state(
				'roi/pgn',
				array(
					'defaultOrientation' => 'white',
				)
			);
		}
	}
}
