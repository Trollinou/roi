<?php
/**
 * Class TypeABCDaire
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypeABCDaire
 * Handles rendering for Type 3: ABCDaire Tactique (Visual Builder).
 */
class TypeABCDaire implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$initial_fen   = $config_data['fen'] ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		$initial_color = $config_data['color'] ?? 'white';
		?>
		<div class="roi-exercice-visual-builder-container" style="margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 id="roi_visual_builder_title" style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice visuel (ABCDaire Tactique)", "roi" ); ?></h4>
			
			<div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-end;">
				<div style="flex: 1;">
					<label for="roi_fen_input"><strong>FEN de départ :</strong></label><br>
					<input type="text" id="roi_fen_input" value="<?php echo esc_attr( $initial_fen ); ?>" placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" style="width: 100%; height: 30px;">
				</div>
				<div>
					<label for="roi_color_input"><strong>Orientation :</strong></label><br>
					<select id="roi_color_input" style="width: 100px;">
						<option value="white" <?php selected( $initial_color, 'white' ); ?>>Blancs</option>
						<option value="black" <?php selected( $initial_color, 'black' ); ?>>Noirs</option>
					</select>
				</div>
				<div>
					<button type="button" id="roi_generate_board_btn" class="button button-secondary">Générer l'échiquier de travail</button>
				</div>
			</div>

			<div style="display: flex; gap: 20px; align-items: flex-start;">
				<div id="roi_admin_chessboard_container" style="width: 350px; flex-shrink: 0; position: relative;">
					<button type="button" id="btn_open_fen_editor" class="button" title="Éditer la position visuellement" style="position: absolute; top: 8px; right: 8px; z-index: 10; padding: 0; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); border: 1px solid #ccd0d4; background: #ffffff; cursor: pointer;">
						<span class="dashicons dashicons-edit" style="width: auto; height: auto; font-size: 18px; line-height: 1; margin: 0; color: #1e1e1e;"></span>
					</button>
					<div id="roi-exercice-builder-chessboard" 
					     class="roi-clean-admin-board"
					     data-fen="<?php echo esc_attr( $initial_fen ); ?>"
					     data-orientation="<?php echo esc_attr( $initial_color ); ?>"
					     style="width: 100%; aspect-ratio: 1; position: relative;">
					</div>
				</div>
				
				<div style="flex: 1;">
					<strong>Coups enregistrés (Solution) :</strong>
					<ul id="roi_solution_list" style="margin-top: 10px; padding-left: 20px; list-style-type: decimal;">
						<!-- Rempli par JS -->
					</ul>
					<div style="margin-top: 15px;">
						<button type="button" id="roi_undo_move_btn" class="button button-link-delete" style="color: #b32d2e;">Annuler le dernier coup</button>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
