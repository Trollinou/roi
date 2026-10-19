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
		$cache_key = 'roi_group_prog_v' . self::get_cache_version() . '_' . md5( (string) wp_json_encode( $allowed_roles ) );
		$cached    = wp_cache_get( $cache_key, 'roi_chess' );
		if ( false !== $cached && is_array( $cached ) ) {
			return $cached;
		}

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
				'no_found_rows'  => true,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'     => array(
					array(
						'key'   => '_roi_cours_audience_type',
						'value' => 'restricted',
					),
				),
			)
		);

		if ( ! empty( $restricted_courses_query ) ) {
			update_meta_cache( 'post', wp_list_pluck( $restricted_courses_query, 'ID' ) );
		}

		$restricted_courses = array();
		foreach ( $restricted_courses_query as $c_post ) {
			$raw_groups  = get_post_meta( $c_post->ID, '_roi_cours_target_groups', true );
			$c_groups    = ( is_string( $raw_groups ) && '' !== $raw_groups ) ? ( json_decode( $raw_groups, true ) ? json_decode( $raw_groups, true ) : array() ) : array();
			$raw_members = get_post_meta( $c_post->ID, '_roi_cours_target_members', true );
			$c_members   = ( is_string( $raw_members ) && '' !== $raw_members ) ? ( json_decode( $raw_members, true ) ? json_decode( $raw_members, true ) : array() ) : array();

			$restricted_courses[] = array(
				'id'      => (int) $c_post->ID,
				'groups'  => array_map( 'intval', (array) $c_groups ),
				'members' => array_map( 'intval', (array) $c_members ),
			);
		}

		if ( ! empty( $users ) ) {
			update_meta_cache( 'user', wp_list_pluck( $users, 'ID' ) );
		}

		// Première passe : collecter les clés de progression par utilisateur et tous les IDs d'adhérents pour un chargement groupé (_prime_post_caches).
		$user_prog_keys   = array();
		$all_adherent_ids = array();

		foreach ( $users as $user ) {
			if ( ! ( $user instanceof WP_User ) ) {
				continue;
			}
			$user_meta = get_user_meta( $user->ID );
			if ( ! is_array( $user_meta ) ) {
				continue;
			}

			$progression_keys = array();
			foreach ( $user_meta as $key => $val ) {
				if ( str_starts_with( (string) $key, '_roi_element_valide' ) ) {
					$progression_keys[] = (string) $key;
				}
			}

			$has_member_keys = false;
			foreach ( $progression_keys as $k ) {
				if ( str_starts_with( $k, '_roi_element_valide_member_' ) ) {
					$has_member_keys = true;
					$adh_id          = (int) str_replace( '_roi_element_valide_member_', '', $k );
					if ( $adh_id > 0 ) {
						$all_adherent_ids[] = $adh_id;
					}
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

			if ( ! empty( $progression_keys ) ) {
				$user_prog_keys[ $user->ID ] = $progression_keys;
			}
		}

		// Pré-chargement groupé des posts adhérents, de leurs métadonnées et de leurs termes dame_group (élimine le N+1).
		if ( ! empty( $all_adherent_ids ) ) {
			_prime_post_caches( array_values( array_unique( $all_adherent_ids ) ), true, true );
		}

		foreach ( $users as $user ) {
			if ( ! ( $user instanceof WP_User ) || empty( $user_prog_keys[ $user->ID ] ) ) {
				continue;
			}

			$progression_keys = $user_prog_keys[ $user->ID ];

			foreach ( $progression_keys as $key ) {
				$meta_entries     = get_user_meta( $user->ID, $key, false );
				$elements_valides = array();
				$details          = array();

				if ( is_array( $meta_entries ) ) {
					foreach ( $meta_entries as $entry ) {
						if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
							$elem_id = (int) $entry['element_id'];
							if ( $elem_id > 0 ) {
								$elements_valides[]  = $elem_id;
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
						$adh_post      = get_post( $adherent_id );
						$first_name    = (string) get_post_meta( $adherent_id, '_dame_first_name', true );
						$adh_prenom    = '' !== $first_name ? $first_name : (string) get_post_meta( $adherent_id, '_dame_prenom', true );
						$last_name     = (string) get_post_meta( $adherent_id, '_dame_last_name', true );
						$birth_name    = (string) get_post_meta( $adherent_id, '_dame_birth_name', true );
						$adh_nom       = '' !== $last_name ? $last_name : ( '' !== $birth_name ? $birth_name : (string) get_post_meta( $adherent_id, '_dame_nom', true ) );

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
						$terms = get_the_terms( $adherent_id, 'dame_group' );
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

		wp_cache_set( $cache_key, $groupe, 'roi_chess', 300 );

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
		$deleted_any  = false;

		if ( is_array( $meta_entries ) ) {
			foreach ( $meta_entries as $entry ) {
				if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
					$elem_id = (int) $entry['element_id'];
					if ( in_array( $elem_id, $playlist_ids, true ) ) {
						delete_user_meta( $student_id, $meta_key, $entry );
						$deleted_any = true;
					}
				}
			}
		}

		if ( $deleted_any ) {
			self::flush_group_progression_cache();
		}

		return true;
	}

	/**
	 * Roster service instance.
	 *
	 * @var Roster_Service|null
	 */
	private ?Roster_Service $roster_service = null;

	/**
	 * Get lazy-loaded Roster_Service instance.
	 *
	 * @return Roster_Service
	 */
	private function get_roster_service(): Roster_Service {
		if ( null === $this->roster_service ) {
			$this->roster_service = new Roster_Service();
		}
		return $this->roster_service;
	}

	/**
	 * Récupère les adhérents DAME non suivis.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function obtenir_candidats_eleves(): array {
		return $this->get_roster_service()->obtenir_candidats_eleves();
	}

	/**
	 * Ajoute un élève dans la liste de suivi.
	 *
	 * @param int $adherent_id Adhérent post ID.
	 * @return array<string, mixed>|WP_Error
	 */
	public function ajouter_eleve_suivi( int $adherent_id ): array|WP_Error {
		return $this->get_roster_service()->ajouter_eleve_suivi( $adherent_id );
	}

	/**
	 * Supprime le suivi d'un élève.
	 *
	 * @param int    $user_id  WordPress user ID.
	 * @param string $meta_key Meta key.
	 * @return void
	 */
	public function retirer_eleve_suivi( int $user_id, string $meta_key ): void {
		$this->get_roster_service()->retirer_eleve_suivi( $user_id, $meta_key );
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
		return $this->get_roster_service()->assigner_cours_eleve( $adherent_id, $cours_id, $action );
	}

	/**
	 * Récupère les groupes dame_group actifs.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function obtenir_groupes_eleves(): array {
		return $this->get_roster_service()->obtenir_groupes_eleves();
	}

	/**
	 * Returns the current cache version for group progression.
	 *
	 * @return int
	 */
	public static function get_cache_version(): int {
		$ver = wp_cache_get( 'roi_group_prog_ver', 'roi_chess' );
		if ( false === $ver || ! is_numeric( $ver ) ) {
			$ver = 1;
			wp_cache_set( 'roi_group_prog_ver', $ver, 'roi_chess', 3600 );
		}
		return (int) $ver;
	}

	/**
	 * Invalidates the group progression cache deterministically.
	 *
	 * @return void
	 */
	public static function flush_group_progression_cache(): void {
		$ver = self::get_cache_version() + 1;
		wp_cache_set( 'roi_group_prog_ver', $ver, 'roi_chess', 3600 );
	}
}
