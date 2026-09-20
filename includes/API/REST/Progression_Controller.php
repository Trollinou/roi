<?php
/**
 * REST API Progression Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

use ROI\Services\Progression\Progression_Service;
use ROI\Services\Progression\Group_Service;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * Class Progression_Controller
 * Handles REST API operations for saving and retrieving student and group progression.
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
	 * Progression service.
	 *
	 * @var Progression_Service
	 */
	protected Progression_Service $progression_service;

	/**
	 * Group service.
	 *
	 * @var Group_Service
	 */
	protected Group_Service $group_service;

	/**
	 * Constructor.
	 *
	 * @param Progression_Service|null $progression_service Progression service.
	 * @param Group_Service|null       $group_service       Group service.
	 */
	public function __construct(
		?Progression_Service $progression_service = null,
		?Group_Service $group_service = null
	) {
		$this->progression_service = $progression_service ?? new Progression_Service();
		$this->group_service       = $group_service ?? new Group_Service();
	}

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
		// Tâche 1 : Route d'enregistrement (Élève) - POST /wp-json/roi/v1/progression.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'enregistrer_progression' ),
					'permission_callback' => array( $this, 'check_adherent_permissions' ),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'obtenir_progression' ),
					'permission_callback' => array( $this, 'check_adherent_permissions' ),
				),
			)
		);

		// Tâche 2 : Route de consultation (Entraîneur) - GET /wp-json/roi/v1/progression/groupe.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/groupe',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'obtenir_progression_groupe' ),
					'permission_callback' => array( $this, 'check_entraineur_permissions' ),
				),
			)
		);

		// Route de réinitialisation de progression (Entraîneur) - POST /wp-json/roi/v1/progression/reset.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/reset',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'reset_progression_cours' ),
					'permission_callback' => array( $this, 'check_entraineur_permissions' ),
				),
			)
		);

		// Route des candidats élèves (Entraîneur) - GET /wp-json/roi/v1/progression/candidats.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/candidats',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'obtenir_candidats_eleves' ),
					'permission_callback' => array( $this, 'check_entraineur_permissions' ),
				),
			)
		);

		// Route d'ajout d'un élève au suivi (Entraîneur) - POST /wp-json/roi/v1/progression/ajouter-eleve.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/ajouter-eleve',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'ajouter_eleve_suivi' ),
					'permission_callback' => array( $this, 'check_entraineur_permissions' ),
				),
			)
		);

		// Route de retrait d'un élève du suivi (Entraîneur) - POST /wp-json/roi/v1/progression/retirer-eleve.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/retirer-eleve',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'retirer_eleve_suivi' ),
					'permission_callback' => array( $this, 'check_entraineur_permissions' ),
				),
			)
		);

		// Route des groupes d'adhérents (Entraîneur) - GET /wp-json/roi/v1/progression/groupes.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/groupes',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'obtenir_groupes_eleves' ),
					'permission_callback' => array( $this, 'check_entraineur_permissions' ),
				),
			)
		);

		// Route d'assignation d'un cours à un élève (Entraîneur) - POST /wp-json/roi/v1/progression/assigner-cours.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/assigner-cours',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'assigner_cours_eleve' ),
					'permission_callback' => array( $this, 'check_entraineur_permissions' ),
				),
			)
		);
	}

	/**
	 * Permission callback for students to manage progression.
	 *
	 * @return bool|WP_Error
	 */
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
				array( 'status' => 401 )
			);
		}

		$user  = wp_get_current_user();
		$roles = (array) $user->roles;

		if ( ! in_array( 'entraineur', $roles, true ) && ! in_array( 'administrator', $roles, true ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Accès réservé aux entraîneurs et administrateurs.', 'roi' ),
				array( 'status' => 403 )
			);
		}

		$default_roles = array( 'administrator', 'staff', 'entraineur', 'editor', 'membre' );
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', $default_roles );

		if ( false === $allowed_roles ) {
			$allowed_roles = $default_roles;
		}

		$intersect = array_intersect( $allowed_roles, $roles );
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
	 * Enregistre la réussite d'un exercice, d'un cours ou d'une leçon (par l'élève ou par un entraîneur).
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function enregistrer_progression( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$student_id_raw = $request->get_param( 'student_id' );
		$is_trainer     = false;

		if ( ! empty( $student_id_raw ) ) {
			$can_edit = $this->check_entraineur_permissions();
			if ( is_wp_error( $can_edit ) ) {
				return $can_edit;
			}
			$is_trainer = true;
			$meta_key   = '_roi_element_valide';
			$user_id    = 0;

			if ( is_string( $student_id_raw ) && str_contains( $student_id_raw, '__' ) ) {
				$parts   = explode( '__', $student_id_raw );
				$user_id = (int) $parts[0];
				if ( isset( $parts[1] ) && '' !== $parts[1] ) {
					$meta_key = $parts[1];
				}
			} else {
				$user_id = (int) $student_id_raw;
			}
		} else {
			$user_id  = get_current_user_id();
			$meta_key = $this->get_progression_meta_key( $request );
		}

		if ( $user_id <= 0 ) {
			return new WP_Error(
				'invalid_user_id',
				__( 'ID utilisateur invalide.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$course_id     = (int) $request->get_param( 'course_id' );
		$element_id    = (int) $request->get_param( 'element_id' );
		$element_ids   = $request->get_param( 'element_ids' );
		$elements_todo = array();

		if ( $course_id > 0 ) {
			$playlist_meta = get_post_meta( $course_id, '_roi_cours_playlist', true );
			if ( is_string( $playlist_meta ) && '' !== $playlist_meta ) {
				$decoded = json_decode( $playlist_meta, true );
				if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
					foreach ( $decoded as $item ) {
						if ( is_array( $item ) && isset( $item['id'] ) ) {
							$elements_todo[] = (int) $item['id'];
						}
					}
				}
			}
		} elseif ( is_array( $element_ids ) && ! empty( $element_ids ) ) {
			foreach ( $element_ids as $eid ) {
				$eid = (int) $eid;
				if ( $eid > 0 ) {
					$elements_todo[] = $eid;
				}
			}
		} elseif ( $element_id > 0 ) {
			$elements_todo[] = $element_id;
		}

		if ( empty( $elements_todo ) ) {
			return new WP_Error(
				'invalid_element_id',
				__( 'Aucun élément spécifié.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$time_spent      = (int) $request->get_param( 'time_spent' );
		$attempts        = (int) $request->get_param( 'attempts' );
		$validated_count = $this->progression_service->enregistrer(
			$user_id,
			$meta_key,
			$elements_todo,
			$time_spent,
			$attempts,
			$is_trainer
		);

		return new WP_REST_Response(
			array(
				'success'         => true,
				'validated_count' => $validated_count,
				'message'         => __( 'Progression enregistrée avec succès.', 'roi' ),
			),
			200
		);
	}

	/**
	 * Récupère les statistiques de progression pour tous les adhérents.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function obtenir_progression_groupe( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$default_roles = array( 'administrator', 'staff', 'entraineur', 'editor', 'membre' );
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', $default_roles );

		if ( false === $allowed_roles || empty( $allowed_roles ) ) {
			$allowed_roles = $default_roles;
		}

		$groupe = $this->group_service->obtenir_progression_groupe( $allowed_roles );

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
		$elements     = $this->progression_service->obtenir( $user_id, $meta_key );

		return new WP_REST_Response( $elements, 200 );
	}

	/**
	 * Supprime la progression d'un élève pour un cours spécifique.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function reset_progression_cours( WP_REST_Request $request ): WP_REST_Response|WP_Error {
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
		$element_id = (int) $request->get_param( 'element_id' );

		if ( $student_id <= 0 || ( $course_id <= 0 && $element_id <= 0 ) ) {
			return new WP_Error(
				'invalid_params',
				__( 'Paramètres invalides.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$success = $this->group_service->reset_progression_cours(
			$student_id,
			$meta_key,
			$course_id > 0 ? $course_id : null,
			$element_id > 0 ? $element_id : null
		);

		return new WP_REST_Response(
			array(
				'success' => $success,
				'message' => $success ? __( 'Progression réinitialisée avec succès.', 'roi' ) : __( 'Aucun élément à réinitialiser.', 'roi' ),
			),
			200
		);
	}

	/**
	 * Récupère les adhérents (DAME) qui ne sont pas encore suivis.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function obtenir_candidats_eleves( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$candidats = $this->group_service->obtenir_candidats_eleves();
		return new WP_REST_Response( $candidats, 200 );
	}

	/**
	 * Ajoute un élève (adhérent DAME) dans la liste de suivi.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function ajouter_eleve_suivi( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$adherent_id = (int) $request->get_param( 'adherent_id' );

		if ( $adherent_id <= 0 ) {
			return new WP_Error(
				'invalid_adherent_id',
				__( 'ID d\'adhérent invalide.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$result = $this->group_service->ajouter_eleve_suivi( $adherent_id );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'student' => $result,
			),
			200
		);
	}

	/**
	 * Retire un élève de la liste de suivi.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function retirer_eleve_suivi( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$student_id = (string) $request->get_param( 'student_id' );

		if ( empty( $student_id ) ) {
			return new WP_Error(
				'missing_student_id',
				__( 'Identifiant d\'élève manquant.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$user_id  = 0;
		$meta_key = '';

		if ( str_contains( $student_id, '__' ) ) {
			$parts    = explode( '__', $student_id, 2 );
			$user_id  = (int) $parts[0];
			$meta_key = sanitize_key( $parts[1] );
		} elseif ( is_numeric( $student_id ) ) {
			$user_id  = (int) $student_id;
			$meta_key = '_roi_element_valide';
		}

		if ( $user_id <= 0 || empty( $meta_key ) || ! str_starts_with( $meta_key, '_roi_element_valide' ) ) {
			return new WP_Error(
				'invalid_student_id',
				__( 'Identifiant d\'élève invalide.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$this->group_service->retirer_eleve_suivi( $user_id, $meta_key );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Élève retiré du suivi avec succès.', 'roi' ),
			),
			200
		);
	}

	/**
	 * Assigne ou retire un cours ciblé pour un élève (Entraîneur).
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function assigner_cours_eleve( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$adherent_id = (int) $request->get_param( 'adherent_id' );
		$cours_id    = (int) $request->get_param( 'cours_id' );
		$raw_action  = (string) $request->get_param( 'action' );
		$action      = sanitize_key( ! empty( $raw_action ) ? $raw_action : 'assign' );

		if ( $adherent_id <= 0 || $cours_id <= 0 ) {
			return new WP_Error(
				'invalid_params',
				__( 'Identifiant d\'élève ou de cours invalide.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$result = $this->group_service->assigner_cours_eleve( $adherent_id, $cours_id, $action );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response(
			array(
				'success'        => true,
				'message'        => ( 'assign' === $action ) ? __( 'Cours assigné avec succès.', 'roi' ) : __( 'Cours retiré des assignations.', 'roi' ),
				'cours_id'       => $result['cours_id'],
				'adherent_id'    => $result['adherent_id'],
				'target_members' => $result['target_members'],
			),
			200
		);
	}

	/**
	 * Retourne la liste des groupes dame_group actifs.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function obtenir_groupes_eleves( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$groups = $this->group_service->obtenir_groupes_eleves();
		return new WP_REST_Response( $groups, 200 );
	}
}
