<?php
/**
 * REST API Parcours Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

use ROI\CPT\Chapitre_Taxonomy;
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
	 * Transient cache key for raw courses.
	 *
	 * @var string
	 */
	public const CACHE_KEY = 'roi_parcours_raw_courses';

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

		// Cache invalidation hooks.
		add_action( 'save_post_roi_cours', array( self::class, 'delete_parcours_cache' ) );
		add_action( 'save_post_roi_exercice', array( self::class, 'delete_parcours_cache' ) );
		add_action( 'save_post_roi_lecon', array( self::class, 'delete_parcours_cache' ) );
		add_action( 'save_post_roi_video', array( self::class, 'delete_parcours_cache' ) );
		add_action( 'deleted_post', array( self::class, 'on_post_deleted' ) );
		add_action( 'trash_post', array( self::class, 'on_post_deleted' ) );
		add_action( 'untrash_post', array( self::class, 'on_post_deleted' ) );
		add_action( 'created_roi_chapitre', array( self::class, 'delete_parcours_cache' ) );
		add_action( 'edited_roi_chapitre', array( self::class, 'delete_parcours_cache' ) );
		add_action( 'delete_roi_chapitre', array( self::class, 'delete_parcours_cache' ) );
	}

	/**
	 * Deletes the parcours courses transient cache.
	 *
	 * @return void
	 */
	public static function delete_parcours_cache(): void {
		delete_transient( self::CACHE_KEY );
	}

	/**
	 * Deletes the parcours cache when an ROI post is deleted or trashed.
	 *
	 * @param int $post_id Post ID being deleted or trashed.
	 * @return void
	 */
	public static function on_post_deleted( int $post_id ): void {
		$post_type = get_post_type( $post_id );
		if ( in_array( $post_type, array( 'roi_cours', 'roi_exercice', 'roi_lecon', 'roi_video' ), true ) ) {
			self::delete_parcours_cache();
		}
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
	 * Retrieves or builds the complete raw courses catalog with transient cache.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_raw_courses(): array {
		$cached = get_transient( self::CACHE_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$args = array(
			'post_type'      => 'roi_cours',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
		);

		$query = new WP_Query( $args );
		if ( ! $query->have_posts() ) {
			return array();
		}

		// First pass: collect posts and all playlist item IDs across all courses.
		$raw_posts_data = array();
		$all_item_ids   = array();

		while ( $query->have_posts() ) {
			$query->the_post();
			$post_id = get_the_ID();
			$post    = get_post( $post_id );
			if ( ! $post ) {
				continue;
			}

			$playlist_meta = get_post_meta( $post_id, '_roi_cours_playlist', true );
			$raw_items     = array();
			if ( is_string( $playlist_meta ) && '' !== $playlist_meta ) {
				$decoded = json_decode( $playlist_meta, true );
				if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $decoded ) ) {
					$decoded = json_decode( wp_unslash( $playlist_meta ), true );
				}
				if ( is_array( $decoded ) ) {
					$raw_items = $decoded;
					foreach ( $decoded as $item ) {
						if ( isset( $item['id'] ) && is_numeric( $item['id'] ) ) {
							$all_item_ids[] = (int) $item['id'];
						}
					}
				}
			}

			$raw_posts_data[] = array(
				'post'      => $post,
				'raw_items' => $raw_items,
			);
		}
		wp_reset_postdata();

		// Bulk prime post caches in 1 single SQL query to prevent N+1 queries.
		if ( ! empty( $all_item_ids ) ) {
			_prime_post_caches( array_unique( $all_item_ids ), false, false );
		}

		// Second pass: resolve playlist item details and course attributes.
		$courses_data = array();
		foreach ( $raw_posts_data as $data ) {
			$post    = $data['post'];
			$post_id = (int) $post->ID;
			$ordre   = (int) $post->menu_order;

			// Audience.
			$audience_type = (string) get_post_meta( $post_id, '_roi_cours_audience_type', true );
			if ( empty( $audience_type ) ) {
				$audience_type = 'all';
			}

			$raw_target_groups = get_post_meta( $post_id, '_roi_cours_target_groups', true );
			$target_groups     = array();
			if ( is_string( $raw_target_groups ) && '' !== $raw_target_groups ) {
				$decoded = json_decode( $raw_target_groups, true );
				if ( is_array( $decoded ) ) {
					$target_groups = array_map( 'intval', $decoded );
				}
			}

			$raw_target_members = get_post_meta( $post_id, '_roi_cours_target_members', true );
			$target_members     = array();
			if ( is_string( $raw_target_members ) && '' !== $raw_target_members ) {
				$decoded = json_decode( $raw_target_members, true );
				if ( is_array( $decoded ) ) {
					$target_members = array_map( 'intval', $decoded );
				}
			}

			// Niveau.
			$niveau_meta = get_post_meta( $post_id, '_roi_cours_niveau', true );
			$niveau      = is_numeric( $niveau_meta ) ? (int) $niveau_meta : 1;

			// Playlist.
			$playlist = array();
			foreach ( $data['raw_items'] as $item ) {
				if ( isset( $item['id'] ) ) {
					$item_id     = (int) $item['id'];
					$item_status = get_post_status( $item_id );
					if ( 'publish' === $item_status ) {
						$item['titre']    = html_entity_decode( (string) get_the_title( $item_id ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
						$item['modified'] = (string) get_post_field( 'post_modified', $item_id );
						$playlist[]       = $item;
					}
				}
			}

			// Chapitre info.
			$chapitre_nom     = '';
			$chapitre_couleur = '';
			$terms            = get_the_terms( $post_id, 'roi_chapitre' );
			if ( is_array( $terms ) && ! empty( $terms ) ) {
				$term             = $terms[0];
				$chapitre_nom     = html_entity_decode( (string) $term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
				$chapitre_couleur = (string) get_term_meta( $term->term_id, '_roi_chapitre_couleur', true );
			}

			$courses_data[] = array(
				'id'               => $post_id,
				'titre'            => html_entity_decode( (string) $post->post_title, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'niveau'           => $niveau,
				'playlist'         => $playlist,
				'chapitre_nom'     => $chapitre_nom,
				'chapitre_couleur' => $chapitre_couleur,
				'ordre'            => $ordre,
				'audience_type'    => $audience_type,
				'target_groups'    => $target_groups,
				'target_members'   => $target_members,
			);
		}

		// Sort courses strictly by Level, Chapitre (Predefined Order), and Ordre.
		usort(
			$courses_data,
			function ( array $a, array $b ): int {
				// 1. Niveau.
				if ( $a['niveau'] !== $b['niveau'] ) {
					return $a['niveau'] <=> $b['niveau'];
				}

				// 2. Chapitre (Strict predefined order via Chapitre_Taxonomy).
				$pos_a = Chapitre_Taxonomy::get_chapter_order( $a['chapitre_nom'] );
				$pos_b = Chapitre_Taxonomy::get_chapter_order( $b['chapitre_nom'] );
				if ( $pos_a !== $pos_b ) {
					return $pos_a <=> $pos_b;
				}

				// 3. Ordre.
				return $a['ordre'] <=> $b['ordre'];
			}
		);

		set_transient( self::CACHE_KEY, $courses_data, DAY_IN_SECONDS );

		return $courses_data;
	}

	/**
	 * Get courses structure and playlists.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response
	 */
	public function get_parcours( WP_REST_Request $request ): WP_REST_Response {
		$user                = wp_get_current_user();
		$roles               = (array) $user->roles;
		$is_trainer_or_admin = in_array( 'administrator', $roles, true ) || in_array( 'entraineur', $roles, true );

		// Identifier l'adhérent actif via l'en-tête X-Selected-Identity ou le compte utilisateur.
		$selected_identity  = (string) $request->get_header( 'X-Selected-Identity' );
		$active_adherent_id = 0;
		if ( ! empty( $selected_identity ) && str_starts_with( $selected_identity, 'member_' ) ) {
			$active_adherent_id = (int) str_replace( 'member_', '', $selected_identity );
		} elseif ( ! empty( $selected_identity ) && is_numeric( $selected_identity ) ) {
			$active_adherent_id = (int) $selected_identity;
		}

		if ( $active_adherent_id <= 0 && $user->ID > 0 ) {
			$meta_adh = get_user_meta( $user->ID, '_dame_adherent_id', true );
			if ( ! empty( $meta_adh ) && is_numeric( $meta_adh ) ) {
				$active_adherent_id = (int) $meta_adh;
			}
		}

		// Récupérer les groupes associés à l'adhérent actif (taxonomie dame_group).
		$student_group_ids = array();
		if ( $active_adherent_id > 0 && taxonomy_exists( 'dame_group' ) ) {
			$terms = wp_get_object_terms( $active_adherent_id, 'dame_group', array( 'fields' => 'ids' ) );
			if ( is_array( $terms ) && ! empty( $terms ) ) {
				$student_group_ids = array_map( 'intval', $terms );
			}
		}

		$raw_courses = $this->get_raw_courses();
		$cours       = array();

		foreach ( $raw_courses as $item ) {
			$audience_type          = $item['audience_type'];
			$target_groups          = $item['target_groups'];
			$target_members         = $item['target_members'];
			$is_assigned            = ( 'restricted' === $audience_type );
			$unlocked_by_assignment = false;

			// Audience verification.
			if ( ! $is_trainer_or_admin ) {
				if ( 'restricted' === $audience_type ) {
					$in_group  = ! empty( array_intersect( $student_group_ids, $target_groups ) );
					$is_member = ( $active_adherent_id > 0 && in_array( $active_adherent_id, $target_members, true ) );

					if ( ! $in_group && ! $is_member ) {
						// L'élève ne fait pas partie des cibles de ce cours.
						continue;
					}
					$unlocked_by_assignment = true;
				}
			} else {
				$unlocked_by_assignment = $is_assigned;
			}

			$item['is_assigned']            = $is_assigned;
			$item['unlocked_by_assignment'] = $unlocked_by_assignment;

			$cours[] = $item;
		}

		return new WP_REST_Response( $cours, 200 );
	}
}
