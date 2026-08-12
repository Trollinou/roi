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
	 * @param int                       $id           Post ID of the exercise.
	 * @param string                    $title        Title of the exercise.
	 * @param Exercice_Type             $type         Exercise type.
	 * @param Exercice_Niveau           $niveau       Difficulty level.
	 * @param array<string, mixed>|null $config Config array decoded from JSON.
	 */
	public function __construct(
		public int $id,
		public string $title,
		public Exercice_Type $type,
		public Exercice_Niveau $niveau,
		public ?array $config = null,
	) {}

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

		$type   = Exercice_Type::from( $type_meta > 0 ? $type_meta : 1 );
		$niveau = Exercice_Niveau::from( $niveau_meta > 0 ? $niveau_meta : 1 );

		$config = null;
		if ( is_string( $config_meta ) && '' !== $config_meta ) {
			$decoded = json_decode( $config_meta, true );
			if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
				$config = $decoded;
			}
		}

		return new self(
			id: $post->ID,
			title: $post->post_title,
			type: $type,
			niveau: $niveau,
			config: $config
		);
	}
}
