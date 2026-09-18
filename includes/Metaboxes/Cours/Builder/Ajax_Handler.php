<?php
/**
 * AJAX handler for Cours Builder item search.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Cours\Builder;

use WP_Query;

/**
 * Class Ajax_Handler
 * Handles AJAX search and filtering for lessons, exercises and videos in the cours builder.
 */
class Ajax_Handler {

	/**
	 * Registers AJAX hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'wp_ajax_roi_search_cours_items', array( $this, 'handle_search' ) );
	}

	/**
	 * AJAX endpoint for searching course items.
	 *
	 * @return void
	 */
	public function handle_search(): void {
		check_ajax_referer( 'roi_search_cours_items_nonce', 'security', false );

		$search          = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : '';
		$chapitre        = isset( $_GET['chapter'] ) ? (int) $_GET['chapter'] : 0;
		$niveau          = isset( $_GET['level'] ) ? (int) $_GET['level'] : 0;
		$unassigned_only = isset( $_GET['unassigned'] ) && '1' === (string) $_GET['unassigned'];
		$course_id       = isset( $_GET['course_id'] ) ? (int) $_GET['course_id'] : 0;

		$args = array(
			'post_type'      => array( 'roi_lecon', 'roi_exercice', 'roi_video' ),
			'post_status'    => 'publish',
			'posts_per_page' => 50,
			's'              => $search,
		);

		if ( $unassigned_only ) {
			global $wpdb;

			if ( $course_id > 0 ) {
				$playlists = $wpdb->get_col(
					$wpdb->prepare(
						"SELECT pm.meta_value 
						 FROM {$wpdb->postmeta} pm
						 INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
						 WHERE pm.meta_key = '_roi_cours_playlist'
						   AND p.post_type = 'roi_cours'
						   AND p.post_status NOT IN ('trash', 'auto-draft')
						   AND p.ID != %d",
						$course_id
					)
				);
			} else {
				$playlists = $wpdb->get_col(
					"SELECT pm.meta_value 
					 FROM {$wpdb->postmeta} pm
					 INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
					 WHERE pm.meta_key = '_roi_cours_playlist'
					   AND p.post_type = 'roi_cours'
					   AND p.post_status NOT IN ('trash', 'auto-draft')"
				);
			}

			$assigned_ids = array();
			if ( is_array( $playlists ) ) {
				foreach ( $playlists as $raw_json ) {
					$items = json_decode( (string) $raw_json, true );
					if ( is_array( $items ) ) {
						foreach ( $items as $item ) {
							if ( isset( $item['id'] ) && (int) $item['id'] > 0 ) {
								$assigned_ids[ (int) $item['id'] ] = true;
							}
						}
					}
				}
			}

			if ( ! empty( $assigned_ids ) ) {
				$args['post__not_in'] = array_keys( $assigned_ids );
			}
		}

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
				array(
					'key'     => '_roi_video_niveau',
					'value'   => $niveau,
					'compare' => '=',
					'type'    => 'NUMERIC',
				),
			);
		}

		$query   = new WP_Query( $args );
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
				$meta_key = '_roi_exercice_niveau';
				if ( 'roi_lecon' === $post_type ) {
					$meta_key = '_roi_lecon_niveau';
				} elseif ( 'roi_video' === $post_type ) {
					$meta_key = '_roi_video_niveau';
				}
				$level = (int) get_post_meta( $post_id, $meta_key, true );
				if ( 0 === $level ) {
					$level = 1;
				}

				$results[] = array(
					'id'         => $post_id,
					'titre'      => html_entity_decode( (string) get_the_title(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
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
