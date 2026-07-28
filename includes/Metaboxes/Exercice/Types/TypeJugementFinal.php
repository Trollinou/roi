<?php
/**
 * Class TypeJugementFinal
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

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

			<div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-end;">
				<div style="flex: 1;">
					<label for="roi_t15_fen_depart"><strong><?php esc_html_e( 'Position de départ (FEN) :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t15_fen_depart" value="<?php echo esc_attr( $fen_depart ); ?>" readonly style="width: 100%; height: 30px;">
				</div>
				<div>
					<button type="button" id="btn_open_fen_editor_t15" class="button"><?php esc_html_e( 'Éditer la position', 'roi' ); ?></button>
				</div>
				<div>
					<label for="roi_t15_couleur"><strong><?php esc_html_e( 'Couleur joueur :', 'roi' ); ?></strong></label><br>
					<select id="roi_t15_couleur" style="width: 120px; height: 30px;">
						<option value="white" <?php selected( $couleur_joueur, 'white' ); ?>><?php esc_html_e( 'Blancs', 'roi' ); ?></option>
						<option value="black" <?php selected( $couleur_joueur, 'black' ); ?>><?php esc_html_e( 'Noirs', 'roi' ); ?></option>
					</select>
				</div>
			</div>

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
								<textarea class="roi_t15_scenario_pgn" data-index="<?php echo $i; ?>" rows="3" placeholder="<?php esc_attr_e( 'Saisir le PGN brut sans commentaires...', 'roi' ); ?>" style="width: 100%;"><?php echo esc_textarea( $sc_pgn ); ?></textarea>
								<button type="button" class="button btn_open_pgn_editor_t15_scenario" data-index="<?php echo $i; ?>" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;"><span class="dashicons dashicons-edit" style="font-size: 16px; width: 16px; height: 16px; line-height: 1;"></span> <?php esc_html_e( 'Éditer le PGN', 'roi' ); ?></button>
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
				<h3 style="margin-top: 0; font-size: 14px; font-weight: 600; margin-bottom: 8px;"><?php esc_html_e( 'Explication Finale', 'roi' ); ?></h3>
				<textarea id="roi_t15_pgn_explication" rows="6" placeholder="<?php esc_attr_e( 'Saisir le PGN complet et commenté de la solution...', 'roi' ); ?>" style="width: 100%;"><?php echo esc_textarea( $pgn_explication ); ?></textarea>
				<button type="button" id="btn_open_pgn_editor_t15_explication" class="button" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;"><span class="dashicons dashicons-edit" style="font-size: 16px; width: 16px; height: 16px; line-height: 1;"></span> <?php esc_html_e( 'Éditer le PGN', 'roi' ); ?></button>
			</div>
		</div>
		<?php
	}
}
