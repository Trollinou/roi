<?php
/**
 * Register Chapitre Custom Taxonomy and seed initial terms.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\CPT;

/**
 * Class Chapitre_Taxonomy
 * Handles registration and term seeding for the 'roi_chapitre' taxonomy.
 */
class Chapitre_Taxonomy {

	/**
	 * Register actions.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', [ $this, 'register' ], 0 );
		add_filter( 'get_terms', [ $this, 'trier_termes_chapitre' ], 10, 3 );
		add_filter( 'wp_terms_checklist_args', [ $this, 'args_checklist_chapitre' ], 10, 2 );
	}

	/**
	 * Register the taxonomy.
	 *
	 * @return void
	 */
	public function register(): void {
		$labels = [
			'name'              => _x( 'Chapitres', 'taxonomy general name', 'roi' ),
			'singular_name'     => _x( 'Chapitre', 'taxonomy singular name', 'roi' ),
			'search_items'      => __( 'Rechercher les chapitres', 'roi' ),
			'all_items'         => __( 'Tous les chapitres', 'roi' ),
			'parent_item'       => __( 'Chapitre parent', 'roi' ),
			'parent_item_colon' => __( 'Chapitre parent :', 'roi' ),
			'edit_item'         => __( 'Modifier le chapitre', 'roi' ),
			'update_item'       => __( 'Mettre à jour le chapitre', 'roi' ),
			'add_new_item'      => __( 'Ajouter un nouveau chapitre', 'roi' ),
			'new_item_name'     => __( 'Nom du nouveau chapitre', 'roi' ),
			'menu_name'         => __( 'Chapitres', 'roi' ),
		];

		$args = [
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_in_menu'      => false,
			'show_admin_column' => false,
			'query_var'         => true,
			'rewrite'           => [ 'slug' => 'roi-chapitre' ],
			'show_in_rest'      => true,
		];

		register_taxonomy( 'roi_chapitre', [ 'roi_exercice', 'roi_lecon', 'roi_cours' ], $args );

		$this->seed_terms();
	}

	/**
	 * Seed initial terms for the 'roi_chapitre' taxonomy.
	 *
	 * @return void
	 */
	public function seed_terms(): void {
		$terms = [
			'Matérialité'         => 'primary',
			'Activité des Pièces' => 'warning',
			'Sécurité du Roi'     => 'danger',
			'Structure de Pions'  => 'success',
			'Combination'         => 'tertiary',
		];

		foreach ( $terms as $name => $color ) {
			$term = term_exists( $name, 'roi_chapitre' );

			if ( ! $term ) {
				$inserted = wp_insert_term( $name, 'roi_chapitre' );
				if ( ! is_wp_error( $inserted ) && is_array( $inserted ) ) {
					$term_id = (int) $inserted['term_id'];
					update_term_meta( $term_id, '_roi_chapitre_couleur', $color );
				}
			} else {
				$term_id = is_array( $term ) ? (int) $term['term_id'] : (int) $term;
				$current_color = get_term_meta( $term_id, '_roi_chapitre_couleur', true );
				if ( empty( $current_color ) ) {
					update_term_meta( $term_id, '_roi_chapitre_couleur', $color );
				}
			}
		}
	}

	/**
	 * Sorts terms of roi_chapitre to follow the strict predefined order.
	 *
	 * @param array<int, mixed>|\WP_Error $terms Array of terms.
	 * @param array<int, string> $taxonomies Taxonomies being queried.
	 * @param array<string, mixed> $args Arguments.
	 * @return array<int, mixed>|\WP_Error Sorted terms.
	 */
	public function trier_termes_chapitre( $terms, $taxonomies, $args ) {
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return $terms;
		}

		if ( is_array( $taxonomies ) && in_array( 'roi_chapitre', $taxonomies, true ) ) {
			$order_map = [
				'Matérialité'         => 1,
				'Activité des Pièces' => 2,
				'Sécurité du Roi'     => 3,
				'Structure de Pions'  => 4,
				'Combination'         => 5,
			];

			usort( $terms, function( $a, $b ) use ( $order_map ) {
				$name_a = is_object( $a ) ? $a->name : ( is_array( $a ) ? ( $a['name'] ?? '' ) : '' );
				$name_b = is_object( $b ) ? $b->name : ( is_array( $b ) ? ( $b['name'] ?? '' ) : '' );
				$pos_a  = $order_map[ $name_a ] ?? 99;
				$pos_b  = $order_map[ $name_b ] ?? 99;
				return $pos_a <=> $pos_b;
			} );
		}

		return $terms;
	}

	/**
	 * Configure arguments for checklist chapitre.
	 *
	 * @param array<string, mixed> $args Arguments.
	 * @param int $post_id Post ID.
	 * @return array<string, mixed>
	 */
	public function args_checklist_chapitre( array $args, int $post_id ): array {
		if ( isset( $args['taxonomy'] ) && 'roi_chapitre' === $args['taxonomy'] ) {
			$args['checked_ontop'] = false;
			$args['walker']        = new \ROI\Admin\Walker_Category_Radio();
		}
		return $args;
	}
}
