<?php
/**
 * Class TypeJugementFinal
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\PgnInput;

/**
 * Class TypeJugementFinal
 * Handles rendering for Type 15: Jugement final.
 */
class TypeJugementFinal implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$consigne        = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : '';
		$fen_depart      = isset( $config_data['fen_depart'] ) && is_string( $config_data['fen_depart'] ) ? $config_data['fen_depart'] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		$couleur_joueur  = isset( $config_data['couleur_joueur'] ) && is_string( $config_data['couleur_joueur'] ) ? $config_data['couleur_joueur'] : 'white';
		$scenarios       = isset( $config_data['scenarios'] ) && is_array( $config_data['scenarios'] ) ? $config_data['scenarios'] : array();
		$pgn_explication = isset( $config_data['pgn_explication'] ) && is_string( $config_data['pgn_explication'] ) ? $config_data['pgn_explication'] : '';

		$correct_index = 0;
		foreach ( $scenarios as $idx => $sc ) {
			if ( is_array( $sc ) && ! empty( $sc['is_correct'] ) ) {
				$correct_index = (int) $idx;
				break;
			}
		}
		?>
		<div id="roi_builder_type_15" class="roi-builder-section" style="display:none;">
			<h4 class="roi-builder-section-title"><?php esc_html_e( "Constructeur d'exercice (Jugement final)", 'roi' ); ?></h4>
			<p class="roi-builder-description">
				<strong><?php esc_html_e( 'Principe :', 'roi' ); ?></strong>
				<?php esc_html_e( 'Collez les 3 PGN commentés (commençant par la même balise [FEN "..."]) et cochez la bonne réponse. La FEN de départ, l’orientation et le PGN résultat (explication finale avec commentaires et shapes) sont déduits automatiquement.', 'roi' ); ?>
			</p>

			<div class="roi-form-row">
				<label for="roi_t15_consigne"><?php esc_html_e( 'Consigne :', 'roi' ); ?></label>
				<input type="text" id="roi_t15_consigne" class="large-text" value="<?php echo esc_attr( $consigne ); ?>" placeholder="<?php esc_attr_e( 'Observez ces 3 plans. Lequel est le plus prometteur ?', 'roi' ); ?>">
			</div>

			<div class="roi-t15-scenarios-block">
				<label class="roi-t15-section-label"><strong><?php esc_html_e( 'Les 3 Scénarios (PGN commentés) :', 'roi' ); ?></strong></label>
				<div id="roi_t15_scenarios_container" class="roi-t15-scenarios-container">
					<?php
					for ( $i = 0; $i < 3; $i++ ) :
						$sc_pgn     = isset( $scenarios[ $i ]['pgn'] ) && is_string( $scenarios[ $i ]['pgn'] ) ? $scenarios[ $i ]['pgn'] : '';
						$is_correct = ( $correct_index === $i );
						$card_class = 'roi-t15-scenario-card' . ( $is_correct ? ' is-correct' : '' );
						?>
						<div class="<?php echo esc_attr( $card_class ); ?>" data-index="<?php echo (int) $i; ?>">
							<div class="roi-t15-scenario-header">
								<h4 class="roi-t15-scenario-title">
									<?php
									/* translators: %d: scenario number (1 to 3) */
									echo esc_html( sprintf( __( 'Scénario %d', 'roi' ), $i + 1 ) );
									?>
								</h4>
								<label class="roi-t15-correct-label">
									<input type="radio" name="roi_t15_correct" value="<?php echo (int) $i; ?>" <?php checked( $correct_index, $i ); ?>>
									<span><?php esc_html_e( 'Bonne réponse', 'roi' ); ?></span>
								</label>
							</div>
							<div class="roi-t15-scenario-pgn-wrap">
								<?php
								PgnInput::render(
									array(
										'id'              => 'roi_t15_scenario_pgn_' . $i,
										'value'           => $sc_pgn,
										'button_id'       => 'btn_open_pgn_editor_t15_scenario_' . $i,
										'input_class'     => 'roi_t15_scenario_pgn',
										'button_class'    => 'button btn_open_pgn_editor_t15_scenario',
										'label'           => '',
										'rows'            => 4,
										'placeholder'     => __( 'Coller le PGN commenté (avec [FEN "..."])...', 'roi' ),
										'data_attributes' => array( 'index' => $i ),
									)
								);
								?>
							</div>
						</div>
					<?php endfor; ?>
				</div>
			</div>

			<div class="roi-t15-deduced-summary">
				<h4 class="roi-builder-section-title"><?php esc_html_e( 'Données déduites automatiquement', 'roi' ); ?></h4>
				<div class="roi-t15-deduced-grid">
					<div class="roi-t15-deduced-item roi-t15-deduced-fen">
						<span class="roi-t15-deduced-label"><?php esc_html_e( 'Position de départ (FEN) :', 'roi' ); ?></span>
						<div class="roi-t15-deduced-fen-row">
							<code id="roi_t15_deduced_fen_display" class="roi-t15-fen-code"><?php echo esc_html( $fen_depart ); ?></code>
							<span id="roi_t15_fen_consistency_badge" class="roi-t15-badge"></span>
						</div>
					</div>
					<div class="roi-t15-deduced-item roi-t15-deduced-orientation">
						<label for="roi_t15_couleur" class="roi-t15-deduced-label"><?php esc_html_e( 'Orientation :', 'roi' ); ?></label>
						<select id="roi_t15_couleur" class="roi-t15-orientation-select">
							<option value="white" <?php selected( $couleur_joueur, 'white' ); ?>><?php esc_html_e( 'Blancs', 'roi' ); ?></option>
							<option value="black" <?php selected( $couleur_joueur, 'black' ); ?>><?php esc_html_e( 'Noirs', 'roi' ); ?></option>
						</select>
					</div>
				</div>
				<div class="roi-t15-deduced-item roi-t15-deduced-explication">
					<span class="roi-t15-deduced-label"><?php esc_html_e( 'PGN résultat (Explication finale) :', 'roi' ); ?></span>
					<span id="roi_t15_deduced_explication_status" class="roi-t15-explication-status">
						<?php
						if ( ! empty( $pgn_explication ) ) {
							/* translators: %d: scenario number (1 to 3) */
							echo esc_html( sprintf( __( 'Repris automatiquement depuis le Scénario %d.', 'roi' ), $correct_index + 1 ) );
						} else {
							esc_html_e( 'En attente du PGN de la bonne réponse...', 'roi' );
						}
						?>
					</span>
				</div>
			</div>
		</div>
		<?php
	}
}
