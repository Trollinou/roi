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
	}

	/**
	 * Permission callback for students to manage progression.
	 *
	 * @return bool|\WP_Error
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

		// Récupérer les éléments déjà validés pour cette identité.
		$meta_entries    = get_user_meta( $user_id, $meta_key, false );
		$already_val_map = array();
		if ( is_array( $meta_entries ) ) {
			foreach ( $meta_entries as $entry ) {
				if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
					$already_val_map[ (int) $entry['element_id'] ] = $entry;
				}
			}
		}

		$time_spent      = (int) $request->get_param( 'time_spent' );
		$attempts        = (int) $request->get_param( 'attempts' );
		$validated_count = 0;

		foreach ( $elements_todo as $elem_id ) {
			$post = get_post( $elem_id );
			if ( ! $post || ! in_array( $post->post_type, array( 'roi_exercice', 'roi_lecon' ), true ) ) {
				continue;
			}

			if ( ! isset( $already_val_map[ $elem_id ] ) ) {
				$data = array(
					'element_id' => $elem_id,
					'date'       => current_time( 'mysql' ),
					'time_spent' => max( 0, $time_spent ),
					'attempts'   => max( 1, $attempts ),
				);
				if ( $is_trainer ) {
					$data['source'] = 'club';
				}
				add_user_meta( $user_id, $meta_key, $data, false );
				$already_val_map[ $elem_id ] = $data;
				$validated_count++;
			} elseif ( ! $is_trainer && $time_spent > 0 ) {
				$old_entry = $already_val_map[ $elem_id ];
				if ( empty( $old_entry['time_spent'] ) ) {
					$updated_entry               = $old_entry;
					$updated_entry['time_spent'] = $time_spent;
					if ( $attempts > 0 ) {
						$updated_entry['attempts'] = $attempts;
					}
					update_user_meta( $user_id, $meta_key, $updated_entry, $old_entry );
					$already_val_map[ $elem_id ] = $updated_entry;
				}
			}
		}

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

		$query = new WP_User_Query(
			array(
				'role__in' => $allowed_roles,
				'orderby'  => 'display_name',
				'order'    => 'ASC',
			)
		);

		$users  = $query->get_results();
		$groupe = array();

		foreach ( $users as $user ) {
			$user_meta = get_user_meta( $user->ID );
			if ( ! is_array( $user_meta ) ) {
				continue;
			}

			// Trouver toutes les clés de progression pour cet utilisateur.
			$progression_keys = array();
			foreach ( $user_meta as $key => $val ) {
				if ( str_starts_with( $key, '_roi_element_valide' ) ) {
					$progression_keys[] = $key;
				}
			}

			// Si le compte possède des identités d'adhérents (_roi_element_valide_member_*),
			// on masque la clé brute générique _roi_element_valide pour ne pas afficher le compte parent conteneur en doublon.
			$has_member_keys = false;
			foreach ( $progression_keys as $k ) {
				if ( str_starts_with( $k, '_roi_element_valide_member_' ) ) {
					$has_member_keys = true;
					break;
				}
			}

			if ( $has_member_keys ) {
				$progression_keys = array_values(
					array_filter(
						$progression_keys,
						static fn( string $k ): bool => '_roi_element_valide' !== $k
					)
				);
			}

			if ( empty( $progression_keys ) ) {
				continue;
			}

			foreach ( $progression_keys as $key ) {
				$meta_entries     = get_user_meta( $user->ID, $key, false );
				$elements_valides = array();
				$details          = array();

				if ( is_array( $meta_entries ) ) {
					foreach ( $meta_entries as $entry ) {
						if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
							$elem_id = (int) $entry['element_id'];
							if ( $elem_id > 0 ) {
								$elements_valides[] = $elem_id;
								$details[ $elem_id ] = array(
									'date'       => isset( $entry['date'] ) ? (string) $entry['date'] : '',
									'time_spent' => isset( $entry['time_spent'] ) ? (int) $entry['time_spent'] : null,
									'attempts'   => isset( $entry['attempts'] ) ? (int) $entry['attempts'] : null,
									'source'     => isset( $entry['source'] ) ? (string) $entry['source'] : '',
								);
							}
						}
					}
				}

				// Garder des IDs uniques et ordonnés.
				$elements_valides = array_values( array_unique( $elements_valides ) );

				// Déterminer le nom et prénom en fonction de la clé d'identité.
				$nom           = $user->last_name;
				$prenom        = $user->first_name;
				$display_name  = $user->display_name;
				$display_id    = $user->ID;
				$identity_type = 'user';
				$parent_user   = null;

				if ( '_roi_element_valide' !== $key ) {
					$identity = str_replace( '_roi_element_valide_', '', $key );
					if ( str_starts_with( $identity, 'member_' ) ) {
						$identity_type = 'member';
						$adherent_id   = (int) str_replace( 'member_', '', $identity );
						$display_id    = $adherent_id;
						$adh_post      = get_post( $adherent_id );
						$adh_prenom    = get_post_meta( $adherent_id, '_dame_first_name', true ) ?: get_post_meta( $adherent_id, '_dame_prenom', true );
						$adh_nom       = get_post_meta( $adherent_id, '_dame_last_name', true ) ?: ( get_post_meta( $adherent_id, '_dame_birth_name', true ) ?: get_post_meta( $adherent_id, '_dame_nom', true ) );

						if ( ! empty( $adh_nom ) || ! empty( $adh_prenom ) ) {
							$nom          = ! empty( $adh_nom ) ? (string) $adh_nom : '';
							$prenom       = ! empty( $adh_prenom ) ? (string) $adh_prenom : '';
							$display_name = trim( $prenom . ' ' . $nom );
						} elseif ( $adh_post ) {
							$display_name = $adh_post->post_title;
							$prenom       = $display_name;
							$nom          = '';
						}

						$parent_user = array(
							'id'           => $user->ID,
							'display_name' => $user->display_name,
						);
					} elseif ( str_starts_with( $identity, 'rep_' ) ) {
						$identity_type = 'parent';
						$display_name  = $user->display_name . ' (Parent)';
					} elseif ( 'wp_virtual' === $identity ) {
						$identity_type = 'admin';
						$display_name  = $user->display_name . ' (Admin)';
					}
				}

				if ( empty( $nom ) && empty( $prenom ) ) {
					$prenom = $display_name;
					$nom    = '';
				}

				$groupe[] = array(
					'id'               => $user->ID . '__' . $key, // ID unique pour le tableau React (double underscore).
					'display_id'       => $display_id,
					'identity_type'    => $identity_type,
					'parent_user'      => $parent_user,
					'nom'              => $nom,
					'prenom'           => $prenom,
					'display_name'     => $display_name,
					'elements_valides' => $elements_valides,
					'details'          => (object) $details,
				);
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
		$elements     = array();

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
		$element_id = (int) $request->get_param( 'element_id' );

		if ( $student_id <= 0 || ( $course_id <= 0 && $element_id <= 0 ) ) {
			return new \WP_Error(
				'invalid_params',
				__( 'Paramètres invalides.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$playlist_ids = array();

		if ( $element_id > 0 ) {
			$playlist_ids[] = $element_id;
		} elseif ( $course_id > 0 ) {
			// Retrieve course playlist.
			$playlist_meta = get_post_meta( $course_id, '_roi_cours_playlist', true );
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
		}

		if ( empty( $playlist_ids ) ) {
			return new WP_REST_Response(
				array(
					'success' => true,
					'message' => __( 'Aucun élément à réinitialiser.', 'roi' ),
				),
				200
			);
		}

		// Get all entries.
		$meta_entries = get_user_meta( $student_id, $meta_key, false );

		// Delete all entries.
		delete_user_meta( $student_id, $meta_key );

		// Filter and re-add entries not in the playlist.
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
			array(
				'success' => true,
				'message' => __( 'Progression réinitialisée avec succès.', 'roi' ),
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
		global $wpdb;

		// Récupérer tous les identifiants d'adhérents déjà suivis dans les meta users.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$existing_keys = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT DISTINCT meta_key FROM {$wpdb->usermeta} WHERE meta_key LIKE %s",
				'_roi_element_valide_member_%'
			)
		);

		$tracked_adherent_ids = array();
		if ( is_array( $existing_keys ) ) {
			foreach ( $existing_keys as $k ) {
				$aid = (int) str_replace( '_roi_element_valide_member_', '', (string) $k );
				if ( $aid > 0 ) {
					$tracked_adherent_ids[] = $aid;
				}
			}
		}

		$candidats = array();

		// Si le CPT adherent existe (DAME actif).
		if ( post_type_exists( 'adherent' ) ) {
			$args = array(
				'post_type'      => 'adherent',
				'post_status'    => 'publish',
				'posts_per_page' => 200,
				'orderby'        => 'title',
				'order'          => 'ASC',
			);
			if ( ! empty( $tracked_adherent_ids ) ) {
				$args['post__not_in'] = $tracked_adherent_ids;
			}

			$posts = get_posts( $args );
			foreach ( $posts as $post ) {
				$prenom    = (string) ( get_post_meta( $post->ID, '_dame_first_name', true ) ?: get_post_meta( $post->ID, '_dame_prenom', true ) );
				$nom       = (string) ( get_post_meta( $post->ID, '_dame_last_name', true ) ?: ( get_post_meta( $post->ID, '_dame_birth_name', true ) ?: get_post_meta( $post->ID, '_dame_nom', true ) ) );
				$email     = (string) get_post_meta( $post->ID, '_dame_email', true );
				$full_name = trim( $prenom . ' ' . $nom );
				if ( empty( $full_name ) ) {
					$full_name = $post->post_title;
				}

				$birth_date = (string) get_post_meta( $post->ID, '_dame_birth_date', true );
				$rep_fname  = (string) get_post_meta( $post->ID, '_dame_legal_rep_1_first_name', true );
				$rep_lname  = (string) get_post_meta( $post->ID, '_dame_legal_rep_1_last_name', true );
				$legal_rep  = trim( $rep_fname . ' ' . $rep_lname );

				$candidats[] = array(
					'id'           => $post->ID,
					'type'         => 'adherent',
					'nom'          => $nom,
					'prenom'       => $prenom,
					'display_name' => $full_name,
					'email'        => $email,
					'birth_date'   => $birth_date,
					'legal_rep'    => $legal_rep,
				);
			}
		}

		return new WP_REST_Response( $candidats, 200 );
	}

	/**
	 * Ajoute un élève (adhérent DAME) dans la liste de suivi.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|\WP_Error
	 */
	public function ajouter_eleve_suivi( WP_REST_Request $request ): WP_REST_Response|\WP_Error {
		$adherent_id = (int) $request->get_param( 'adherent_id' );

		if ( $adherent_id <= 0 ) {
			return new \WP_Error(
				'invalid_adherent_id',
				__( 'ID d\'adhérent invalide.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		$post = get_post( $adherent_id );
		if ( ! $post || 'adherent' !== $post->post_type ) {
			return new \WP_Error(
				'adherent_not_found',
				__( 'Adhérent non trouvé dans DAME.', 'roi' ),
				array( 'status' => 404 )
			);
		}

		// Trouver un compte WordPress rattaché à cet adhérent.
		$user = null;

		// 1. Recherche par post meta direct (_dame_wp_user_id, _dame_linked_wp_user, _dame_user_id).
		$linked_user_id = (int) ( get_post_meta( $adherent_id, '_dame_wp_user_id', true )
			?: get_post_meta( $adherent_id, '_dame_linked_wp_user', true )
			?: get_post_meta( $adherent_id, '_dame_user_id', true ) );

		if ( $linked_user_id > 0 ) {
			$found = get_user_by( 'ID', $linked_user_id );
			if ( $found instanceof \WP_User ) {
				$user = $found;
			}
		}

		// 2. Recherche par user meta _dame_adherent_id.
		if ( ! $user ) {
			$users_with_meta = get_users(
				array(
					'meta_key'   => '_dame_adherent_id',
					'meta_value' => (string) $adherent_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
					'number'     => 1,
				)
			);
			if ( ! empty( $users_with_meta ) ) {
				$user = $users_with_meta[0];
			}
		}

		// 3. Recherche par email direct de l'adhérent.
		$adh_email = (string) get_post_meta( $adherent_id, '_dame_email', true );
		if ( ! $user && ! empty( $adh_email ) ) {
			$found = get_user_by( 'email', $adh_email );
			if ( $found instanceof \WP_User ) {
				$user = $found;
			}
		}

		// 4. Recherche par email du représentant légal 1.
		$rep1_email = (string) get_post_meta( $adherent_id, '_dame_legal_rep_1_email', true );
		if ( ! $user && ! empty( $rep1_email ) ) {
			$found = get_user_by( 'email', $rep1_email );
			if ( $found instanceof \WP_User ) {
				$user = $found;
			}
		}

		// 5. Recherche par email du représentant légal 2.
		$rep2_email = (string) get_post_meta( $adherent_id, '_dame_legal_rep_2_email', true );
		if ( ! $user && ! empty( $rep2_email ) ) {
			$found = get_user_by( 'email', $rep2_email );
			if ( $found instanceof \WP_User ) {
				$user = $found;
			}
		}

		// 6. Si aucun utilisateur WP n'existe, on crée un compte WP dédié.
		// Note : Ne JAMAIS se replier sur post_author ni sur l'administrateur courant.
		if ( ! $user ) {
			$adh_fname = (string) ( get_post_meta( $adherent_id, '_dame_first_name', true ) ?: get_post_meta( $adherent_id, '_dame_prenom', true ) );
			$adh_lname = (string) ( get_post_meta( $adherent_id, '_dame_last_name', true ) ?: get_post_meta( $adherent_id, '_dame_nom', true ) );
			$login     = sanitize_user( 'eleve_' . $adherent_id, true );

			// Préférer l'email du représentant légal ou de l'adhérent s'il existe et n'est pas déjà pris.
			$email_candidate = ! empty( $rep1_email ) ? $rep1_email : ( ! empty( $adh_email ) ? $adh_email : '' );
			if ( ! empty( $email_candidate ) && ! email_exists( $email_candidate ) ) {
				$email = $email_candidate;
			} else {
				$email = 'eleve_' . $adherent_id . '@club.local';
			}

			$created_id = wp_insert_user(
				array(
					'user_login'   => $login,
					'user_email'   => $email,
					'first_name'   => $adh_fname,
					'last_name'    => $adh_lname,
					'display_name' => trim( $adh_fname . ' ' . $adh_lname ),
					'user_pass'    => wp_generate_password( 20 ),
					'role'         => 'membre',
				)
			);

			if ( ! is_wp_error( $created_id ) ) {
				update_user_meta( $created_id, '_dame_adherent_id', $adherent_id );
				$user = get_user_by( 'ID', $created_id );
			}
		}

		if ( ! $user instanceof \WP_User ) {
			return new \WP_Error(
				'user_association_failed',
				__( 'Impossible d\'associer un compte utilisateur.', 'roi' ),
				array( 'status' => 500 )
			);
		}

		$meta_key = '_roi_element_valide_member_' . $adherent_id;

		// Initialiser l'entrée de suivi avec un marqueur (element_id = 0) si aucune entrée n'existe.
		$existing = get_user_meta( $user->ID, $meta_key, false );
		if ( empty( $existing ) ) {
			add_user_meta(
				$user->ID,
				$meta_key,
				array(
					'element_id' => 0,
					'date'       => current_time( 'mysql' ),
					'source'     => 'init',
				),
				false
			);
		}

		$prenom       = (string) ( get_post_meta( $adherent_id, '_dame_first_name', true ) ?: get_post_meta( $adherent_id, '_dame_prenom', true ) );
		$nom          = (string) ( get_post_meta( $adherent_id, '_dame_last_name', true ) ?: ( get_post_meta( $adherent_id, '_dame_birth_name', true ) ?: get_post_meta( $adherent_id, '_dame_nom', true ) ) );
		$display_name = trim( $prenom . ' ' . $nom );
		if ( empty( $display_name ) ) {
			$display_name = $post->post_title;
		}

		$parent_user = array(
			'id'           => $user->ID,
			'display_name' => $user->display_name,
		);

		return new WP_REST_Response(
			array(
				'success' => true,
				'student' => array(
					'id'               => $user->ID . '__' . $meta_key,
					'display_id'       => $adherent_id,
					'identity_type'    => 'member',
					'parent_user'      => $parent_user,
					'nom'              => $nom,
					'prenom'           => $prenom,
					'display_name'     => $display_name,
					'elements_valides' => array(),
					'details'          => (object) array(),
				),
			),
			200
		);
	}

	/**
	 * Retire un élève de la liste de suivi.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|\WP_Error
	 */
	public function retirer_eleve_suivi( WP_REST_Request $request ): WP_REST_Response|\WP_Error {
		$student_id = (string) $request->get_param( 'student_id' );

		if ( empty( $student_id ) ) {
			return new \WP_Error(
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
			return new \WP_Error(
				'invalid_student_id',
				__( 'Identifiant d\'élève invalide.', 'roi' ),
				array( 'status' => 400 )
			);
		}

		delete_user_meta( $user_id, $meta_key );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Élève retiré du suivi avec succès.', 'roi' ),
			),
			200
		);
	}
}
