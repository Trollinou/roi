<?php
/**
 * Exercice Config Data Transfer Object.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\DTO;

use ROI\Enums\Exercice_Niveau;
use ROI\Enums\Exercice_Type;

/**
 * Readonly Class Exercice_Config_DTO
 * Data transfer object for exercise metadata.
 */
readonly class Exercice_Config_DTO {

	/**
	 * Constructor property promotion.
	 *
	 * @param int                       $id       Post ID of the exercise.
	 * @param string                    $title    Title of the exercise.
	 * @param Exercice_Type             $type     Exercise type.
	 * @param Exercice_Niveau           $niveau   Difficulty level.
	 * @param array<string, mixed>|null $config   Config array decoded from JSON.
	 * @param string|null               $variante Normalized variant slug or null.
	 */
	public function __construct(
		public int $id,
		public string $title,
		public Exercice_Type $type,
		public Exercice_Niveau $niveau,
		public ?array $config = null,
		public ?string $variante = null,
	) {}

	/**
	 * Returns the human-readable variant label.
	 *
	 * @return string
	 */
	public function get_variante_label(): string {
		return $this->type->extract_variante_label( $this->config );
	}

	/**
	 * Parses raw exercise config (array, serialized string, double-encoded JSON, or slashed JSON) into a normalized associative array.
	 *
	 * @param mixed $config_meta Raw metadata value.
	 * @return array<string, mixed>|null Decoded config array or null if invalid/empty.
	 */
	public static function parse_raw_config( mixed $config_meta ): ?array {
		if ( is_array( $config_meta ) ) {
			return $config_meta;
		}

		if ( is_object( $config_meta ) ) {
			return (array) $config_meta;
		}

		if ( ! is_string( $config_meta ) || '' === trim( $config_meta ) ) {
			return null;
		}

		$unserialized = maybe_unserialize( $config_meta );
		if ( is_array( $unserialized ) ) {
			return $unserialized;
		}
		if ( is_object( $unserialized ) ) {
			return (array) $unserialized;
		}

		$decoded = self::decode_nested_json( $config_meta );
		if ( is_array( $decoded ) ) {
			return $decoded;
		}

		$decoded_unslashed = self::decode_nested_json( wp_unslash( $config_meta ) );
		if ( is_array( $decoded_unslashed ) ) {
			return $decoded_unslashed;
		}

		return null;
	}

	/**
	 * Helper to recursively decode JSON strings that may be double-encoded.
	 *
	 * @param string $raw Raw JSON string.
	 * @return array<string, mixed>|null
	 */
	private static function decode_nested_json( string $raw ): ?array {
		$decoded = json_decode( $raw, true );
		while ( is_string( $decoded ) ) {
			$sub = json_decode( $decoded, true );
			if ( JSON_ERROR_NONE === json_last_error() ) {
				$decoded = $sub;
			} else {
				break;
			}
		}

		return is_array( $decoded ) ? $decoded : null;
	}

	/**
	 * Creates a DTO instance from a WP_Post object and raw post meta.
	 *
	 * @param \WP_Post $post The post object.
	 * @return self
	 */
	public static function from_post( \WP_Post $post ): self {
		$type_meta   = (int) get_post_meta( $post->ID, '_roi_exercice_type', true );
		$niveau_meta = (int) get_post_meta( $post->ID, '_roi_exercice_niveau', true );
		$config_meta = get_post_meta( $post->ID, '_roi_exercice_config', true );

		$type   = Exercice_Type::tryFrom( $type_meta ) ?? Exercice_Type::COMMANDEMENTS_100;
		$niveau = Exercice_Niveau::tryFrom( $niveau_meta ) ?? Exercice_Niveau::LEVEL_1;
		$config = self::parse_raw_config( $config_meta );

		$variante_meta = (string) get_post_meta( $post->ID, '_roi_exercice_variante', true );
		$variante      = '' !== $variante_meta ? $variante_meta : null;
		if ( null === $variante && $type->has_variantes() && is_array( $config ) ) {
			$raw_var  = $config['variante'] ?? ( $config['type_reponse'] ?? null );
			$variante = is_string( $raw_var ) ? $type->normalize_variante_slug( $raw_var ) : null;
		}

		return new self(
			id: $post->ID,
			title: $post->post_title,
			type: $type,
			niveau: $niveau,
			config: $config,
			variante: $variante
		);
	}
}
