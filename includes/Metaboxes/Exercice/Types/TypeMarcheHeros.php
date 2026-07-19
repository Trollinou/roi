<?php
/**
 * Class TypeMarcheHeros
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypeMarcheHeros
 * Gère le rendu pour le Type 7 : Marche du Héros.
 */
class TypeMarcheHeros implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$current_mode = $config_data['mode'] ?? '3x5';
		?>
		<div id="roi_builder_type_7" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Marche du Héros (Type 7)", "roi" ); ?></h4>
			
			<div style="margin-bottom: 15px;">
				<label for="roi_t7_mode"><strong><?php esc_html_e( "Mode de configuration :", "roi" ); ?></strong></label><br>
				<select id="roi_t7_mode" style="margin-top: 5px;">
					<option value="3x5" <?php selected( $current_mode, '3x5' ); ?>><?php esc_html_e( "3 séries de 5 diagrammes", "roi" ); ?></option>
					<option value="5x3" <?php selected( $current_mode, '5x3' ); ?>><?php esc_html_e( "5 séries de 3 diagrammes", "roi" ); ?></option>
				</select>
			</div>

			<div id="roi_t7_series_container"></div>
		</div>
		<?php
	}
}
