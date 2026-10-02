<?php
/**
 * HTML Processor service for safe HTML manipulations with WP_HTML_Tag_Processor.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Services;

use WP_HTML_Tag_Processor;

/**
 * Class Html_Processor
 * Provides utility methods to safely transform HTML markup using WordPress HTML API.
 */
class Html_Processor {

	/**
	 * Injects Interactivity API attributes and directives onto the first HTML element.
	 *
	 * @param string               $html       Original HTML markup.
	 * @param string               $namespace  Interactivity namespace (e.g. 'roi/chessboard').
	 * @param array<string, mixed> $context    Initial context array (encoded as JSON).
	 * @param array<string, string> $directives Additional directives (e.g. ['data-wp-init' => 'callbacks.mount']).
	 * @return string Updated HTML.
	 */
	public function inject_interactivity(
		string $html,
		string $namespace,
		array $context = array(),
		array $directives = array()
	): string {
		if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
			return $html;
		}

		$processor = new WP_HTML_Tag_Processor( $html );

		if ( $processor->next_tag() ) {
			$processor->set_attribute( 'data-wp-interactive', $namespace );

			if ( ! empty( $context ) ) {
				$json_context = wp_json_encode( $context );
				if ( false !== $json_context ) {
					$processor->set_attribute( 'data-wp-context', $json_context );
				}
			}

			foreach ( $directives as $name => $value ) {
				$processor->set_attribute( (string) $name, (string) $value );
			}

			return $processor->get_updated_html();
		}

		return $html;
	}

	/**
	 * Sets attributes on a specific tag in HTML markup.
	 *
	 * @param string               $html       Original HTML markup.
	 * @param string               $tag_name   Target HTML tag (e.g. 'div', 'section').
	 * @param array<string, string> $attributes Key-value map of attributes to set.
	 * @param string|null          $class_name Optional CSS class name to match.
	 * @return string Updated HTML.
	 */
	public function set_tag_attributes(
		string $html,
		string $tag_name,
		array $attributes,
		?string $class_name = null
	): string {
		if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
			return $html;
		}

		$processor = new WP_HTML_Tag_Processor( $html );
		$query     = array( 'tag_name' => $tag_name );

		if ( null !== $class_name ) {
			$query['class_name'] = $class_name;
		}

		if ( $processor->next_tag( $query ) ) {
			foreach ( $attributes as $attr => $value ) {
				$processor->set_attribute( (string) $attr, (string) $value );
			}
			return $processor->get_updated_html();
		}

		return $html;
	}

	/**
	 * Ensures data-* chess attributes are properly formatted and escaped on the root block element.
	 *
	 * @param string               $html       HTML block markup.
	 * @param array<string, mixed> $attributes Attributes to set on the root element.
	 * @return string Updated HTML.
	 */
	public function set_root_data_attributes( string $html, array $attributes ): string {
		if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
			return $html;
		}

		$processor = new WP_HTML_Tag_Processor( $html );

		if ( $processor->next_tag() ) {
			foreach ( $attributes as $key => $value ) {
				$attr_name = str_starts_with( $key, 'data-' ) ? $key : 'data-' . $key;
				if ( is_bool( $value ) ) {
					$processor->set_attribute( $attr_name, $value ? 'true' : 'false' );
				} elseif ( is_scalar( $value ) ) {
					$processor->set_attribute( $attr_name, (string) $value );
				} elseif ( is_array( $value ) ) {
					$json = wp_json_encode( $value );
					if ( false !== $json ) {
						$processor->set_attribute( $attr_name, $json );
					}
				}
			}
			return $processor->get_updated_html();
		}

		return $html;
	}
}
