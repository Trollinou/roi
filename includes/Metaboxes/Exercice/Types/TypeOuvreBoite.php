<?php
/**
 * Class TypeOuvreBoite
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

/**
 * Class TypeOuvreBoite
 * Handles rendering for Type 13: Ouvre'boîte.
 */
class TypeOuvreBoite implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		?>
		<div id="roi_builder_type_13" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Ouvre'boîte)", 'roi' ); ?></h4>
			
			<?php
			FenInput::render(
				array(
					'id'             => 'roi_t13_fen_depart',
					'value'          => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
					'color'          => 'white',
					'orientation_id' => 'roi_t13_couleur',
					'button_id'      => 'btn_open_fen_editor_t13',
					'label'          => __( 'FEN de départ :', 'roi' ),
				)
			);
			?>

			<div style="margin-bottom: 15px;">
				<label for="roi_t13_question"><strong><?php esc_html_e( 'Question :', 'roi' ); ?></strong></label><br>
				<input type="text" id="roi_t13_question" style="width: 100%; height: 30px;" placeholder="<?php esc_attr_e( 'Quel coup choisir pour ouvrir la position ?', 'roi' ); ?>">
			</div>

			<div style="margin-top: 15px;">
				<label><strong><?php esc_html_e( 'Choix de réponses (3 choix) :', 'roi' ); ?></strong></label>
				<div id="roi_t13_choix_container" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
					<?php for ( $i = 0; $i < 3; $i++ ) : ?>
						<div class="t13-choix-card" style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;">
							<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
								<label style="font-weight: 600;">
									<input type="radio" name="roi_t13_correct" value="<?php echo (int) $i; ?>" <?php checked( $i, 0 ); ?>>
									<?php
									/* translators: %d: Choice number */
									echo esc_html( sprintf( __( 'Bonne réponse (Choix %d)', 'roi' ), $i + 1 ) );
									?>
								</label>
							</div>
							<div style="display: flex; gap: 10px; margin-bottom: 8px;">
								<input type="text" class="t13-choix-texte" data-index="<?php echo (int) $i; ?>" placeholder="<?php esc_attr_e( 'Texte du bouton', 'roi' ); ?>" style="flex: 2;">
								<input type="text" class="t13-choix-san" data-index="<?php echo (int) $i; ?>" placeholder="<?php esc_attr_e( 'Coup SAN (ex: e4)', 'roi' ); ?>" style="flex: 1;">
							</div>
							<div>
								<input type="text" class="t13-choix-explication" data-index="<?php echo (int) $i; ?>" placeholder="<?php esc_attr_e( 'Explication si sélectionné', 'roi' ); ?>" style="width: 100%;">
							</div>
						</div>
					<?php endfor; ?>
				</div>
			</div>
		</div>
		<?php
	}
}
