<?php
/**
 * Class TypePosiPlan
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

/**
 * Class TypePosiPlan
 * Handles rendering for Type 5: Posi'Plan.
 */
class TypePosiPlan implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		?>
		<div id="roi_builder_type_5" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Posi'Plan)", "roi" ); ?></h4>
			
			<?php
			FenInput::render([
				'id'             => 'roi_t5_fen_depart',
				'value'          => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				'color'          => 'white',
				'orientation_id' => 'roi_t5_couleur',
				'button_id'      => 'btn_open_fen_editor_t5',
				'label'          => __( 'FEN de départ :', 'roi' ),
			]);
			?>

			<div id="roi_t5_etapes_container" style="margin-top: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 15px;"></div>
			
			<div>
				<button type="button" id="roi_t5_add_etape" class="button button-secondary"><?php esc_html_e( "Ajouter une étape Posi'Plan", "roi" ); ?></button>
			</div>
		</div>
		<?php
	}
}
