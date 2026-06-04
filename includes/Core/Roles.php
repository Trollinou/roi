<?php
/**
 * Roles and capabilities management.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Core;

/**
 * Class Roles
 * Manages WordPress roles and custom capabilities for ROI post types.
 */
class Roles {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', [ $this, 'register_roles_caps' ] );
	}

	/**
	 * Run hook for initial registration.
	 *
	 * @return void
	 */
	public function register_roles_caps(): void {
		self::add_capabilities_to_roles();
	}

	/**
	 * Get capabilities list for roi_exercice.
	 *
	 * @return array<string, bool>
	 */
	public static function get_exercice_capabilities(): array {
		return [
			'edit_exercice'          => true,
			'read_exercice'          => true,
			'delete_exercice'        => true,
			'edit_exercices'         => true,
			'edit_others_exercices'  => true,
			'publish_exercices'      => true,
			'read_private_exercices' => true,
		];
	}

	/**
	 * Get capabilities list for roi_cours.
	 *
	 * @return array<string, bool>
	 */
	public static function get_cours_capabilities(): array {
		return [
			'edit_cours_item'    => true,
			'read_cours_item'    => true,
			'delete_cours_item'  => true,
			'edit_cours'         => true,
			'edit_others_cours'  => true,
			'publish_cours'      => true,
			'read_private_cours' => true,
		];
	}

	/**
	 * Adds capabilities to roles.
	 *
	 * @return void
	 */
	public static function add_capabilities_to_roles(): void {
		$caps = array_merge(
			self::get_exercice_capabilities(),
			self::get_cours_capabilities()
		);

		// Coach
		$entraineur = get_role( 'entraineur' );
		if ( $entraineur ) {
			foreach ( $caps as $cap => $grant ) {
				$entraineur->add_cap( $cap, $grant );
			}
		}

		// Admin
		$admin = get_role( 'administrator' );
		if ( $admin ) {
			foreach ( $caps as $cap => $grant ) {
				$admin->add_cap( $cap, $grant );
			}
		}
	}

	/**
	 * Removes capabilities from roles.
	 *
	 * @return void
	 */
	public static function remove_capabilities_from_roles(): void {
		$caps = array_merge(
			self::get_exercice_capabilities(),
			self::get_cours_capabilities()
		);

		// Coach
		$entraineur = get_role( 'entraineur' );
		if ( $entraineur ) {
			foreach ( $caps as $cap => $grant ) {
				$entraineur->remove_cap( $cap );
			}
		}

		// Admin
		$admin = get_role( 'administrator' );
		if ( $admin ) {
			foreach ( $caps as $cap => $grant ) {
				$admin->remove_cap( $cap );
			}
		}
	}
}
