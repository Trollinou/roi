<?php
/**
 * Class TypePopEchecs
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypePopEchecs
 * Handles rendering for Type 2: Pop'Echecs.
 */
class TypePopEchecs implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		?>
		<div id="roi_builder_type_2" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Pop'Echecs)", "roi" ); ?></h4>
			<p>
				<label for="roi_t2_consigne"><strong>Consigne :</strong></label><br>
				<input type="text" id="roi_t2_consigne" class="large-text" style="width: 100%;" placeholder="Ex : Replacez le Cavalier Blanc sur la bonne case.">
			</p>
			<div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-end;">
				<div style="flex: 1;">
					<label for="roi_t2_fen_finale"><strong>FEN Complète (position finale) :</strong></label><br>
					<input type="text" id="roi_t2_fen_finale" class="large-text" style="width: 100%; height: 30px;" placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1">
				</div>
				<div>
					<button type="button" id="btn_open_fen_editor_t2" class="button" title="Éditer la position visuellement" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); border: 1px solid #ccd0d4; background: #ffffff; cursor: pointer; padding: 0;">
						<span class="dashicons dashicons-edit" style="width: auto; height: auto; font-size: 18px; line-height: 1; margin: 0; color: #1e1e1e;"></span>
					</button>
				</div>
				<div>
					<button type="button" id="roi_t2_generate_btn" class="button button-secondary">Générer le plateau de sélection</button>
				</div>
			</div>
			<div style="display: flex; gap: 20px; align-items: flex-start;">
				<div id="roi_t2_chessboard_container" style="width: 350px; flex-shrink: 0; position: relative;">
					<p style="color: #646970; font-style: italic; text-align: center; padding: 40px 0;">Cliquez sur "Générer le plateau de sélection" pour afficher l'échiquier.</p>
				</div>
				<div style="flex: 1;">
					<p id="roi_t2_feedback" style="padding: 12px 15px; background: #f0f0f1; border-left: 4px solid #72aee6; border-radius: 2px; margin: 0;">Aucune pièce sélectionnée.</p>
					<div style="margin-top: 15px;">
						<button type="button" id="roi_t2_cancel_btn" class="button button-link-delete" style="color: #b32d2e; display: none;">Annuler la sélection</button>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
