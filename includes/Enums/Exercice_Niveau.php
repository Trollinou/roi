<?php
/**
 * Exercice Niveau Backed Enum.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Enums;

/**
 * Enum Exercice_Niveau
 * Defines valid difficulty levels (1 to 4).
 */
enum Exercice_Niveau: int {
	case LEVEL_1 = 1;
	case LEVEL_2 = 2;
	case LEVEL_3 = 3;
	case LEVEL_4 = 4;
}
