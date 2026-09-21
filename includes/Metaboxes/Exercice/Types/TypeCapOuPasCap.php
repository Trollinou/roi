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
		$consigne = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : '';
		$variante = isset( $config_data['variante'] ) && is_string( $config_data['variante'] )
			? $config_data['variante']
			: ( isset( $config_data['type_reponse'] ) && is_string( $config_data['type_reponse'] ) ? $config_data['type_reponse'] : 'qcm_oui_non' );

		// Rétrocompatibilité variante.
		if ( 'qcm' === $variante ) {
			$variante = 'qcm_oui_non';
		}

		$mode_clic    = isset( $config_data['mode_clic'] ) && is_string( $config_data['mode_clic'] ) ? $config_data['mode_clic'] : 'cibles';
		$mode_setup   = isset( $config_data['mode_setup'] ) && is_string( $config_data['mode_setup'] ) ? $config_data['mode_setup'] : 'memoire';
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
				• <strong><?php esc_html_e( 'QCM Multiple :', 'roi' ); ?></strong> <?php esc_html_e( 'Définissez les affirmations globales, puis pour chaque diagramme indiquez si chaque affirmation est OUI ou NON.', 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'QCM Oui/Non :', 'roi' ); ?></strong> <?php esc_html_e( 'Définissez une question commune à la série, puis pour chaque diagramme indiquez la réponse attendue (OUI ou NON).', 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Move :', 'roi' ); ?></strong> <?php esc_html_e( 'Indiquez le ou les coups attendus (supporte les variantes PGN multi-solutions ex: 1. Nd5+ (1. Bh4+)).', 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Notation :', 'roi' ); ?></strong> <?php esc_html_e( "L'élève doit saisir la position de chaque pièce en notation française (ex: Tc2, Dd4, c3). Déduit de la FEN.", 'roi' ); ?><br>
				<?php /* translators: %csl is a PGN annotation tag for colored squares */ ?>
				• <strong><?php esc_html_e( 'Clic / Sélection :', 'roi' ); ?></strong> <?php esc_html_e( "L'élève clique pour entourer les pièces (Prises [%csl], pièces non protégées, attaques ou différentiel de matériel).", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Reconstitution (Setup) :', 'roi' ); ?></strong> <?php esc_html_e( "L'élève place les pièces sur un échiquier vierge depuis une palette (d'après texte ou de mémoire).", 'roi' ); ?>
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
						<option value="move" <?php selected( $variante, 'move' ); ?>><?php esc_html_e( 'Move (Déplacement sur l\'échiquier / Multi-coups)', 'roi' ); ?></option>
						<option value="notation" <?php selected( $variante, 'notation' ); ?>><?php esc_html_e( 'Notation (Saisie des coordonnées des pièces)', 'roi' ); ?></option>
						<option value="clic" <?php selected( $variante, 'clic' ); ?>><?php esc_html_e( 'Clic / Sélection sur l\'échiquier', 'roi' ); ?></option>
						<option value="setup" <?php selected( $variante, 'setup' ); ?>><?php esc_html_e( 'Reconstitution (Setup / Palette)', 'roi' ); ?></option>
					</select>
				</div>

				<!-- Bloc Options de réponses partagées (pour QCM Simple et QCM Multiple) -->
				<div id="roi_t14_bloc_global_options_reponse" style="border: 1px solid #e2e4e7; background: #fafafa; padding: 12px; border-radius: 4px; display: <?php echo ( 'qcm_multiple' === $variante || 'qcm_oui_non' === $variante ) ? 'block' : 'none'; ?>;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
						<label><strong><?php esc_html_e( 'Options de réponse possibles :', 'roi' ); ?></strong></label>
						<button type="button" id="roi_t14_add_option_btn" class="button button-secondary">
							<span class="dashicons dashicons-plus-alt2" style="vertical-align: middle;"></span>
							<?php esc_html_e( 'Ajouter une option', 'roi' ); ?>
						</button>
					</div>
					<p class="description" style="margin-top: 0; margin-bottom: 8px; font-size: 12px; color: #646970;">
						<?php esc_html_e( 'Par défaut : OUI et NON. Vous pouvez modifier les libellés ou ajouter des choix supplémentaires (ex: BLANC, NOIR, ÉGALE ou 0, 1, 2, 3).', 'roi' ); ?>
					</p>
					<div id="roi_t14_options_reponse_list" style="display: flex; flex-wrap: wrap; gap: 8px;">
						<!-- Généré dynamiquement en JS -->
					</div>
				</div>

				<!-- Bloc Propositions pour QCM Multiple -->
				<div id="roi_t14_bloc_global_propositions" style="border: 1px solid #e2e4e7; background: #fafafa; padding: 12px; border-radius: 4px; display: <?php echo 'qcm_multiple' === $variante ? 'block' : 'none'; ?>;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
						<label><strong><?php esc_html_e( 'Propositions / Questions de la série :', 'roi' ); ?></strong></label>
						<button type="button" id="roi_t14_add_proposition_btn" class="button button-secondary">
							<span class="dashicons dashicons-plus-alt2" style="vertical-align: middle;"></span>
							<?php esc_html_e( 'Ajouter une proposition', 'roi' ); ?>
						</button>
					</div>
					<div id="roi_t14_propositions_list" style="display: flex; flex-direction: column; gap: 8px;">
						<!-- Généré dynamiquement en JS -->
					</div>
				</div>

				<!-- Bloc Question unique pour QCM Oui/Non (QCM Simple) -->
				<div id="roi_t14_bloc_global_question" style="border: 1px solid #e2e4e7; background: #fafafa; padding: 12px; border-radius: 4px; display: <?php echo 'qcm_oui_non' === $variante ? 'block' : 'none'; ?>;">
					<label for="roi_t14_question"><strong><?php esc_html_e( 'Question commune aux 5 diagrammes :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t14_question" value="<?php echo esc_attr( $question ); ?>" style="width:100%; height: 30px; margin-top: 5px;" placeholder="<?php esc_attr_e( 'ex: Le roque est-il autorisé dans cette position ? ou Qui a l\'avantage ?', 'roi' ); ?>">
				</div>

				<!-- Bloc Sous-mode pour Clic -->
				<div id="roi_t14_bloc_global_clic" style="border: 1px solid #e2e4e7; background: #fafafa; padding: 12px; border-radius: 4px; display: <?php echo 'clic' === $variante ? 'block' : 'none'; ?>;">
					<label><strong><?php esc_html_e( 'Mode de sélection Clic :', 'roi' ); ?></strong></label><br>
					<div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 8px;">
						<label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
							<input type="radio" name="roi_t14_mode_clic" class="roi_t14_mode_clic" value="cibles" <?php checked( $mode_clic, 'cibles' ); ?>>
							<?php /* translators: %csl is a PGN annotation tag for colored squares */ ?>
							<span><?php esc_html_e( 'Cases / Pièces cibles du PGN ([%csl ...]) (Prises, Attaques, Non-protégées)', 'roi' ); ?></span>
						</label>
						<label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
							<input type="radio" name="roi_t14_mode_clic" class="roi_t14_mode_clic" value="prises_meilleur_coup" <?php checked( $mode_clic, 'prises_meilleur_coup' ); ?>>
							<span><?php esc_html_e( 'Prises possibles puis Meilleur coup (Séquence Clic ➔ Coup)', 'roi' ); ?></span>
						</label>
						<label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
							<input type="radio" name="roi_t14_mode_clic" class="roi_t14_mode_clic" value="materiel" <?php checked( $mode_clic, 'materiel' ); ?>>
							<span><?php esc_html_e( 'Différentiel de matériel (Comptage & inventaire libre)', 'roi' ); ?></span>
						</label>
					</div>
				</div>

				<!-- Bloc Sous-mode pour Setup -->
				<div id="roi_t14_bloc_global_setup" style="border: 1px solid #e2e4e7; background: #fafafa; padding: 12px; border-radius: 4px; display: <?php echo 'setup' === $variante ? 'block' : 'none'; ?>;">
					<label><strong><?php esc_html_e( 'Mode de reconstitution Setup :', 'roi' ); ?></strong></label><br>
					<div style="display: flex; gap: 20px; margin-top: 8px;">
						<label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
							<input type="radio" name="roi_t14_mode_setup" class="roi_t14_mode_setup" value="memoire" <?php checked( $mode_setup, 'memoire' ); ?>>
							<span><?php esc_html_e( 'Mémorisation puis reproduction (Carte flash à mémoriser)', 'roi' ); ?></span>
						</label>
						<label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
							<input type="radio" name="roi_t14_mode_setup" class="roi_t14_mode_setup" value="texte" <?php checked( $mode_setup, 'texte' ); ?>>
							<span><?php esc_html_e( 'Description textuelle (Liste des coordonnées écrites)', 'roi' ); ?></span>
						</label>
					</div>
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
					$conseil          = isset( $exo['conseil'] ) && is_string( $exo['conseil'] ) ? $exo['conseil'] : '';
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
								'label'           => __( 'Séquence PGN (Position + Coup éventuel + Flèches/Cercles) :', 'roi' ),
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
								<?php esc_html_e( 'Réponses attendues pour ce diagramme :', 'roi' ); ?>
							</label>
							<div class="roi_t14_multiple_reponses_container" data-index="<?php echo (int) $i; ?>" style="display: flex; flex-direction: column; gap: 8px;">
								<!-- Rempli dynamiquement en JS selon les propositions et options -->
							</div>
						</div>

						<!-- Bloc QCM Oui/Non (QCM Simple) -->
						<div class="roi_t14_bloc_qcm_oui_non" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'qcm_oui_non' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 8px; display: block;">
								<?php esc_html_e( 'Réponse attendue pour ce diagramme :', 'roi' ); ?>
							</label>
							<div class="roi_t14_single_reponse_container" data-index="<?php echo (int) $i; ?>" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; background: #fff; padding: 10px 14px; border: 1px solid #ccd0d4; border-radius: 4px; width: fit-content;">
								<!-- Rempli dynamiquement en JS selon options_reponse -->
							</div>
						</div>

						<!-- Bloc Move -->
						<div class="roi_t14_bloc_move" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'move' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 6px; display: block;"><?php esc_html_e( 'Déplacement attendu :', 'roi' ); ?></label>
							<div style="display: flex; gap: 10px; margin-bottom: 6px;">
								<input type="text" class="roi_t14_move_san" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $move_san ); ?>" placeholder="<?php esc_attr_e( 'Coup attendu (ex: Nxf7 ou auto-extrait du PGN)', 'roi' ); ?>" style="flex: 1; height: 30px;">
								<input type="text" class="roi_t14_move_explication" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $move_explication ); ?>" placeholder="<?php esc_attr_e( 'Explication si erreur', 'roi' ); ?>" style="flex: 2; height: 30px;">
							</div>
							<div style="font-size: 11px; color: #666;">
								<?php esc_html_e( 'Astuce : Si le PGN contient des variantes (ex: 1. Nd5+ (1. Bh4+)), le moteur PWA demandera automatiquement de trouver tous les coups légaux !', 'roi' ); ?>
							</div>
						</div>

						<!-- Bloc Notation -->
						<div class="roi_t14_bloc_notation" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'notation' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<div style="font-size: 12px; color: #50575e; background: #e7f3fe; border-left: 3px solid #2271b1; padding: 8px 10px; border-radius: 2px;">
								<span class="dashicons dashicons-info" style="font-size: 16px; width: 16px; height: 16px; vertical-align: text-bottom; margin-right: 4px; color: #2271b1;"></span>
								<?php esc_html_e( 'Variante Notation : Les pièces et leurs coordonnées cibles sont automatiquement extraites de la position FEN.', 'roi' ); ?>
							</div>
						</div>

						<!-- Bloc Clic -->
						<div class="roi_t14_bloc_clic" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'clic' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<div style="font-size: 12px; color: #50575e; background: #e7f3fe; border-left: 3px solid #2271b1; padding: 8px 10px; border-radius: 2px;">
								<span class="dashicons dashicons-info" style="font-size: 16px; width: 16px; height: 16px; vertical-align: text-bottom; margin-right: 4px; color: #2271b1;"></span>
								<?php
								/* translators: %csl is a PGN annotation tag for colored squares */
								esc_html_e( 'Variante Clic : Les cases/pièces cibles sont automatiquement extraites des annotations [%csl ...] du PGN ou calculées à partir de la FEN.', 'roi' );
								?>
							</div>
						</div>

						<!-- Bloc Setup -->
						<div class="roi_t14_bloc_setup" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'setup' === $variante ? 'block' : 'none'; ?>; border-top: 1px dashed #ccc; padding-top: 12px; margin-top: 10px;">
							<label style="font-weight: 600; margin-bottom: 6px; display: block;"><?php esc_html_e( 'Conseil / Indice au verso (optionnel) :', 'roi' ); ?></label>
							<input type="text" class="roi_t14_conseil" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $conseil ); ?>" placeholder="<?php esc_attr_e( 'ex: Observe les pièces qui ont bougé par rapport au début !', 'roi' ); ?>" style="width: 100%; height: 30px;">
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}


