<?php
/**
 * Custom Meta Box for Lecon CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes;

use WP_Post;

/**
 * Class Lecon
 * Handles registration and rendering of the metabox for roi_lecon CPT.
 */
class Lecon {

	/**
	 * Initialize actions.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
		add_action( 'save_post_roi_lecon', [ $this, 'save_meta' ] );
	}

	/**
	 * Adds the meta boxes for the Lecon CPT.
	 *
	 * @return void
	 */
	public function add_meta_boxes(): void {
		add_meta_box(
			'roi_lecon_details_metabox',
			__( 'Détails de la leçon', 'roi' ),
			[ $this, 'render_details_metabox' ],
			'roi_lecon',
			'normal',
			'high'
		);
	}

	/**
	 * Renders the meta box for lecon details.
	 *
	 * @param WP_Post $post The post object.
	 * @return void
	 */
	public function render_details_metabox( WP_Post $post ): void {
		wp_nonce_field( 'roi_save_lecon_meta', 'roi_lecon_metabox_nonce' );

		$difficulty = get_post_meta( $post->ID, '_roi_difficulty', true );
		?>
		<table class="form-table">
			<tr>
				<th><label for="roi_difficulty"><?php _e( 'Difficulté', 'roi' ); ?></label></th>
				<td>
					<select name="roi_difficulty" id="roi_difficulty">
						<option value="" <?php selected( $difficulty, '' ); ?>><?php _e( '— Sélectionner une difficulté —', 'roi' ); ?></option>
						<option value="1" <?php selected( $difficulty, 1 ); ?>><?php _e( '1 - Très facile', 'roi' ); ?></option>
						<option value="2" <?php selected( $difficulty, 2 ); ?>><?php _e( '2 - Facile', 'roi' ); ?></option>
						<option value="3" <?php selected( $difficulty, 3 ); ?>><?php _e( '3 - Modéré', 'roi' ); ?></option>
						<option value="4" <?php selected( $difficulty, 4 ); ?>><?php _e( '4 - Difficile', 'roi' ); ?></option>
						<option value="5" <?php selected( $difficulty, 5 ); ?>><?php _e( '5 - Très Difficile', 'roi' ); ?></option>
						<option value="6" <?php selected( $difficulty, 6 ); ?>><?php _e( '6 - Expert', 'roi' ); ?></option>
					</select>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save meta box content for Lecon CPT.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function save_meta( int $post_id ): void {
		if ( ! isset( $_POST['roi_lecon_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_lecon_metabox_nonce'], 'roi_save_lecon_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( empty( $_POST['roi_difficulty'] ) ) {
			set_transient( 'roi_error_message', __( 'La difficulté est un champ obligatoire. La leçon n\'a pas été publiée.', 'roi' ), 10 );

			remove_action( 'save_post_roi_lecon', [ $this, 'save_meta' ] );
			wp_update_post( [
				'ID'          => $post_id,
				'post_status' => 'draft',
			] );
			add_action( 'save_post_roi_lecon', [ $this, 'save_meta' ] );

			return;
		}

		if ( isset( $_POST['roi_difficulty'] ) && '' !== $_POST['roi_difficulty'] ) {
			update_post_meta( $post_id, '_roi_difficulty', (int) $_POST['roi_difficulty'] );
		} else {
			delete_post_meta( $post_id, '_roi_difficulty' );
		}
	}
}
