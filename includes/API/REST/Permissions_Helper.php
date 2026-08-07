<?php
/**
 * REST API Permissions Helper.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

use WP_Error;

/**
 * Class Permissions_Helper
 * Centralized authorization checks for REST API endpoints.
 */
class Permissions_Helper {

	/**
	 * Default allowed roles for Apprentissage module.
	 */
	public const DEFAULT_ROLES = [ 'administrator', 'staff', 'entraineur', 'editor', 'membre' ];

	/**
	 * Checks if the current user is logged in and belongs to an allowed Apprentissage role.
	 *
	 * @return bool|WP_Error
	 */
	public static function check_apprentissage_access(): bool|WP_Error {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Vous devez être connecté.', 'roi' ),
				[ 'status' => 401 ]
			);
		}

		$user          = wp_get_current_user();
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', self::DEFAULT_ROLES );

		if ( false === $allowed_roles || ! is_array( $allowed_roles ) ) {
			$allowed_roles = self::DEFAULT_ROLES;
		}

		$intersect = array_intersect( $allowed_roles, (array) $user->roles );

		if ( empty( $intersect ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Accès non autorisé.', 'roi' ),
				[ 'status' => 403 ]
			);
		}

		return true;
	}
}
