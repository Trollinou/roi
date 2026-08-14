<?php
/**
 * Builder metabox for Cours CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Cours;

/**
 * Class Builder
 * Handles the visual playlist/builder of Leçons and Exercices for a Cours, filtering by chapter and level.
 */
class Builder {

	/**
	 * Constructor.
	 * Registers actions.
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', array( $this, 'ajouter_metabox' ) );
		add_action( 'add_meta_boxes_roi_cours', array( $this, 'ordonner_metaboxes_side' ), 999 );
		add_action( 'save_post', array( $this, 'sauvegarder_metabox' ) );
		add_action( 'wp_ajax_roi_search_cours_items', array( $this, 'ajax_recherche_elements' ) );
	}

	/**
	 * Adds the playlist builder metabox and level display metabox.
	 *
	 * @return void
	 */
	public function ajouter_metabox(): void {
		add_meta_box(
			'roi_cours_builder_box',
			__( 'Constructeur de Cours (Playlist)', 'roi' ),
			array( $this, 'afficher_metabox' ),
			'roi_cours',
			'normal',
			'high'
		);

		add_meta_box(
			'roi_cours_level_box',
			__( 'Niveau du cours', 'roi' ),
			array( $this, 'afficher_metabox_niveau' ),
			'roi_cours',
			'side',
			'high'
		);
	}

	/**
	 * Reorders side column metaboxes for roi_cours:
	 * 1. Ordre du cours (#pageparentdiv)
	 * 2. Niveau du cours (#roi_cours_level_box)
	 * 3. Chapitres (#roi_chapitrediv)
	 *
	 * @return void
	 */
	public function ordonner_metaboxes_side(): void {
		global $wp_meta_boxes;

		if ( ! isset( $wp_meta_boxes['roi_cours']['side'] ) ) {
			return;
		}

		$desired_order = array(
			'pageparentdiv',
			'roi_cours_level_box',
			'roi_chapitrediv',
			'taxonomy-roi_chapitre',
		);

		$reordered = array();

		foreach ( $desired_order as $box_id ) {
			foreach ( array( 'high', 'core', 'default', 'low' ) as $priority ) {
				if ( isset( $wp_meta_boxes['roi_cours']['side'][ $priority ][ $box_id ] ) ) {
					$reordered[ $box_id ] = $wp_meta_boxes['roi_cours']['side'][ $priority ][ $box_id ];
					unset( $wp_meta_boxes['roi_cours']['side'][ $priority ][ $box_id ] );
					break;
				}
			}
		}

		foreach ( array( 'high', 'core', 'default', 'low' ) as $priority ) {
			if ( ! empty( $wp_meta_boxes['roi_cours']['side'][ $priority ] ) ) {
				foreach ( $wp_meta_boxes['roi_cours']['side'][ $priority ] as $box_id => $box ) {
					$reordered[ $box_id ] = $box;
				}
			}
		}

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_meta_boxes['roi_cours']['side'] = array(
			'high' => $reordered,
		);
	}

	/**
	 * Renders the course level read-only metabox content.
	 *
	 * @param \WP_Post $post The post object.
	 * @return void
	 */
	public function afficher_metabox_niveau( \WP_Post $post ): void {
		$niveau = (int) get_post_meta( $post->ID, '_roi_cours_niveau', true );
		if ( $niveau > 0 ) {
			/* translators: %d: Course level */
			$text = sprintf( __( 'Niveau %d', 'roi' ), $niveau );
		} else {
			$text = __( 'Déterminé par le 1er élément du cours', 'roi' );
		}
		?>
		<div id="roi_cours_level_display" style="padding: 4px 0; font-weight: 600; font-size: 13px; color: #1d2327;">
			<?php echo esc_html( $text ); ?>
		</div>
		<?php
	}

	/**
	 * Renders the metabox content.
	 *
	 * @param \WP_Post $post The post object.
	 * @return void
	 */
	public function afficher_metabox( \WP_Post $post ): void {
		wp_nonce_field( 'roi_sauvegarder_cours_builder', 'roi_cours_builder_nonce' );

		$playlist          = get_post_meta( $post->ID, '_roi_cours_playlist', true );
		$course_level      = (int) get_post_meta( $post->ID, '_roi_cours_niveau', true );
		$course_chapter_id = 0;
		$terms             = get_the_terms( $post->ID, 'roi_chapitre' );
		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			$term              = reset( $terms );
			$course_chapter_id = (int) $term->term_id;
		}

		$chapitres = get_terms(
			array(
				'taxonomy'   => 'roi_chapitre',
				'hide_empty' => false,
			)
		);

		if ( empty( $playlist ) ) {
			$playlist = '[]';
		}
		?>
		<style>
			.roi-cours-builder-columns {
				display: flex;
				gap: 20px;
				margin-top: 10px;
			}
			.roi-cours-builder-col {
				flex: 1;
				min-width: 0;
				border-radius: 6px;
				padding: 12px;
			}
			.roi-cours-catalog-filter-bar {
				display: flex;
				gap: 8px;
				margin-bottom: 12px;
				align-items: center;
			}
			.roi-cours-catalog-filter-bar input[type="text"] {
				flex: 1;
				height: 32px;
			}
			.roi-cours-catalog-filter-bar select {
				height: 32px;
			}
			.roi-builder-badge {
				background: #2271b1;
				color: #fff;
				border-radius: 10px;
				padding: 2px 8px;
				font-size: 11px;
				font-weight: bold;
			}
			.roi-scrollable-container {
				max-height: 480px;
				overflow-y: auto;
				padding-right: 2px;
			}
			.roi-scrollable-container::-webkit-scrollbar {
				width: 6px;
			}
			.roi-scrollable-container::-webkit-scrollbar-track {
				background: #f1f1f1;
				border-radius: 3px;
			}
			.roi-scrollable-container::-webkit-scrollbar-thumb {
				background: #c1c1c1;
				border-radius: 3px;
			}
			.roi-scrollable-container::-webkit-scrollbar-thumb:hover {
				background: #a8a8a8;
			}
		</style>
		<div class="roi-cours-builder-container" data-course-chapter-id="<?php echo esc_attr( (string) $course_chapter_id ); ?>" data-course-level="<?php echo esc_attr( (string) $course_level ); ?>">
			<input type="hidden" name="roi_cours_playlist_json" id="roi_cours_playlist_json" value="<?php echo esc_attr( $playlist ); ?>">

			<div class="roi-cours-builder-columns">
				<!-- Colonne Gauche : Catalogue -->
				<div class="roi-cours-builder-col" style="border: 1px solid #ccc; background: #fafafa;">
					<h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
						<span><?php esc_html_e( 'Catalogue des leçons & exercices', 'roi' ); ?></span>
						<span id="roi_available_count" class="roi-builder-badge">0</span>
					</h3>

					<div class="roi-cours-catalog-filter-bar">
						<input type="text" id="roi_catalog_search" placeholder="<?php esc_attr_e( 'Rechercher par titre...', 'roi' ); ?>">
						
						<select id="roi_catalog_chapter_filter">
							<?php if ( ! is_wp_error( $chapitres ) && ! empty( $chapitres ) ) : ?>
								<?php foreach ( $chapitres as $chapitre ) : ?>
									<option value="<?php echo esc_attr( (string) $chapitre->term_id ); ?>">
										<?php echo esc_html( $chapitre->name ); ?>
									</option>
								<?php endforeach; ?>
							<?php endif; ?>
						</select>

						<select id="roi_catalog_level_filter">
							<?php for ( $i = 1; $i <= 4; $i++ ) : ?>
								<option value="<?php echo (int) $i; ?>"><?php echo (int) $i; ?></option>
							<?php endfor; ?>
						</select>
					</div>

					<div id="roi_available_items" class="roi-scrollable-container" style="display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
						<!-- Rempli par JS -->
					</div>
				</div>

				<!-- Colonne Droite : Playlist -->
				<div class="roi-cours-builder-col" style="border: 1px solid #ccc; background: #fff;">
					<h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
						<span><?php esc_html_e( 'Contenu du cours (Playlist)', 'roi' ); ?></span>
						<span id="roi_playlist_count" class="roi-builder-badge">0</span>
					</h3>

					<div id="roi_playlist_items" class="roi-scrollable-container" style="min-height: 350px; border: 2px dashed #bbb; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
						<?php
						$playlist_items = json_decode( $playlist, true );
						if ( is_array( $playlist_items ) ) {
							foreach ( $playlist_items as $item ) {
								$item_id   = (int) $item['id'];
								$item_type = sanitize_text_field( $item['type'] );
								$post_obj  = get_post( $item_id );

								if ( $post_obj && in_array( $post_obj->post_type, array( 'roi_lecon', 'roi_exercice' ), true ) ) {
									$title = get_the_title( $post_obj );

									// Get color and ID.
									$color      = 'primary';
									$chapter_id = 0;
									$terms      = get_the_terms( $item_id, 'roi_chapitre' );
									if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
										$term       = reset( $terms );
										$chapter_id = $term->term_id;
										$term_color = get_term_meta( $term->term_id, '_roi_chapitre_couleur', true );
										if ( ! empty( $term_color ) ) {
											$color = $term_color;
										}
									}

									$meta_key = ( 'roi_lecon' === $item_type ) ? '_roi_lecon_niveau' : '_roi_exercice_niveau';
									$level    = (int) get_post_meta( $item_id, $meta_key, true );
									if ( 0 === $level ) {
										$level = 1;
									}

									$type_label = ( 'roi_lecon' === $item_type ) ? 'Leçon' : 'Exercice';

									// Color style details.
									$color_palette = array(
										'primary'  => array(
											'bg'     => '#e5f3ff',
											'border' => '#0073aa',
											'text'   => '#005a87',
										),
										'warning'  => array(
											'bg'     => '#fff5ec',
											'border' => '#d94f00',
											'text'   => '#a63c00',
										),
										'danger'   => array(
											'bg'     => '#fbeaea',
											'border' => '#d63638',
											'text'   => '#9e2526',
										),
										'success'  => array(
											'bg'     => '#edfaef',
											'border' => '#00a32a',
											'text'   => '#00701c',
										),
										'tertiary' => array(
											'bg'     => '#f5ecfc',
											'border' => '#8224e3',
											'text'   => '#5c16a6',
										),
									);
									$styles        = isset( $color_palette[ $color ] ) ? $color_palette[ $color ] : $color_palette['primary'];

									?>
									<div class="roi-playlist-item" 
										data-playlist-item="true" 
										draggable="true" 
										data-id="<?php echo (int) $item_id; ?>" 
										data-type="<?php echo esc_attr( $item_type ); ?>" 
										data-title="<?php echo esc_attr( $title ); ?>" 
										data-color="<?php echo esc_attr( $color ); ?>" 
										data-level="<?php echo (int) $level; ?>" 
										data-chapter-id="<?php echo (int) $chapter_id; ?>" 
										style="padding: 10px; border: 1px solid <?php echo esc_attr( $styles['border'] ); ?>; background: <?php echo esc_attr( $styles['bg'] ); ?>; color: <?php echo esc_attr( $styles['text'] ); ?>; border-radius: 4px; cursor: move; font-size: 13px; font-weight: 500; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
										<span style="word-break: break-word; overflow-wrap: anywhere;"><?php echo esc_html( $title ); ?></span>
										<div style="display: flex; gap: 5px; align-items: center; flex-shrink: 0;">
											<span style="font-size: 10px; white-space: nowrap; flex-shrink: 0; background: rgba(255,255,255,0.6); border: 1px solid <?php echo esc_attr( $styles['border'] ); ?>; padding: 1px 5px; border-radius: 3px;">
												Niv.&nbsp;<?php echo (int) $level; ?>
											</span>
											<span style="font-size: 10px; white-space: nowrap; flex-shrink: 0; text-transform: uppercase; background: <?php echo esc_attr( $styles['border'] ); ?>; color: #fff; padding: 2px 6px; border-radius: 3px;">
												<?php echo esc_html( $type_label ); ?>
											</span>
											<button type="button" class="roi-playlist-item-remove" style="background: none; border: none; color: <?php echo esc_attr( $styles['text'] ); ?>; opacity: 0.6; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0 0 0 5px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">&times;</button>
										</div>
									</div>
									<?php
								}
							}
						}
						?>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Saves metabox fields.
	 *
	 * @param int $post_id The post ID.
	 * @return void
	 */
	public function sauvegarder_metabox( int $post_id ): void {
		if ( ! isset( $_POST['roi_cours_builder_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['roi_cours_builder_nonce'] ) ), 'roi_sauvegarder_cours_builder' ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['roi_cours_playlist_json'] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$json_raw = wp_unslash( $_POST['roi_cours_playlist_json'] );

			$playlist_data = json_decode( $json_raw, true );
			if ( json_last_error() === JSON_ERROR_NONE && is_array( $playlist_data ) ) {
				update_post_meta( $post_id, '_roi_cours_playlist', wp_slash( $json_raw ) );

				if ( ! empty( $playlist_data ) ) {
					$first_item = reset( $playlist_data );
					$first_id   = (int) $first_item['id'];
					$first_type = sanitize_text_field( $first_item['type'] );

					$meta_key = ( 'roi_lecon' === $first_type ) ? '_roi_lecon_niveau' : '_roi_exercice_niveau';
					$niveau   = (int) get_post_meta( $first_id, $meta_key, true );
					if ( $niveau > 0 ) {
						update_post_meta( $post_id, '_roi_cours_niveau', $niveau );
					}

					$chapter_saved = false;
					$terms         = get_the_terms( $first_id, 'roi_chapitre' );
					if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
						$term_ids = wp_list_pluck( $terms, 'term_id' );
						wp_set_object_terms( $post_id, array_map( 'intval', $term_ids ), 'roi_chapitre' );
						$chapter_saved = true;
					}

					if ( ! $chapter_saved && ! empty( $_POST['tax_input']['roi_chapitre'] ) ) {
						// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
						$posted_terms = (array) wp_unslash( $_POST['tax_input']['roi_chapitre'] );
						$posted_terms = array_filter( array_map( 'intval', $posted_terms ) );
						if ( ! empty( $posted_terms ) ) {
							wp_set_object_terms( $post_id, $posted_terms, 'roi_chapitre' );
						}
					}
				} else {
					delete_post_meta( $post_id, '_roi_cours_niveau' );
					wp_set_object_terms( $post_id, array(), 'roi_chapitre' );
				}
			} else {
				update_post_meta( $post_id, '_roi_cours_playlist', wp_slash( $json_raw ) );
			}
		}
	}

	/**
	 * AJAX endpoint for search.
	 *
	 * @return void
	 */
	public function ajax_recherche_elements(): void {
		check_ajax_referer( 'roi_search_cours_items_nonce', 'security', false );

		$search   = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : '';
		$chapitre = isset( $_GET['chapter'] ) ? (int) $_GET['chapter'] : 0;
		$niveau   = isset( $_GET['level'] ) ? (int) $_GET['level'] : 0;

		$args = array(
			'post_type'      => array( 'roi_lecon', 'roi_exercice' ),
			'post_status'    => 'publish',
			'posts_per_page' => 50,
			's'              => $search,
		);

		if ( $chapitre > 0 ) {
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
			$args['tax_query'] = array(
				array(
					'taxonomy' => 'roi_chapitre',
					'field'    => 'term_id',
					'terms'    => $chapitre,
				),
			);
		}

		if ( $niveau > 0 ) {
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			$args['meta_query'] = array(
				'relation' => 'OR',
				array(
					'key'     => '_roi_exercice_niveau',
					'value'   => $niveau,
					'compare' => '=',
					'type'    => 'NUMERIC',
				),
				array(
					'key'     => '_roi_lecon_niveau',
					'value'   => $niveau,
					'compare' => '=',
					'type'    => 'NUMERIC',
				),
			);
		}

		$query   = new \WP_Query( $args );
		$results = array();

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$post_id   = get_the_ID();
				$post_type = get_post_type();

				// Get associated chapter color and ID.
				$color      = 'primary';
				$chapter_id = 0;
				$terms      = get_the_terms( $post_id, 'roi_chapitre' );
				if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
					$term       = reset( $terms );
					$chapter_id = $term->term_id;
					$term_color = get_term_meta( $term->term_id, '_roi_chapitre_couleur', true );
					if ( ! empty( $term_color ) ) {
						$color = $term_color;
					}
				}

				if ( 0 === $chapter_id && $chapitre > 0 ) {
					$chapter_id = $chapitre;
					$term_color = get_term_meta( $chapitre, '_roi_chapitre_couleur', true );
					if ( ! empty( $term_color ) ) {
						$color = $term_color;
					}
				}

				// Retrieve the level from CPT specific meta key.
				$meta_key = ( 'roi_lecon' === $post_type ) ? '_roi_lecon_niveau' : '_roi_exercice_niveau';
				$level    = (int) get_post_meta( $post_id, $meta_key, true );
				if ( 0 === $level ) {
					$level = 1;
				}

				$results[] = array(
					'id'         => $post_id,
					'titre'      => get_the_title(),
					'type'       => $post_type,
					'color'      => $color,
					'niveau'     => $level,
					'chapter_id' => $chapter_id,
				);
			}
			wp_reset_postdata();
		}

		wp_send_json_success( $results );
	}
}
