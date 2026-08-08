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
	case POP_ECHECS          = 2;
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
			self::COMMANDEMENTS_100  => "1 - 100 Commandements",
			self::POP_ECHECS          => "2 - Pop'Echecs",
			self::ABCDAIRE_TACTIQUE  => "3 - ABCDaire Tactique",
			self::PARTIE_HEROS       => "4 - La Partie dont tu es le Héros",
			self::POSI_PLAN          => "5 - Posi'Plan",
			self::ASSOCI_PLAN        => "6 - Associ'Plan",
			self::MARCHE_HEROS       => "7 - Marche du Héros",
			self::VISION_CHECS       => "8 - Vision'checs",
			self::PARCOURS           => "9 - Parcours",
			self::ECHEC_EVAL         => "10 - Echec'éval",
			self::CLASS_ECHECS       => "11 - Class'échecs",
			self::QUI_SUIS_JE        => "12 - Qui-suis-je ?",
			self::OUVRE_BOITE        => "13 - Ouvre'boite",
			self::CAP_OU_PAS_CAP     => "14 - Cap ou pas cap ?",
			self::JUGEMENT_FINAL     => "15 - Jugement final",
			self::DESTINATION_FINALE => "16 - Destination finale",
		};
	}
}
