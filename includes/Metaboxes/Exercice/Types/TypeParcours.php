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
 * Gère le rendu pour le Type 9 : Parcours (Série de 3 parcours).
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
		$consigne_globale = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : '';
		$series           = isset( $config_data['series'] ) && is_array( $config_data['series'] ) ? $config_data['series'] : array();
		?>
		<div id="roi_builder_type_9" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Parcours - Série de 3)", 'roi' ); ?></h4>
			
			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<strong><?php esc_html_e( 'Règles visuelles & parcours :', 'roi' ); ?></strong><br>
				• <strong><?php esc_html_e( 'Cercle bleu (obligatoire) :', 'roi' ); ?></strong> <?php esc_html_e( 'Case de départ du parcours.', 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Cercle vert (optionnel si boucle) :', 'roi' ); ?></strong> <?php esc_html_e( "Case d'arrivée / cible. Si aucun cercle vert n'est tracé, le parcours est configuré en tour complet (boucle fermée avec arrivée = départ).", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Cercles rouges (optionnel) :', 'roi' ); ?></strong> <?php esc_html_e( 'Cases piégées / interdites.', 'roi' ); ?>
			</p>

			<div style="margin-bottom: 20px;">
				<label for="roi_t9_consigne"><strong><?php esc_html_e( 'Consigne générale (optionnelle) :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t9_consigne" class="large-text" style="width: 100%; height: 30px;" value="<?php echo esc_attr( $consigne_globale ); ?>" placeholder="<?php esc_attr_e( 'Ex : Complétez les 3 parcours tactiques.', 'roi' ); ?>">
			</div>

			<div style="display: flex; flex-direction: column; gap: 15px;">
				<?php
				for ( $i = 0; $i < 3; $i++ ) :
					$serie_item    = isset( $series[ $i ] ) && is_array( $series[ $i ] ) ? $series[ $i ] : array();
					$serie_desc    = isset( $serie_item['description'] ) && is_string( $serie_item['description'] ) ? $serie_item['description'] : '';
					$serie_var     = isset( $serie_item['variante'] ) && is_string( $serie_item['variante'] ) ? $serie_item['variante'] : 'standard';
					$serie_fen     = isset( $serie_item['fen_depart'] ) && is_string( $serie_item['fen_depart'] ) ? $serie_item['fen_depart'] : '';
					$serie_couleur = isset( $serie_item['couleur_joueur'] ) && is_string( $serie_item['couleur_joueur'] ) ? $serie_item['couleur_joueur'] : 'white';
					$serie_depart  = isset( $serie_item['case_depart'] ) && is_string( $serie_item['case_depart'] ) ? $serie_item['case_depart'] : '';
					$serie_arrivee = isset( $serie_item['case_arrivee'] ) && is_string( $serie_item['case_arrivee'] ) ? $serie_item['case_arrivee'] : '';
					$serie_piece   = isset( $serie_item['piece_attendue'] ) && is_string( $serie_item['piece_attendue'] ) ? $serie_item['piece_attendue'] : '';
					$serie_shapes  = isset( $serie_item['shapes'] ) && is_array( $serie_item['shapes'] ) ? $serie_item['shapes'] : array();
					?>
					<div class="roi-t9-serie-item" style="border: 1px solid #e5e5e5; padding: 14px; border-radius: 4px; background: #f9f9f9;">
						<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1d2327;">
							<?php
							/* translators: %d: Parcours number */
							echo esc_html( sprintf( __( 'Parcours %d / 3', 'roi' ), $i + 1 ) );
							?>
						</h4>

						<div style="display: flex; gap: 15px; margin-bottom: 12px; flex-wrap: wrap;">
							<div style="flex: 1; min-width: 200px;">
								<label for="roi_t9_variante_<?php echo (int) $i; ?>"><strong><?php esc_html_e( 'Variante :', 'roi' ); ?></strong></label><br>
								<select id="roi_t9_variante_<?php echo (int) $i; ?>" class="roi_t9_variante_item" data-index="<?php echo (int) $i; ?>" style="margin-top: 5px; width: 100%; height: 30px;">
									<option value="standard" <?php selected( $serie_var, 'standard' ); ?>><?php esc_html_e( 'standard - Parcours classique', 'roi' ); ?></option>
									<option value="pacman" <?php selected( $serie_var, 'pacman' ); ?>><?php esc_html_e( 'pacman - Manger toutes les pièces', 'roi' ); ?></option>
									<option value="stealth" <?php selected( $serie_var, 'stealth' ); ?>><?php esc_html_e( 'stealth - Pas vu, pas pris (cases non attaquées)', 'roi' ); ?></option>
									<option value="traces" <?php selected( $serie_var, 'traces' ); ?>><?php esc_html_e( "traces - Retrouver la pièce d'après ses traces", 'roi' ); ?></option>
								</select>
							</div>

							<div style="flex: 2; min-width: 250px;">
								<label for="roi_t9_description_<?php echo (int) $i; ?>"><strong><?php esc_html_e( 'Consigne / Description spécifique (optionnelle) :', 'roi' ); ?></strong></label><br>
								<input type="text" id="roi_t9_description_<?php echo (int) $i; ?>" class="roi_t9_description_item large-text" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 30px; margin-top: 5px;" value="<?php echo esc_attr( $serie_desc ); ?>" placeholder="<?php esc_attr_e( "Ex : Atteignez la case d'arrivée sans vous faire repérer.", 'roi' ); ?>">
							</div>
						</div>

						<?php
						FenInput::render(
							array(
								'id'              => 'roi_t9_fen_' . $i,
								'value'           => $serie_fen,
								'color'           => $serie_couleur,
								'shapes'          => $serie_shapes,
								'orientation_id'  => 'roi_t9_couleur_' . $i,
								'button_id'       => 'btn_open_fen_editor_t9_' . $i,
								'input_class'     => 'roi_t9_fen',
								'color_class'     => 'roi_t9_couleur',
								'button_class'    => 'button btn_open_fen_editor_t9',
								'label'           => __( 'Position & Parcours (FEN) :', 'roi' ),
								'button_label'    => __( 'Éditer la position et le parcours', 'roi' ),
								'data_attributes' => array( 'index' => $i ),
							)
						);
						?>

						<div style="display: flex; gap: 15px; margin-top: 10px; flex-wrap: wrap;">
							<div style="flex: 1; min-width: 150px;">
								<label for="roi_t9_case_depart_<?php echo (int) $i; ?>"><strong><?php esc_html_e( 'Case de départ (Cercle Bleu) :', 'roi' ); ?></strong></label><br>
								<input type="text" id="roi_t9_case_depart_<?php echo (int) $i; ?>" class="roi_t9_case_depart" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $serie_depart ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e; margin-top: 5px;">
							</div>
							<div style="flex: 1; min-width: 150px;">
								<label for="roi_t9_case_arrivee_<?php echo (int) $i; ?>"><strong><?php esc_html_e( "Case d'arrivée (Cercle Vert) :", 'roi' ); ?></strong></label><br>
								<input type="text" id="roi_t9_case_arrivee_<?php echo (int) $i; ?>" class="roi_t9_case_arrivee" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $serie_arrivee ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e; margin-top: 5px;">
							</div>
							<div style="flex: 1; min-width: 150px;">
								<label for="roi_t9_piece_attendue_<?php echo (int) $i; ?>"><strong><?php esc_html_e( 'Pièce attendue (Traces) :', 'roi' ); ?></strong></label><br>
								<input type="text" id="roi_t9_piece_attendue_<?php echo (int) $i; ?>" class="roi_t9_piece_attendue" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $serie_piece ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e; margin-top: 5px;">
							</div>
						</div>

						<!-- Aperçu visuel statique non-interactif du parcours -->
						<div style="margin-top: 10px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
								<strong><?php esc_html_e( 'Aperçu du parcours (non interactif) :', 'roi' ); ?></strong>
							</label>
							<div id="roi_t9_preview_container_<?php echo (int) $i; ?>" class="main-wrap fit-container piece-set-cburnett board-theme-brown" style="width: 260px; height: 260px; position: relative; border: 1px solid #ccd0d4; border-radius: 4px; background: #fff; overflow: hidden;">
								<div id="roi_t9_preview_board_<?php echo (int) $i; ?>" class="main-board roi_t9_preview_board" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 100%;"></div>
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}

