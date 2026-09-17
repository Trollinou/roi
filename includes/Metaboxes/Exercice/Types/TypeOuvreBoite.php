<?php
/**
 * Class TypeOuvreBoite
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\PgnInput;

/**
 * Class TypeOuvreBoite
 * Handles rendering for Type 13: Ouvre'boîte (Série de 6 Mini-PGN).
 */
class TypeOuvreBoite implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$consigne  = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : '';
		$exercices = isset( $config_data['exercices'] ) && is_array( $config_data['exercices'] ) ? $config_data['exercices'] : array();
		?>
		<div id="roi_builder_type_13" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Ouvre'boîte - Série de 6)", 'roi' ); ?></h4>
			
			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<strong><?php esc_html_e( 'Format :', 'roi' ); ?></strong> <?php esc_html_e( "Série de 6 Mini-PGN. Chaque PGN contient la position de départ (avec flèches éventuelles [%cal]), la branche principale (bonne réponse avec son explication) et les variantes (mauvais choix avec leurs explications). Le moteur PWA déduit automatiquement les choix, les libellés des coups en français et mélange les options.", 'roi' ); ?>
			</p>

			<div style="margin-bottom: 15px;">
				<label for="roi_t13_consigne"><strong><?php esc_html_e( 'Consigne générale :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t13_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width: 100%; height: 30px;" placeholder="<?php esc_attr_e( 'ex: Trouvez le bon coup pour ouvrir la position.', 'roi' ); ?>">
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

			<h5 style="margin-bottom: 10px; font-size: 14px; font-weight: 600;"><?php esc_html_e( 'Mini-PGN (Série de 6 cartes)', 'roi' ); ?></h5>

			<div id="roi_t13_exercices_container" style="display: flex; flex-direction: column; gap: 18px;">
				<?php
				for ( $i = 0; $i < 6; $i++ ) :
					$exo     = isset( $exercices[ $i ] ) && is_array( $exercices[ $i ] ) ? $exercices[ $i ] : array();
					$exo_pgn = isset( $exo['pgn'] ) && is_string( $exo['pgn'] ) ? $exo['pgn'] : '';
					?>
					<div class="roi-t13-exercice-item" data-index="<?php echo (int) $i; ?>" style="padding: 14px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;">
						<div style="font-weight: 600; margin-bottom: 10px; font-size: 13px; color: #1d2327;">
							<?php
							/* translators: %d: Exercise number */
							echo esc_html( sprintf( __( 'Mini-PGN %d / 6', 'roi' ), $i + 1 ) );
							?>
						</div>

						<?php
						PgnInput::render(
							array(
								'id'              => 'roi_t13_pgn_' . $i,
								'value'           => $exo_pgn,
								'button_id'       => 'btn_open_pgn_editor_t13_' . $i,
								'input_class'     => 'roi_t13_pgn',
								'button_class'    => 'button btn_open_pgn_editor_t13',
								'label'           => __( 'Séquence PGN (Position + Coup gagnant + Variantes + Flèches/Cercles) :', 'roi' ),
								'rows'            => 3,
								'placeholder'     => __( "Collez un PGN avec variantes ou cliquez sur 'Éditer le PGN'...", 'roi' ),
								'data_attributes' => array( 'index' => $i ),
							)
						);
						?>

						<!-- Aperçu interactif du PGN -->
						<div style="margin-top: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
								<strong><?php esc_html_e( 'Aperçu interactif & navigation des coups (lecture seule) :', 'roi' ); ?></strong>
							</label>
							<div id="roi_t13_preview_container_<?php echo (int) $i; ?>" class="roi-t13-preview-container"></div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
