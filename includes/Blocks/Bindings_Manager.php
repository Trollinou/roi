<?php
/**
 * Gutenberg Block Bindings Manager.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Blocks;

use ROI\Enums\Exercice_Type;

/**
 * Class Bindings_Manager
 * Registers and handles custom Block Bindings sources for WordPress 6.5+ / 7.x.
 */
class Bindings_Manager {

	/**
	 * Whitelist of allowed meta keys for roi/post-meta binding source.
	 *
	 * @var array<string, string>
	 */
	private const ALLOWED_META_MAP = array(
		'fen'              => '_roi_fen',
		'pgn'              => '_roi_pgn',
		'orientation'      => '_roi_orientation',
		'difficulty_level' => '_roi_difficulty_level',
		'game_duration'    => '_roi_game_duration',
		'game_date'        => '_roi_game_date',
		'video_url'        => '_roi_video_url',
		'video_duree'      => '_roi_video_duree',
		'cours_niveau'     => '_roi_cours_niveau',
		'exercice_niveau'  => '_roi_exercice_niveau',
		'exercice_type'    => '_roi_exercice_type',
		'exercice_variante'=> '_roi_exercice_variante',
	);

	/**
	 * Initialize Block Bindings sources.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register_sources' ) );
	}

	/**
	 * Register custom block bindings sources.
	 *
	 * @return void
	 */
	public function register_sources(): void {
		if ( ! function_exists( 'register_block_bindings_source' ) ) {
			return;
		}

		// 1. Source pour métadonnées ROI générales.
		register_block_bindings_source(
			'roi/post-meta',
			array(
				'label'              => _x( 'Métadonnées Échecs ROI', 'Block Bindings Source Label', 'roi' ),
				'get_value_callback' => array( $this, 'get_post_meta_value' ),
				'uses_context'       => array( 'postId', 'postType' ),
			)
		);

		// 2. Source pour extraction avancée depuis la configuration d'un exercice (_roi_exercice_config).
		register_block_bindings_source(
			'roi/exercice-config',
			array(
				'label'              => _x( 'Configuration Exercice ROI', 'Block Bindings Source Label', 'roi' ),
				'get_value_callback' => array( $this, 'get_exercice_config_value' ),
				'uses_context'       => array( 'postId', 'postType' ),
			)
		);
	}

	/**
	 * Resolves value for the 'roi/post-meta' block binding source.
	 *
	 * @param array<string, mixed> $source_args    Arguments passed to the binding source.
	 * @param \WP_Block            $block_instance The block instance being rendered.
	 * @param string               $attribute_name Name of the target block attribute.
	 * @return mixed Resolved value or null.
	 */
	public function get_post_meta_value( array $source_args, \WP_Block $block_instance, string $attribute_name ): mixed {
		$post_id = $this->resolve_post_id( $block_instance );
		if ( 0 === $post_id ) {
			return null;
		}

		$raw_key = isset( $source_args['key'] ) ? (string) $source_args['key'] : $attribute_name;
		$meta_key = self::ALLOWED_META_MAP[ $raw_key ] ?? ( str_starts_with( $raw_key, '_roi_' ) ? $raw_key : null );

		if ( null === $meta_key || ! in_array( $meta_key, self::ALLOWED_META_MAP, true ) ) {
			return null;
		}

		$value = get_post_meta( $post_id, $meta_key, true );
		if ( '' === $value || false === $value ) {
			return null;
		}

		return $value;
	}

	/**
	 * Resolves value for the 'roi/exercice-config' block binding source.
	 *
	 * @param array<string, mixed> $source_args    Arguments passed to the binding source.
	 * @param \WP_Block            $block_instance The block instance being rendered.
	 * @param string               $attribute_name Name of the target block attribute.
	 * @return mixed Resolved value or null.
	 */
	public function get_exercice_config_value( array $source_args, \WP_Block $block_instance, string $attribute_name ): mixed {
		$post_id = $this->resolve_post_id( $block_instance );
		if ( 0 === $post_id ) {
			return null;
		}

		$target_key = isset( $source_args['key'] ) ? (string) $source_args['key'] : $attribute_name;

		// Résolution de label de type
		if ( 'type_name' === $target_key || 'type_label' === $target_key ) {
			$type_val = (int) get_post_meta( $post_id, '_roi_exercice_type', true );
			$type_enum = Exercice_Type::tryFrom( $type_val );
			return $type_enum ? $type_enum->get_label() : '';
		}

		$config_raw = get_post_meta( $post_id, '_roi_exercice_config', true );
		if ( ! is_string( $config_raw ) || '' === trim( $config_raw ) ) {
			return null;
		}

		$config = json_decode( $config_raw, true );
		if ( ! is_array( $config ) ) {
			return null;
		}

		if ( ! array_key_exists( $target_key, $config ) ) {
			// Fallback standard pour FEN si absent
			if ( 'fen' === $target_key ) {
				return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
			}
			return null;
		}

		$value = $config[ $target_key ];
		if ( is_array( $value ) ) {
			return wp_json_encode( $value );
		}

		return $value;
	}

	/**
	 * Resolves the Post ID from block context or current global query.
	 *
	 * @param \WP_Block $block_instance Block instance.
	 * @return int Post ID or 0 if not found.
	 */
	private function resolve_post_id( \WP_Block $block_instance ): int {
		if ( isset( $block_instance->context['postId'] ) ) {
			return (int) $block_instance->context['postId'];
		}

		$current_id = get_the_ID();
		return false !== $current_id ? (int) $current_id : 0;
	}
}
