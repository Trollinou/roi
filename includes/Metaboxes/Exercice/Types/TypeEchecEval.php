<?php
/**
 * Class TypeEchecEval
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;
use ROI\Metaboxes\Exercice\Components\PgnInput;

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
		$questions       = isset( $config_data['questions'] ) && is_array( $config_data['questions'] ) ? $config_data['questions'] : array();
		$solution_moves  = isset( $config_data['solution_moves'] ) && is_array( $config_data['solution_moves'] ) ? implode( ', ', $config_data['solution_moves'] ) : '';
		$pgn_explication = isset( $config_data['pgn_explication'] ) && is_string( $config_data['pgn_explication'] ) ? $config_data['pgn_explication'] : '';
		?>
		<div id="roi_builder_type_10" class="roi-builder-section" style="display:none;">
			<h4 class="roi-builder-section-title"><?php esc_html_e( "Constructeur d'exercice (Echec'éval)", 'roi' ); ?></h4>

			<!-- Configuration Globale -->
			<div class="roi-form-row">
				<?php
				FenInput::render(
					array(
						'id'             => 'roi_t10_fen_depart',
						'value'          => $fen_depart,
						'color'          => $couleur_joueur,
						'orientation_id' => 'roi_t10_couleur',
						'button_id'      => 'btn_open_fen_editor_t10',
						'label'          => __( 'Position de départ (FEN) :', 'roi' ),
					)
				);
				?>

				<div class="roi-form-row">
					<label for="roi_t10_theme"><?php esc_html_e( 'Thème :', 'roi' ); ?></label>
					<input type="text" id="roi_t10_theme" value="<?php echo esc_attr( $theme ); ?>" placeholder="<?php esc_attr_e( 'Ex: Sécurité du Roi', 'roi' ); ?>">
				</div>
			</div>

			<hr>

			<!-- Questions (Dynamiques) -->
			<div class="roi-form-row">
				<h4 class="roi-builder-section-title"><?php esc_html_e( 'Questions d\'évaluation', 'roi' ); ?></h4>
				
				<div id="roi_t10_questions_container">
					<?php
					foreach ( $questions as $idx => $q ) :
						$q_texte       = isset( $q['texte'] ) && is_string( $q['texte'] ) ? $q['texte'] : '';
						$q_type        = isset( $q['type_reponse'] ) && is_string( $q['type_reponse'] ) ? $q['type_reponse'] : 'yesno';
						$q_reponse     = isset( $q['reponse_attendue'] ) && is_string( $q['reponse_attendue'] ) ? $q['reponse_attendue'] : '';
						$q_explication = isset( $q['explication'] ) && is_string( $q['explication'] ) ? $q['explication'] : '';
						?>
						<div class="roi-t10-question-card" data-index="<?php echo (int) $idx; ?>">
							<div class="roi-t10-question-header">
								<strong>
									<?php
									/* translators: %d: Question number */
									echo esc_html( sprintf( __( 'Question %d', 'roi' ), (int) $idx + 1 ) );
									?>
								</strong>
								<button type="button" class="button button-link-delete roi_t10_remove_question">
									<?php esc_html_e( 'Supprimer', 'roi' ); ?>
								</button>
							</div>

							<div class="roi-form-row">
								<div class="roi-form-row">
									<label><?php esc_html_e( 'Intitulé de la question :', 'roi' ); ?></label>
									<input type="text" class="roi_t10_q_texte" value="<?php echo esc_attr( $q_texte ); ?>" placeholder="<?php esc_attr_e( 'Ex: Le Roi blanc est-il en sécurité ?', 'roi' ); ?>">
								</div>

								<div class="roi-form-flex-row">
									<div class="roi-form-flex-col">
										<label><?php esc_html_e( 'Type de réponse :', 'roi' ); ?></label>
										<select class="roi_t10_q_type">
											<option value="yesno" <?php selected( $q_type, 'yesno' ); ?>><?php esc_html_e( 'Oui / Non (yesno)', 'roi' ); ?></option>
											<option value="evaluation" <?php selected( $q_type, 'evaluation' ); ?>><?php esc_html_e( 'Évaluation (evaluation)', 'roi' ); ?></option>
										</select>
									</div>

									<div class="roi-form-flex-col">
										<label><?php esc_html_e( 'Réponse attendue :', 'roi' ); ?></label>
										<select class="roi_t10_q_reponse_yesno" style="display: <?php echo 'yesno' === $q_type ? 'inline-block' : 'none'; ?>;">
											<option value="oui" <?php selected( $q_reponse, 'oui' ); ?>><?php esc_html_e( 'Oui', 'roi' ); ?></option>
											<option value="non" <?php selected( $q_reponse, 'non' ); ?>><?php esc_html_e( 'Non', 'roi' ); ?></option>
										</select>
										<select class="roi_t10_q_reponse_evaluation" style="display: <?php echo 'evaluation' === $q_type ? 'inline-block' : 'none'; ?>;">
											<option value="bonne" <?php selected( $q_reponse, 'bonne' ); ?>><?php esc_html_e( 'Bonne', 'roi' ); ?></option>
											<option value="neutre" <?php selected( $q_reponse, 'neutre' ); ?>><?php esc_html_e( 'Neutre', 'roi' ); ?></option>
											<option value="mauvaise" <?php selected( $q_reponse, 'mauvaise' ); ?>><?php esc_html_e( 'Mauvaise', 'roi' ); ?></option>
										</select>
									</div>
								</div>

								<div class="roi-form-row">
									<label><?php esc_html_e( 'Explication :', 'roi' ); ?></label>
									<input type="text" class="roi_t10_q_explication" value="<?php echo esc_attr( $q_explication ); ?>" placeholder="<?php esc_attr_e( 'Ex: Le centre va s\'ouvrir dangereusement.', 'roi' ); ?>">
								</div>
							</div>
						</div>
					<?php endforeach; ?>
				</div>

				<button type="button" id="roi_t10_add_question" class="button"><?php esc_html_e( 'Ajouter une question', 'roi' ); ?></button>
			</div>

			<hr>

			<!-- L'Action & Explication (Fin de l'exercice) -->
			<div class="roi-form-row">
				<div class="roi-form-row">
					<h4><?php esc_html_e( 'Séquence à jouer', 'roi' ); ?></h4>
					<input type="text" id="roi_t10_solution_moves" value="<?php echo esc_attr( $solution_moves ); ?>" placeholder="<?php esc_attr_e( 'Coups SAN séparés par des virgules (ex: Nxe5, Nxe5, d4)', 'roi' ); ?>">
				</div>

				<div class="roi-form-row">
					<?php
					PgnInput::render(
						array(
							'id'          => 'roi_t10_pgn_explication',
							'value'       => $pgn_explication,
							'button_id'   => 'btn_open_pgn_editor_t10_explication',
							'label'       => __( 'Explication Finale (PGN)', 'roi' ),
							'rows'        => 5,
							'placeholder' => __( 'Ex: 1. Nxe5 {Une attaque centrale forte} Nxe5 2. d4 {Récupération de la pièce}', 'roi' ),
						)
					);
					?>
				</div>
			</div>
		</div>

		<?php
	}
}
