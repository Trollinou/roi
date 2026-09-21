<?php
/**
 * Class TypePartieHeros
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\PgnInput;

/**
 * Class TypePartieHeros
 * Handles rendering for Type 4: La Partie dont tu es le Héros (Étude PGN interactive avec embranchements QCM).
 */
class TypePartieHeros implements TypeInterface {

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
			: __( 'Revivez la partie du héros et trouvez le bon coup.', 'roi' );
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
		<div id="roi_builder_type_4" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (La Partie dont tu es le Héros)", 'roi' ); ?></h4>
			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<?php /* translators: %cal is a PGN annotation tag for colored arrows */ ?>
				<strong><?php esc_html_e( 'Principe :', 'roi' ); ?></strong> <?php esc_html_e( 'Collez une étude PGN complète (ex: exportée depuis Lichess). Les moments de choix QCM sont automatiquement détectés via les flèches [%cal ...] et les 2 variantes associées au coup principal.', 'roi' ); ?>
			</p>

			<div style="margin-bottom: 20px;">
				<label for="roi_t4_consigne"><strong><?php esc_html_e( 'Consigne générale :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t4_consigne" class="large-text" style="width: 100%; height: 30px;" value="<?php echo esc_attr( $consigne ); ?>" placeholder="<?php esc_attr_e( 'Revivez la partie du héros et trouvez le bon coup.', 'roi' ); ?>">
			</div>

			<div class="roi-t4-diagramme-item" style="border: 1px solid #e5e5e5; padding: 14px; border-radius: 4px; background: #f9f9f9;">
				<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1d2327;">
					<?php esc_html_e( 'Étude PGN Complète', 'roi' ); ?>
				</h4>

				<?php
				PgnInput::render(
					array(
						'id'           => 'roi_t4_pgn',
						'value'        => $pgn,
						'button_id'    => 'btn_open_pgn_editor_t4',
						'input_class'  => 'roi_t4_pgn',
						'button_class' => 'button btn_open_pgn_editor_t4',
						'label'        => __( 'Séquence PGN (Partie complète avec variantes et commentaires) :', 'roi' ),
						'rows'         => 8,
						'placeholder'  => __( "Collez l'étude PGN complète (ex: export Lichess)...", 'roi' ),
					)
				);
				?>

				<!-- Aperçu interactif du PGN avec navigation et commentaires -->
				<div style="margin-top: 15px;">
					<label style="display: block; margin-bottom: 6px; font-size: 12px; color: #50575e;">
						<strong><?php esc_html_e( 'Aperçu interactif & navigation des coups (lecture seule) :', 'roi' ); ?></strong>
					</label>
					<div id="roi_t4_preview_container" class="roi-t4-preview-container"></div>
				</div>
			</div>
		</div>
		<?php
	}
}

