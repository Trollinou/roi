<?php
/**
 * REST API Games Endpoint.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * Class Games
 * Handles saving chess games played in the PWA.
 */
class Games {

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
	protected string $rest_base = 'games';

	/**
	 * Initialize the class and register hooks.
	 */
	public function init(): void {
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Register the REST API routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'save_game' ],
					'permission_callback' => [ $this, 'save_game_permissions_check' ],
				],
			]
		);
	}

	/**
	 * Permission callback for the endpoint.
	 *
	 * @return bool|WP_Error
	 */
	public function save_game_permissions_check(): bool|WP_Error {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Vous devez être connecté.', 'roi' ),
				[ 'status' => 401 ]
			);
		}

		return true;
	}

	/**
	 * Saves a chess game played in the PWA.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_game( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$member_id        = (int) $request->get_param( 'member_id' );
		$difficulty_level = (int) $request->get_param( 'difficulty_level' );
		$hints_count      = (int) $request->get_param( 'hints_count' );
		$takebacks_count  = (int) $request->get_param( 'takebacks_count' );
		$pgn              = sanitize_textarea_field( (string) $request->get_param( 'pgn' ) );
		$duration         = (int) $request->get_param( 'duration' );
		$game_date_raw    = sanitize_text_field( (string) $request->get_param( 'game_date' ) );

		if ( $member_id <= 0 ) {
			return new WP_Error( 'invalid_member', __( 'ID de membre invalide.', 'roi' ), [ 'status' => 400 ] );
		}

		// Contrôle anti-doublons (Même membre et même PGN)
		$existing_games = get_posts( [
			'post_type'      => 'roi_partie',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'key'   => '_roi_member_id',
					'value' => $member_id,
				],
				[
					'key'   => '_roi_pgn',
					'value' => $pgn,
				],
			],
		] );

		if ( ! empty( $existing_games ) ) {
			return rest_ensure_response( [
				'success' => true,
				'id'      => $existing_games[0],
				'message' => __( 'Partie déjà enregistrée.', 'roi' ),
			] );
		}

		// Vérifier que le membre existe bien (CPT adherent de Dame)
		$member = get_post( $member_id );
		if ( ! $member || 'adherent' !== $member->post_type ) {
			return new WP_Error( 'member_not_found', __( 'Membre non trouvé.', 'roi' ), [ 'status' => 404 ] );
		}

		// Formater la date fournie ou repli sur la date actuelle
		$post_date = current_time( 'mysql' );
		if ( ! empty( $game_date_raw ) ) {
			$timestamp = strtotime( $game_date_raw );
			if ( $timestamp ) {
				$post_date = date( 'Y-m-d H:i:s', $timestamp );
			}
		}

		$current_user = wp_get_current_user();

		// Insérer le post roi_partie
		$post_title = sprintf( 'Partie de %s - %s', $member->post_title, date( 'd/m/Y H:i', strtotime( $post_date ) ) );
		
		$post_id = wp_insert_post( [
			'post_type'    => 'roi_partie',
			'post_status'  => 'publish',
			'post_title'   => $post_title,
			'post_content' => $pgn, // Stockage du PGN dans le contenu également
			'post_author'  => $current_user->ID,
			'post_date'    => $post_date,
		] );

		if ( is_wp_error( $post_id ) || 0 === $post_id ) {
			return new WP_Error( 'db_error', __( 'Erreur lors de l\'enregistrement en base de données.', 'roi' ), [ 'status' => 500 ] );
		}

		// Sauvegarde des métadonnées avec préfixe _roi_
		update_post_meta( $post_id, '_roi_member_id', $member_id );
		update_post_meta( $post_id, '_roi_difficulty_level', $difficulty_level );
		update_post_meta( $post_id, '_roi_hints_count', $hints_count );
		update_post_meta( $post_id, '_roi_takebacks_count', $takebacks_count );
		update_post_meta( $post_id, '_roi_pgn', $pgn );
		update_post_meta( $post_id, '_roi_game_duration', $duration );
		update_post_meta( $post_id, '_roi_game_date', $post_date );

		return rest_ensure_response( [
			'success' => true,
			'id'      => $post_id,
			'message' => __( 'Partie enregistrée avec succès.', 'roi' ),
		] );
	}
}
