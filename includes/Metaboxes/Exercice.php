<?php
/**
 * Custom Meta Box for Exercice CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes;

use WP_Post;

/**
 * Class Exercice
 * Handles registration and rendering of the metabox for roi_exercice CPT.
 */
class Exercice {

	/**
	 * Initialize actions.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
		add_action( 'save_post_roi_exercice', [ $this, 'save_meta' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_scripts' ] );
	}

	/**
	 * Adds the meta boxes for the Exercice CPT.
	 *
	 * @return void
	 */
	public function add_meta_boxes(): void {
		add_meta_box(
			'roi_exercice_details_metabox',
			__( 'Détails de l\'exercice', 'roi' ),
			[ $this, 'render_details_metabox' ],
			'roi_exercice',
			'normal',
			'high'
		);
	}

	/**
	 * Renders the meta box for exercice details.
	 *
	 * @param WP_Post $post The post object.
	 * @return void
	 */
	public function render_details_metabox( WP_Post $post ): void {
		wp_nonce_field( 'roi_save_exercice_meta', 'roi_exercice_metabox_nonce' );

		$difficulty    = get_post_meta( $post->ID, '_roi_difficulty', true );
		$question_type = get_post_meta( $post->ID, '_roi_question_type', true );
		$solution      = get_post_meta( $post->ID, '_roi_solution', true );
		$answers       = get_post_meta( $post->ID, '_roi_answers', true );
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
			<tr>
				<th><?php _e( 'Type de question', 'roi' ); ?></th>
				<td>
					<label><input type="radio" name="roi_question_type" value="true_false" <?php checked( $question_type, 'true_false' ); ?>> <?php _e( 'Vrai/Faux', 'roi' ); ?></label><br>
					<label><input type="radio" name="roi_question_type" value="qcm_single" <?php checked( $question_type, 'qcm_single' ); ?>> <?php _e( 'QCM - Choix unique', 'roi' ); ?></label><br>
					<label><input type="radio" name="roi_question_type" value="qcm_multiple" <?php checked( $question_type, 'qcm_multiple' ); ?>> <?php _e( 'QCM - Choix multiples', 'roi' ); ?></label>
				</td>
			</tr>
			<tr>
				<th><?php _e( 'Réponses possibles', 'roi' ); ?></th>
				<td>
					<p class="description"><?php _e( 'Pour chaque réponse, entrez le texte (les shortcodes sont autorisés) et cochez la case si c\'est une réponse correcte.', 'roi' ); ?></p>
					<?php
					$answers = is_array( $answers ) ? $answers : array_fill( 0, 5, [
						'text'    => '',
						'correct' => false,
					] );
					for ( $i = 0; $i < 5; $i++ ) :
						$answer_text = $answers[$i]['text'] ?? '';
						$is_correct  = (bool) ( $answers[$i]['correct'] ?? false );
						?>
					<div style="margin-bottom: 15px;">
						<label for="roi_answer_text_<?php echo esc_attr( (string) $i ); ?>"><?php printf( __( 'Réponse %d', 'roi' ), $i + 1 ); ?></label>
						<input type="text" name="roi_answers[<?php echo esc_attr( (string) $i ); ?>][text]" id="roi_answer_text_<?php echo esc_attr( (string) $i ); ?>" value="<?php echo esc_attr( $answer_text ); ?>" style="width: 80%;" />
						<label><input type="checkbox" name="roi_answers[<?php echo esc_attr( (string) $i ); ?>][correct]" value="1" <?php checked( $is_correct ); ?> /> <?php _e( 'Correcte', 'roi' ); ?></label>
					</div>
					<?php endfor; ?>
				</td>
			</tr>
			<tr>
				<th><label for="roi_exercice_solution"><?php _e( 'Solution', 'roi' ); ?></label></th>
				<td>
					<?php
					wp_editor(
						(string) $solution,
						'roi_exercice_solution',
						[
							'textarea_name' => 'roi_exercice_solution',
							'media_buttons' => false,
							'textarea_rows' => 10,
						]
					);
					?>
					<p class="description"><?php _e( 'La solution sera affichée après que l\'utilisateur a répondu à l\'exercice.', 'roi' ); ?></p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save meta box content for Exercice CPT.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function save_meta( int $post_id ): void {
		if ( ! isset( $_POST['roi_exercice_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_exercice_metabox_nonce'], 'roi_save_exercice_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( empty( $_POST['roi_difficulty'] ) ) {
			set_transient( 'roi_error_message', __( 'La difficulté est un champ obligatoire. L\'exercice n\'a pas été publié.', 'roi' ), 10 );

			remove_action( 'save_post_roi_exercice', [ $this, 'save_meta' ] );
			wp_update_post( [
				'ID'          => $post_id,
				'post_status' => 'draft',
			] );
			add_action( 'save_post_roi_exercice', [ $this, 'save_meta' ] );

			return;
		}

		if ( isset( $_POST['roi_difficulty'] ) && '' !== $_POST['roi_difficulty'] ) {
			update_post_meta( $post_id, '_roi_difficulty', (int) $_POST['roi_difficulty'] );
		} else {
			delete_post_meta( $post_id, '_roi_difficulty' );
		}
		if ( isset( $_POST['roi_question_type'] ) ) {
			update_post_meta( $post_id, '_roi_question_type', sanitize_key( (string) $_POST['roi_question_type'] ) );
		}
		if ( isset( $_POST['roi_exercice_solution'] ) ) {
			update_post_meta( $post_id, '_roi_solution', wp_kses_post( (string) $_POST['roi_exercice_solution'] ) );
		}
		if ( isset( $_POST['roi_answers'] ) && is_array( $_POST['roi_answers'] ) ) {
			$sanitized_answers = [];
			foreach ( $_POST['roi_answers'] as $answer ) {
				if ( ! empty( $answer['text'] ) ) {
					$sanitized_answers[] = [
						'text'    => $answer['text'],
						'correct' => isset( $answer['correct'] ),
					];
				}
			}
			update_post_meta( $post_id, '_roi_answers', $sanitized_answers );
		}
	}

	/**
	 * Enqueues admin scripts for the exercice screen.
	 *
	 * @param string $hook The current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_scripts( string $hook ): void {
		global $post;
		$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );

		if ( ( 'post.php' === $hook || 'post-new.php' === $hook ) && isset( $post->post_type ) && 'roi_exercice' === $post->post_type ) {
			wp_enqueue_editor();
			wp_enqueue_style(
				'roi-admin-styles',
				$plugin_url . 'assets/css/admin-style.css',
				[],
				ROI_VERSION
			);
		}
	}
}
