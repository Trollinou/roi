<?php
/**
 * REST API Contenu Endpoint.
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
 * Class Contenu_Controller
 * Handles REST API operations for unified Lesson and Exercise content.
 */
class Contenu_Controller {

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
	protected string $rest_base = 'contenu';

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
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_contenu' ),
					'permission_callback' => array( Permissions_Helper::class, 'check_apprentissage_access' ),
				),
			)
		);
	}

	/**
	 * Get details of a single Lesson or Exercise.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_contenu( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$post = get_post( $id );

		if ( ! $post || 'publish' !== $post->post_status || ! in_array( $post->post_type, array( 'roi_exercice', 'roi_lecon' ), true ) ) {
			return new WP_Error(
				'rest_contenu_not_found',
				__( 'Contenu non trouvé ou non publié.', 'roi' ),
				array( 'status' => 404 )
			);
		}

		$chapitre_nom     = '';
		$chapitre_couleur = '';

		$terms = get_the_terms( $post->ID, 'roi_chapitre' );
		if ( is_array( $terms ) && ! empty( $terms ) ) {
			$term             = $terms[0];
			$chapitre_nom     = $term->name;
			$chapitre_couleur = (string) get_term_meta( $term->term_id, '_roi_chapitre_couleur', true );
		}

		$is_exercice = 'roi_exercice' === $post->post_type;

		$niveau_meta = get_post_meta( $post->ID, $is_exercice ? '_roi_exercice_niveau' : '_roi_lecon_niveau', true );
		$niveau      = is_numeric( $niveau_meta ) ? (int) $niveau_meta : 1;

		$data = array(
			'id'               => $post->ID,
			'titre'            => $post->post_title,
			'post_type'        => $post->post_type,
			'chapitre_nom'     => $chapitre_nom,
			'chapitre_couleur' => $chapitre_couleur,
			'niveau'           => $niveau,
		);

		if ( $is_exercice ) {
			$type_meta   = get_post_meta( $post->ID, '_roi_exercice_type', true );
			$config_meta = get_post_meta( $post->ID, '_roi_exercice_config', true );

			$data['type']   = is_numeric( $type_meta ) ? (int) $type_meta : 0;
			$data['config'] = null;

			if ( is_array( $config_meta ) ) {
				$data['config'] = $config_meta;
			} elseif ( is_string( $config_meta ) && '' !== trim( $config_meta ) ) {
				$decoded = json_decode( $config_meta, true );
				if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
					$data['config'] = $decoded;
				} else {
					$decoded_unslashed = json_decode( wp_unslash( $config_meta ), true );
					if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded_unslashed ) ) {
						$data['config'] = $decoded_unslashed;
					} else {
						$data['config'] = array( 'raw_json' => $config_meta );
					}
				}
			}
		} else {
			$data['contenu_html'] = apply_filters( 'the_content', $post->post_content );
		}

		return rest_ensure_response( $data );
	}
}
