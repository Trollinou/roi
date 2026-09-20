<?php
/**
 * Trainer and Group Progression Service.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Services\Progression;

use WP_User;
use WP_User_Query;
use WP_Error;

/**
 * Class Group_Service
 * Handles business logic for group monitoring, students tracking, course assignments and reset.
 */
class Group_Service {

	/**
	 * Récupère la matrice de progression de tous les élèves suivis.
	 *
	 * @param array<string> $allowed_roles Roles allowed to be viewed in progress.
	 * @return array<int, array<string, mixed>>
	 */
	public function obtenir_progression_groupe( array $allowed_roles ): array {
		$query = new WP_User_Query(
			array(
				'role__in' => $allowed_roles,
				'orderby'  => 'display_name',
				'order'    => 'ASC',
			)
		);

		$users  = (array) $query->get_results();
		$groupe = array();

		// Pré-chargement des cours assignés (restreints) pour identifier les cours affectés par élève.
		$restricted_courses_query = get_posts(
			array(
				'post_type'      => 'roi_cours',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'meta_query'     => array(
					array(
						'key'   => '_roi_cours_audience_type',
						'value' => 'restricted',
					),
				),
			)
		);
		$restricted_courses = array();
		foreach ( $restricted_courses_query as $c_post ) {
			$raw_groups     = get_post_meta( $c_post->ID, '_roi_cours_target_groups', true );
			$decoded_groups = ( is_string( $raw_groups ) && '' !== $raw_groups ) ? json_decode( $raw_groups, true ) : null;
			$c_groups       = is_array( $decoded_groups ) ? $decoded_groups : array();

			$raw_members     = get_post_meta( $c_post->ID, '_roi_cours_target_members', true );
			$decoded_members = ( is_string( $raw_members ) && '' !== $raw_members ) ? json_decode( $raw_members, true ) : null;
			$c_members       = is_array( $decoded_members ) ? $decoded_members : array();

			$restricted_courses[] = array(
				'id'      => (int) $c_post->ID,
				'groups'  => array_map( 'intval', (array) $c_groups ),
				'members' => array_map( 'intval', (array) $c_members ),
			);
		}

		foreach ( $users as $user ) {
			if ( ! ( $user instanceof WP_User ) ) {
				continue;
			}
			$user_meta = get_user_meta( $user->ID );
			if ( ! is_array( $user_meta ) ) {
				continue;
			}

			// Trouver toutes les clés de progression pour cet utilisateur.
			$progression_keys = array();
			foreach ( $user_meta as $key => $val ) {
				if ( str_starts_with( (string) $key, '_roi_element_valide' ) ) {
					$progression_keys[] = (string) $key;
				}
			}

			// Si le compte possède des identités d'adhérents (_roi_element_valide_member_*),
			// on masque la clé brute générique _roi_element_valide pour ne pas afficher le compte parent en doublon.
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
				$nom           = (string) $user->last_name;
				$prenom        = (string) $user->first_name;
				$display_name  = (string) $user->display_name;
				$display_id    = (int) $user->ID;
				$identity_type = 'user';
				$parent_user   = null;
				$adherent_id   = 0;

				if ( '_roi_element_valide' !== $key ) {
					$identity = str_replace( '_roi_element_valide_', '', $key );
					if ( str_starts_with( $identity, 'member_' ) ) {
						$identity_type = 'member';
						$adherent_id   = (int) str_replace( 'member_', '', $identity );
						$display_id    = $adherent_id;
						$adh_post   = get_post( $adherent_id );
						$adh_fn     = (string) get_post_meta( $adherent_id, '_dame_first_name', true );
						$adh_pr     = (string) get_post_meta( $adherent_id, '_dame_prenom', true );
						$adh_prenom = ! empty( $adh_fn ) ? $adh_fn : $adh_pr;

						$adh_ln  = (string) get_post_meta( $adherent_id, '_dame_last_name', true );
						$adh_bn  = (string) get_post_meta( $adherent_id, '_dame_birth_name', true );
						$adh_no  = (string) get_post_meta( $adherent_id, '_dame_nom', true );
						$adh_nom = ! empty( $adh_ln ) ? $adh_ln : ( ! empty( $adh_bn ) ? $adh_bn : $adh_no );

						if ( ! empty( $adh_nom ) || ! empty( $adh_prenom ) ) {
							$nom          = ! empty( $adh_nom ) ? (string) $adh_nom : '';
							$prenom       = ! empty( $adh_prenom ) ? (string) $adh_prenom : '';
							$display_name = trim( $prenom . ' ' . $nom );
						} elseif ( $adh_post ) {
							$display_name = (string) $adh_post->post_title;
							$prenom       = $display_name;
							$nom          = '';
						}

						$parent_user = array(
							'id'           => (int) $user->ID,
							'display_name' => (string) $user->display_name,
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

				// Récupération des groupes dame_group et des cours assignés pour l'élève.
				$student_groups      = array();
				$assigned_course_ids = array();

				if ( 'member' === $identity_type && $adherent_id > 0 ) {
					if ( taxonomy_exists( 'dame_group' ) ) {
						$terms = wp_get_object_terms( $adherent_id, 'dame_group' );
						if ( is_array( $terms ) && ! empty( $terms ) ) {
							foreach ( $terms as $t ) {
								if ( $t instanceof \WP_Term ) {
									$student_groups[] = array(
										'id'   => (int) $t->term_id,
										'name' => html_entity_decode( (string) $t->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
										'slug' => (string) $t->slug,
									);
								}
							}
						}
					}

					$group_ids = array_column( $student_groups, 'id' );
					foreach ( $restricted_courses as $rc ) {
						if ( in_array( $adherent_id, $rc['members'], true ) || ! empty( array_intersect( $group_ids, $rc['groups'] ) ) ) {
							$assigned_course_ids[] = $rc['id'];
						}
					}
				}

				$groupe[] = array(
					'id'                  => $user->ID . '__' . $key,
					'display_id'          => $display_id,
					'identity_type'       => $identity_type,
					'parent_user'         => $parent_user,
					'nom'                 => $nom,
					'prenom'              => $prenom,
					'display_name'        => $display_name,
					'groups'              => $student_groups,
					'assigned_course_ids' => $assigned_course_ids,
					'elements_valides'    => $elements_valides,
					'details'             => (object) $details,
				);
			}
		}

		return $groupe;
	}

	/**
	 * Réinitialise la progression d'un élève pour un cours ou un élément.
	 *
	 * @param int      $student_id WordPress User ID.
	 * @param string   $meta_key   Progression meta key.
	 * @param int|null $course_id  Course ID.
	 * @param int|null $element_id Element ID.
	 * @return bool True if reset performed.
	 */
	public function reset_progression_cours(
		int $student_id,
		string $meta_key,
		?int $course_id = null,
		?int $element_id = null
	): bool {
		$playlist_ids = array();

		if ( null !== $element_id && $element_id > 0 ) {
			$playlist_ids[] = $element_id;
		} elseif ( null !== $course_id && $course_id > 0 ) {
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
			return false;
		}

		$meta_entries = get_user_meta( $student_id, $meta_key, false );
		delete_user_meta( $student_id, $meta_key );

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

		return true;
	}

	/**
	 * Récupère les adhérents DAME non suivis.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function obtenir_candidats_eleves(): array {
		global $wpdb;

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
				$adh_fn = (string) get_post_meta( $post->ID, '_dame_first_name', true );
				$adh_pr = (string) get_post_meta( $post->ID, '_dame_prenom', true );
				$prenom = ! empty( $adh_fn ) ? $adh_fn : $adh_pr;

				$adh_ln = (string) get_post_meta( $post->ID, '_dame_last_name', true );
				$adh_bn = (string) get_post_meta( $post->ID, '_dame_birth_name', true );
				$adh_no = (string) get_post_meta( $post->ID, '_dame_nom', true );
				$nom    = ! empty( $adh_ln ) ? $adh_ln : ( ! empty( $adh_bn ) ? $adh_bn : $adh_no );

				$email     = (string) get_post_meta( $post->ID, '_dame_email', true );
				$full_name = trim( $prenom . ' ' . $nom );
				if ( empty( $full_name ) ) {
					$full_name = (string) $post->post_title;
				}

				$birth_date = (string) get_post_meta( $post->ID, '_dame_birth_date', true );
				$rep_fname  = (string) get_post_meta( $post->ID, '_dame_legal_rep_1_first_name', true );
				$rep_lname  = (string) get_post_meta( $post->ID, '_dame_legal_rep_1_last_name', true );
				$legal_rep  = trim( $rep_fname . ' ' . $rep_lname );

				$candidats[] = array(
					'id'           => (int) $post->ID,
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

		return $candidats;
	}

	/**
	 * Ajoute un élève dans la liste de suivi.
	 *
	 * @param int $adherent_id Adhérent post ID.
	 * @return array<string, mixed>|WP_Error
	 */
	public function ajouter_eleve_suivi( int $adherent_id ): array|WP_Error {
		$post = get_post( $adherent_id );
		if ( ! $post || 'adherent' !== $post->post_type ) {
			return new WP_Error(
				'adherent_not_found',
				__( 'Adhérent non trouvé dans DAME.', 'roi' ),
				array( 'status' => 404 )
			);
		}

		$user = null;

		$meta_wp_user     = (int) get_post_meta( $adherent_id, '_dame_wp_user_id', true );
		$meta_linked_user = (int) get_post_meta( $adherent_id, '_dame_linked_wp_user', true );
		$meta_user        = (int) get_post_meta( $adherent_id, '_dame_user_id', true );
		$linked_user_id   = $meta_wp_user > 0 ? $meta_wp_user : ( $meta_linked_user > 0 ? $meta_linked_user : $meta_user );

		if ( $linked_user_id > 0 ) {
			$found = get_user_by( 'ID', $linked_user_id );
			if ( $found instanceof WP_User ) {
				$user = $found;
			}
		}

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

		$adh_email = (string) get_post_meta( $adherent_id, '_dame_email', true );
		if ( ! $user && ! empty( $adh_email ) ) {
			$found = get_user_by( 'email', $adh_email );
			if ( $found instanceof WP_User ) {
				$user = $found;
			}
		}

		$rep1_email = (string) get_post_meta( $adherent_id, '_dame_legal_rep_1_email', true );
		if ( ! $user && ! empty( $rep1_email ) ) {
			$found = get_user_by( 'email', $rep1_email );
			if ( $found instanceof WP_User ) {
				$user = $found;
			}
		}

		$rep2_email = (string) get_post_meta( $adherent_id, '_dame_legal_rep_2_email', true );
		if ( ! $user && ! empty( $rep2_email ) ) {
			$found = get_user_by( 'email', $rep2_email );
			if ( $found instanceof WP_User ) {
				$user = $found;
			}
		}

		if ( ! $user ) {
			$meta_fn   = (string) get_post_meta( $adherent_id, '_dame_first_name', true );
			$meta_pr   = (string) get_post_meta( $adherent_id, '_dame_prenom', true );
			$adh_fname = ! empty( $meta_fn ) ? $meta_fn : $meta_pr;

			$meta_ln   = (string) get_post_meta( $adherent_id, '_dame_last_name', true );
			$meta_no   = (string) get_post_meta( $adherent_id, '_dame_nom', true );
			$adh_lname = ! empty( $meta_ln ) ? $meta_ln : $meta_no;

			$login           = sanitize_user( 'eleve_' . $adherent_id, true );
			$email_candidate = ! empty( $rep1_email ) ? $rep1_email : ( ! empty( $adh_email ) ? $adh_email : '' );
			$email           = ( ! empty( $email_candidate ) && ! email_exists( $email_candidate ) ) ? $email_candidate : 'eleve_' . $adherent_id . '@club.local';

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

		if ( ! $user instanceof WP_User ) {
			return new WP_Error(
				'user_association_failed',
				__( 'Impossible d\'associer un compte utilisateur.', 'roi' ),
				array( 'status' => 500 )
			);
		}

		$meta_key = '_roi_element_valide_member_' . $adherent_id;
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

		$meta_fn = (string) get_post_meta( $adherent_id, '_dame_first_name', true );
		$meta_pr = (string) get_post_meta( $adherent_id, '_dame_prenom', true );
		$prenom  = ! empty( $meta_fn ) ? $meta_fn : $meta_pr;

		$meta_ln = (string) get_post_meta( $adherent_id, '_dame_last_name', true );
		$meta_bn = (string) get_post_meta( $adherent_id, '_dame_birth_name', true );
		$meta_no = (string) get_post_meta( $adherent_id, '_dame_nom', true );
		$nom     = ! empty( $meta_ln ) ? $meta_ln : ( ! empty( $meta_bn ) ? $meta_bn : $meta_no );

		$display_name = trim( $prenom . ' ' . $nom );
		if ( empty( $display_name ) ) {
			$display_name = (string) $post->post_title;
		}

		return array(
			'id'               => $user->ID . '__' . $meta_key,
			'display_id'       => $adherent_id,
			'identity_type'    => 'member',
			'parent_user'      => array(
				'id'           => (int) $user->ID,
				'display_name' => (string) $user->display_name,
			),
			'nom'              => $nom,
			'prenom'           => $prenom,
			'display_name'     => $display_name,
			'elements_valides' => array(),
			'details'          => (object) array(),
		);
	}

	/**
	 * Supprime le suivi d'un élève.
	 *
	 * @param int    $user_id  WordPress user ID.
	 * @param string $meta_key Meta key.
	 * @return void
	 */
	public function retirer_eleve_suivi( int $user_id, string $meta_key ): void {
		delete_user_meta( $user_id, $meta_key );
	}

	/**
	 * Assigne ou désassigne un cours à un adhérent.
	 *
	 * @param int    $adherent_id Adhérent ID.
	 * @param int    $cours_id    Cours ID.
	 * @param string $action      'assign' or 'unassign'.
	 * @return array<string, mixed>|WP_Error
	 */
	public function assigner_cours_eleve( int $adherent_id, int $cours_id, string $action = 'assign' ): array|WP_Error {
		$cours_post = get_post( $cours_id );
		if ( ! $cours_post || 'roi_cours' !== $cours_post->post_type ) {
			return new WP_Error(
				'course_not_found',
				__( 'Cours introuvable.', 'roi' ),
				array( 'status' => 404 )
			);
		}

		$raw_members    = get_post_meta( $cours_id, '_roi_cours_target_members', true );
		$target_members = array();
		if ( is_string( $raw_members ) && '' !== $raw_members ) {
			$decoded = json_decode( $raw_members, true );
			if ( is_array( $decoded ) ) {
				$target_members = array_map( 'intval', $decoded );
			}
		}

		if ( 'assign' === $action ) {
			if ( ! in_array( $adherent_id, $target_members, true ) ) {
				$target_members[] = $adherent_id;
			}
			update_post_meta( $cours_id, '_roi_cours_audience_type', 'restricted' );
		} else {
			$target_members = array_values( array_diff( $target_members, array( $adherent_id ) ) );
		}

		$sanitized_members = array_values( array_unique( $target_members ) );
		update_post_meta( $cours_id, '_roi_cours_target_members', wp_json_encode( $sanitized_members ) );

		return array(
			'cours_id'       => $cours_id,
			'adherent_id'    => $adherent_id,
			'target_members' => $sanitized_members,
		);
	}

	/**
	 * Récupère les groupes dame_group actifs.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function obtenir_groupes_eleves(): array {
		$groups = array();
		if ( taxonomy_exists( 'dame_group' ) ) {
			$terms = get_terms(
				array(
					'taxonomy'   => 'dame_group',
					'hide_empty' => false,
				)
			);
			if ( is_array( $terms ) ) {
				foreach ( $terms as $t ) {
					if ( $t instanceof \WP_Term ) {
						$groups[] = array(
							'id'    => (int) $t->term_id,
							'name'  => html_entity_decode( (string) $t->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
							'slug'  => (string) $t->slug,
							'count' => (int) $t->count,
						);
					}
				}
			}
		}
		return $groups;
	}
}
