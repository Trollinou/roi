<?php
/**
 * REST API Exercices Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * Class Exercices
 * Handles REST API operations for exercices.
 */
class Exercices {

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
	protected string $rest_base = 'exercice';

	/**
	 * Initialize the class and register hooks.
	 */
	public function init(): void {
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Register the REST API routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_exercice' ],
					'permission_callback' => '__return_true',
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/exercices',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'obtenir_liste_exercices' ],
					'permission_callback' => '__return_true',
				],
			]
		);
	}

	/**
	 * Get a single exercice.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_exercice( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$post = get_post( $id );

		if ( ! $post || 'roi_exercice' !== $post->post_type || 'publish' !== $post->post_status ) {
			return new WP_Error(
				'rest_exercice_not_found',
				__( 'Exercice non trouvé ou non publié.', 'roi' ),
				[ 'status' => 404 ]
			);
		}

		$type_meta     = get_post_meta( $post->ID, '_roi_exercice_type', true );
		$niveau_meta   = get_post_meta( $post->ID, '_roi_exercice_niveau', true );
		$chapitre_meta = get_post_meta( $post->ID, '_roi_exercice_chapitre', true );
		$couleur_meta  = get_post_meta( $post->ID, '_roi_exercice_couleur', true );
		$config_meta   = get_post_meta( $post->ID, '_roi_exercice_config', true );

		$type     = is_numeric( $type_meta ) ? (int) $type_meta : 0;
		$niveau   = is_numeric( $niveau_meta ) ? (int) $niveau_meta : 1;
		$chapitre = (string) $chapitre_meta;
		$couleur  = (string) $couleur_meta;
		$config   = json_decode( $config_meta ?: '{}' );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			$config = null;
		}

		$data = [
			'id'       => $post->ID,
			'title'    => $post->post_title,
			'type'     => $type,
			'niveau'   => $niveau,
			'chapitre' => $chapitre,
			'couleur'  => $couleur,
			'config'   => $config,
		];

		return rest_ensure_response( $data );
	}

	/**
	 * Get list of all published exercices.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function obtenir_liste_exercices( WP_REST_Request $request ): WP_REST_Response {
		$posts = get_posts( [
			'post_type'      => 'roi_exercice',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_key'       => '_roi_exercice_ordre',
			'orderby'        => 'meta_value_num',
			'order'          => 'ASC',
		] );

		$data = [];
		foreach ( $posts as $post ) {
			$type_meta     = get_post_meta( $post->ID, '_roi_exercice_type', true );
			$niveau_meta   = get_post_meta( $post->ID, '_roi_exercice_niveau', true );
			$chapitre_meta = get_post_meta( $post->ID, '_roi_exercice_chapitre', true );
			$couleur_meta  = get_post_meta( $post->ID, '_roi_exercice_couleur', true );

			$data[] = [
				'id'       => $post->ID,
				'titre'    => $post->post_title,
				'type'     => is_numeric( $type_meta ) ? (int) $type_meta : 0,
				'niveau'   => is_numeric( $niveau_meta ) ? (int) $niveau_meta : 1,
				'chapitre' => (string) $chapitre_meta,
				'couleur'  => (string) $couleur_meta,
			];
		}

		return new WP_REST_Response( $data, 200 );
	}
}
