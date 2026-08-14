<?php
/**
 * Class TypeParcours
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

/**
 * Class TypeParcours
 * Gère le rendu pour le Type 9 : Parcours.
 */
class TypeParcours implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$variante       = $config_data['variante'] ?? 'standard';
		$fen_depart     = $config_data['fen_depart'] ?? '';
		$couleur_joueur = $config_data['couleur_joueur'] ?? $config_data['couleur'] ?? 'white';
		$case_depart    = $config_data['case_depart'] ?? '';
		$case_arrivee   = $config_data['case_arrivee'] ?? '';
		?>
		<div id="roi_builder_type_9" style="display:none; margin-top: 15px;">
			<div style="padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
				<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( 'Parcours (Type 9)', 'roi' ); ?></h4>
				
				<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
					
					<p style="margin: 0; font-style: italic; color: #646970;">
						<?php esc_html_e( "Instructions : Utilisez l'éditeur pour placer un cercle BLEU sur la case de départ, un cercle VERT sur l'arrivée, et des cercles ROUGES sur les cases interdites.", 'roi' ); ?>
					</p>

					<div>
						<label for="roi_t9_variante"><strong><?php esc_html_e( 'Variante :', 'roi' ); ?></strong></label><br>
						<select id="roi_t9_variante" style="margin-top: 5px; width: 200px;">
							<option value="standard" <?php selected( $variante, 'standard' ); ?>><?php esc_html_e( 'standard', 'roi' ); ?></option>
							<option value="pacman" <?php selected( $variante, 'pacman' ); ?>><?php esc_html_e( 'pacman', 'roi' ); ?></option>
							<option value="stealth" <?php selected( $variante, 'stealth' ); ?>><?php esc_html_e( 'stealth', 'roi' ); ?></option>
						</select>
					</div>

					<?php
					FenInput::render(
						array(
							'id'             => 'roi_t9_fen_depart',
							'value'          => $fen_depart,
							'color'          => $couleur_joueur,
							'orientation_id' => 'roi_t9_couleur',
							'button_id'      => 'btn_open_fen_editor_t9',
							'button_label'   => __( 'Éditer la position et le parcours', 'roi' ),
							'label'          => __( 'Position & Parcours (FEN) :', 'roi' ),
						)
					);
					?>



					<div style="display: flex; gap: 15px;">
						<div style="flex: 1;">
							<label for="roi_t9_case_depart"><strong><?php esc_html_e( 'Déductions Automatiques - Case de départ :', 'roi' ); ?></strong></label><br>
							<input type="text" id="roi_t9_case_depart" value="<?php echo esc_attr( $case_depart ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e; margin-top: 5px;">
						</div>
						<div style="flex: 1;">
							<label for="roi_t9_case_arrivee"><strong><?php esc_html_e( "Déductions Automatiques - Case d'arrivée :", 'roi' ); ?></strong></label><br>
							<input type="text" id="roi_t9_case_arrivee" value="<?php echo esc_attr( $case_arrivee ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e; margin-top: 5px;">
						</div>
					</div>

				</div>
			</div>
		</div>
		<?php
	}
}
