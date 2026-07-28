<?php
/**
 * Class TypeEchecEval
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypeEchecEval
 * Handles rendering for Type 10: Echec'éval.
 */
class TypeEchecEval implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$fen_depart      = isset( $config_data['fen_depart'] ) && is_string( $config_data['fen_depart'] ) ? $config_data['fen_depart'] : 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5';
		$couleur_joueur  = isset( $config_data['couleur_joueur'] ) && is_string( $config_data['couleur_joueur'] ) ? $config_data['couleur_joueur'] : 'white';
		$theme           = isset( $config_data['theme'] ) && is_string( $config_data['theme'] ) ? $config_data['theme'] : '';
		$questions       = isset( $config_data['questions'] ) && is_array( $config_data['questions'] ) ? $config_data['questions'] : [];
		$solution_moves  = isset( $config_data['solution_moves'] ) && is_array( $config_data['solution_moves'] ) ? implode( ', ', $config_data['solution_moves'] ) : '';
		$pgn_explication = isset( $config_data['pgn_explication'] ) && is_string( $config_data['pgn_explication'] ) ? $config_data['pgn_explication'] : '';
		?>
		<div id="roi_builder_type_10" class="roi-builder-section" style="display:none; margin-top:15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Echec'éval)", 'roi' ); ?></h4>

			<!-- Configuration Globale -->
			<div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
				<div style="display: flex; gap: 15px; align-items: flex-end;">
					<div style="flex: 1;">
						<label for="roi_t10_fen_depart"><strong><?php esc_html_e( 'Position de départ (FEN) :', 'roi' ); ?></strong></label><br>
						<input type="text" id="roi_t10_fen_depart" value="<?php echo esc_attr( $fen_depart ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e;">
					</div>
					<div>
						<button type="button" id="btn_open_fen_editor_t10" class="button"><?php esc_html_e( 'Éditer la position', 'roi' ); ?></button>
					</div>
					<div>
						<label for="roi_t10_couleur"><strong><?php esc_html_e( 'Couleur du joueur :', 'roi' ); ?></strong></label><br>
						<select id="roi_t10_couleur" style="width: 120px; height: 30px;">
							<option value="white" <?php selected( $couleur_joueur, 'white' ); ?>><?php esc_html_e( 'Blancs', 'roi' ); ?></option>
							<option value="black" <?php selected( $couleur_joueur, 'black' ); ?>><?php esc_html_e( 'Noirs', 'roi' ); ?></option>
						</select>
					</div>
				</div>

				<div>
					<label for="roi_t10_theme"><strong><?php esc_html_e( 'Thème :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t10_theme" value="<?php echo esc_attr( $theme ); ?>" style="width:100%; height: 30px;" placeholder="<?php esc_attr_e( 'Ex: Sécurité du Roi', 'roi' ); ?>">
				</div>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

			<!-- Questions (Dynamiques) -->
			<div style="margin-bottom: 20px;">
				<h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; font-weight: 600;"><?php esc_html_e( 'Questions d\'évaluation', 'roi' ); ?></h4>
				
				<div id="roi_t10_questions_container" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px;">
					<?php
					foreach ( $questions as $idx => $q ) :
						$q_texte       = isset( $q['texte'] ) && is_string( $q['texte'] ) ? $q['texte'] : '';
						$q_type        = isset( $q['type_reponse'] ) && is_string( $q['type_reponse'] ) ? $q['type_reponse'] : 'yesno';
						$q_reponse     = isset( $q['reponse_attendue'] ) && is_string( $q['reponse_attendue'] ) ? $q['reponse_attendue'] : '';
						$q_explication = isset( $q['explication'] ) && is_string( $q['explication'] ) ? $q['explication'] : '';
						?>
						<div class="roi-t10-question-card" data-index="<?php echo (int) $idx; ?>" style="padding: 12px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;">
							<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
								<strong style="font-size: 13px; color: #1d2327;">
									<?php printf( esc_html__( 'Question %d', 'roi' ), (int) $idx + 1 ); ?>
								</strong>
								<button type="button" class="button button-link-delete roi_t10_remove_question" style="color: #b32d2e; text-decoration: none;">
									<?php esc_html_e( 'Supprimer', 'roi' ); ?>
								</button>
							</div>

							<div style="display: flex; flex-direction: column; gap: 10px;">
								<div>
									<label style="font-weight: 600; font-size: 12px;"><?php esc_html_e( 'Intitulé de la question :', 'roi' ); ?></label>
									<input type="text" class="roi_t10_q_texte" value="<?php echo esc_attr( $q_texte ); ?>" style="width: 100%; height: 30px;" placeholder="<?php esc_attr_e( 'Ex: Le Roi blanc est-il en sécurité ?', 'roi' ); ?>">
								</div>

								<div style="display: flex; gap: 15px; align-items: center;">
									<div style="flex: 1;">
										<label style="font-weight: 600; font-size: 12px;"><?php esc_html_e( 'Type de réponse :', 'roi' ); ?></label>
										<select class="roi_t10_q_type" style="width: 100%; height: 30px;">
											<option value="yesno" <?php selected( $q_type, 'yesno' ); ?>><?php esc_html_e( 'Oui / Non (yesno)', 'roi' ); ?></option>
											<option value="evaluation" <?php selected( $q_type, 'evaluation' ); ?>><?php esc_html_e( 'Évaluation (evaluation)', 'roi' ); ?></option>
										</select>
									</div>

									<div style="flex: 1;">
										<label style="font-weight: 600; font-size: 12px;"><?php esc_html_e( 'Réponse attendue :', 'roi' ); ?></label>
										<select class="roi_t10_q_reponse_yesno" style="width: 100%; height: 30px; display: <?php echo 'yesno' === $q_type ? 'inline-block' : 'none'; ?>;">
											<option value="oui" <?php selected( $q_reponse, 'oui' ); ?>><?php esc_html_e( 'Oui', 'roi' ); ?></option>
											<option value="non" <?php selected( $q_reponse, 'non' ); ?>><?php esc_html_e( 'Non', 'roi' ); ?></option>
										</select>
										<select class="roi_t10_q_reponse_evaluation" style="width: 100%; height: 30px; display: <?php echo 'evaluation' === $q_type ? 'inline-block' : 'none'; ?>;">
											<option value="bonne" <?php selected( $q_reponse, 'bonne' ); ?>><?php esc_html_e( 'Bonne', 'roi' ); ?></option>
											<option value="neutre" <?php selected( $q_reponse, 'neutre' ); ?>><?php esc_html_e( 'Neutre', 'roi' ); ?></option>
											<option value="mauvaise" <?php selected( $q_reponse, 'mauvaise' ); ?>><?php esc_html_e( 'Mauvaise', 'roi' ); ?></option>
										</select>
									</div>
								</div>

								<div>
									<label style="font-weight: 600; font-size: 12px;"><?php esc_html_e( 'Explication :', 'roi' ); ?></label>
									<input type="text" class="roi_t10_q_explication" value="<?php echo esc_attr( $q_explication ); ?>" style="width: 100%; height: 30px;" placeholder="<?php esc_attr_e( 'Ex: Le centre va s\'ouvrir dangereusement.', 'roi' ); ?>">
								</div>
							</div>
						</div>
					<?php endforeach; ?>
				</div>

				<button type="button" id="roi_t10_add_question" class="button"><?php esc_html_e( 'Ajouter une question', 'roi' ); ?></button>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0 15px;">

			<!-- L'Action & Explication (Fin de l'exercice) -->
			<div style="display: flex; flex-direction: column; gap: 15px;">
				<div>
					<h4 style="margin-top: 0; font-size: 14px; font-weight: 600; margin-bottom: 8px;"><?php esc_html_e( 'Séquence à jouer', 'roi' ); ?></h4>
					<input type="text" id="roi_t10_solution_moves" value="<?php echo esc_attr( $solution_moves ); ?>" style="width:100%; height: 30px;" placeholder="<?php esc_attr_e( 'Coups SAN séparés par des virgules (ex: Nxe5, Nxe5, d4)', 'roi' ); ?>">
				</div>

				<div>
					<h4 style="margin-top: 0; font-size: 14px; font-weight: 600; margin-bottom: 8px;"><?php esc_html_e( 'Explication Finale', 'roi' ); ?></h4>
					<textarea id="roi_t10_pgn_explication" rows="5" style="width:100%;" placeholder="<?php esc_attr_e( 'Ex: 1. Nxe5 {Une attaque centrale forte} Nxe5 2. d4 {Récupération de la pièce}', 'roi' ); ?>"><?php echo esc_textarea( $pgn_explication ); ?></textarea>
				</div>
			</div>
		</div>
		<?php
	}
}
