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
	public const DEFAULT_ROLES = array( 'administrator', 'staff', 'entraineur', 'editor', 'membre' );

	/**
	 * Returns the list of allowed WordPress roles for the Apprentissage module.
	 *
	 * @return array<string>
	 */
	public static function get_allowed_roles(): array {
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', self::DEFAULT_ROLES );

		if ( false === $allowed_roles || ! is_array( $allowed_roles ) || empty( $allowed_roles ) ) {
			return self::DEFAULT_ROLES;
		}

		return array_values( array_map( 'strval', $allowed_roles ) );
	}

	/**
	 * Checks whether the current user is an administrator or trainer.
	 *
	 * @return bool
	 */
	public static function is_trainer_or_admin(): bool {
		if ( ! is_user_logged_in() ) {
			return false;
		}

		$user  = wp_get_current_user();
		$roles = (array) $user->roles;

		return in_array( 'entraineur', $roles, true ) || in_array( 'administrator', $roles, true );
	}

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
				array( 'status' => 401 )
			);
		}

		$user          = wp_get_current_user();
		$allowed_roles = self::get_allowed_roles();
		$intersect     = array_intersect( $allowed_roles, (array) $user->roles );

		if ( empty( $intersect ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Accès non autorisé.', 'roi' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Checks if the current user is a trainer or administrator with Apprentissage access.
	 *
	 * @return bool|WP_Error
	 */
	public static function check_entraineur_access(): bool|WP_Error {
		$base_access = self::check_apprentissage_access();
		if ( is_wp_error( $base_access ) ) {
			return $base_access;
		}

		if ( ! self::is_trainer_or_admin() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Accès réservé aux entraîneurs et administrateurs.', 'roi' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Verifies if the current user is allowed to read or write data for a specific DAME member ID.
	 * Trainers and administrators can access any member; regular users must be linked to the member.
	 *
	 * @param int $member_id The DAME adherent post ID.
	 * @return bool
	 */
	public static function can_access_member( int $member_id ): bool {
		if ( $member_id <= 0 || ! is_user_logged_in() ) {
			return false;
		}

		if ( self::is_trainer_or_admin() ) {
			return true;
		}

		$user    = wp_get_current_user();
		$user_id = (int) $user->ID;

		// 1. Direct user meta link (_dame_adherent_id).
		$linked_adh = (int) get_user_meta( $user_id, '_dame_adherent_id', true );
		if ( $linked_adh === $member_id ) {
			return true;
		}

		// 2. Post meta links on the adherent CPT.
		foreach ( array( '_dame_wp_user_id', '_dame_linked_wp_user', '_dame_user_id' ) as $meta_key ) {
			if ( (int) get_post_meta( $member_id, $meta_key, true ) === $user_id ) {
				return true;
			}
		}

		// 3. Email match (adherent email or legal representatives).
		$user_email = strtolower( trim( (string) $user->user_email ) );
		if ( '' !== $user_email ) {
			foreach ( array( '_dame_email', '_dame_legal_rep_1_email', '_dame_legal_rep_2_email' ) as $email_meta ) {
				$meta_email = strtolower( trim( (string) get_post_meta( $member_id, $email_meta, true ) ) );
				if ( '' !== $meta_email && $meta_email === $user_email ) {
					return true;
				}
			}
		}

		return false;
	}
}
