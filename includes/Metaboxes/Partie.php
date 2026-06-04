<?php
/**
 * Custom Meta Box for Partie CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes;

use WP_Post;

/**
 * Class Partie
 * Handles registration and rendering of the metabox for roi_partie CPT.
 */
class Partie {

	/**
	 * Initialize actions.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
		add_action( 'save_post_roi_partie', [ $this, 'save_meta' ] );
	}

	/**
	 * Adds the meta boxes for the Partie CPT.
	 *
	 * @return void
	 */
	public function add_meta_boxes(): void {
		add_meta_box(
			'roi_partie_details_metabox',
			__( 'Détails de la partie', 'roi' ),
			[ $this, 'render_details_metabox' ],
			'roi_partie',
			'normal',
			'high'
		);
	}

	/**
	 * Renders the meta box for partie details.
	 *
	 * @param WP_Post $post The post object.
	 * @return void
	 */
	public function render_details_metabox( WP_Post $post ): void {
		wp_nonce_field( 'roi_save_partie_meta', 'roi_partie_metabox_nonce' );

		$member_id   = get_post_meta( $post->ID, '_roi_member_id', true );
		$level       = get_post_meta( $post->ID, '_roi_difficulty_level', true );
		$hints       = get_post_meta( $post->ID, '_roi_hints_count', true );
		$takebacks   = get_post_meta( $post->ID, '_roi_takebacks_count', true );
		$duration    = get_post_meta( $post->ID, '_roi_game_duration', true );
		$game_date   = get_post_meta( $post->ID, '_roi_game_date', true );
		$pgn         = get_post_meta( $post->ID, '_roi_pgn', true );

		$member_name = __( 'Inconnu', 'roi' );
		$member_link = '';
		if ( ! empty( $member_id ) ) {
			$member = get_post( (int) $member_id );
			if ( $member ) {
				$member_name = esc_html( $member->post_title );
				$member_link = get_edit_post_link( $member->ID );
			}
		}

		$formatted_duration = '';
		if ( ! empty( $duration ) ) {
			$duration_int       = (int) $duration;
			$minutes            = floor( $duration_int / 60 );
			$seconds            = $duration_int % 60;
			$formatted_duration = sprintf( __( '%d min %d s (%d secondes)', 'roi' ), $minutes, $seconds, $duration_int );
		}

		?>
		<table class="form-table">
			<tr>
				<th><strong><?php _e( 'Joueur (Adhérent)', 'roi' ); ?></strong></th>
				<td>
					<?php if ( ! empty( $member_link ) ) : ?>
						<a href="<?php echo esc_url( $member_link ); ?>" target="_blank"><strong><?php echo $member_name; ?></strong></a>
					<?php else : ?>
						<span><?php echo $member_name; ?></span>
					<?php endif; ?>
					<input type="hidden" name="roi_member_id" value="<?php echo esc_attr( (string) $member_id ); ?>">
				</td>
			</tr>
			<tr>
				<th><label for="roi_difficulty_level"><?php _e( 'Niveau Stockfish (ELO)', 'roi' ); ?></label></th>
				<td>
					<input type="number" name="roi_difficulty_level" id="roi_difficulty_level" value="<?php echo esc_attr( (string) $level ); ?>" class="small-text">
				</td>
			</tr>
			<tr>
				<th><label for="roi_hints_count"><?php _e( 'Nombre d\'aides utilisées', 'roi' ); ?></label></th>
				<td>
					<input type="number" name="roi_hints_count" id="roi_hints_count" value="<?php echo esc_attr( (string) $hints ); ?>" class="small-text">
				</td>
			</tr>
			<tr>
				<th><label for="roi_takebacks_count"><?php _e( 'Nombre de "Oups !"', 'roi' ); ?></label></th>
				<td>
					<input type="number" name="roi_takebacks_count" id="roi_takebacks_count" value="<?php echo esc_attr( (string) $takebacks ); ?>" class="small-text">
				</td>
			</tr>
			<tr>
				<th><label for="roi_game_duration"><?php _e( 'Durée de la partie (en secondes)', 'roi' ); ?></label></th>
				<td>
					<input type="number" name="roi_game_duration" id="roi_game_duration" value="<?php echo esc_attr( (string) $duration ); ?>" class="regular-text" style="width: 100px;">
					<?php if ( ! empty( $formatted_duration ) ) : ?>
						<span class="description" style="margin-left: 10px;"><?php echo esc_html( $formatted_duration ); ?></span>
					<?php endif; ?>
				</td>
			</tr>
			<tr>
				<th><label for="roi_game_date"><?php _e( 'Date de la partie', 'roi' ); ?></label></th>
				<td>
					<input type="text" name="roi_game_date" id="roi_game_date" value="<?php echo esc_attr( (string) $game_date ); ?>" class="regular-text">
					<p class="description"><?php _e( 'Format attendu : AAAA-MM-JJ HH:MM:SS', 'roi' ); ?></p>
				</td>
			</tr>
			<tr>
				<th><label for="roi_pgn"><?php _e( 'Code PGN de la partie', 'roi' ); ?></label></th>
				<td>
					<textarea name="roi_pgn" id="roi_pgn" rows="6" class="large-text code" style="width: 100%; font-family: monospace;"><?php echo esc_textarea( (string) $pgn ); ?></textarea>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save meta box content for Partie CPT.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function save_meta( int $post_id ): void {
		if ( ! isset( $_POST['roi_partie_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_partie_metabox_nonce'], 'roi_save_partie_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['roi_member_id'] ) ) {
			update_post_meta( $post_id, '_roi_member_id', (int) $_POST['roi_member_id'] );
		}
		if ( isset( $_POST['roi_difficulty_level'] ) ) {
			update_post_meta( $post_id, '_roi_difficulty_level', (int) $_POST['roi_difficulty_level'] );
		}
		if ( isset( $_POST['roi_hints_count'] ) ) {
			update_post_meta( $post_id, '_roi_hints_count', (int) $_POST['roi_hints_count'] );
		}
		if ( isset( $_POST['roi_takebacks_count'] ) ) {
			update_post_meta( $post_id, '_roi_takebacks_count', (int) $_POST['roi_takebacks_count'] );
		}
		if ( isset( $_POST['roi_game_duration'] ) ) {
			update_post_meta( $post_id, '_roi_game_duration', (int) $_POST['roi_game_duration'] );
		}
		if ( isset( $_POST['roi_game_date'] ) ) {
			update_post_meta( $post_id, '_roi_game_date', sanitize_text_field( (string) $_POST['roi_game_date'] ) );
		}
		if ( isset( $_POST['roi_pgn'] ) ) {
			update_post_meta( $post_id, '_roi_pgn', sanitize_textarea_field( (string) $_POST['roi_pgn'] ) );
		}
	}
}
