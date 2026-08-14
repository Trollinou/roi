<?php
/**
 * Class TypeAssociPlan
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;
use ROI\Metaboxes\Exercice\Components\PgnInput;

/**
 * Class TypeAssociPlan
 * Handles rendering for Type 6: Associ'Plan.
 */
class TypeAssociPlan implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		?>
		<div id="roi_builder_type_6" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Associ'Plan)", 'roi' ); ?></h4>
			<p class="description"><?php esc_html_e( "Définissez exactement 4 paires (FEN + Description + PGN) pour l'association.", 'roi' ); ?></p>
			
			<div style="display: flex; flex-direction: column; gap: 20px; margin-top: 15px;">
				<?php for ( $i = 0; $i < 4; $i++ ) : ?>
					<div class="roi-t6-paire-card" data-index="<?php echo (int) $i; ?>" style="border: 1px solid #ccd0d4; padding: 15px; background: #fafafa; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 8px;">
							<strong style="font-size: 14px; color: #1e1e1e;">
								<?php
								/* translators: %d: Pair number */
								echo esc_html( sprintf( __( 'Paire %d', 'roi' ), $i + 1 ) );
								?>
							</strong>
						</div>
						
						<div style="display: flex; flex-direction: column; gap: 12px;">
							<?php
							FenInput::render(
								array(
									'id'              => 'roi_t6_fen_' . $i,
									'value'           => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
									'color'           => 'white',
									'orientation_id'  => 'roi_t6_couleur_' . $i,
									'button_id'       => 'btn_open_fen_editor_t6_' . $i,
									'input_class'     => 'roi_t6_fen',
									'color_class'     => 'roi_t6_couleur',
									'button_class'    => 'button btn_open_fen_editor',
									'label'           => __( 'FEN :', 'roi' ),
									'data_attributes' => array( 'index' => $i ),
								)
							);
							?>
							
							<div>
								<label style="font-weight: 600; display: block; margin-bottom: 4px;"><?php esc_html_e( 'Description :', 'roi' ); ?></label>
								<textarea class="roi_t6_desc" style="width: 100%; height: 60px; resize: vertical;" placeholder="<?php esc_attr_e( "Description de l'ouverture ou du schéma...", 'roi' ); ?>"></textarea>
							</div>
							
							<?php
							PgnInput::render(
								array(
									'id'              => 'roi_t6_pgn_' . $i,
									'value'           => '',
									'button_id'       => 'btn_open_pgn_editor_t6_' . $i,
									'input_class'     => 'roi_t6_pgn',
									'button_class'    => 'button btn_open_pgn_editor',
									'label'           => __( 'PGN :', 'roi' ),
									'rows'            => 3,
									'placeholder'     => __( "Cliquez sur 'Éditer le PGN' pour définir les coups...", 'roi' ),
									'data_attributes' => array( 'index' => $i ),
								)
							);
							?>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
