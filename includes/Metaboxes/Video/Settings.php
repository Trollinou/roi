<?php
/**
 * Settings metabox for Video CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Video;

/**
 * Class Settings
 * Manages YouTube URL, video ID, duration and difficulty level for Video post type.
 */
class Settings {

	/**
	 * Constructor.
	 * Registers actions.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'enregistrer_meta' ) );
		add_action( 'add_meta_boxes', array( $this, 'ajouter_metaboxes' ) );
		add_action( 'save_post_roi_video', array( $this, 'sauvegarder_metabox' ) );
	}

	/**
	 * Registers post meta for REST API / Gutenberg.
	 *
	 * @return void
	 */
	public function enregistrer_meta(): void {
		register_post_meta(
			'roi_video',
			'_roi_video_url',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'esc_url_raw',
				'auth_callback'     => function ( bool $allowed, string $meta_key, int $post_id ): bool {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);

		register_post_meta(
			'roi_video',
			'_roi_video_id',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function ( bool $allowed, string $meta_key, int $post_id ): bool {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);

		register_post_meta(
			'roi_video',
			'_roi_video_duree',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function ( bool $allowed, string $meta_key, int $post_id ): bool {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);

		register_post_meta(
			'roi_video',
			'_roi_video_niveau',
			array(
				'show_in_rest'      => array(
					'schema' => array(
						'type'    => 'integer',
						'default' => 1,
					),
				),
				'single'            => true,
				'type'              => 'integer',
				'default'           => 1,
				'sanitize_callback' => 'absint',
				'auth_callback'     => function ( bool $allowed, string $meta_key, int $post_id ): bool {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);
	}

	/**
	 * Adds settings metabox to roi_video CPT.
	 *
	 * @return void
	 */
	public function ajouter_metaboxes(): void {
		add_meta_box(
			'roi_video_settings',
			__( 'Paramètres de la Vidéo', 'roi' ),
			array( $this, 'afficher_metabox' ),
			'roi_video',
			'normal',
			'high'
		);

		add_meta_box(
			'roi_video_niveau_side',
			__( 'Niveau de difficulté', 'roi' ),
			array( $this, 'afficher_metabox_niveau' ),
			'roi_video',
			'side',
			'default'
		);
	}

	/**
	 * Renders the main settings metabox.
	 *
	 * @param \WP_Post $post Current post.
	 * @return void
	 */
	public function afficher_metabox( \WP_Post $post ): void {
		wp_nonce_field( 'roi_video_settings_action', 'roi_video_settings_nonce' );

		$video_url = (string) get_post_meta( $post->ID, '_roi_video_url', true );
		$video_id  = (string) get_post_meta( $post->ID, '_roi_video_id', true );
		$duree     = (string) get_post_meta( $post->ID, '_roi_video_duree', true );
		?>
		<div style="margin-bottom: 15px;">
			<label for="roi_video_url" style="font-weight: 600; display: block; margin-bottom: 5px;">
				<?php esc_html_e( 'URL de la vidéo YouTube :', 'roi' ); ?>
			</label>
			<input type="url" id="roi_video_url" name="roi_video_url" value="<?php echo esc_attr( $video_url ); ?>" class="widefat" placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..." />
			<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
				<p class="description" style="margin: 0;">
					<?php esc_html_e( 'Collez l\'URL complète de la vidéo YouTube. Le titre et la durée seront détectés automatiquement.', 'roi' ); ?>
				</p>
				<span id="roi_video_fetch_status" style="font-size: 12px; font-weight: 500; display: none;"></span>
			</div>
		</div>

		<div style="display: flex; gap: 20px; margin-bottom: 15px;">
			<div style="flex: 1;">
				<label for="roi_video_duree" style="font-weight: 600; display: block; margin-bottom: 5px;">
					<?php esc_html_e( 'Durée indicative :', 'roi' ); ?>
				</label>
				<input type="text" id="roi_video_duree" name="roi_video_duree" value="<?php echo esc_attr( $duree ); ?>" placeholder="Ex: 5:30 ou 8 min" style="width: 100%;" />
			</div>
			<div style="flex: 1;">
				<label style="font-weight: 600; display: block; margin-bottom: 5px;">
					<?php esc_html_e( 'Identifiant YouTube extrait :', 'roi' ); ?>
				</label>
				<code id="roi_video_id_preview" style="display: inline-block; padding: 4px 8px; background: #f0f0f1; border-radius: 4px;">
					<?php echo esc_html( $video_id ?: 'Aucun' ); ?>
				</code>
			</div>
		</div>

		<div style="margin-top: 15px;">
			<label style="font-weight: 600; display: block; margin-bottom: 8px;">
				<?php esc_html_e( 'Aperçu du lecteur vidéo :', 'roi' ); ?>
			</label>
			<div id="roi_video_player_container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 640px; background: #111; border-radius: 8px; border: 1px solid #ddd;">
				<?php if ( ! empty( $video_id ) ) : ?>
					<iframe 
						src="https://www.youtube-nocookie.com/embed/<?php echo esc_attr( $video_id ); ?>?rel=0&modestbranding=1&playsinline=1" 
						style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
						allowfullscreen>
					</iframe>
				<?php else : ?>
					<div style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#888;">
						<?php esc_html_e( 'Collez une URL YouTube valide pour afficher l\'aperçu.', 'roi' ); ?>
					</div>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the difficulty level metabox in the sidebar.
	 *
	 * @param \WP_Post $post Current post.
	 * @return void
	 */
	public function afficher_metabox_niveau( \WP_Post $post ): void {
		$niveau = (int) get_post_meta( $post->ID, '_roi_video_niveau', true );
		if ( $niveau < 1 || $niveau > 4 ) {
			$niveau = 1;
		}
		?>
		<p>
			<label for="roi_video_niveau"><strong><?php esc_html_e( 'Niveau (1 à 4) :', 'roi' ); ?></strong></label>
			<select name="roi_video_niveau" id="roi_video_niveau" class="widefat" style="margin-top: 5px;">
				<?php for ( $i = 1; $i <= 4; $i++ ) : ?>
					<option value="<?php echo (int) $i; ?>" <?php selected( $niveau, $i ); ?>>
						<?php printf( esc_html__( 'Niveau %d', 'roi' ), (int) $i ); ?>
					</option>
				<?php endfor; ?>
			</select>
		</p>
		<?php
	}

	/**
	 * Extract YouTube ID from multiple URL formats.
	 *
	 * @param string $url The YouTube URL.
	 * @return string The 11-char video ID or empty string.
	 */
	public static function extraire_youtube_id( string $url ): string {
		$url = trim( $url );
		if ( empty( $url ) ) {
			return '';
		}

		if ( preg_match( '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/\s]{11})%i', $url, $match ) ) {
			return $match[1];
		}

		return '';
	}

	/**
	 * Saves metabox fields.
	 *
	 * @param int $post_id The post ID.
	 * @return void
	 */
	public function sauvegarder_metabox( int $post_id ): void {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['roi_video_settings_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['roi_video_settings_nonce'] ) ), 'roi_video_settings_action' ) ) {
			if ( isset( $_POST['roi_video_url'] ) ) {
				$video_url = esc_url_raw( wp_unslash( $_POST['roi_video_url'] ) );
				update_post_meta( $post_id, '_roi_video_url', $video_url );

				$video_id = self::extraire_youtube_id( $video_url );
				update_post_meta( $post_id, '_roi_video_id', $video_id );
			}

			if ( isset( $_POST['roi_video_duree'] ) ) {
				$duree = sanitize_text_field( wp_unslash( $_POST['roi_video_duree'] ) );
				update_post_meta( $post_id, '_roi_video_duree', $duree );
			}

			if ( isset( $_POST['roi_video_niveau'] ) ) {
				$niveau = (int) $_POST['roi_video_niveau'];
				if ( $niveau >= 1 && $niveau <= 4 ) {
					update_post_meta( $post_id, '_roi_video_niveau', $niveau );
				}
			}
		} elseif ( isset( $_POST['meta'] ) && is_array( $_POST['meta'] ) ) {
			// Fallback REST / Gutenberg meta save.
			if ( isset( $_POST['meta']['_roi_video_url'] ) ) {
				$video_url = esc_url_raw( wp_unslash( $_POST['meta']['_roi_video_url'] ) );
				update_post_meta( $post_id, '_roi_video_url', $video_url );
				update_post_meta( $post_id, '_roi_video_id', self::extraire_youtube_id( $video_url ) );
			}
			if ( isset( $_POST['meta']['_roi_video_duree'] ) ) {
				update_post_meta( $post_id, '_roi_video_duree', sanitize_text_field( wp_unslash( $_POST['meta']['_roi_video_duree'] ) ) );
			}
			if ( isset( $_POST['meta']['_roi_video_niveau'] ) ) {
				$niveau = (int) $_POST['meta']['_roi_video_niveau'];
				if ( $niveau >= 1 && $niveau <= 4 ) {
					update_post_meta( $post_id, '_roi_video_niveau', $niveau );
				}
			}
		}
	}
}
