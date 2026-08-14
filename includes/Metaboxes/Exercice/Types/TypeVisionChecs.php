<?php
/**
 * Class TypeVisionChecs
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

/**
 * Class TypeVisionChecs
 * Handles rendering for Type 8: Vision'checs (4 Diagrammes avec aperçu).
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
		$consigne   = $config_data['consigne'] ?? __( 'Observez les 4 diagrammes ci-dessous.', 'roi' );
		$diagrammes = isset( $config_data['diagrammes'] ) && is_array( $config_data['diagrammes'] ) ? $config_data['diagrammes'] : array();

		// Retro-compatibilité avec l'ancienne FEN unique.
		if ( empty( $diagrammes ) && ! empty( $config_data['fen_depart'] ) ) {
			$diagrammes = array(
				array(
					'fen'            => (string) $config_data['fen_depart'],
					'couleur_joueur' => (string) ( $config_data['couleur_joueur'] ?? 'white' ),
					'shapes'         => isset( $config_data['shapes'] ) && is_array( $config_data['shapes'] ) ? $config_data['shapes'] : array(),
				),
			);
		}
		?>
		<div id="roi_builder_type_8" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Vision'checs)", 'roi' ); ?></h4>
			
			<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
				<!-- Consigne -->
				<div>
					<label for="roi_t8_consigne"><strong><?php esc_html_e( 'Consigne :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t8_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width: 100%; height: 30px;">
				</div>

				<!-- Liste des 4 diagrammes avec aperçu -->
				<div style="display: flex; flex-direction: column; gap: 15px;">
					<?php
					for ( $i = 0; $i < 4; $i++ ) :
						$pos_fen     = $diagrammes[ $i ]['fen'] ?? '';
						$pos_couleur = $diagrammes[ $i ]['couleur_joueur'] ?? 'white';
						$pos_shapes  = $diagrammes[ $i ]['shapes'] ?? array();
						?>
						<div style="border: 1px solid #e5e5e5; padding: 12px; border-radius: 4px; background: #f9f9f9;">
							<h4 style="margin: 0 0 10px 0;">
								<?php
								/* translators: %d: Diagram number */
								echo esc_html( sprintf( __( 'Diagramme %d', 'roi' ), $i + 1 ) );
								?>
							</h4>
							<?php
							FenInput::render(
								array(
									'id'              => 'roi_t8_fen_' . $i,
									'value'           => $pos_fen,
									'color'           => $pos_couleur,
									'shapes'          => $pos_shapes,
									'orientation_id'  => 'roi_t8_couleur_' . $i,
									'button_id'       => 'btn_open_fen_editor_t8_' . $i,
									'input_class'     => 'roi_t8_fen',
									'color_class'     => 'roi_t8_couleur',
									'button_class'    => 'button btn_open_fen_editor_t8',
									'label'           => __( 'FEN :', 'roi' ),
									'data_attributes' => array( 'index' => $i ),
								)
							);
							?>

							<!-- Aperçu visuel statique non-interactif du diagramme -->
							<div style="margin-top: 10px;">
								<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
									<strong><?php esc_html_e( 'Aperçu du diagramme (non interactif) :', 'roi' ); ?></strong>
								</label>
								<div id="roi_t8_preview_container_<?php echo (int) $i; ?>" style="width: 260px; height: 260px; position: relative; border: 1px solid #ccd0d4; border-radius: 4px; background: #fff; overflow: hidden;">
									<div id="roi_t8_preview_board_<?php echo (int) $i; ?>" class="roi_t8_preview_board" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 100%;"></div>
								</div>
							</div>
						</div>
					<?php endfor; ?>
				</div>
			</div>
		</div>
		<?php
	}
}
