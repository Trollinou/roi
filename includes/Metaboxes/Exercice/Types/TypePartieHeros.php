<?php
/**
 * Class TypePartieHeros
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypePartieHeros
 * Handles rendering for Type 4: La Partie dont tu es le Héros.
 */
class TypePartieHeros implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		?>
		<div id="roi_builder_type_4" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur de Scénario (La Partie dont tu es le Héros)", "roi" ); ?></h4>
			<p class="description"><?php esc_html_e( "Créez un scénario interactif en ajoutant des séquences de jeu PGN et des questions à choix multiples (QCM).", "roi" ); ?></p>
			
			<div id="roi_t4_etapes_container" style="margin-top: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 15px;"></div>
			
			<div style="display: flex; gap: 10px;">
				<button type="button" id="roi_t4_add_pgn" class="button button-secondary"><?php esc_html_e( "Ajouter une séquence PGN", "roi" ); ?></button>
				<button type="button" id="roi_t4_add_qcm" class="button button-secondary"><?php esc_html_e( "Ajouter un QCM", "roi" ); ?></button>
			</div>
		</div>
		<?php
	}
}
