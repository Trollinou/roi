<?php
/**
 * Admin Assets handler.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin;

/**
 * Class Assets
 * Manages admin-specific assets (CSS/JS).
 */
class Assets {

	/**
	 * Initialize the class and register hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
	}

	/**
	 * Enqueue admin scripts and styles.
	 *
	 * @param string $hook The current admin page.
	 * @return void
	 */
	public function enqueue_admin_assets( string $hook ): void {
		global $post_type;

		// Only load on CPT Exercice, Lecon or Cours post editing screen
		if ( ! in_array( $post_type, [ 'roi_exercice', 'roi_cours', 'roi_lecon' ], true ) || ( 'post.php' !== $hook && 'post-new.php' !== $hook ) ) {
			return;
		}

		$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
		$chess_url  = $plugin_url . 'build/chessboard/';

		if ( in_array( $post_type, [ 'roi_exercice', 'roi_lecon' ], true ) ) {
			// Enqueue eg-chessboard styles & script
			wp_enqueue_style(
				'roi-chessboard-style',
				$chess_url . 'eg-chessboard.css',
				[],
				ROI_VERSION
			);

			wp_enqueue_script(
				'roi-admin-fen-editor',
				$chess_url . 'admin-fen-editor.js',
				[ 'wp-element' ],
				ROI_VERSION,
				true
			);

			if ( 'roi_exercice' === $post_type ) {
				// Enqueue admin-exercice-builder.js
				wp_enqueue_script(
					'roi-admin-exercice-builder',
					$chess_url . 'admin-exercice-builder.js',
					[ 'roi-admin-fen-editor' ],
					ROI_VERSION,
					true
				);
			}
		} elseif ( 'roi_cours' === $post_type ) {
			// Enqueue admin-cours-builder.js
			wp_enqueue_script(
				'roi-admin-cours-builder',
				$chess_url . 'admin-cours-builder.js',
				[],
				ROI_VERSION,
				true
			);

			wp_localize_script( 'roi-admin-cours-builder', 'roi_cours_builder', [
				'nonce' => wp_create_nonce( 'roi_search_cours_items_nonce' ),
			] );
		}
	}
}
