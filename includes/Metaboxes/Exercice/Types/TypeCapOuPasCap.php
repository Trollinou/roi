<?php
/**
 * Class TypeCapOuPasCap
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\PgnInput;

/**
 * Class TypeCapOuPasCap
 * Handles rendering for Type 14: Cap ou pas cap ? (Série de 5 Mini-PGN).
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
		$variante     = isset( $config_data['variante'] ) && is_string( $config_data['variante'] )
			? $config_data['variante']
			: ( isset( $config_data['type_reponse'] ) && is_string( $config_data['type_reponse'] ) ? $config_data['type_reponse'] : 'qcm_oui_non' );

		// Rétrocompatibilité variante
		if ( 'qcm' === $variante ) {
			$variante = 'qcm_oui_non';
		}

		$propositions = isset( $config_data['propositions'] ) && is_array( $config_data['propositions'] ) ? $config_data['propositions'] : array();
		$question     = isset( $config_data['question'] ) && is_string( $config_data['question'] ) ? $config_data['question'] : '';
		$exercices    = isset( $config_data['exercices'] ) && is_array( $config_data['exercices'] )
			? $config_data['exercices']
			: ( isset( $config_data['diagrammes'] ) && is_array( $config_data['diagrammes'] ) ? $config_data['diagrammes'] : array() );
		?>
		<div id="roi_builder_type_14" class="roi-builder-section" style="display:none; margin-top:15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Cap ou pas cap ? - Série de 5)", 'roi' ); ?></h4>

			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<strong><?php esc_html_e( 'Format :', 'roi' ); ?></strong> <?php esc_html_e( "Série de 5 Mini-PGN (position FEN ou 1 coup avec flèches/cercles). La variante et la consigne s'appliquent pour l'ensemble de la série de 5.", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'QCM Multiple :', 'roi' ); ?></strong> <?php esc_html_e( "Définissez les affirmations globales, puis pour chaque diagramme indiquez si chaque affirmation est OUI ou NON.", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'QCM Oui/Non :', 'roi' ); ?></strong> <?php esc_html_e( "Définissez une question commune à la série, puis pour chaque diagramme indiquez la réponse attendue (OUI ou NON).", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Move :', 'roi' ); ?></strong> <?php esc_html_e( "Indiquez pour chaque diagramme le coup attendu sur l'échiquier.", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Notation :', 'roi' ); ?></strong> <?php esc_html_e( "L'élève doit saisir la position de chaque pièce en notation française (ex: Tc2, Dd4, c3). Les pièces et cases attendues sont automatiquement déduites de la position FEN.", 'roi' ); ?>
			</p>

			<div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
				<div>
					<label for="roi_t14_consigne"><strong><?php esc_html_e( 'Consigne générale :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t14_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width:100%; height: 30px;" placeholder="<?php esc_attr_e( 'ex: Donnez la position de chaque pièce présente sur l\'échiquier.', 'roi' ); ?>">
				</div>

				<div>
					<label for="roi_t14_variante"><strong><?php esc_html_e( 'Variante de la série :', 'roi' ); ?></strong></label><br>
					<select id="roi_t14_variante" style="min-width: 320px; height: 30px;">
						<option value="qcm_multiple" <?php selected( $variante, 'qcm_multiple' ); ?>><?php esc_html_e( 'QCM Multiple (Plusieurs propositions Oui/Non)', 'roi' ); ?></option>
						<option value="qcm_oui_non" <?php selected( $variante, 'qcm_oui_non' ); ?>><?php esc_html_e( 'QCM Oui/Non (Une question commune)', 'roi' ); ?></option>
						<option value="move" <?php selected( $variante, 'move' ); ?>><?php esc_html_e( 'Move (Déplacement sur l\'échiquier)', 'roi' ); ?></option>
						<option value="notation" <?php selected( $variante, 'notation' ); ?>><?php esc_html_e( 'Notation (Saisie des coordonnées des pièces)', 'roi' ); ?></option>
					</select>
				</div>

				<!-- Bloc Propositions pour QCM Multiple -->
				<div id="roi_t14_bloc_global_propositions" style="border: 1px solid #e2e4e7; background: #fafafa; padding: 12px; border-radius: 4px; display: <?php echo 'qcm_multiple' === $variante ? 'block' : 'none'; ?>;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
						<label><strong><?php esc_html_e( 'Propositions communes à la série :', 'roi' ); ?></strong></label>
						<button type="button" id="roi_t14_add_proposition_btn" class="button button-secondary">
							<span class="dashicons dashicons-plus-alt2" style="vertical-align: middle;"></span>
							<?php esc_html_e( 'Ajouter une proposition', 'roi' ); ?>
						</button>
					</div>
					<div id="roi_t14_propositions_list" style="display: flex; flex-direction: column; gap: 8px;">
						<!-- Généré dynamiquement en JS -->
					</div>
				</div>

				<!-- Bloc Question unique pour QCM Oui/Non -->
				<div id="roi_t14_bloc_global_question" style="border: 1px solid #e2e4e7; background: #fafafa; padding: 12px; border-radius: 4px; display: <?php echo 'qcm_oui_non' === $variante ? 'block' : 'none'; ?>;">
					<label for="roi_t14_question"><strong><?php esc_html_e( 'Question commune aux 5 diagrammes :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t14_question" value="<?php echo esc_attr( $question ); ?>" style="width:100%; height: 30px; margin-top: 5px;" placeholder="<?php esc_attr_e( 'ex: Le roque est-il autorisé dans cette position ?', 'roi' ); ?>">
				</div>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

			<h5 style="margin-bottom: 10px; font-size: 14px; font-weight: 600;"><?php esc_html_e( 'Mini-PGN (Série de 5)', 'roi' ); ?></h5>

			<div id="roi_t14_exercices_container" style="display: flex; flex-direction: column; gap: 18px;">
				<?php
				for ( $i = 0; $i < 5; $i++ ) :
					$exo              = isset( $exercices[ $i ] ) && is_array( $exercices[ $i ] ) ? $exercices[ $i ] : array();
					$exo_pgn          = isset( $exo['pgn'] ) && is_string( $exo['pgn'] ) ? $exo['pgn'] : '';
					$move_san         = isset( $exo['move_san'] ) && is_string( $exo['move_san'] ) ? $exo['move_san'] : '';
					$move_explication = isset( $exo['move_explication'] ) && is_string( $exo['move_explication'] ) ? $exo['move_explication'] : '';
					$reponse_oui_non  = isset( $exo['reponse_oui_non'] ) ? (bool) $exo['reponse_oui_non'] : true;
					?>
					<div class="roi-t14-exercice-item" data-index="<?php echo (int) $i; ?>" style="padding: 14px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;">
						<div style="font-weight: 600; margin-bottom: 10px; font-size: 13px; color: #1d2327;">
							<?php
							/* translators: %d: Exercise number */
							echo esc_html( sprintf( __( 'Mini-PGN %d / 5', 'roi' ), $i + 1 ) );
							?>
						</div>

						<?php
						PgnInput::render(
							array(
								'id'              => 'roi_t14_pgn_' . $i,
								'value'           => $exo_pgn,
								'button_id'       => 'btn_open_pgn_editor_t14_' . $i,
								'input_class'     => 'roi_t14_pgn',
								'button_class'    => 'button btn_open_pgn_editor_t14',
								'label'           => __( 'Séquence PGN (Position + Coup éventuel + Flèches) :', 'roi' ),
								'rows'            => 3,
								'placeholder'     => __( "Collez un PGN ou cliquez sur 'Éditer le PGN'...", 'roi' ),
								'data_attributes' => array( 'index' => $i ),
							)
						);
						?>

						<!-- Aperçu interactif du PGN -->
						<div style="margin-top: 12px; margin-bottom: 14px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
								<strong><?php esc_html_e( 'Aperçu interactif & navigation des coups (lecture seule) :', 'roi' ); ?></strong>
							</label>
							<div id="roi_t14_preview_container_<?php echo (int) $i; ?>" class="roi-t14-preview-container"></div>
						</div>

						<!-- Bloc QCM Multiple (réponses pour les propositions) -->
						<div class="roi_t14_bloc_qcm_multiple" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'qcm_multiple' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 8px; display: block;">
								<?php esc_html_e( 'Réponses attendues pour ce diagramme (OUI / NON) :', 'roi' ); ?>
							</label>
							<div class="roi_t14_multiple_reponses_container" data-index="<?php echo (int) $i; ?>" style="display: flex; flex-direction: column; gap: 8px;">
								<!-- Rempli dynamiquement en JS selon les propositions -->
							</div>
						</div>

						<!-- Bloc QCM Oui/Non -->
						<div class="roi_t14_bloc_qcm_oui_non" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'qcm_oui_non' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 8px; display: block;">
								<?php esc_html_e( 'Réponse attendue pour ce diagramme :', 'roi' ); ?>
							</label>
							<div style="display: flex; gap: 20px; align-items: center; background: #fff; padding: 10px 14px; border: 1px solid #ccd0d4; border-radius: 4px; width: fit-content;">
								<label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 600; color: #198754;">
									<input type="radio" name="roi_t14_reponse_oui_non_<?php echo (int) $i; ?>" class="roi_t14_reponse_oui_non" data-index="<?php echo (int) $i; ?>" value="1" <?php checked( $reponse_oui_non, true ); ?>>
									<span>✓ <?php esc_html_e( 'OUI', 'roi' ); ?></span>
								</label>
								<label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 600; color: #dc3545;">
									<input type="radio" name="roi_t14_reponse_oui_non_<?php echo (int) $i; ?>" class="roi_t14_reponse_oui_non" data-index="<?php echo (int) $i; ?>" value="0" <?php checked( $reponse_oui_non, false ); ?>>
									<span>✗ <?php esc_html_e( 'NON', 'roi' ); ?></span>
								</label>
							</div>
						</div>

						<!-- Bloc Move -->
						<div class="roi_t14_bloc_move" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'move' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 6px; display: block;"><?php esc_html_e( 'Déplacement attendu :', 'roi' ); ?></label>
							<div style="display: flex; gap: 10px;">
								<input type="text" class="roi_t14_move_san" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $move_san ); ?>" placeholder="<?php esc_attr_e( 'Coup attendu (ex: Nxf7)', 'roi' ); ?>" style="flex: 1; height: 30px;">
								<input type="text" class="roi_t14_move_explication" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $move_explication ); ?>" placeholder="<?php esc_attr_e( 'Explication si erreur', 'roi' ); ?>" style="flex: 2; height: 30px;">
							</div>
						</div>

						<!-- Bloc Notation -->
						<div class="roi_t14_bloc_notation" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'notation' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<div style="font-size: 12px; color: #50575e; background: #e7f3fe; border-left: 3px solid #2271b1; padding: 8px 10px; border-radius: 2px;">
								<span class="dashicons dashicons-info" style="font-size: 16px; width: 16px; height: 16px; vertical-align: text-bottom; margin-right: 4px; color: #2271b1;"></span>
								<?php esc_html_e( "Variante Notation : Les pièces et leurs coordonnées cibles sont automatiquement extraites de la position FEN.", 'roi' ); ?>
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}


