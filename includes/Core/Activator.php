<?php
/**
 * Plugin activation helper.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Core;

/**
 * Class Activator
 * Handles logic during plugin activation.
 */
class Activator {

	/**
	 * Run on plugin activation.
	 *
	 * @return void
	 */
	public static function activate(): void {
		// Register capabilities
		Roles::add_capabilities_to_roles();

		// Register CPTs and Taxonomies to enable rewrite rules generation
		( new \ROI\CPT\Chapitre_Taxonomy() )->register();
		\ROI\CPT\Chapitre_Taxonomy::seed_terms();
		( new \ROI\CPT\Lecon() )->register();
		( new \ROI\CPT\Exercice() )->register();
		( new \ROI\CPT\Cours() )->register();
		( new \ROI\CPT\Partie() )->register();

		// Flush rewrite rules
		flush_rewrite_rules();
	}
}
