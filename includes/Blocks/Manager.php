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
	 * Initialize the blocks registration hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register_blocks' ) );
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
	}
}
