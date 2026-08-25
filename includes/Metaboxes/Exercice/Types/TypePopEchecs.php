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
		$consigne_globale = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : '';
		$diagrammes       = isset( $config_data['diagrammes'] ) && is_array( $config_data['diagrammes'] ) ? $config_data['diagrammes'] : array();
		?>
		<div id="roi_builder_type_2" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Pop'Echecs - Série de 4)", 'roi' ); ?></h4>
			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<strong><?php esc_html_e( 'Note :', 'roi' ); ?></strong> <?php esc_html_e( "Pour chaque diagramme, la pièce à placer doit être entourée d'un cercle bleu dans l'éditeur d'échiquier.", 'roi' ); ?>
			</p>

			<div style="margin-bottom: 20px;">
				<label for="roi_t2_consigne"><strong><?php esc_html_e( 'Consigne générale (optionnelle) :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t2_consigne" class="large-text" style="width: 100%; height: 30px;" value="<?php echo esc_attr( $consigne_globale ); ?>" placeholder="<?php esc_attr_e( 'Ex : Replacez les pièces sur les bonnes cases.', 'roi' ); ?>">
			</div>

			<div style="display: flex; flex-direction: column; gap: 15px;">
				<?php
				for ( $i = 0; $i < 4; $i++ ) :
					$diag_item     = isset( $diagrammes[ $i ] ) && is_array( $diagrammes[ $i ] ) ? $diagrammes[ $i ] : array();
					$diag_consigne = isset( $diag_item['consigne'] ) && is_string( $diag_item['consigne'] ) ? $diag_item['consigne'] : '';
					$diag_fen      = isset( $diag_item['fen'] ) && is_string( $diag_item['fen'] ) ? $diag_item['fen'] : '';
					$diag_couleur  = isset( $diag_item['couleur_joueur'] ) && is_string( $diag_item['couleur_joueur'] ) ? $diag_item['couleur_joueur'] : 'white';
					$diag_shapes   = isset( $diag_item['shapes'] ) && is_array( $diag_item['shapes'] ) ? $diag_item['shapes'] : array();
					?>
					<div class="roi-t2-diagramme-item" style="border: 1px solid #e5e5e5; padding: 14px; border-radius: 4px; background: #f9f9f9;">
						<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1d2327;">
							<?php
							/* translators: %d: Diagram number */
							echo esc_html( sprintf( __( 'Diagramme %d / 4', 'roi' ), $i + 1 ) );
							?>
						</h4>

						<div style="margin-bottom: 12px;">
							<label for="roi_t2_consigne_<?php echo (int) $i; ?>"><strong><?php esc_html_e( 'Consigne de ce diagramme :', 'roi' ); ?></strong></label><br>
							<input type="text" id="roi_t2_consigne_<?php echo (int) $i; ?>" class="roi_t2_consigne_item large-text" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 30px;" value="<?php echo esc_attr( $diag_consigne ); ?>" placeholder="<?php esc_attr_e( 'Ex : Replacez le Cavalier blanc sur la bonne case.', 'roi' ); ?>">
						</div>

						<?php
						FenInput::render(
							array(
								'id'              => 'roi_t2_fen_' . $i,
								'value'           => $diag_fen,
								'color'           => $diag_couleur,
								'shapes'          => $diag_shapes,
								'orientation_id'  => 'roi_t2_couleur_' . $i,
								'button_id'       => 'btn_open_fen_editor_t2_' . $i,
								'input_class'     => 'roi_t2_fen',
								'color_class'     => 'roi_t2_couleur',
								'button_class'    => 'button btn_open_fen_editor_t2',
								'label'           => __( 'Position complète (FEN) :', 'roi' ),
								'data_attributes' => array( 'index' => $i ),
							)
						);
						?>

						<!-- Aperçu visuel statique non-interactif du diagramme -->
						<div style="margin-top: 10px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
								<strong><?php esc_html_e( 'Aperçu du diagramme (non interactif) :', 'roi' ); ?></strong>
							</label>
							<div id="roi_t2_preview_container_<?php echo (int) $i; ?>" class="main-wrap fit-container piece-set-cburnett board-theme-brown" style="width: 260px; height: 260px; position: relative; border: 1px solid #ccd0d4; border-radius: 4px; background: #fff; overflow: hidden;">
								<div id="roi_t2_preview_board_<?php echo (int) $i; ?>" class="main-board roi_t2_preview_board" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 100%;"></div>
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
