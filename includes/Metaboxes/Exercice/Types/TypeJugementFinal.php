<?php
/**
 * Class TypeJugementFinal
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;
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
		$scenarios       = isset( $config_data['scenarios'] ) && is_array( $config_data['scenarios'] ) ? $config_data['scenarios'] : [];
		$pgn_explication = isset( $config_data['pgn_explication'] ) && is_string( $config_data['pgn_explication'] ) ? $config_data['pgn_explication'] : '';

		$correct_index = 0;
		foreach ( $scenarios as $idx => $sc ) {
			if ( is_array( $sc ) && ! empty( $sc['is_correct'] ) ) {
				$correct_index = (int) $idx;
				break;
			}
		}
		?>
		<div id="roi_builder_type_15" class="roi-builder-section" style="display:none; margin-top:15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Jugement final)", 'roi' ); ?></h4>

			<div style="margin-bottom: 15px;">
				<label for="roi_t15_consigne"><strong><?php esc_html_e( 'Consigne :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t15_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width:100%; height: 30px;" placeholder="<?php esc_attr_e( 'Observez ces 3 plans. Lequel est le plus prometteur ?', 'roi' ); ?>">
			</div>

			<?php
			FenInput::render([
				'id'             => 'roi_t15_fen_depart',
				'value'          => $fen_depart,
				'color'          => $couleur_joueur,
				'orientation_id' => 'roi_t15_couleur',
				'button_id'      => 'btn_open_fen_editor_t15',
				'label'          => __( 'Position de départ (FEN) :', 'roi' ),
			]);
			?>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

			<div style="margin-top: 15px;">
				<label><strong><?php esc_html_e( 'Les 3 Scénarios :', 'roi' ); ?></strong></label>
				<div id="roi_t15_scenarios_container" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
					<?php
					for ( $i = 0; $i < 3; $i++ ) :
						$sc_pgn = isset( $scenarios[ $i ]['pgn'] ) && is_string( $scenarios[ $i ]['pgn'] ) ? $scenarios[ $i ]['pgn'] : '';
						?>
						<div class="t15-scenario-card" style="padding: 12px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;">
							<h4 style="margin-top: 0; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #1d2327;">
								<?php echo esc_html( 'Scénario ' . ( $i + 1 ) ); ?>
							</h4>
							<div style="margin-bottom: 8px;">
								<?php
								PgnInput::render([
									'id'              => 'roi_t15_scenario_pgn_' . $i,
									'value'           => $sc_pgn,
									'button_id'       => 'btn_open_pgn_editor_t15_scenario_' . $i,
									'input_class'     => 'roi_t15_scenario_pgn',
									'button_class'    => 'button btn_open_pgn_editor_t15_scenario',
									'label'           => '',
									'rows'            => 3,
									'placeholder'     => __( 'Saisir le PGN brut sans commentaires...', 'roi' ),
									'data_attributes' => [ 'index' => $i ],
								]);
								?>
							</div>
							<div>
								<label style="font-weight: 600; font-size: 13px;">
									<input type="radio" name="roi_t15_correct" value="<?php echo $i; ?>" <?php checked( $correct_index, $i ); ?>>
									<?php esc_html_e( 'Bonne réponse', 'roi' ); ?>
								</label>
							</div>
						</div>
					<?php endfor; ?>
				</div>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0 15px;">

			<div style="margin-top: 15px;">
				<?php
				PgnInput::render([
					'id'          => 'roi_t15_pgn_explication',
					'value'       => $pgn_explication,
					'button_id'   => 'btn_open_pgn_editor_t15_explication',
					'label'       => __( 'Explication Finale (PGN)', 'roi' ),
					'rows'        => 6,
					'placeholder' => __( 'Saisir le PGN complet et commenté de la solution...', 'roi' ),
				]);
				?>
			</div>
		</div>
		<?php
	}
}
