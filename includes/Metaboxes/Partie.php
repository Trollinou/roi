<?php
/**
 * Custom Meta Box for Partie CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes;

use WP_Post;

/**
 * Class Partie
 * Handles registration and rendering of the metabox for roi_partie CPT.
 */
class Partie {

	/**
	 * Initialize actions.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
		add_action( 'save_post_roi_partie', [ $this, 'save_meta' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_scripts' ] );
	}

	/**
	 * Adds the meta boxes for the Partie CPT.
	 *
	 * @return void
	 */
	public function add_meta_boxes(): void {
		// Metabox side for details
		add_meta_box(
			'roi_partie_side_metabox',
			__( 'Informations de la partie', 'roi' ),
			[ $this, 'render_side_metabox' ],
			'roi_partie',
			'side',
			'core'
		);

		// Metabox normal for viewer
		add_meta_box(
			'roi_partie_viewer_metabox',
			__( 'Visualisation de la partie', 'roi' ),
			[ $this, 'render_viewer_metabox' ],
			'roi_partie',
			'normal',
			'high'
		);
	}

	/**
	 * Renders the meta box for partie side details.
	 *
	 * @param WP_Post $post The post object.
	 * @return void
	 */
	public function render_side_metabox( WP_Post $post ): void {
		wp_nonce_field( 'roi_save_partie_meta', 'roi_partie_metabox_nonce' );

		$member_id   = get_post_meta( $post->ID, '_roi_member_id', true );
		$level       = get_post_meta( $post->ID, '_roi_difficulty_level', true );
		$hints       = get_post_meta( $post->ID, '_roi_hints_count', true );
		$takebacks   = get_post_meta( $post->ID, '_roi_takebacks_count', true );
		$duration    = get_post_meta( $post->ID, '_roi_game_duration', true );
		$game_date   = get_post_meta( $post->ID, '_roi_game_date', true );

		$member_name = __( 'Inconnu', 'roi' );
		$member_link = '';
		if ( ! empty( $member_id ) ) {
			$member = get_post( (int) $member_id );
			if ( $member ) {
				$member_name = esc_html( $member->post_title );
				$member_link = get_edit_post_link( $member->ID );
			}
		}

		$formatted_duration = '';
		if ( ! empty( $duration ) ) {
			$duration_int       = (int) $duration;
			$minutes            = floor( $duration_int / 60 );
			$seconds            = $duration_int % 60;
			$formatted_duration = sprintf( __( '%d min %d s', 'roi' ), $minutes, $seconds );
		}
		?>
		<div class="roi-side-meta-fields">
			<p>
				<strong><?php _e( 'Joueur (Adhérent) :', 'roi' ); ?></strong><br>
				<?php if ( ! empty( $member_link ) ) : ?>
					<a href="<?php echo esc_url( $member_link ); ?>" target="_blank"><strong><?php echo $member_name; ?></strong></a>
				<?php else : ?>
					<span><?php echo $member_name; ?></span>
				<?php endif; ?>
				<input type="hidden" name="roi_member_id" value="<?php echo esc_attr( (string) $member_id ); ?>">
			</p>
			<p>
				<label for="roi_difficulty_level"><strong><?php _e( 'Niveau Stockfish (ELO) :', 'roi' ); ?></strong></label>
				<input type="number" name="roi_difficulty_level" id="roi_difficulty_level" value="<?php echo esc_attr( (string) $level ); ?>" style="width: 100%;">
			</p>
			<p>
				<label for="roi_hints_count"><strong><?php _e( 'Nombre d\'aides utilisées :', 'roi' ); ?></strong></label>
				<input type="number" name="roi_hints_count" id="roi_hints_count" value="<?php echo esc_attr( (string) $hints ); ?>" style="width: 100%;">
			</p>
			<p>
				<label for="roi_takebacks_count"><strong><?php _e( 'Nombre de "Oups !" :', 'roi' ); ?></strong></label>
				<input type="number" name="roi_takebacks_count" id="roi_takebacks_count" value="<?php echo esc_attr( (string) $takebacks ); ?>" style="width: 100%;">
			</p>
			<p>
				<label for="roi_game_duration"><strong><?php _e( 'Durée de la partie :', 'roi' ); ?></strong></label>
				<input type="number" name="roi_game_duration" id="roi_game_duration" value="<?php echo esc_attr( (string) $duration ); ?>" style="width: 100%;">
				<?php if ( ! empty( $formatted_duration ) ) : ?>
					<span class="description" style="display: block; margin-top: 5px;"><?php echo esc_html( $formatted_duration ); ?></span>
				<?php endif; ?>
			</p>
			<p>
				<label for="roi_game_date"><strong><?php _e( 'Date de la partie :', 'roi' ); ?></strong></label>
				<input type="text" name="roi_game_date" id="roi_game_date" value="<?php echo esc_attr( (string) $game_date ); ?>" style="width: 100%;">
				<span class="description" style="display: block; margin-top: 5px;"><?php _e( 'Format : AAAA-MM-JJ HH:MM:SS', 'roi' ); ?></span>
			</p>
		</div>
		<?php
	}

	/**
	 * Renders the meta box for partie interactive viewer.
	 *
	 * @param WP_Post $post The post object.
	 * @return void
	 */
	public function render_viewer_metabox( WP_Post $post ): void {
		$pgn = get_post_meta( $post->ID, '_roi_pgn', true );
		$initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		?>
		<div class="roi-pgn-viewer-container" style="display: flex; flex-direction: column; gap: 15px;">
			<!-- Partie Haute : Boutons de navigation et résumé du coup -->
			<div class="roi-viewer-header" style="display: flex; align-items: center; justify-content: space-between; background: #f6f7f7; padding: 10px; border: 1px solid #dcdcde; border-radius: 4px;">
				<div class="roi-viewer-controls" style="display: flex; gap: 8px;">
					<button type="button" class="button" id="roi-prev-start-btn" title="<?php esc_attr_e( 'Début', 'roi' ); ?>">«</button>
					<button type="button" class="button" id="roi-prev-btn" title="<?php esc_attr_e( 'Précédent', 'roi' ); ?>">‹</button>
					<button type="button" class="button" id="roi-next-btn" title="<?php esc_attr_e( 'Suivant', 'roi' ); ?>">›</button>
					<button type="button" class="button" id="roi-next-end-btn" title="<?php esc_attr_e( 'Fin', 'roi' ); ?>">»</button>
				</div>
				<div class="roi-viewer-move-info" id="roi-move-info" style="font-weight: bold; font-size: 1.1em; color: #1d2327;">
					<?php _e( 'Position de départ', 'roi' ); ?>
				</div>
			</div>

			<!-- Partie Principale : Liste de coups à gauche, Échiquier à droite -->
			<div class="roi-viewer-body" style="display: flex; gap: 20px;">
				<!-- Colonne Gauche : Liste des coups -->
				<div class="roi-viewer-moves-list-wrapper" style="flex: 1; border: 1px solid #dcdcde; border-radius: 4px; padding: 10px; background: #fff; max-height: 400px; overflow-y: auto;">
					<div class="roi-viewer-moves-list" id="roi-moves-list" style="display: flex; flex-wrap: wrap; gap: 6px 12px; line-height: 2;">
						<span style="color: #646970; font-style: italic;"><?php _e( 'Aucun coup disponible', 'roi' ); ?></span>
					</div>
				</div>

				<!-- Colonne Droite : L'échiquier -->
				<div class="roi-viewer-board-wrapper" style="width: 350px; flex-shrink: 0; position: relative;">
					<div id="roi-partie-viewer-chessboard" 
					     class="chessboard-block"
					     data-fen="<?php echo esc_attr( $initial_fen ); ?>"
					     data-orientation="white"
					     data-coordinates="true"
					     data-view-only="true"
					     data-player-color="both"
					     data-show-threats="false"
					     data-use-stockfish="false"
					     data-free-mode="false">
						<section class="main-wrap">
							<div class="main-board">
								<div class="chessboard-mount-element"></div>
							</div>
						</section>
					</div>
				</div>
			</div>

			<!-- Zone de saisie/modification du PGN (Collapsible) -->
			<div class="roi-viewer-pgn-editor" style="margin-top: 10px; border-top: 1px solid #dcdcde; padding-top: 15px;">
				<details>
					<summary style="font-weight: bold; cursor: pointer; color: #2271b1; user-select: none;">
						<?php _e( 'Modifier le PGN brut', 'roi' ); ?>
					</summary>
					<div style="margin-top: 10px;">
						<textarea name="roi_pgn" id="roi_pgn" rows="4" class="large-text code" style="width: 100%; font-family: monospace;"><?php echo esc_textarea( (string) $pgn ); ?></textarea>
					</div>
				</details>
			</div>
		</div>
		<?php
	}

	/**
	 * Save meta box content for Partie CPT.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function save_meta( int $post_id ): void {
		if ( ! isset( $_POST['roi_partie_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_partie_metabox_nonce'], 'roi_save_partie_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['roi_member_id'] ) ) {
			update_post_meta( $post_id, '_roi_member_id', (int) $_POST['roi_member_id'] );
		}
		if ( isset( $_POST['roi_difficulty_level'] ) ) {
			update_post_meta( $post_id, '_roi_difficulty_level', (int) $_POST['roi_difficulty_level'] );
		}
		if ( isset( $_POST['roi_hints_count'] ) ) {
			update_post_meta( $post_id, '_roi_hints_count', (int) $_POST['roi_hints_count'] );
		}
		if ( isset( $_POST['roi_takebacks_count'] ) ) {
			update_post_meta( $post_id, '_roi_takebacks_count', (int) $_POST['roi_takebacks_count'] );
		}
		if ( isset( $_POST['roi_game_duration'] ) ) {
			update_post_meta( $post_id, '_roi_game_duration', (int) $_POST['roi_game_duration'] );
		}
		if ( isset( $_POST['roi_game_date'] ) ) {
			update_post_meta( $post_id, '_roi_game_date', sanitize_text_field( (string) $_POST['roi_game_date'] ) );
		}
		if ( isset( $_POST['roi_pgn'] ) ) {
			update_post_meta( $post_id, '_roi_pgn', sanitize_textarea_field( (string) $_POST['roi_pgn'] ) );
		}
	}

	/**
	 * Enqueues admin scripts for the partie screen.
	 *
	 * @param string $hook The current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_scripts( string $hook ): void {
		global $post;
		if ( ! $post || 'roi_partie' !== $post->post_type ) {
			return;
		}

		if ( 'post.php' === $hook || 'post-new.php' === $hook ) {
			$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
			$chess_url = $plugin_url . 'build/chessboard/';

			wp_enqueue_style(
				'chessboard-style',
				$chess_url . 'style.css',
				[],
				ROI_VERSION
			);

			wp_enqueue_script(
				'chessboard-view',
				$chess_url . 'chessboard-view.js',
				[ 'wp-element' ],
				ROI_VERSION,
				true
			);

			wp_enqueue_script(
				'roi-admin-partie-viewer',
				$plugin_url . 'assets/js/admin-partie-viewer.js',
				[ 'chessboard-view' ],
				ROI_VERSION,
				true
			);
		}
	}
}

