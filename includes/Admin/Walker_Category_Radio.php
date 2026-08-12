<?php
/**
 * Custom Walker to render taxonomy terms as radio buttons.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin;

/**
 * Class Walker_Category_Radio
 * Overrides the checkbox inputs with radio buttons for single selection taxonomies.
 */
class Walker_Category_Radio extends \Walker_Category_Checklist {

	/**
	 * Start the element output.
	 *
	 * @param string               $output Used to append additional content (passed by reference).
	 * @param \WP_Term             $category The current term object.
	 * @param int                  $depth Depth of category. Used for tab indentation.
	 * @param array<string, mixed> $args An array of arguments.
	 * @param int                  $id Current category ID.
	 * @return void
	 */
	public function start_el( &$output, $category, $depth = 0, $args = array(), $id = 0 ): void {
		$temp_output = '';
		parent::start_el( $temp_output, $category, $depth, $args, $id );

		// Convert checkboxes to radio buttons
		$temp_output = str_replace( 'type="checkbox"', 'type="radio"', $temp_output );

		// Remove brackets from input name to make it a standard radio group if needed,
		// but keeping it as tax_input[roi_chapitre][] is safe and still groups them as long as the name is identical.
		// Let's replace the name to make it a single-value submission if WordPress supports it,
		// but tax_input[roi_chapitre][] is actually perfectly handled by WP save post.
		// Let's replace tax_input[roi_chapitre][] with tax_input[roi_chapitre] to ensure the browser groups them properly.
		// Actually, browser groups by the exact string of the name attribute, so tax_input[roi_chapitre][] already groups them.

		$output .= $temp_output;
	}
}
