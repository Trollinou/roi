<?php
/**
 * REST API Parcours Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Query;

/**
 * Class Parcours_Controller
 * Handles REST API operations for fetching courses and their playlists.
 */
class Parcours_Controller {

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
	protected string $rest_base = 'parcours';

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
					'callback'            => array( $this, 'get_parcours' ),
					'permission_callback' => array( Permissions_Helper::class, 'check_apprentissage_access' ),
				),
			)
		);
	}

	/**
	 * Get courses structure and playlists.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function get_parcours( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$args = array(
			'post_type'      => 'roi_cours',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
		);

		$query = new WP_Query( $args );
		$cours = array();

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$post_id = get_the_ID();
				$post    = get_post( $post_id );
				$ordre   = $post ? (int) $post->menu_order : 0;

				// Retrieve level.
				$niveau_meta = get_post_meta( $post_id, '_roi_cours_niveau', true );
				$niveau      = is_numeric( $niveau_meta ) ? (int) $niveau_meta : 1;

				// Retrieve playlist.
				$playlist_meta = get_post_meta( $post_id, '_roi_cours_playlist', true );
				$playlist      = array();
				if ( is_string( $playlist_meta ) && '' !== $playlist_meta ) {
					$decoded = json_decode( $playlist_meta, true );
					if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
						foreach ( $decoded as &$item ) {
							if ( isset( $item['id'] ) ) {
								$item['titre'] = get_the_title( (int) $item['id'] );
							}
						}
						unset( $item );
						$playlist = $decoded;
					}
				}

				// Retrieve chapter info.
				$chapitre_nom     = '';
				$chapitre_couleur = '';
				$terms            = get_the_terms( $post_id, 'roi_chapitre' );
				if ( is_array( $terms ) && ! empty( $terms ) ) {
					$term             = $terms[0];
					$chapitre_nom     = $term->name;
					$chapitre_couleur = (string) get_term_meta( $term->term_id, '_roi_chapitre_couleur', true );
				}

				$cours[] = array(
					'id'               => $post_id,
					'titre'            => get_the_title(),
					'niveau'           => $niveau,
					'playlist'         => $playlist,
					'chapitre_nom'     => $chapitre_nom,
					'chapitre_couleur' => $chapitre_couleur,
					'ordre'            => $ordre,
				);
			}
			wp_reset_postdata();
		}

		usort(
			$cours,
			function ( array $a, array $b ): int {
				$order_map = array(
					'Matérialité'         => 1,
					'Activité des Pièces' => 2,
					'Sécurité du Roi'     => 3,
					'Structure de Pions'  => 4,
					'Combination'         => 5,
				);

				// 1. Niveau
				if ( $a['niveau'] !== $b['niveau'] ) {
					return $a['niveau'] <=> $b['niveau'];
				}

				// 2. Chapitre
				$pos_a = $order_map[ $a['chapitre_nom'] ] ?? 99;
				$pos_b = $order_map[ $b['chapitre_nom'] ] ?? 99;
				if ( $pos_a !== $pos_b ) {
					return $pos_a <=> $pos_b;
				}

				// 3. Ordre
				return $a['ordre'] <=> $b['ordre'];
			}
		);

		return new WP_REST_Response( $cours, 200 );
	}
}
