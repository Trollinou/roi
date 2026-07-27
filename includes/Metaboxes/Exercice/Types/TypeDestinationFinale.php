<?php
/**
 * Class TypeDestinationFinale
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypeDestinationFinale
 * Handles rendering for Type 16: Destination finale.
 */
class TypeDestinationFinale implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$consigne        = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : "Remettez les étapes de ce plan d'attaque dans le bon ordre :";
		$fen_depart      = isset( $config_data['fen_depart'] ) && is_string( $config_data['fen_depart'] ) ? $config_data['fen_depart'] : 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5';
		$couleur_joueur  = isset( $config_data['couleur_joueur'] ) && is_string( $config_data['couleur_joueur'] ) ? $config_data['couleur_joueur'] : 'white';
		$etapes_texte    = isset( $config_data['etapes_texte'] ) && is_array( $config_data['etapes_texte'] ) ? $config_data['etapes_texte'] : [];
		$pgn_explication = isset( $config_data['pgn_explication'] ) && is_string( $config_data['pgn_explication'] ) ? $config_data['pgn_explication'] : '';
		?>
		<div id="roi_builder_type_16" class="roi-builder-section" style="display:none; margin-top:15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Destination finale)", 'roi' ); ?></h4>

			<div style="margin-bottom: 15px;">
				<label for="roi_t16_consigne"><strong><?php esc_html_e( 'Consigne :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t16_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width:100%; height: 30px;" placeholder="<?php esc_attr_e( "Remettez les étapes de ce plan d'attaque dans le bon ordre :", 'roi' ); ?>">
			</div>

			<div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-end;">
				<div style="flex: 1;">
					<label for="roi_t16_fen_depart"><strong><?php esc_html_e( 'Position de départ (FEN) :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t16_fen_depart" value="<?php echo esc_attr( $fen_depart ); ?>" readonly style="width: 100%; height: 30px;">
				</div>
				<div>
					<button type="button" id="btn_open_fen_editor_t16" class="button"><?php esc_html_e( 'Éditer la position', 'roi' ); ?></button>
				</div>
				<div>
					<label for="roi_t16_couleur"><strong><?php esc_html_e( 'Couleur :', 'roi' ); ?></strong></label><br>
					<select id="roi_t16_couleur" style="width: 120px; height: 30px;">
						<option value="white" <?php selected( $couleur_joueur, 'white' ); ?>><?php esc_html_e( 'Blancs', 'roi' ); ?></option>
						<option value="black" <?php selected( $couleur_joueur, 'black' ); ?>><?php esc_html_e( 'Noirs', 'roi' ); ?></option>
					</select>
				</div>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

			<div style="margin-bottom: 15px;">
				<label><strong><?php esc_html_e( 'Les Étapes Textuelles (Ordre correct) :', 'roi' ); ?></strong></label>
				<p class="description" style="margin-top: 4px; margin-bottom: 10px; color: #646970;">
					<?php esc_html_e( 'Saisissez les étapes dans l\'ordre chronologique correct (1, 2, 3...). L\'application se chargera de les mélanger.', 'roi' ); ?>
				</p>
				<div id="roi_t16_etapes_container" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;">
					<?php
					if ( ! empty( $etapes_texte ) ) :
						foreach ( $etapes_texte as $idx => $etape ) :
							$etape_val = is_string( $etape ) ? $etape : '';
							?>
							<div class="roi-t16-etape-item" style="display: flex; gap: 10px; align-items: center;">
								<span class="roi-t16-etape-num" style="font-weight: 600; min-width: 24px;"><?php echo ( (int) $idx + 1 ) . '.'; ?></span>
								<input type="text" class="roi_t16_etape_input" value="<?php echo esc_attr( $etape_val ); ?>" style="flex: 1; height: 30px;" placeholder="<?php esc_attr_e( 'Saisir le texte de l\'étape...', 'roi' ); ?>">
								<button type="button" class="button roi_t16_remove_etape" style="color: #b32d2e; border-color: #b32d2e; font-weight: bold;">&times;</button>
							</div>
						<?php
						endforeach;
					endif;
					?>
				</div>
				<button type="button" id="roi_t16_add_etape" class="button"><?php esc_html_e( 'Ajouter une étape textuelle', 'roi' ); ?></button>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0 15px;">

			<div style="margin-top: 15px;">
				<h3 style="margin-top: 0; font-size: 14px; font-weight: 600; margin-bottom: 8px;"><?php esc_html_e( 'Solution & Explications', 'roi' ); ?></h3>
				<textarea id="roi_t16_pgn_explication" rows="6" placeholder="<?php esc_attr_e( 'Saisir le PGN de la solution...', 'roi' ); ?>" style="width: 100%;"><?php echo esc_textarea( $pgn_explication ); ?></textarea>
			</div>
		</div>
		<?php
	}
}
