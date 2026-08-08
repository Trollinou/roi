<?php
/**
 * Chapitre Couleur Backed Enum.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Enums;

/**
 * Enum Chapitre_Couleur
 * Defines chapter badge colors and their hex code equivalents.
 */
enum Chapitre_Couleur: string {
	case PRIMARY  = 'primary';
	case WARNING  = 'warning';
	case DANGER   = 'danger';
	case SUCCESS  = 'success';
	case TERTIARY = 'tertiary';

	/**
	 * Returns hex code representation for the badge color.
	 *
	 * @return string
	 */
	public function hex(): string {
		return match ( $this ) {
			self::PRIMARY  => '#0073aa',
			self::WARNING  => '#d94f00',
			self::DANGER   => '#d63638',
			self::SUCCESS  => '#00a32a',
			self::TERTIARY => '#8224e3',
		};
	}
}
