<?php
/**
 * Class TypeAssociPlan
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

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
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Associ'Plan)", "roi" ); ?></h4>
			<p class="description"><?php esc_html_e( "Définissez exactement 4 paires (FEN + Description + PGN) pour l'association.", "roi" ); ?></p>
			
			<div style="display: flex; flex-direction: column; gap: 20px; margin-top: 15px;">
				<?php for ( $i = 0; $i < 4; $i++ ) : ?>
					<div class="roi-t6-paire-card" data-index="<?php echo $i; ?>" style="border: 1px solid #ccd0d4; padding: 15px; background: #fafafa; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 8px;">
							<strong style="font-size: 14px; color: #1e1e1e;"><?php printf( esc_html__( "Paire %d", "roi" ), $i + 1 ); ?></strong>
						</div>
						
						<div style="display: flex; flex-direction: column; gap: 12px;">
							<div style="display: flex; gap: 10px; align-items: flex-end;">
								<div style="flex: 1;">
									<label style="font-weight: 600; display: block; margin-bottom: 4px;">FEN :</label>
									<input type="text" class="roi_t6_fen" style="width: 100%; height: 30px;" placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1">
								</div>
								<div>
									<button type="button" class="button btn_open_fen_editor" data-index="<?php echo $i; ?>" title="Éditer la position visuellement" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); border: 1px solid #ccd0d4; background: #ffffff; cursor: pointer; padding: 0;">
										<span class="dashicons dashicons-edit" style="width: auto; height: auto; font-size: 18px; line-height: 1; margin: 0; color: #1e1e1e;"></span>
									</button>
								</div>
								<div>
									<label style="font-weight: 600; display: block; margin-bottom: 4px;">Couleur :</label>
									<select class="roi_t6_couleur" style="width: 120px; height: 30px;">
										<option value="white"><?php esc_html_e( "Blancs", "roi" ); ?></option>
										<option value="black"><?php esc_html_e( "Noirs", "roi" ); ?></option>
									</select>
								</div>
							</div>
							
							<div>
								<label style="font-weight: 600; display: block; margin-bottom: 4px;">Description :</label>
								<textarea class="roi_t6_desc" style="width: 100%; height: 60px; resize: vertical;" placeholder="Description de l'ouverture ou du schéma..."></textarea>
							</div>
							
							<div>
								<label style="font-weight: 600; display: block; margin-bottom: 4px;">PGN :</label>
								<div style="display: flex; gap: 10px; align-items: flex-start;">
									<textarea class="roi_t6_pgn" readonly style="width: 100%; height: 60px; font-family: monospace; font-size: 12px; background: #f0f0f1; resize: none; border: 1px solid #ccd0d4; border-radius: 4px; padding: 8px; color: #50575e;" placeholder="Cliquez sur 'Éditer le PGN' pour définir les coups..."></textarea>
									<button type="button" class="button btn_open_pgn_editor" data-index="<?php echo $i; ?>" style="display: inline-flex; align-items: center; gap: 4px; height: 32px;"><span class="dashicons dashicons-edit" style="font-size: 16px; width: 16px; height: 16px; line-height: 1;"></span> Éditer le PGN</button>
								</div>
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
