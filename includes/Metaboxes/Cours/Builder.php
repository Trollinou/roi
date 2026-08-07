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
		add_action( 'add_meta_boxes', [ $this, 'ajouter_metabox' ] );
		add_action( 'save_post', [ $this, 'sauvegarder_metabox' ] );
		add_action( 'wp_ajax_roi_search_cours_items', [ $this, 'ajax_recherche_elements' ] );
	}

	/**
	 * Adds the playlist builder metabox.
	 *
	 * @return void
	 */
	public function ajouter_metabox(): void {
		add_meta_box(
			'roi_cours_builder_box',
			__( 'Constructeur de Cours (Playlist)', 'roi' ),
			[ $this, 'afficher_metabox' ],
			'roi_cours',
			'normal',
			'high'
		);
	}

	/**
	 * Renders the metabox content.
	 *
	 * @param \WP_Post $post The post object.
	 * @return void
	 */
	public function afficher_metabox( $post ): void {
		wp_nonce_field( 'roi_sauvegarder_cours_builder', 'roi_cours_builder_nonce' );

		$playlist = get_post_meta( $post->ID, '_roi_cours_playlist', true );
		if ( empty( $playlist ) ) {
			$playlist = '[]';
		}

		$chapitres = get_terms( [
			'taxonomy'   => 'roi_chapitre',
			'hide_empty' => false,
		] );

		if ( ! is_wp_error( $chapitres ) && ! empty( $chapitres ) ) {
			$order_map = [
				'Matérialité'         => 1,
				'Activité des Pièces' => 2,
				'Sécurité du Roi'     => 3,
				'Structure de Pions'  => 4,
				'Combination'         => 5,
			];
			usort( $chapitres, function( $a, $b ) use ( $order_map ) {
				$pos_a = $order_map[ $a->name ] ?? 99;
				$pos_b = $order_map[ $b->name ] ?? 99;
				return $pos_a <=> $pos_b;
			} );
		}
		?>
		<style>
			.roi-builder-badge {
				display: inline-block;
				background: #2271b1;
				color: #fff;
				font-size: 11px;
				font-weight: 600;
				padding: 2px 7px;
				border-radius: 10px;
				margin-left: 6px;
				vertical-align: middle;
			}
			.roi-scrollable-container {
				max-height: 450px;
				overflow-y: auto;
				scrollbar-width: thin;
				scrollbar-color: #c1c1c1 #f1f1f1;
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
		<div class="roi-cours-builder-container">
			<input type="hidden" name="roi_cours_playlist_json" id="roi_cours_playlist_json" value="<?php echo esc_attr( $playlist ); ?>">

			<div style="display: flex; gap: 20px; margin-top: 15px;">
				<!-- Colonne Gauche : Catalogue -->
				<div style="flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 15px; background: #fafafa;">
					<h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
						<span><?php esc_html_e( 'Catalogue des leçons & exercices', 'roi' ); ?></span>
						<span id="roi_available_count" class="roi-builder-badge">0</span>
					</h3>

					<div style="display: flex; gap: 10px; margin-bottom: 15px;">
						<input type="text" id="roi_catalog_search" placeholder="<?php esc_attr_e( 'Rechercher par titre...', 'roi' ); ?>" style="flex: 1;">
						
						<select id="roi_catalog_chapter_filter">
							<option value=""><?php esc_html_e( 'Tous les chapitres', 'roi' ); ?></option>
							<?php if ( ! is_wp_error( $chapitres ) && ! empty( $chapitres ) ) : ?>
								<?php foreach ( $chapitres as $chapitre ) : ?>
									<option value="<?php echo esc_attr( (string) $chapitre->term_id ); ?>">
										<?php echo esc_html( $chapitre->name ); ?>
									</option>
								<?php endforeach; ?>
							<?php endif; ?>
						</select>

						<select id="roi_catalog_level_filter">
							<option value=""><?php esc_html_e( 'Tous les niveaux', 'roi' ); ?></option>
							<?php for ( $i = 1; $i <= 4; $i++ ) : ?>
								<option value="<?php echo $i; ?>"><?php echo $i; ?></option>
							<?php endfor; ?>
						</select>
					</div>

					<div id="roi_available_items" class="roi-scrollable-container" style="display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
						<!-- Rempli par JS -->
					</div>
				</div>

				<!-- Colonne Droite : Playlist -->
				<div style="flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 15px; background: #fff;">
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

								if ( $post_obj && in_array( $post_obj->post_type, [ 'roi_lecon', 'roi_exercice' ], true ) ) {
									$title = get_the_title( $post_obj );

									// Get color and ID
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

									// Color style details
									$color_palette = [
										'primary'  => [ 'bg' => '#e5f3ff', 'border' => '#0073aa', 'text' => '#005a87' ],
										'warning'  => [ 'bg' => '#fff5ec', 'border' => '#d94f00', 'text' => '#a63c00' ],
										'danger'   => [ 'bg' => '#fbeaea', 'border' => '#d63638', 'text' => '#9e2526' ],
										'success'  => [ 'bg' => '#edfaef', 'border' => '#00a32a', 'text' => '#00701c' ],
										'tertiary' => [ 'bg' => '#f5ecfc', 'border' => '#8224e3', 'text' => '#5c16a6' ],
									];
									$styles = isset( $color_palette[ $color ] ) ? $color_palette[ $color ] : $color_palette['primary'];

									?>
									<div class="roi-playlist-item" 
										data-playlist-item="true" 
										draggable="true" 
										data-id="<?php echo $item_id; ?>" 
										data-type="<?php echo esc_attr( $item_type ); ?>" 
										data-title="<?php echo esc_attr( $title ); ?>" 
										data-color="<?php echo esc_attr( $color ); ?>" 
										data-level="<?php echo $level; ?>" 
										data-chapter-id="<?php echo $chapter_id; ?>" 
										style="padding: 10px; border: 1px solid <?php echo esc_attr( $styles['border'] ); ?>; background: #fff; color: #333; border-radius: 4px; cursor: move; font-size: 13px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
										<div style="display: flex; align-items: center; gap: 8px;">
											<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: <?php echo esc_attr( $styles['border'] ); ?>;"></span>
											<strong style="color: <?php echo esc_attr( $styles['text'] ); ?>; font-size: 11px;">[<?php echo esc_html( $type_label ); ?>]</strong>
											<span><?php echo esc_html( $title ); ?></span>
										</div>
										<button type="button" class="roi-playlist-item-remove" style="background: none; border: none; color: #bbb; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0 5px;" onmouseover="this.style.color='#d63638'" onmouseout="this.style.color='#bbb'">&times;</button>
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
		if ( ! isset( $_POST['roi_cours_builder_nonce'] ) || ! wp_verify_nonce( $_POST['roi_cours_builder_nonce'], 'roi_sauvegarder_cours_builder' ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['roi_cours_playlist_json'] ) ) {
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

					$terms = get_the_terms( $first_id, 'roi_chapitre' );
					if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
						$term_ids = wp_list_pluck( $terms, 'term_id' );
						wp_set_object_terms( $post_id, array_map( 'intval', $term_ids ), 'roi_chapitre' );
					}
				} else {
					delete_post_meta( $post_id, '_roi_cours_niveau' );
					wp_set_object_terms( $post_id, [], 'roi_chapitre' );
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

		$args = [
			'post_type'      => [ 'roi_lecon', 'roi_exercice' ],
			'post_status'    => 'publish',
			'posts_per_page' => 50,
			's'              => $search,
		];

		if ( $chapitre > 0 ) {
			$args['tax_query'] = [
				[
					'taxonomy' => 'roi_chapitre',
					'field'    => 'term_id',
					'terms'    => $chapitre,
				],
			];
		}

		if ( $niveau > 0 ) {
			$args['meta_query'] = [
				'relation' => 'OR',
				[
					'key'     => '_roi_exercice_niveau',
					'value'   => $niveau,
					'compare' => '=',
					'type'    => 'NUMERIC',
				],
				[
					'key'     => '_roi_lecon_niveau',
					'value'   => $niveau,
					'compare' => '=',
					'type'    => 'NUMERIC',
				],
			];
		}

		$query = new \WP_Query( $args );
		$results = [];

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$post_id = get_the_ID();
				$post_type = get_post_type();

				// Get associated chapter color and ID
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

				// Retrieve the level from CPT specific meta key
				$meta_key = ( 'roi_lecon' === $post_type ) ? '_roi_lecon_niveau' : '_roi_exercice_niveau';
				$level = (int) get_post_meta( $post_id, $meta_key, true );
				if ( 0 === $level ) {
					$level = 1;
				}

				$results[] = [
					'id'         => $post_id,
					'titre'      => get_the_title(),
					'type'       => $post_type,
					'color'      => $color,
					'niveau'     => $level,
					'chapter_id' => $chapter_id,
				];
			}
			wp_reset_postdata();
		}

		wp_send_json_success( $results );
	}
}
