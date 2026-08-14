<?php
/**
 * REST API Configuration Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class Config_Controller
 * Handles public REST API operations for fetching general configurations.
 */
class Config_Controller {

	/**
	 * Namespace for the API.
	 *
	 * @var string
	 */
	protected string $namespace = 'roi/v1';

	/**
	 * Base path for the resource.
	 *
	 * @var string
	 */
	protected string $rest_base = 'config';

	/**
	 * Initialize the class and register hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_config' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Get configuration settings.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function get_config( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$default_roles = array( 'administrator', 'staff', 'entraineur', 'editor', 'membre' );
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', $default_roles );

		if ( false === $allowed_roles ) {
			$allowed_roles = $default_roles;
		}

		$data = array(
			'apprentissage_allowed_roles' => $allowed_roles,
		);

		return rest_ensure_response( $data );
	}
}
