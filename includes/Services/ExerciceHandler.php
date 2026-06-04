<?php
/**
 * Exercice Handler Logic.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Services;

/**
 * Class ExerciceHandler
 * Handles rendering the answer form on single exercice (roi_exercice) pages.
 */
class ExerciceHandler {

	/**
	 * Initialize the actions/filters.
	 *
	 * @return void
	 */
	public function init(): void {
		add_filter( 'the_content', [ $this, 'display_single_exercice_form' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_single_exercice_scripts' ] );
	}

	/**
	 * Appends the exercise answer form to the content on single exercise pages.
	 *
	 * @param string $content The post content.
	 * @return string The modified content.
	 */
	public function display_single_exercice_form( string $content ): string {
		if ( is_singular( 'roi_exercice' ) ) {
			$exercice_id = get_the_ID();

			ob_start();
			?>
			<div id="roi-single-exercice-wrapper">
				<form id="roi-exercice-form">
					<input type="hidden" id="roi-exercice-id" value="<?php echo esc_attr( (string) $exercice_id ); ?>">

					<?php
					$question_type = get_post_meta( $exercice_id, '_roi_question_type', true );
					$answers       = get_post_meta( $exercice_id, '_roi_answers', true );
					$input_type    = $question_type === 'qcm_multiple' ? 'checkbox' : 'radio';

					if ( ! empty( $answers ) && is_array( $answers ) ) {
						echo '<div class="roi-answers">';
						echo '<h4>' . __( 'Choisissez votre réponse :', 'roi' ) . '</h4>';
						foreach ( $answers as $index => $answer ) {
							$text = $answer['text'] ?? '';
							if ( function_exists( 'roi_chess_pieces_shortcodes_filter' ) ) {
								$filtered_text = roi_chess_pieces_shortcodes_filter( $text );
							} else {
								$filtered_text = \ROI\Shortcodes\Shortcodes::chess_pieces_filter( $text );
							}
							?>
							<label>
								<input type="<?php echo esc_attr( $input_type ); ?>" name="roi_answer[]" value="<?php echo esc_attr( (string) $index ); ?>">
								<?php echo wp_kses_post( $filtered_text ); ?>
							</label><br>
							<?php
						}
						echo '</div>';
					}
					?>

					<button type="button" id="roi-submit-answer" class="button button-primary"><?php _e( 'Valider la réponse', 'roi' ); ?></button>
				</form>
				<div id="roi-exercice-feedback" style="margin-top: 20px;"></div>
				<div id="roi-exercice-solution" style="display:none; border-top: 1px solid #ccc; margin-top: 20px; padding-top: 15px;"></div>
			</div>
			<?php
			$form_html = ob_get_clean();

			$content .= $form_html;
		}
		return $content;
	}

	/**
	 * Enqueues scripts for the single exercise page.
	 *
	 * @return void
	 */
	public function enqueue_single_exercice_scripts(): void {
		if ( is_singular( 'roi_exercice' ) ) {
			$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
			wp_enqueue_script(
				'roi-single-exercice',
				$plugin_url . 'assets/js/public-single-exercice.js',
				[ 'jquery' ],
				ROI_VERSION,
				true
			);
			wp_localize_script(
				'roi-single-exercice',
				'roi_single_exercice_ajax',
				[
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'roi_exercice_nonce' ),
				]
			);
		}
	}
}
