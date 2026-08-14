<?php
/**
 * Plugin deactivation helper.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Core;

/**
 * Class Deactivator
 * Handles logic during plugin deactivation.
 */
class Deactivator {

	/**
	 * Run on plugin deactivation.
	 *
	 * @return void
	 */
	public static function deactivate(): void {
		// Remove capabilities.
		Roles::remove_capabilities_from_roles();

		// Flush rewrite rules.
		flush_rewrite_rules();
	}
}
