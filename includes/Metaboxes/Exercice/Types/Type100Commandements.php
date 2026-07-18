<?php
/**
 * Class Type100Commandements
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class Type100Commandements
 * Handles rendering for Type 1: 100 Commandements.
 */
class Type100Commandements implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		?>
		<div id="roi_builder_type_1" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (100 Commandements)", "roi" ); ?></h4>
			<p>
				<label for="roi_t1_question"><strong>Question :</strong></label><br>
				<input type="text" id="roi_t1_question" class="large-text" style="width: 100%;">
			</p>
			<p><strong>Réponses (sélectionnez la bonne réponse) :</strong></p>
			<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
				<input type="radio" name="roi_t1_correct" value="0" id="roi_t1_correct_0">
				<input type="text" id="roi_t1_reponse_0" style="flex: 1;" placeholder="Réponse 1">
			</div>
			<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
				<input type="radio" name="roi_t1_correct" value="1" id="roi_t1_correct_1">
				<input type="text" id="roi_t1_reponse_1" style="flex: 1;" placeholder="Réponse 2">
			</div>
			<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
				<input type="radio" name="roi_t1_correct" value="2" id="roi_t1_correct_2">
				<input type="text" id="roi_t1_reponse_2" style="flex: 1;" placeholder="Réponse 3">
			</div>
		</div>
		<?php
	}
}
