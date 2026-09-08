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
		$paires = isset( $config_data['paires'] ) && is_array( $config_data['paires'] ) ? $config_data['paires'] : array();
		?>
		<div id="roi_builder_type_6" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Associ'Plan)", 'roi' ); ?></h4>
			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<strong><?php esc_html_e( 'Format :', 'roi' ); ?></strong> <?php esc_html_e( 'Saisissez exactement 4 PGNs complets. Pour chacun, la position de départ (avec ses shapes éventuels) et la description (commentaire initial) seront automatiquement extraits côté PWA.', 'roi' ); ?>
			</p>
			
			<div style="display: flex; flex-direction: column; gap: 15px;">
				<?php
				for ( $i = 0; $i < 4; $i++ ) :
					$paire_item = isset( $paires[ $i ] ) && is_array( $paires[ $i ] ) ? $paires[ $i ] : array();
					$paire_pgn  = isset( $paire_item['pgn'] ) && is_string( $paire_item['pgn'] ) ? $paire_item['pgn'] : '';
					if ( empty( $paire_pgn ) && isset( $paire_item['pgn_data'] ) && is_string( $paire_item['pgn_data'] ) ) {
						$paire_pgn = $paire_item['pgn_data'];
					}
					?>
					<div class="roi-t6-diagramme-item" style="border: 1px solid #e5e5e5; padding: 14px; border-radius: 4px; background: #f9f9f9;">
						<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1d2327;">
							<?php
							/* translators: %d: Pair number */
							echo esc_html( sprintf( __( 'Position / Plan %d / 4', 'roi' ), $i + 1 ) );
							?>
						</h4>
						
						<?php
						PgnInput::render(
							array(
								'id'              => 'roi_t6_pgn_' . $i,
								'value'           => $paire_pgn,
								'button_id'       => 'btn_open_pgn_editor_t6_' . $i,
								'input_class'     => 'roi_t6_pgn',
								'button_class'    => 'button btn_open_pgn_editor_t6',
								'label'           => __( 'PGN complet (Header FEN + Commentaire initial + Coups) :', 'roi' ),
								'rows'            => 6,
								'placeholder'     => __( "Collez ici le PGN complet (export Lichess) ou cliquez sur 'Éditer le PGN'...", 'roi' ),
								'data_attributes' => array( 'index' => $i ),
							)
						);
						?>
						
						<!-- Aperçu visuel statique non-interactif du diagramme initial -->
						<div style="margin-top: 10px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
								<strong><?php esc_html_e( 'Aperçu de la position initiale (non interactif) :', 'roi' ); ?></strong>
							</label>
							<div id="roi_t6_preview_container_<?php echo (int) $i; ?>" class="main-wrap fit-container piece-set-cburnett board-theme-brown" style="width: 260px; height: 260px; position: relative; border: 1px solid #ccd0d4; border-radius: 4px; background: #fff; overflow: hidden;">
								<div id="roi_t6_preview_board_<?php echo (int) $i; ?>" class="main-board roi_t6_preview_board" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 100%;"></div>
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
