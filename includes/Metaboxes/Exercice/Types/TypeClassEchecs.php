<?php
/**
 * Class TypeClassEchecs
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

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
		$consigne  = $config_data['consigne'] ?? 'Classez ces positions de la plus faible (1) à la plus forte (5).';
		$positions = isset( $config_data['positions'] ) && is_array( $config_data['positions'] ) ? $config_data['positions'] : array();
		?>
		<div id="roi_builder_type_11" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Class'échecs)", 'roi' ); ?></h4>

			<div class="notice notice-info inline" style="margin: 0 0 15px 0; padding: 8px 12px;">
				<p style="margin: 0;">
					<strong><?php esc_html_e( 'Astuce :', 'roi' ); ?></strong>
					<?php esc_html_e( 'Vous pouvez coller directement un PGN Lichess complet (avec [FEN "..."], [Orientation "..."] et { commentaire }) dans le champ FEN de chaque position pour remplir automatiquement la position, l\'orientation, les formes et le commentaire explicatif.', 'roi' ); ?>
				</p>
			</div>

			<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
				<!-- Consigne -->
				<div>
					<label for="roi_t11_consigne"><strong><?php esc_html_e( 'Consigne :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t11_consigne" value="<?php echo esc_attr( $consigne ); ?>" style="width: 100%; height: 30px;">
				</div>

				<!-- Liste des 5 positions -->
				<div style="display: flex; flex-direction: column; gap: 15px;">
					<?php
					for ( $i = 0; $i < 5; $i++ ) :
						$pos_fen         = isset( $positions[ $i ]['fen'] ) && is_string( $positions[ $i ]['fen'] ) ? $positions[ $i ]['fen'] : '';
						$pos_couleur     = isset( $positions[ $i ]['couleur_joueur'] ) && is_string( $positions[ $i ]['couleur_joueur'] ) ? $positions[ $i ]['couleur_joueur'] : 'white';
						$pos_shapes      = isset( $positions[ $i ]['shapes'] ) && is_array( $positions[ $i ]['shapes'] ) ? $positions[ $i ]['shapes'] : array();
						$pos_commentaire = isset( $positions[ $i ]['commentaire'] ) && is_string( $positions[ $i ]['commentaire'] ) ? $positions[ $i ]['commentaire'] : '';
						$suffix          = ( 0 === $i ) ? ' (La plus faible)' : ( ( 4 === $i ) ? ' (La plus forte)' : '' );
						?>
						<div style="border: 1px solid #e5e5e5; padding: 12px; border-radius: 4px; background: #f9f9f9;">
							<h4 style="margin: 0 0 10px 0;">
								<?php echo esc_html( 'Position ' . ( $i + 1 ) . $suffix ); ?>
							</h4>
							<?php
							FenInput::render(
								array(
									'id'              => 'roi_t11_fen_' . $i,
									'value'           => $pos_fen,
									'color'           => $pos_couleur,
									'shapes'          => $pos_shapes,
									'orientation_id'  => 'roi_t11_couleur_' . $i,
									'button_id'       => 'btn_open_fen_editor_t11_' . $i,
									'input_class'     => 'roi_t11_fen',
									'color_class'     => 'roi_t11_couleur',
									'button_class'    => 'button btn_open_fen_editor_t11',
									'label'           => __( 'FEN (ou coller un PGN complet) :', 'roi' ),
									'data_attributes' => array( 'index' => $i ),
								)
							);
							?>
							<div style="margin-top: 10px;">
								<label for="roi_t11_commentaire_<?php echo (int) $i; ?>">
									<strong><?php esc_html_e( 'Commentaire explicatif (affiché après validation) :', 'roi' ); ?></strong>
								</label><br>
								<textarea
									id="roi_t11_commentaire_<?php echo (int) $i; ?>"
									class="roi_t11_commentaire large-text"
									data-index="<?php echo (int) $i; ?>"
									rows="2"
									style="width: 100%; margin-top: 4px;"
									placeholder="<?php esc_attr_e( 'Ex : 1 : La Dame en f6 est mal placée, elle est presque enfermée après 1.Cd5...', 'roi' ); ?>"
								><?php echo esc_textarea( $pos_commentaire ); ?></textarea>
							</div>
						</div>
					<?php endfor; ?>
				</div>
			</div>
		</div>
		<?php
	}
}
