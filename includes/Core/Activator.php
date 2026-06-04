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

		// Flush rewrite rules
		flush_rewrite_rules();
	}
}
