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
		add_action( 'add_meta_boxes', [ $this, 'ajouter_metabox' ] );
		add_action( 'save_post', [ $this, 'sauvegarder_metabox' ] );
	}

	/**
	 * Adds the settings metabox.
	 *
	 * @return void
	 */
	public function ajouter_metabox(): void {
		add_meta_box(
			'roi_lecon_settings_box',
			__( 'Configuration de la Leçon', 'roi' ),
			[ $this, 'afficher_metabox' ],
			'roi_lecon',
			'side',
			'default'
		);
	}

	/**
	 * Renders the metabox content.
	 *
	 * @param \WP_Post $post The post object.
	 * @return void
	 */
	public function afficher_metabox( $post ): void {
		wp_nonce_field( 'roi_sauvegarder_lecon_settings', 'roi_lecon_settings_nonce' );

		$niveau = get_post_meta( $post->ID, '_roi_lecon_niveau', true );
		if ( empty( $niveau ) ) {
			$niveau = '1';
		}
		?>
		<p>
			<label for="roi_lecon_niveau"><strong><?php esc_html_e( 'Niveau de difficulté :', 'roi' ); ?></strong></label><br>
			<select name="roi_lecon_niveau" id="roi_lecon_niveau" style="width: 100%; max-width: 120px; box-sizing: border-box; margin-top: 5px;">
				<?php for ( $i = 1; $i <= 4; $i++ ) : ?>
					<option value="<?php echo $i; ?>" <?php selected( $niveau, (string) $i ); ?>><?php echo $i; ?></option>
				<?php endfor; ?>
			</select>
		</p>
		<?php
	}

	/**
	 * Saves metabox fields.
	 *
	 * @param int $post_id The post ID.
	 * @return void
	 */
	public function sauvegarder_metabox( int $post_id ): void {
		if ( ! isset( $_POST['roi_lecon_settings_nonce'] ) || ! wp_verify_nonce( $_POST['roi_lecon_settings_nonce'], 'roi_sauvegarder_lecon_settings' ) ) {
			return;
		}

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
		}
	}
}
