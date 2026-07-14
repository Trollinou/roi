<?php
/**
 * Class TypePosiPlan
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

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
			
			<div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-end;">
				<div style="flex: 1;">
					<label for="roi_t5_fen_depart"><strong>FEN de départ :</strong></label><br>
					<input type="text" id="roi_t5_fen_depart" value="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" style="width: 100%; height: 30px;">
				</div>
				<div>
					<button type="button" id="btn_open_fen_editor_t5" class="button" title="Éditer la position visuellement" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); border: 1px solid #ccd0d4; background: #ffffff; cursor: pointer; padding: 0;">
						<span class="dashicons dashicons-edit" style="width: auto; height: auto; font-size: 18px; line-height: 1; margin: 0; color: #1e1e1e;"></span>
					</button>
				</div>
				<div>
					<label for="roi_t5_couleur"><strong>Couleur joueur :</strong></label><br>
					<select id="roi_t5_couleur" style="width: 120px;">
						<option value="white"><?php esc_html_e( "Blancs", "roi" ); ?></option>
						<option value="black"><?php esc_html_e( "Noirs", "roi" ); ?></option>
					</select>
				</div>
			</div>

			<div id="roi_t5_etapes_container" style="margin-top: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 15px;"></div>
			
			<div>
				<button type="button" id="roi_t5_add_etape" class="button button-secondary"><?php esc_html_e( "Ajouter une étape Posi'Plan", "roi" ); ?></button>
			</div>
		</div>
		<?php
	}
}
