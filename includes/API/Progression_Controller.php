<?php
/**
 * REST API Progression Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use WP_User_Query;

/**
 * Class Progression_Controller
 * Handles saving and retrieving student exercise and lesson progression.
 */
class Progression_Controller {

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
	protected string $rest_base = 'progression';

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
		// Tâche 1 : Route d'enregistrement (Élève) - POST /wp-json/roi/v1/progression
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'enregistrer_progression' ],
					'permission_callback' => [ $this, 'check_adherent_permissions' ],
				],
			]
		);

		// Tâche 2 : Route de consultation (Entraîneur) - GET /wp-json/roi/v1/progression/groupe
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/groupe',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'obtenir_progression_groupe' ],
					'permission_callback' => [ $this, 'check_entraineur_permissions' ],
				],
			]
		);
	}

	/**
	 * Permission callback for students to register their progress.
	 *
	 * @return bool|WP_Error
	 */
	public function check_adherent_permissions(): bool|WP_Error {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Vous devez être connecté.', 'roi' ),
				[ 'status' => 401 ]
			);
		}

		$user = wp_get_current_user();
		if ( ! in_array( 'adherent', (array) $user->roles, true ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Accès réservé aux adhérents.', 'roi' ),
				[ 'status' => 403 ]
			);
		}

		return true;
	}

	/**
	 * Permission callback for trainers/admins to view group progress.
	 *
	 * @return bool|WP_Error
	 */
	public function check_entraineur_permissions(): bool|WP_Error {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Vous devez être connecté.', 'roi' ),
				[ 'status' => 401 ]
			);
		}

		$user  = wp_get_current_user();
		$roles = (array) $user->roles;

		if ( ! in_array( 'entraineur', $roles, true ) && ! in_array( 'administrator', $roles, true ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Accès réservé aux entraîneurs et administrateurs.', 'roi' ),
				[ 'status' => 403 ]
			);
		}

		return true;
	}

	/**
	 * Enregistre la réussite d'un exercice ou d'une leçon par l'adhérent connecté.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function enregistrer_progression( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$element_id = (int) $request->get_param( 'element_id' );

		if ( $element_id <= 0 ) {
			return new WP_Error(
				'invalid_element_id',
				__( 'ID d\'élément invalide.', 'roi' ),
				[ 'status' => 400 ]
			);
		}

		$post = get_post( $element_id );
		if ( ! $post || ! in_array( $post->post_type, [ 'roi_exercice', 'roi_lecon' ], true ) ) {
			return new WP_Error(
				'element_not_found',
				__( 'Élément non trouvé.', 'roi' ),
				[ 'status' => 404 ]
			);
		}

		$user_id = get_current_user_id();

		// On vérifie si l'adhérent a déjà validé cet élément pour éviter d'ajouter des doublons
		$meta_entries      = get_user_meta( $user_id, '_roi_element_valide', false );
		$already_validated = false;
		if ( is_array( $meta_entries ) ) {
			foreach ( $meta_entries as $entry ) {
				if ( is_array( $entry ) && isset( $entry['element_id'] ) && (int) $entry['element_id'] === $element_id ) {
					$already_validated = true;
					break;
				}
			}
		}

		if ( ! $already_validated ) {
			$data = [
				'element_id' => $element_id,
				'date'       => current_time( 'mysql' ),
			];
			add_user_meta( $user_id, '_roi_element_valide', $data, false );
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => __( 'Progression sauvegardée', 'roi' ),
			],
			200
		);
	}

	/**
	 * Récupère les statistiques de progression pour tous les adhérents.
	 *
	 * @return WP_REST_Response
	 */
	public function obtenir_progression_groupe(): WP_REST_Response {
		$query = new WP_User_Query( [
			'role'    => 'adherent',
			'orderby' => 'display_name',
			'order'   => 'ASC',
		] );

		$users  = $query->get_results();
		$groupe = [];

		foreach ( $users as $user ) {
			$meta_entries     = get_user_meta( $user->ID, '_roi_element_valide', false );
			$elements_valides = [];

			if ( is_array( $meta_entries ) ) {
				foreach ( $meta_entries as $entry ) {
					if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
						$elements_valides[] = (int) $entry['element_id'];
					}
				}
			}

			// Garder des IDs uniques et ordonnés
			$elements_valides = array_values( array_unique( $elements_valides ) );

			$groupe[] = [
				'id'               => $user->ID,
				'nom'              => $user->last_name,
				'prenom'           => $user->first_name,
				'elements_valides' => $elements_valides,
			];
		}

		return new WP_REST_Response( $groupe, 200 );
	}
}
