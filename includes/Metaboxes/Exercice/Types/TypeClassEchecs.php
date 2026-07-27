<?php
/**
 * Class TypeClassEchecs
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypeClassEchecs
 * Gère l'affichage du type 11 : Class'échecs.
 */
class TypeClassEchecs implements TypeInterface {

	/**
	 * Affiche le HTML spécifique à ce type d'exercice.
	 *
	 * @param \WP_Post             $post        L'objet post actuel.
	 * @param array<string, mixed> $config_data Les données de configuration JSON décodées.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$consigne  = $config_data['consigne'] ?? "Classez ces positions de la plus forte (1) à la moins forte (5).";
		$positions = isset( $config_data['positions'] ) && is_array( $config_data['positions'] ) ? $config_data['positions'] : [];
		?>
		<div id="roi_builder_type_11" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Class'échecs)", "roi" ); ?></h4>

			<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
				<!-- Consigne -->
				<div>
					<label for="roi_t11_consigne"><strong><?php esc_html_e( "Consigne :", "roi" ); ?></strong></label><br>
					<input type="text" id="roi_t11_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width: 100%; height: 30px;">
				</div>

				<!-- Liste des 5 positions -->
				<div style="display: flex; flex-direction: column; gap: 15px;">
					<?php for ( $i = 0; $i < 5; $i++ ) :
						$pos_fen     = $positions[ $i ]['fen'] ?? '';
						$pos_couleur = $positions[ $i ]['couleur_joueur'] ?? 'white';
						$suffix      = ( 0 === $i ) ? ' (La plus forte)' : ( ( 4 === $i ) ? ' (La moins forte)' : '' );
					?>
						<div style="border: 1px solid #e5e5e5; padding: 12px; border-radius: 4px; background: #f9f9f9;">
							<h4 style="margin: 0 0 10px 0;">
								<?php echo esc_html( 'Position ' . ( $i + 1 ) . $suffix ); ?>
							</h4>
							<div style="display: flex; gap: 15px; align-items: flex-end;">
								<div style="flex: 1;">
									<label><strong><?php esc_html_e( "FEN :", "roi" ); ?></strong></label><br>
									<input type="text" class="roi_t11_fen" data-index="<?php echo $i; ?>" value="<?php echo esc_attr( $pos_fen ); ?>" readonly style="width: 100%; height: 30px; background: #f0f0f1; color: #50575e;">
								</div>
								<div>
									<label><strong><?php esc_html_e( "Couleur du joueur :", "roi" ); ?></strong></label><br>
									<select class="roi_t11_couleur" data-index="<?php echo $i; ?>" style="width: 120px; height: 30px;">
										<option value="white" <?php selected( $pos_couleur, 'white' ); ?>><?php esc_html_e( "Blancs", "roi" ); ?></option>
										<option value="black" <?php selected( $pos_couleur, 'black' ); ?>><?php esc_html_e( "Noirs", "roi" ); ?></option>
									</select>
								</div>
								<div>
									<button type="button" class="button btn_open_fen_editor_t11" data-index="<?php echo $i; ?>">
										<?php esc_html_e( "Éditer la position", "roi" ); ?>
									</button>
								</div>
							</div>
						</div>
					<?php endfor; ?>
				</div>
			</div>
		</div>
		<?php
	}
}
