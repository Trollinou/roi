<?php
/**
 * Roster Service for Student Tracking and Course Assignment.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Services\Progression;

use WP_User;
use WP_Error;

/**
 * Class Roster_Service
 * Handles candidate discovery, adding/removing students from tracking, course assignments, and student groups.
 */
class Roster_Service {

	/**
	 * Récupère les adhérents DAME non suivis.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function obtenir_candidats_eleves(): array {
		global $wpdb;

		$cached_keys = wp_cache_get( 'roi_tracked_adherent_meta_keys', 'roi_chess' );
		if ( false !== $cached_keys && is_array( $cached_keys ) ) {
			$existing_keys = $cached_keys;
		} else {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$existing_keys = $wpdb->get_col(
				$wpdb->prepare(
					"SELECT DISTINCT meta_key FROM {$wpdb->usermeta} WHERE meta_key LIKE %s",
					'_roi_element_valide_member_%'
				)
			);
			if ( is_array( $existing_keys ) ) {
				wp_cache_set( 'roi_tracked_adherent_meta_keys', $existing_keys, 'roi_chess', 3600 );
			}
		}

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
				// phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- Candidate members list for coach tracking.
				'posts_per_page' => 200,
				'no_found_rows'  => true,
				'orderby'        => 'title',
				'order'          => 'ASC',
			);
			if ( ! empty( $tracked_adherent_ids ) ) {
				$args['post__not_in'] = $tracked_adherent_ids;
			}

			$posts = get_posts( $args );
			foreach ( $posts as $post ) {
				$first_name = (string) get_post_meta( $post->ID, '_dame_first_name', true );
				$prenom     = '' !== $first_name ? $first_name : (string) get_post_meta( $post->ID, '_dame_prenom', true );
				$last_name  = (string) get_post_meta( $post->ID, '_dame_last_name', true );
				$birth_name = (string) get_post_meta( $post->ID, '_dame_birth_name', true );
				$nom        = '' !== $last_name ? $last_name : ( '' !== $birth_name ? $birth_name : (string) get_post_meta( $post->ID, '_dame_nom', true ) );
				$email      = (string) get_post_meta( $post->ID, '_dame_email', true );
				$full_name  = trim( $prenom . ' ' . $nom );
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

		$meta_user_id = (int) get_post_meta( $adherent_id, '_dame_wp_user_id', true );
		if ( $meta_user_id <= 0 ) {
			$meta_user_id = (int) get_post_meta( $adherent_id, '_dame_linked_wp_user', true );
		}
		if ( $meta_user_id <= 0 ) {
			$meta_user_id = (int) get_post_meta( $adherent_id, '_dame_user_id', true );
		}
		$linked_user_id = $meta_user_id;

		if ( $linked_user_id > 0 ) {
			$found = get_user_by( 'ID', $linked_user_id );
			if ( $found instanceof WP_User ) {
				$user = $found;
			}
		}

		if ( ! $user ) {
			$users_with_meta = get_users(
				array(
					// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key, WordPress.DB.SlowDBQuery.slow_db_query_meta_value
					'meta_key'   => '_dame_adherent_id',
					'meta_value' => (string) $adherent_id,
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
			$fname_meta      = (string) get_post_meta( $adherent_id, '_dame_first_name', true );
			$adh_fname       = '' !== $fname_meta ? $fname_meta : (string) get_post_meta( $adherent_id, '_dame_prenom', true );
			$lname_meta      = (string) get_post_meta( $adherent_id, '_dame_last_name', true );
			$adh_lname       = '' !== $lname_meta ? $lname_meta : (string) get_post_meta( $adherent_id, '_dame_nom', true );
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
			wp_cache_delete( 'roi_tracked_adherent_meta_keys', 'roi_chess' );
			Group_Service::flush_group_progression_cache();
		}

		$f_name       = (string) get_post_meta( $adherent_id, '_dame_first_name', true );
		$prenom       = '' !== $f_name ? $f_name : (string) get_post_meta( $adherent_id, '_dame_prenom', true );
		$l_name       = (string) get_post_meta( $adherent_id, '_dame_last_name', true );
		$b_name       = (string) get_post_meta( $adherent_id, '_dame_birth_name', true );
		$nom          = '' !== $l_name ? $l_name : ( '' !== $b_name ? $b_name : (string) get_post_meta( $adherent_id, '_dame_nom', true ) );
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
		wp_cache_delete( 'roi_tracked_adherent_meta_keys', 'roi_chess' );
		Group_Service::flush_group_progression_cache();
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
		Group_Service::flush_group_progression_cache();

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

