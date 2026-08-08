<?php
/**
 * Class TypePopEchecs
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

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
				<label for="roi_t2_consigne"><strong><?php esc_html_e( 'Consigne :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t2_consigne" class="large-text" style="width: 100%;" placeholder="<?php esc_attr_e( 'Ex : Replacez le Cavalier Blanc sur la bonne case.', 'roi' ); ?>">
			</p>
			<?php
			FenInput::render([
				'id'               => 'roi_t2_fen_finale',
				'value'            => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				'color'            => 'white',
				'orientation_id'   => 'roi_t2_couleur',
				'button_id'        => 'btn_open_fen_editor_t2',
				'label'            => __( 'FEN Complète (position finale) :', 'roi' ),
				'show_orientation' => true,
			]);
			?>
			<div style="margin-bottom: 15px;">
				<button type="button" id="roi_t2_generate_btn" class="button button-secondary"><?php esc_html_e( 'Générer le plateau de sélection', 'roi' ); ?></button>
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
