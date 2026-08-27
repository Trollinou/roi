<?php
/**
 * Class TypeABCDaire
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\PgnInput;

/**
 * Class TypeABCDaire
 * Handles rendering for Type 3: ABCDaire Tactique (Série de 4 Mini-PGN).
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
		$consigne_globale = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) && '' !== trim( $config_data['consigne'] )
			? $config_data['consigne']
			: __( 'Trouver le meilleur coup.', 'roi' );
		$exercices        = isset( $config_data['exercices'] ) && is_array( $config_data['exercices'] ) ? $config_data['exercices'] : array();

		// Rétrocompatibilité avec l'ancien format FEN unique si présent.
		if ( empty( $exercices ) && ! empty( $config_data['fen'] ) ) {
			$legacy_fen = (string) $config_data['fen'];
			$legacy_pgn = '[SetUp "1"]' . "\n" . '[FEN "' . $legacy_fen . '"]' . "\n\n";
			if ( ! empty( $config_data['solution'] ) && is_array( $config_data['solution'] ) ) {
				$legacy_pgn .= implode( ' ', $config_data['solution'] );
			}
			$exercices = array(
				array( 'pgn' => $legacy_pgn ),
			);
		}
		?>
		<div id="roi_builder_type_3" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (ABCDaire Tactique - Série de 4)", 'roi' ); ?></h4>
			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<strong><?php esc_html_e( 'Format :', 'roi' ); ?></strong> <?php esc_html_e( "Série de 4 Mini-PGN (1 coup ou un enchaînement de coups). Vous pouvez coller directement un export PGN de Lichess ou utiliser l'éditeur interactif.", 'roi' ); ?>
			</p>

			<div style="margin-bottom: 20px;">
				<label for="roi_t3_consigne"><strong><?php esc_html_e( 'Consigne :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t3_consigne" class="large-text" style="width: 100%; height: 30px;" value="<?php echo esc_attr( $consigne_globale ); ?>" placeholder="<?php esc_attr_e( 'Trouver le meilleur coup.', 'roi' ); ?>">
			</div>

			<div style="display: flex; flex-direction: column; gap: 15px;">
				<?php
				for ( $i = 0; $i < 4; $i++ ) :
					$exo_item = isset( $exercices[ $i ] ) && is_array( $exercices[ $i ] ) ? $exercices[ $i ] : array();
					$exo_pgn  = isset( $exo_item['pgn'] ) && is_string( $exo_item['pgn'] ) ? $exo_item['pgn'] : '';
					?>
					<div class="roi-t3-diagramme-item" style="border: 1px solid #e5e5e5; padding: 14px; border-radius: 4px; background: #f9f9f9;">
						<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1d2327;">
							<?php
							/* translators: %d: Exercise number */
							echo esc_html( sprintf( __( 'Mini PGN %d / 4', 'roi' ), $i + 1 ) );
							?>
						</h4>

						<?php
						PgnInput::render(
							array(
								'id'              => 'roi_t3_pgn_' . $i,
								'value'           => $exo_pgn,
								'button_id'       => 'btn_open_pgn_editor_t3_' . $i,
								'input_class'     => 'roi_t3_pgn',
								'button_class'    => 'button btn_open_pgn_editor_t3',
								'label'           => __( 'Séquence PGN (Position + Coups) :', 'roi' ),
								'rows'            => 3,
								'placeholder'     => __( "Collez un PGN (ex: export Lichess) ou cliquez sur 'Éditer le PGN'...", 'roi' ),
								'data_attributes' => array( 'index' => $i ),
							)
						);
						?>

						<!-- Aperçu visuel statique non-interactif du diagramme initial -->
						<div style="margin-top: 10px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
								<strong><?php esc_html_e( 'Aperçu de la position initiale (non interactif) :', 'roi' ); ?></strong>
							</label>
							<div id="roi_t3_preview_container_<?php echo (int) $i; ?>" class="main-wrap fit-container piece-set-cburnett board-theme-brown" style="width: 260px; height: 260px; position: relative; border: 1px solid #ccd0d4; border-radius: 4px; background: #fff; overflow: hidden;">
								<div id="roi_t3_preview_board_<?php echo (int) $i; ?>" class="main-board roi_t3_preview_board" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 100%;"></div>
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
