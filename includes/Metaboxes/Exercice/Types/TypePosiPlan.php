<?php
/**
 * Class TypePosiPlan
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\PgnInput;

/**
 * Class TypePosiPlan
 * Handles rendering for Type 5: Posi'Plan (Étude PGN interactive avec choix initial à 3 branches et exploration de variantes).
 */
class TypePosiPlan implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$consigne = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) && '' !== trim( $config_data['consigne'] )
			? $config_data['consigne']
			: __( 'Évaluez la position et choisissez le meilleur plan.', 'roi' );
		$pgn      = isset( $config_data['pgn'] ) && is_string( $config_data['pgn'] ) ? $config_data['pgn'] : '';

		// Rétrocompatibilité : si l'ancien format 'etapes' est présent.
		if ( empty( $pgn ) && ! empty( $config_data['etapes'] ) && is_array( $config_data['etapes'] ) ) {
			$pgn_parts = array();
			foreach ( $config_data['etapes'] as $etape ) {
				if ( isset( $etape['pgn_data'] ) && is_string( $etape['pgn_data'] ) ) {
					$pgn_parts[] = $etape['pgn_data'];
				}
			}
			$pgn = implode( "\n\n", $pgn_parts );
		}
		?>
		<div id="roi_builder_type_5" class="roi-builder-section" style="display:none;">
			<h4 class="roi-builder-section-title"><?php esc_html_e( "Constructeur d'exercice (Posi'Plan)", 'roi' ); ?></h4>
			<p class="roi-builder-description">
				<strong><?php esc_html_e( 'Principe :', 'roi' ); ?></strong> <?php esc_html_e( "Collez une étude PGN complète (ex: exportée depuis Lichess). Dès la position initiale, un choix parmi 3 plans est proposé (1 coup principal + variantes à explorer). Sur la ligne principale, d'autres choix peuvent suivre.", 'roi' ); ?>
			</p>

			<div class="roi-form-row">
				<label for="roi_t5_consigne"><?php esc_html_e( 'Consigne générale :', 'roi' ); ?></label>
				<input type="text" id="roi_t5_consigne" class="large-text" value="<?php echo esc_attr( $consigne ); ?>" placeholder="<?php esc_attr_e( 'Évaluez la position et choisissez le meilleur plan.', 'roi' ); ?>">
			</div>

			<div class="roi-t5-diagramme-item">
				<h4 class="roi-builder-section-title">
					<?php esc_html_e( 'Étude PGN Complète', 'roi' ); ?>
				</h4>

				<?php
				PgnInput::render(
					array(
						'id'           => 'roi_t5_pgn',
						'value'        => $pgn,
						'button_id'    => 'btn_open_pgn_editor_t5',
						'input_class'  => 'roi_t5_pgn',
						'button_class' => 'button btn_open_pgn_editor_t5',
						'label'        => __( 'Séquence PGN (Partie complète avec variantes et commentaires) :', 'roi' ),
						'rows'         => 8,
						'placeholder'  => __( "Collez l'étude PGN complète (ex: export Lichess)...", 'roi' ),
					)
				);
				?>

				<!-- Aperçu interactif du PGN avec navigation et commentaires -->
				<div class="roi-form-row">
					<label>
						<strong><?php esc_html_e( 'Aperçu interactif & navigation des coups (lecture seule) :', 'roi' ); ?></strong>
					</label>
					<div id="roi_t5_preview_container" class="roi-t5-preview-container"></div>
				</div>
			</div>
		</div>
		<?php
	}
}

