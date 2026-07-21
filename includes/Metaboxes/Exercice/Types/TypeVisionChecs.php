<?php
/**
 * Class TypeVisionChecs
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypeVisionChecs
 * Handles rendering for Type 8: Vision'checs.
 */
class TypeVisionChecs implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$fen_depart     = $config_data['fen_depart'] ?? '';
		$couleur_joueur = $config_data['couleur_joueur'] ?? 'white';
		$description    = $config_data['description'] ?? '';
		$case_depart    = $config_data['case_depart'] ?? '';
		$case_arrivee   = $config_data['case_arrivee'] ?? '';
		$solution_san   = $config_data['solution_san'] ?? '';
		?>
		<div id="roi_builder_type_8" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Vision'checs)", "roi" ); ?></h4>
			
			<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
				<!-- FEN de départ & Couleur -->
				<div style="display: flex; gap: 15px; align-items: flex-end;">
					<div style="flex: 1;">
						<label for="roi_t8_fen"><strong><?php esc_html_e( "FEN de départ :", "roi" ); ?></strong></label><br>
						<input type="text" id="roi_t8_fen" value="<?php echo esc_attr( $fen_depart ); ?>" style="width: 100%; height: 30px;" placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1">
					</div>
					<div>
						<button type="button" id="btn_open_fen_editor_t8" class="button" title="<?php esc_attr_e( "Éditer la position visuellement", "roi" ); ?>" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); border: 1px solid #ccd0d4; background: #ffffff; cursor: pointer; padding: 0;">
							<span class="dashicons dashicons-edit" style="width: auto; height: auto; font-size: 18px; line-height: 1; margin: 0; color: #1e1e1e;"></span>
						</button>
					</div>
					<div>
						<label for="roi_t8_couleur"><strong><?php esc_html_e( "Couleur du joueur :", "roi" ); ?></strong></label><br>
						<select id="roi_t8_couleur" style="width: 120px; height: 30px;">
							<option value="white" <?php selected( $couleur_joueur, 'white' ); ?>><?php esc_html_e( "Blancs", "roi" ); ?></option>
							<option value="black" <?php selected( $couleur_joueur, 'black' ); ?>><?php esc_html_e( "Noirs", "roi" ); ?></option>
						</select>
					</div>
					<div>
						<button type="button" id="roi_t8_generate_btn" class="button button-secondary"><?php esc_html_e( "Générer l'échiquier", "roi" ); ?></button>
					</div>
				</div>

				<!-- Description -->
				<div>
					<label for="roi_t8_desc"><strong><?php esc_html_e( "Description :", "roi" ); ?></strong></label><br>
					<textarea id="roi_t8_desc" style="width: 100%; height: 80px; resize: vertical;" placeholder="<?php esc_attr_e( "Description textuelle de la position (ex : Le Roi blanc est sur e1, la Dame sur d1...)", "roi" ); ?>"><?php echo esc_textarea( $description ); ?></textarea>
				</div>

				<!-- Solution (Readonly inputs) -->
				<div style="display: flex; gap: 15px;">
					<div style="flex: 1;">
						<label for="roi_t8_case_depart"><strong><?php esc_html_e( "Case de départ :", "roi" ); ?></strong></label><br>
						<input type="text" id="roi_t8_case_depart" value="<?php echo esc_attr( $case_depart ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e;">
					</div>
					<div style="flex: 1;">
						<label for="roi_t8_case_arrivee"><strong><?php esc_html_e( "Case d'arrivée :", "roi" ); ?></strong></label><br>
						<input type="text" id="roi_t8_case_arrivee" value="<?php echo esc_attr( $case_arrivee ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e;">
					</div>
					<div style="flex: 1;">
						<label for="roi_t8_san"><strong><?php esc_html_e( "Solution (SAN) :", "roi" ); ?></strong></label><br>
						<input type="text" id="roi_t8_san" value="<?php echo esc_attr( $solution_san ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e;">
					</div>
				</div>

				<!-- Échiquier visuel pour jouer le coup attendu -->
				<div>
					<label><strong><?php esc_html_e( "Échiquier de saisie (jouez le coup attendu) :", "roi" ); ?></strong></label>
					<div id="roi_t8_board" style="width: 350px; height: 350px; margin-top: 10px; border: 1px solid #ccd0d4; background: #fafafa; border-radius: 4px; display: flex; align-items: center; justify-content: center; position: relative;">
						<p style="color: #646970; font-style: italic; text-align: center; padding: 20px;"><?php esc_html_e( "Entrez une FEN et cliquez sur \"Générer l'échiquier\" pour activer la saisie.", "roi" ); ?></p>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
