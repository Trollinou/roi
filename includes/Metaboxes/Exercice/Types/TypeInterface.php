<?php
/**
 * Interface TypeInterface for exercise metabox sub-types.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Interface TypeInterface
 * Defines the contract for all exercise metabox type renderers.
 */
interface TypeInterface {

	/**
	 * Renders the specific HTML for this exercise type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void;
}
