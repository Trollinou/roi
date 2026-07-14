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
			'show_admin_column' => true,
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
}
