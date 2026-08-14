<?php
/**
 * Class TypeCapOuPasCap
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

/**
 * Class TypeCapOuPasCap
 * Handles rendering for Type 14: Cap ou pas cap ?.
 */
class TypeCapOuPasCap implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$consigne     = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : '';
		$type_reponse = isset( $config_data['type_reponse'] ) && is_string( $config_data['type_reponse'] ) ? $config_data['type_reponse'] : 'qcm';
		$diagrammes   = isset( $config_data['diagrammes'] ) && is_array( $config_data['diagrammes'] ) ? $config_data['diagrammes'] : array();
		?>
		<div id="roi_builder_type_14" class="roi-builder-section" style="display:none; margin-top:15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Cap ou pas cap ?)", 'roi' ); ?></h4>

			<div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
				<div>
					<label for="roi_t14_consigne"><strong><?php esc_html_e( 'Consigne :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t14_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width:100%; height: 30px;" placeholder="<?php esc_attr_e( 'ex: Cap ou pas cap de prendre ce pion empoisonné ?', 'roi' ); ?>">
				</div>

				<div>
					<label for="roi_t14_type_reponse"><strong><?php esc_html_e( 'Type de réponse :', 'roi' ); ?></strong></label><br>
					<select id="roi_t14_type_reponse" style="min-width: 250px; height: 30px;">
						<option value="qcm" <?php selected( $type_reponse, 'qcm' ); ?>><?php esc_html_e( 'qcm (Choix multiples)', 'roi' ); ?></option>
						<option value="move" <?php selected( $type_reponse, 'move' ); ?>><?php esc_html_e( 'move (Déplacement sur l\'échiquier)', 'roi' ); ?></option>
					</select>
				</div>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

			<h5 style="margin-bottom: 10px; font-size: 14px; font-weight: 600;"><?php esc_html_e( 'Diagrammes (5 positions)', 'roi' ); ?></h5>

			<div id="roi_t14_diagrammes_container" style="display: flex; flex-direction: column; gap: 15px;">
				<?php
				for ( $i = 0; $i < 5; $i++ ) :
					$diag             = isset( $diagrammes[ $i ] ) && is_array( $diagrammes[ $i ] ) ? $diagrammes[ $i ] : array();
					$fen              = isset( $diag['fen'] ) && is_string( $diag['fen'] ) ? $diag['fen'] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
					$couleur_joueur   = isset( $diag['couleur_joueur'] ) && is_string( $diag['couleur_joueur'] ) ? $diag['couleur_joueur'] : 'white';
					$qcm_choix        = isset( $diag['qcm_choix'] ) && is_array( $diag['qcm_choix'] ) ? $diag['qcm_choix'] : array();
					$qcm_bonne        = isset( $diag['qcm_bonne_reponse'] ) ? (int) $diag['qcm_bonne_reponse'] : 0;
					$move_san         = isset( $diag['move_san'] ) && is_string( $diag['move_san'] ) ? $diag['move_san'] : '';
					$move_explication = isset( $diag['move_explication'] ) && is_string( $diag['move_explication'] ) ? $diag['move_explication'] : '';

					$opt0_texte       = isset( $qcm_choix[0]['texte'] ) && is_string( $qcm_choix[0]['texte'] ) ? $qcm_choix[0]['texte'] : '';
					$opt0_explication = isset( $qcm_choix[0]['explication'] ) && is_string( $qcm_choix[0]['explication'] ) ? $qcm_choix[0]['explication'] : '';
					$opt1_texte       = isset( $qcm_choix[1]['texte'] ) && is_string( $qcm_choix[1]['texte'] ) ? $qcm_choix[1]['texte'] : '';
					$opt1_explication = isset( $qcm_choix[1]['explication'] ) && is_string( $qcm_choix[1]['explication'] ) ? $qcm_choix[1]['explication'] : '';
					?>
					<div class="roi-t14-diagramme-item" data-index="<?php echo (int) $i; ?>" style="padding: 12px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;">
						<div style="font-weight: 600; margin-bottom: 8px; font-size: 13px; color: #1d2327;">
							<?php
							/* translators: %d: Diagram number */
							echo esc_html( sprintf( __( 'Diagramme %d', 'roi' ), $i + 1 ) );
							?>
						</div>

						<?php
						FenInput::render(
							array(
								'id'              => 'roi_t14_fen_' . $i,
								'value'           => $fen,
								'color'           => $couleur_joueur,
								'orientation_id'  => 'roi_t14_couleur_' . $i,
								'button_id'       => 'btn_open_fen_editor_t14_' . $i,
								'input_class'     => 'roi_t14_fen',
								'color_class'     => 'roi_t14_couleur',
								'button_class'    => 'button btn_open_fen_editor_t14',
								'label'           => __( 'FEN :', 'roi' ),
								'data_attributes' => array( 'index' => $i ),
							)
						);
						?>

						<!-- Bloc QCM -->
						<div class="roi_t14_bloc_qcm" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'qcm' === $type_reponse ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 6px; display: block;"><?php esc_html_e( 'Options QCM (2 choix) :', 'roi' ); ?></label>

							<!-- Choix 1 -->
							<div style="padding: 8px; border: 1px solid #e2e4e7; background: #fff; border-radius: 4px; margin-bottom: 8px;">
								<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
									<input type="radio" class="roi_t14_qcm_bonne_reponse" name="roi_t14_qcm_bonne_reponse_<?php echo (int) $i; ?>" value="0" data-index="<?php echo (int) $i; ?>" <?php checked( $qcm_bonne, 0 ); ?>>
									<strong style="font-size: 12px;"><?php esc_html_e( 'Choix 1 (Bonne réponse ?)', 'roi' ); ?></strong>
								</div>
								<div style="display: flex; gap: 10px;">
									<input type="text" class="roi_t14_qcm_texte" data-index="<?php echo (int) $i; ?>" data-opt="0" value="<?php echo esc_attr( $opt0_texte ); ?>" placeholder="<?php esc_attr_e( 'Texte du bouton (ex: Cap !)', 'roi' ); ?>" style="flex: 1; height: 30px;">
									<input type="text" class="roi_t14_qcm_explication" data-index="<?php echo (int) $i; ?>" data-opt="0" value="<?php echo esc_attr( $opt0_explication ); ?>" placeholder="<?php esc_attr_e( 'Explication (ex: Bien joué...)', 'roi' ); ?>" style="flex: 2; height: 30px;">
								</div>
							</div>

							<!-- Choix 2 -->
							<div style="padding: 8px; border: 1px solid #e2e4e7; background: #fff; border-radius: 4px;">
								<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
									<input type="radio" class="roi_t14_qcm_bonne_reponse" name="roi_t14_qcm_bonne_reponse_<?php echo (int) $i; ?>" value="1" data-index="<?php echo (int) $i; ?>" <?php checked( $qcm_bonne, 1 ); ?>>
									<strong style="font-size: 12px;"><?php esc_html_e( 'Choix 2 (Bonne réponse ?)', 'roi' ); ?></strong>
								</div>
								<div style="display: flex; gap: 10px;">
									<input type="text" class="roi_t14_qcm_texte" data-index="<?php echo (int) $i; ?>" data-opt="1" value="<?php echo esc_attr( $opt1_texte ); ?>" placeholder="<?php esc_attr_e( 'Texte du bouton (ex: Pas cap.)', 'roi' ); ?>" style="flex: 1; height: 30px;">
									<input type="text" class="roi_t14_qcm_explication" data-index="<?php echo (int) $i; ?>" data-opt="1" value="<?php echo esc_attr( $opt1_explication ); ?>" placeholder="<?php esc_attr_e( 'Explication (ex: Dommage...)', 'roi' ); ?>" style="flex: 2; height: 30px;">
								</div>
							</div>
						</div>

						<!-- Bloc Move -->
						<div class="roi_t14_bloc_move" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'move' === $type_reponse ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 6px; display: block;"><?php esc_html_e( 'Déplacement attendu :', 'roi' ); ?></label>
							<div style="display: flex; gap: 10px;">
								<input type="text" class="roi_t14_move_san" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $move_san ); ?>" placeholder="<?php esc_attr_e( 'Coup attendu (ex: Nxf7)', 'roi' ); ?>" style="flex: 1; height: 30px;">
								<input type="text" class="roi_t14_move_explication" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $move_explication ); ?>" placeholder="<?php esc_attr_e( 'Explication si erreur', 'roi' ); ?>" style="flex: 2; height: 30px;">
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
