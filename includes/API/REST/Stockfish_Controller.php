<?php
/**
 * REST API Stockfish Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * Class Stockfish_Controller
 * Serves stockfish.wasm with the correct Content-Type header to bypass Nginx limitations.
 */
class Stockfish_Controller {

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
	protected string $rest_base = 'stockfish-wasm';

	/**
	 * Initialize the class and register hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
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
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'serve_wasm' ],
					'permission_callback' => '__return_true',
				],
			]
		);
	}

	/**
	 * Serves the stockfish.wasm file with correct MIME type.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error|void
	 */
	public function serve_wasm( WP_REST_Request $request ): mixed {
		$file_path = ROI_PLUGIN_DIR . 'assets/js/stockfish.wasm';

		if ( ! file_exists( $file_path ) ) {
			return new WP_Error( 'file_not_found', __( 'Fichier non trouvé.', 'roi' ), [ 'status' => 404 ] );
		}

		// Clean output buffers to prevent any garbage characters
		if ( ob_get_level() ) {
			ob_end_clean();
		}

		header( 'Content-Type: application/wasm' );
		header( 'Content-Length: ' . filesize( $file_path ) );
		header( 'Last-Modified: ' . gmdate( 'D, d M Y H:i:s', filemtime( $file_path ) ) . ' GMT' );
		header( 'Cache-Control: public, max-age=31536000' );

		readfile( $file_path );
		exit;
	}
}
