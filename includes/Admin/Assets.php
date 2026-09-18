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
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_filter( 'get_user_metadata', array( $this, 'sanitize_meta_box_order_user_meta' ), 10, 4 );
		add_action( 'current_screen', array( $this, 'register_screen_meta_box_sanitizer' ) );
	}

	/**
	 * Enqueue admin scripts and styles.
	 *
	 * @param string $hook The current admin page.
	 * @return void
	 */
	public function enqueue_admin_assets( string $hook ): void {
		global $post_type;

		// Only load on CPT Exercice, Lecon, Cours or Video post editing screen.
		if ( ! in_array( $post_type, array( 'roi_exercice', 'roi_cours', 'roi_lecon', 'roi_video' ), true ) || ( 'post.php' !== $hook && 'post-new.php' !== $hook ) ) {
			return;
		}

		$plugin_dir = ROI_PLUGIN_DIR;
		$plugin_url = ROI_PLUGIN_URL;
		$chess_url  = $plugin_url . 'build/chessboard/';
		$chess_dir  = $plugin_dir . 'build/chessboard/';

		// Enqueue admin styles for all ROI post types.
		wp_enqueue_style(
			'roi-admin-style',
			$plugin_url . 'assets/css/admin-style.css',
			array(),
			ROI_VERSION
		);

		if ( in_array( $post_type, array( 'roi_exercice', 'roi_lecon' ), true ) ) {

			// Enqueue eg-chessboard styles & script.
			wp_enqueue_style(
				'roi-admin-chessboard-style',
				$chess_url . 'eg-chessboard.css',
				array(),
				ROI_VERSION
			);

			wp_enqueue_style(
				'roi-admin-fen-editor-style',
				$chess_url . 'admin-fen-editor.css',
				array( 'roi-admin-chessboard-style' ),
				ROI_VERSION
			);

			$fen_asset_file = $chess_dir . 'admin-fen-editor.asset.php';
			$fen_asset      = file_exists( $fen_asset_file ) ? include $fen_asset_file : array(
				'dependencies' => array( 'wp-element' ),
				'version'      => ROI_VERSION,
			);

			wp_enqueue_script(
				'roi-admin-fen-editor',
				$chess_url . 'admin-fen-editor.js',
				$fen_asset['dependencies'],
				$fen_asset['version'],
				true
			);

			if ( 'roi_exercice' === $post_type ) {
				$ex_asset_file = $chess_dir . 'admin-exercice-builder.asset.php';
				$ex_asset      = file_exists( $ex_asset_file ) ? include $ex_asset_file : array(
					'dependencies' => array( 'roi-admin-fen-editor' ),
					'version'      => ROI_VERSION,
				);

				wp_enqueue_script(
					'roi-admin-exercice-builder',
					$chess_url . 'admin-exercice-builder.js',
					array_merge( array( 'roi-admin-fen-editor' ), $ex_asset['dependencies'] ),
					$ex_asset['version'],
					true
				);
			}
		} elseif ( 'roi_cours' === $post_type ) {
			$cours_asset_file = $chess_dir . 'admin-cours-builder.asset.php';
			$cours_asset      = file_exists( $cours_asset_file ) ? include $cours_asset_file : array(
				'dependencies' => array(),
				'version'      => ROI_VERSION,
			);

			wp_enqueue_script(
				'roi-admin-cours-builder',
				$chess_url . 'admin-cours-builder.js',
				$cours_asset['dependencies'],
				$cours_asset['version'],
				true
			);

			wp_localize_script(
				'roi-admin-cours-builder',
				'roi_cours_builder',
				array(
					'nonce' => wp_create_nonce( 'roi_search_cours_items_nonce' ),
				)
			);
		} elseif ( 'roi_video' === $post_type ) {
			$video_asset_file = $chess_dir . 'admin-video-settings.asset.php';
			$video_asset      = file_exists( $video_asset_file ) ? include $video_asset_file : array(
				'dependencies' => array(),
				'version'      => ROI_VERSION,
			);

			wp_enqueue_script(
				'roi-admin-video-settings',
				$chess_url . 'admin-video-settings.js',
				$video_asset['dependencies'],
				$video_asset['version'],
				true
			);
		}
	}

	/**
	 * Sanitizes meta-box-order user options to prevent PHP Warnings in WordPress Core template.php.
	 *
	 * WordPress Core assumes meta-box-order_$page is always an array when truthy.
	 * If corrupted or stored as a non-array value, this filter returns false.
	 *
	 * @param mixed  $value     The value to return.
	 * @param int    $object_id ID of the object metadata is for.
	 * @param string $meta_key  Metadata key.
	 * @param bool   $single    Whether to return only the first value.
	 * @return mixed
	 */
	public function sanitize_meta_box_order_user_meta( mixed $value, int $object_id, string $meta_key, bool $single ): mixed {
		if ( str_contains( $meta_key, 'meta-box-order_' ) ) {
			$meta_cache = wp_cache_get( $object_id, 'user_meta' );
			if ( is_array( $meta_cache ) && isset( $meta_cache[ $meta_key ][0] ) ) {
				$raw = maybe_unserialize( $meta_cache[ $meta_key ][0] );
				if ( ! empty( $raw ) && ! is_array( $raw ) ) {
					return $single ? false : array( false );
				}
			}
		}

		return $value;
	}

	/**
	 * Registers a filter on get_user_option for the current admin screen's meta box order.
	 *
	 * Ensures that get_user_option("meta-box-order_{$screen->id}") always returns an array or false,
	 * preventing PHP Warnings in WordPress Core template.php:1327.
	 *
	 * @param \WP_Screen $screen Current WP_Screen object.
	 * @return void
	 */
	public function register_screen_meta_box_sanitizer( \WP_Screen $screen ): void {
		if ( empty( $screen->id ) ) {
			return;
		}

		add_filter(
			"get_user_option_meta-box-order_{$screen->id}",
			static function ( mixed $result ): mixed {
				if ( ! empty( $result ) && ! is_array( $result ) ) {
					return false;
				}
				return $result;
			}
		);
	}
}
