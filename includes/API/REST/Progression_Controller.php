<?php
/**
 * REST API Progression Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

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
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'obtenir_progression' ],
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

		// Route de réinitialisation de progression (Entraîneur) - POST /wp-json/roi/v1/progression/reset
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/reset',
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'reset_progression_cours' ],
					'permission_callback' => [ $this, 'check_entraineur_permissions' ],
				],
			]
		);
	}

	public function check_adherent_permissions(): bool|WP_Error {
		return Permissions_Helper::check_apprentissage_access();
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

		$default_roles = [ 'administrator', 'staff', 'entraineur', 'editor', 'membre' ];
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', $default_roles );

		if ( false === $allowed_roles ) {
			$allowed_roles = $default_roles;
		}

		$intersect = array_intersect( $allowed_roles, $roles );

		if ( empty( $intersect ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Accès non autorisé.', 'roi' ),
				[ 'status' => 403 ]
			);
		}

		return true;
	}

	/**
	 * Get the meta key for progression based on the request's X-Selected-Identity header.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return string The meta key.
	 */
	private function get_progression_meta_key( WP_REST_Request $request ): string {
		$identity = $request->get_header( 'X-Selected-Identity' );
		if ( is_string( $identity ) && '' !== $identity ) {
			return '_roi_element_valide_' . sanitize_key( $identity );
		}
		return '_roi_element_valide';
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

		$user_id  = get_current_user_id();
		$meta_key = $this->get_progression_meta_key( $request );

		// On vérifie si l'adhérent a déjà validé cet élément pour éviter d'ajouter des doublons
		$meta_entries      = get_user_meta( $user_id, $meta_key, false );
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
			add_user_meta( $user_id, $meta_key, $data, false );
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
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function obtenir_progression_groupe( WP_REST_Request $request ): WP_REST_Response {
		$default_roles = [ 'administrator', 'staff', 'entraineur', 'editor', 'membre' ];
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', $default_roles );

		if ( false === $allowed_roles || empty( $allowed_roles ) ) {
			$allowed_roles = $default_roles;
		}

		$query = new WP_User_Query( [
			'role__in' => $allowed_roles,
			'orderby'  => 'display_name',
			'order'    => 'ASC',
		] );

		$users    = $query->get_results();
		$groupe   = [];

		foreach ( $users as $user ) {
			$user_meta = get_user_meta( $user->ID );
			if ( ! is_array( $user_meta ) ) {
				continue;
			}

			// Trouver toutes les clés de progression pour cet utilisateur
			$progression_keys = [];
			foreach ( $user_meta as $key => $val ) {
				if ( str_starts_with( $key, '_roi_element_valide' ) ) {
					$progression_keys[] = $key;
				}
			}

			if ( empty( $progression_keys ) ) {
				continue;
			}

			foreach ( $progression_keys as $key ) {
				$meta_entries = get_user_meta( $user->ID, $key, false );
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

				if ( empty( $elements_valides ) ) {
					continue;
				}

				// Déterminer le nom et prénom en fonction de la clé d'identité
				$nom          = $user->last_name;
				$prenom       = $user->first_name;
				$display_name = $user->display_name;
				$display_id   = $user->ID;

				if ( '_roi_element_valide' !== $key ) {
					$identity = str_replace( '_roi_element_valide_', '', $key );
					if ( str_starts_with( $identity, 'member_' ) ) {
						$adherent_id = (int) str_replace( 'member_', '', $identity );
						$display_id  = $adherent_id;
						$adh_nom     = get_post_meta( $adherent_id, '_dame_nom', true );
						$adh_prenom  = get_post_meta( $adherent_id, '_dame_prenom', true );
						if ( ! empty( $adh_nom ) || ! empty( $adh_prenom ) ) {
							$nom          = $adh_nom ?: '';
							$prenom       = $adh_prenom ?: '';
							$display_name = trim( $prenom . ' ' . $nom );
						}
					} elseif ( str_starts_with( $identity, 'rep_' ) ) {
						$display_name = $user->display_name . ' (Parent)';
					} elseif ( 'wp_virtual' === $identity ) {
						$display_name = $user->display_name . ' (Admin)';
					}
				}

				if ( empty( $nom ) && empty( $prenom ) ) {
					$prenom = $display_name;
					$nom    = '';
				}

				$groupe[] = [
					'id'               => $user->ID . '__' . $key, // ID unique pour le tableau React (double underscore)
					'display_id'       => $display_id,
					'nom'              => $nom,
					'prenom'           => $prenom,
					'display_name'     => $display_name,
					'elements_valides' => $elements_valides,
				];
			}
		}

		return new WP_REST_Response( $groupe, 200 );
	}

	/**
	 * Récupère la liste des IDs d'éléments validés par l'adhérent connecté.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function obtenir_progression( WP_REST_Request $request ): WP_REST_Response {
		$user_id      = get_current_user_id();
		$meta_key     = $this->get_progression_meta_key( $request );
		$meta_entries = get_user_meta( $user_id, $meta_key, false );
		$elements     = [];

		if ( is_array( $meta_entries ) ) {
			foreach ( $meta_entries as $entry ) {
				if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
					$elements[] = (int) $entry['element_id'];
				}
			}
		}

		$elements = array_values( array_unique( $elements ) );

		return new WP_REST_Response( $elements, 200 );
	}

	/**
	 * Supprime la progression d'un élève pour un cours spécifique.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|\WP_Error
	 */
	public function reset_progression_cours( WP_REST_Request $request ): WP_REST_Response|\WP_Error {
		$student_id_raw = $request->get_param( 'student_id' );
		$meta_key       = '_roi_element_valide';
		$student_id     = 0;

		if ( is_string( $student_id_raw ) && str_contains( $student_id_raw, '__' ) ) {
			$parts      = explode( '__', $student_id_raw );
			$student_id = (int) $parts[0];
			if ( isset( $parts[1] ) ) {
				$meta_key = $parts[1];
			}
		} else {
			$student_id = (int) $student_id_raw;
		}

		$course_id  = (int) $request->get_param( 'course_id' );

		if ( $student_id <= 0 || $course_id <= 0 ) {
			return new \WP_Error(
				'invalid_params',
				__( 'Paramètres invalides.', 'roi' ),
				[ 'status' => 400 ]
			);
		}

		// Retrieve course playlist
		$playlist_meta = get_post_meta( $course_id, '_roi_cours_playlist', true );
		$playlist_ids  = [];
		if ( is_string( $playlist_meta ) && '' !== $playlist_meta ) {
			$decoded = json_decode( $playlist_meta, true );
			if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
				foreach ( $decoded as $item ) {
					if ( isset( $item['id'] ) ) {
						$playlist_ids[] = (int) $item['id'];
					}
				}
			}
		}

		if ( empty( $playlist_ids ) ) {
			return new WP_REST_Response(
				[
					'success' => true,
					'message' => __( 'Le cours ne contient aucun élément à réinitialiser.', 'roi' ),
				],
				200
			);
		}

		// Get all entries
		$meta_entries = get_user_meta( $student_id, $meta_key, false );

		// Delete all entries
		delete_user_meta( $student_id, $meta_key );

		// Filter and re-add entries not in the playlist
		if ( is_array( $meta_entries ) ) {
			foreach ( $meta_entries as $entry ) {
				if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
					$elem_id = (int) $entry['element_id'];
					if ( ! in_array( $elem_id, $playlist_ids, true ) ) {
						add_user_meta( $student_id, $meta_key, $entry, false );
					}
				}
			}
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => __( 'Progression réinitialisée avec succès.', 'roi' ),
			],
			200
		);
	}
}
