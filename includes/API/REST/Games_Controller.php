<?php
/**
 * REST API Games Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\API\REST;

use WP_Query;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * Class Games_Controller
 * Handles saving chess games played in the PWA.
 */
class Games_Controller {

	/**
	 * Namespace for the API.
	 *
	 * @var non-falsy-string
	 */
	protected string $namespace = 'roi/v1';

	/**
	 * Base path for the resource.
	 *
	 * @var string
	 */
	protected string $rest_base = 'games';

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
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_game' ),
					'permission_callback' => array( $this, 'save_game_permissions_check' ),
					'args'                => array(
						'member_id'        => array(
							'description'       => __( 'ID du membre ayant joué la partie.', 'roi' ),
							'type'              => 'integer',
							'required'          => false,
							'default'           => 0,
							'validate_callback' => static function ( $param ): bool {
								return is_numeric( $param ) && (int) $param >= 0;
							},
							'sanitize_callback' => 'absint',
						),
						'difficulty_level' => array(
							'description'       => __( 'Niveau de difficulté (1 à 8).', 'roi' ),
							'type'              => 'integer',
							'required'          => false,
							'default'           => 1,
							'sanitize_callback' => 'absint',
						),
						'hints_count'      => array(
							'description'       => __( 'Nombre d\'indices utilisés.', 'roi' ),
							'type'              => 'integer',
							'required'          => false,
							'default'           => 0,
							'sanitize_callback' => 'absint',
						),
						'takebacks_count'  => array(
							'description'       => __( 'Nombre de retours arrière effectués.', 'roi' ),
							'type'              => 'integer',
							'required'          => false,
							'default'           => 0,
							'sanitize_callback' => 'absint',
						),
						'pgn'              => array(
							'description'       => __( 'Notation PGN de la partie.', 'roi' ),
							'type'              => 'string',
							'required'          => true,
							'validate_callback' => static function ( $param ): bool {
								return is_string( $param ) && '' !== trim( $param );
							},
							'sanitize_callback' => 'sanitize_textarea_field',
						),
						'duration'         => array(
							'description'       => __( 'Durée de la partie en secondes.', 'roi' ),
							'type'              => 'integer',
							'required'          => false,
							'default'           => 0,
							'sanitize_callback' => 'absint',
						),
						'game_date'        => array(
							'description'       => __( 'Date ISO de la partie.', 'roi' ),
							'type'              => 'string',
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_games' ),
					'permission_callback' => array( $this, 'get_games_permissions_check' ),
					'args'                => array(
						'member_id' => array(
							'description'       => __( 'ID du membre pour filtrer les parties.', 'roi' ),
							'type'              => 'integer',
							'required'          => false,
							'sanitize_callback' => 'absint',
						),
						'per_page'  => array(
							'description'       => __( 'Nombre de parties par page.', 'roi' ),
							'type'              => 'integer',
							'default'           => 10,
							'sanitize_callback' => 'absint',
						),
						'page'      => array(
							'description'       => __( 'Numéro de la page.', 'roi' ),
							'type'              => 'integer',
							'default'           => 1,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);
	}

	/**
	 * Permission callback for the endpoint.
	 *
	 * @return bool|WP_Error
	 */
	public function save_game_permissions_check(): bool|WP_Error {
		return Permissions_Helper::check_apprentissage_access();
	}

	/**
	 * Saves a chess game played in the PWA.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_game( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$member_id         = (int) $request->get_param( 'member_id' );
		$selected_identity = (string) $request->get_header( 'X-Selected-Identity' );
		$current_user      = wp_get_current_user();
		$difficulty_level  = (int) $request->get_param( 'difficulty_level' );
		$hints_count       = (int) $request->get_param( 'hints_count' );
		$takebacks_count   = (int) $request->get_param( 'takebacks_count' );
		$pgn               = sanitize_textarea_field( (string) $request->get_param( 'pgn' ) );
		$duration          = (int) $request->get_param( 'duration' );
		$game_date_raw     = sanitize_text_field( (string) $request->get_param( 'game_date' ) );

		// 1. Si member_id absent ou 0, déduction depuis l'en-tête X-Selected-Identity.
		if ( $member_id <= 0 && ! empty( $selected_identity ) ) {
			if ( str_starts_with( $selected_identity, 'member_' ) ) {
				$member_id = (int) str_replace( 'member_', '', $selected_identity );
			} elseif ( is_numeric( $selected_identity ) ) {
				$member_id = (int) $selected_identity;
			}
		}

		// 2. Repli éventuel sur le lien adhérent du compte WordPress (_dame_adherent_id).
		if ( $member_id <= 0 && $current_user->ID > 0 ) {
			$meta_adh = (int) get_user_meta( $current_user->ID, '_dame_adherent_id', true );
			if ( $meta_adh > 0 ) {
				$member_id = $meta_adh;
			}
		}

		// 3. Validation des permissions selon le cas (Adhérent CPT vs Admin wp_virtual).
		$player_name = (string) $current_user->display_name;

		if ( $member_id > 0 ) {
			$member = get_post( $member_id );
			if ( ! $member || 'adherent' !== $member->post_type ) {
				return new WP_Error( 'member_not_found', __( 'Membre non trouvé.', 'roi' ), array( 'status' => 404 ) );
			}
			if ( ! Permissions_Helper::can_access_member( $member_id ) ) {
				return new WP_Error( 'rest_forbidden', __( 'Accès refusé pour ce membre.', 'roi' ), array( 'status' => 403 ) );
			}
			$player_name = (string) $member->post_title;
		} elseif ( ! Permissions_Helper::is_trainer_or_admin() ) {
			// Si member_id est 0, seuls les administrateurs et entraîneurs sont autorisés.
			return new WP_Error( 'invalid_member', __( 'ID de membre invalide.', 'roi' ), array( 'status' => 400 ) );
		}

		// Contrôle anti-doublons rapide : comparer le PGN sur les 5 dernières parties du membre uniquement (évite un JOIN SQL sur LONGTEXT _roi_pgn).
		$recent_game_ids = get_posts(
			array(
				'post_type'      => 'roi_partie',
				'posts_per_page' => 5,
				'fields'         => 'ids',
				'no_found_rows'  => true,
				'orderby'        => 'ID',
				'order'          => 'DESC',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'     => array(
					array(
						'key'   => '_roi_member_id',
						'value' => $member_id,
						'type'  => 'NUMERIC',
					),
				),
			)
		);

		if ( ! empty( $recent_game_ids ) ) {
			update_meta_cache( 'post', $recent_game_ids );
			foreach ( $recent_game_ids as $recent_id ) {
				$existing_pgn = (string) get_post_meta( (int) $recent_id, '_roi_pgn', true );
				if ( trim( $existing_pgn ) === trim( $pgn ) ) {
					return rest_ensure_response(
						array(
							'success' => true,
							'id'      => (int) $recent_id,
							'message' => __( 'Partie déjà enregistrée.', 'roi' ),
						)
					);
				}
			}
		}

		// Formater la date fournie ou repli sur l'instant présent.
		$timestamp = ! empty( $game_date_raw ) && is_string( $game_date_raw ) && false !== strtotime( $game_date_raw )
			? (int) strtotime( $game_date_raw )
			: time();

		$post_date     = (string) wp_date( 'Y-m-d H:i:s', $timestamp ); // Heure locale du site.
		$post_date_gmt = (string) gmdate( 'Y-m-d H:i:s', $timestamp );  // Heure UTC.
		$date_str      = (string) wp_date( 'd/m/Y H:i', $timestamp );   // Titre formaté directement sans double décalage.

		// 4. Titre de la partie adapté.
		$post_title = sprintf( 'Partie de %s - %s', $player_name, $date_str );

		$post_id = wp_insert_post(
			array(
				'post_type'     => 'roi_partie',
				'post_status'   => 'publish',
				'post_title'    => $post_title,
				'post_content'  => '',
				'post_author'   => $current_user->ID,
				'post_date'     => $post_date,
				'post_date_gmt' => $post_date_gmt,
			),
			true
		);

		if ( is_wp_error( $post_id ) || 0 === $post_id ) {
			return new WP_Error( 'db_error', __( 'Erreur lors de l\'enregistrement en base de données.', 'roi' ), array( 'status' => 500 ) );
		}

		// Sauvegarde des métadonnées avec préfixe _roi_.
		update_post_meta( $post_id, '_roi_member_id', $member_id );
		update_post_meta( $post_id, '_roi_difficulty_level', $difficulty_level );
		update_post_meta( $post_id, '_roi_hints_count', $hints_count );
		update_post_meta( $post_id, '_roi_takebacks_count', $takebacks_count );
		update_post_meta( $post_id, '_roi_pgn', $pgn );
		update_post_meta( $post_id, '_roi_game_duration', $duration );
		update_post_meta( $post_id, '_roi_game_date', $post_date );

		return rest_ensure_response(
			array(
				'success' => true,
				'id'      => $post_id,
				'message' => __( 'Partie enregistrée avec succès.', 'roi' ),
			)
		);
	}

	/**
	 * Permission callback for reading games list.
	 *
	 * @return bool|WP_Error
	 */
	public function get_games_permissions_check(): bool|WP_Error {
		return Permissions_Helper::check_apprentissage_access();
	}

	/**
	 * Retrieves a paginated list of saved games.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_games( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$member_id = (int) $request->get_param( 'member_id' );
		$per_page  = $request->get_param( 'per_page' ) ? (int) $request->get_param( 'per_page' ) : 10;
		$page      = $request->get_param( 'page' ) ? (int) $request->get_param( 'page' ) : 1;

		if ( $per_page < 1 ) {
			$per_page = 10;
		}
		if ( $per_page > 100 ) {
			$per_page = 100;
		}
		if ( $page < 1 ) {
			$page = 1;
		}

		$query_args = array(
			'post_type'      => 'roi_partie',
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => 'date',
			'order'          => 'DESC',
		);

		if ( $member_id > 0 ) {
			if ( ! Permissions_Helper::can_access_member( $member_id ) ) {
				return new WP_Error( 'rest_forbidden', __( 'Accès refusé aux parties de ce membre.', 'roi' ), array( 'status' => 403 ) );
			}
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			$query_args['meta_query'] = array(
				array(
					'key'   => '_roi_member_id',
					'value' => $member_id,
					'type'  => 'NUMERIC',
				),
			);
		} elseif ( ! Permissions_Helper::is_trainer_or_admin() ) {
			$linked_member = (int) get_user_meta( get_current_user_id(), '_dame_adherent_id', true );
			if ( $linked_member <= 0 ) {
				return rest_ensure_response(
					array(
						'games'       => array(),
						'total'       => 0,
						'total_pages' => 0,
						'page'        => $page,
						'per_page'    => $per_page,
					)
				);
			}
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			$query_args['meta_query'] = array(
				array(
					'key'   => '_roi_member_id',
					'value' => $linked_member,
					'type'  => 'NUMERIC',
				),
			);
		}

		$query = new WP_Query( $query_args );

		$games = array();
		if ( $query->have_posts() && is_array( $query->posts ) ) {
			foreach ( $query->posts as $post ) {
				if ( ! $post instanceof \WP_Post ) {
					continue;
				}

				$game_id   = $post->ID;
				$game_date = (string) get_post_meta( $game_id, '_roi_game_date', true );
				$games[]   = array(
					'id'               => $game_id,
					'title'            => $post->post_title,
					'date'             => '' !== $game_date ? $game_date : $post->post_date,
					'member_id'        => (int) get_post_meta( $game_id, '_roi_member_id', true ),
					'difficulty_level' => (int) get_post_meta( $game_id, '_roi_difficulty_level', true ),
					'hints_count'      => (int) get_post_meta( $game_id, '_roi_hints_count', true ),
					'takebacks_count'  => (int) get_post_meta( $game_id, '_roi_takebacks_count', true ),
					'duration'         => (int) get_post_meta( $game_id, '_roi_game_duration', true ),
					'pgn'              => (string) get_post_meta( $game_id, '_roi_pgn', true ),
				);
			}
		}

		$total_posts = (int) $query->found_posts;
		$total_pages = (int) ceil( $total_posts / $per_page );

		$response_data = array(
			'games'       => $games,
			'total'       => $total_posts,
			'total_pages' => $total_pages,
			'page'        => $page,
			'per_page'    => $per_page,
		);

		return rest_ensure_response( $response_data );
	}
}
