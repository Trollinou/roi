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

		$plugin_dir = plugin_dir_path( dirname( __DIR__, 2 ) . '/roi.php' );
		$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
		$chess_url  = $plugin_url . 'build/chessboard/';
		$chess_dir  = $plugin_dir . 'build/chessboard/';

		if ( in_array( $post_type, [ 'roi_exercice', 'roi_lecon' ], true ) ) {
			// Enqueue admin styles
			wp_enqueue_style(
				'roi-admin-style',
				$plugin_url . 'assets/css/admin-style.css',
				[],
				ROI_VERSION
			);

			// Enqueue eg-chessboard styles & script
			wp_enqueue_style(
				'roi-admin-chessboard-style',
				$chess_url . 'eg-chessboard.css',
				[],
				ROI_VERSION
			);

			$fen_asset_file = $chess_dir . 'admin-fen-editor.asset.php';
			$fen_asset      = file_exists( $fen_asset_file ) ? include $fen_asset_file : [ 'dependencies' => [ 'wp-element' ], 'version' => ROI_VERSION ];

			wp_enqueue_script(
				'roi-admin-fen-editor',
				$chess_url . 'admin-fen-editor.js',
				$fen_asset['dependencies'],
				$fen_asset['version'],
				true
			);

			if ( 'roi_exercice' === $post_type ) {
				$ex_asset_file = $chess_dir . 'admin-exercice-builder.asset.php';
				$ex_asset      = file_exists( $ex_asset_file ) ? include $ex_asset_file : [ 'dependencies' => [ 'roi-admin-fen-editor' ], 'version' => ROI_VERSION ];

				wp_enqueue_script(
					'roi-admin-exercice-builder',
					$chess_url . 'admin-exercice-builder.js',
					array_merge( [ 'roi-admin-fen-editor' ], $ex_asset['dependencies'] ),
					$ex_asset['version'],
					true
				);
			}
		} elseif ( 'roi_cours' === $post_type ) {
			$cours_asset_file = $chess_dir . 'admin-cours-builder.asset.php';
			$cours_asset      = file_exists( $cours_asset_file ) ? include $cours_asset_file : [ 'dependencies' => [], 'version' => ROI_VERSION ];

			wp_enqueue_script(
				'roi-admin-cours-builder',
				$chess_url . 'admin-cours-builder.js',
				$cours_asset['dependencies'],
				$cours_asset['version'],
				true
			);

			wp_localize_script( 'roi-admin-cours-builder', 'roi_cours_builder', [
				'nonce' => wp_create_nonce( 'roi_search_cours_items_nonce' ),
			] );
		}
	}
}
