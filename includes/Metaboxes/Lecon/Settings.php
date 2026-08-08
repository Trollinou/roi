<?php
/**
 * Settings metabox for Lecon CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Lecon;

/**
 * Class Settings
 * Manages configuration and difficulty level for Leçon post type.
 */
class Settings {

	/**
	 * Constructor.
	 * Registers actions.
	 */
	public function __construct() {
		add_action( 'init', [ $this, 'enregistrer_meta' ] );
		add_action( 'save_post', [ $this, 'sauvegarder_metabox' ] );
	}

	/**
	 * Registers post meta for REST API / Gutenberg.
	 *
	 * @return void
	 */
	public function enregistrer_meta(): void {
		register_post_meta( 'roi_lecon', '_roi_lecon_niveau', [
			'show_in_rest'      => [
				'schema' => [
					'type'    => 'integer',
					'default' => 1,
				],
			],
			'single'            => true,
			'type'              => 'integer',
			'default'           => 1,
			'sanitize_callback' => 'absint',
			'auth_callback'     => function( bool $allowed, string $meta_key, int $post_id ): bool {
				return current_user_can( 'edit_post', $post_id );
			},
		] );
	}

	/**
	 * Saves metabox fields fallback for classic forms and REST API.
	 *
	 * @param int $post_id The post ID.
	 * @return void
	 */
	public function sauvegarder_metabox( int $post_id ): void {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['roi_lecon_niveau'] ) ) {
			$niveau = (int) $_POST['roi_lecon_niveau'];
			if ( $niveau >= 1 && $niveau <= 4 ) {
				update_post_meta( $post_id, '_roi_lecon_niveau', $niveau );
			}
		} elseif ( isset( $_POST['meta']['_roi_lecon_niveau'] ) ) {
			$niveau = (int) $_POST['meta']['_roi_lecon_niveau'];
			if ( $niveau >= 1 && $niveau <= 4 ) {
				update_post_meta( $post_id, '_roi_lecon_niveau', $niveau );
			}
		}
	}
}


