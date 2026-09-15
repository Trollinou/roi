<?php
/**
 * Exercice Type Backed Enum.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Enums;

/**
 * Enum Exercice_Type
 * Defines all 16 exercise types with their numerical IDs and human-readable labels.
 */
enum Exercice_Type: int {
	case COMMANDEMENTS_100  = 1;
	case POP_ECHECS         = 2;
	case ABCDAIRE_TACTIQUE  = 3;
	case PARTIE_HEROS       = 4;
	case POSI_PLAN          = 5;
	case ASSOCI_PLAN        = 6;
	case MARCHE_HEROS       = 7;
	case VISION_CHECS       = 8;
	case PARCOURS           = 9;
	case ECHEC_EVAL         = 10;
	case CLASS_ECHECS       = 11;
	case QUI_SUIS_JE        = 12;
	case OUVRE_BOITE        = 13;
	case CAP_OU_PAS_CAP     = 14;
	case JUGEMENT_FINAL     = 15;
	case DESTINATION_FINALE = 16;

	/**
	 * Returns the human readable label for the exercise type.
	 *
	 * @return string
	 */
	public function label(): string {
		return match ( $this ) {
			self::COMMANDEMENTS_100  => '1 - 100 Commandements',
			self::POP_ECHECS          => "2 - Pop'Echecs",
			self::ABCDAIRE_TACTIQUE  => '3 - ABCDaire Tactique',
			self::PARTIE_HEROS       => '4 - La Partie dont tu es le Héros',
			self::POSI_PLAN          => "5 - Posi'Plan",
			self::ASSOCI_PLAN        => "6 - Associ'Plan",
			self::MARCHE_HEROS       => '7 - Marche du Héros',
			self::VISION_CHECS       => "8 - Vision'checs",
			self::PARCOURS           => '9 - Parcours',
			self::ECHEC_EVAL         => "10 - Echec'éval",
			self::CLASS_ECHECS       => "11 - Class'échecs",
			self::QUI_SUIS_JE        => '12 - Qui-suis-je ?',
			self::OUVRE_BOITE        => "13 - Ouvre'boite",
			self::CAP_OU_PAS_CAP     => '14 - Cap ou pas cap ?',
			self::JUGEMENT_FINAL     => '15 - Jugement final',
			self::DESTINATION_FINALE => '16 - Destination finale',
		};
	}

	/**
	 * Determines if this exercise type has global exercise variants.
	 *
	 * @return bool
	 */
	public function has_variantes(): bool {
		return match ( $this ) {
			self::QUI_SUIS_JE, self::CAP_OU_PAS_CAP => true,
			default                                 => false,
		};
	}

	/**
	 * Returns the dictionary of supported variants and their labels for this exercise type.
	 *
	 * @return array<string, string>
	 */
	public function variantes_labels(): array {
		return match ( $this ) {
			self::QUI_SUIS_JE    => array(
				'pieces' => __( 'Pièces', 'roi' ),
				'cases'  => __( 'Cases', 'roi' ),
			),
			self::CAP_OU_PAS_CAP => array(
				'qcm_multiple' => __( 'QCM Multiple', 'roi' ),
				'qcm_oui_non'  => __( 'QCM Oui/Non', 'roi' ),
				'move'         => __( 'Move', 'roi' ),
				'notation'     => __( 'Notation', 'roi' ),
			),
			default              => array(),
		};
	}

	/**
	 * Normalizes legacy variant slugs to standardized slugs.
	 *
	 * @param string|null $slug The raw variant slug.
	 * @return string|null The normalized slug or null if not applicable.
	 */
	public function normalize_variante_slug( ?string $slug ): ?string {
		if ( null === $slug || '' === trim( $slug ) ) {
			return null;
		}

		$slug = trim( $slug );

		if ( self::QUI_SUIS_JE === $this ) {
			if ( 'piece' === $slug ) {
				return 'pieces';
			}
			if ( 'case' === $slug || 'square' === $slug ) {
				return 'cases';
			}
			return $slug;
		}

		if ( self::CAP_OU_PAS_CAP === $this ) {
			if ( 'qcm' === $slug ) {
				return 'qcm_oui_non';
			}
			return $slug;
		}

		return $slug;
	}

	/**
	 * Extracts and resolves the human-readable variant label from a config array.
	 *
	 * @param array<string, mixed>|null $config Decoded JSON configuration data.
	 * @return string The human readable variant label, or empty string if not applicable.
	 */
	public function extract_variante_label( ?array $config ): string {
		if ( ! $this->has_variantes() || null === $config ) {
			return '';
		}

		$raw_slug = null;
		if ( self::QUI_SUIS_JE === $this ) {
			$raw_slug = isset( $config['variante'] ) && is_string( $config['variante'] ) ? $config['variante'] : 'pieces';
		} elseif ( self::CAP_OU_PAS_CAP === $this ) {
			$raw_slug = isset( $config['variante'] ) && is_string( $config['variante'] )
				? $config['variante']
				: ( isset( $config['type_reponse'] ) && is_string( $config['type_reponse'] ) ? $config['type_reponse'] : 'qcm_oui_non' );
		}

		$normalized = $this->normalize_variante_slug( $raw_slug );
		if ( null === $normalized ) {
			return '';
		}

		$labels = $this->variantes_labels();
		return $labels[ $normalized ] ?? $normalized;
	}
}
