<?php
/**
 * Register Cours Custom Post Type.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\CPT;

/**
 * Class Cours
 * Handles 'roi_cours' custom post type registration.
 */
class Cours {

	/**
	 * Register actions.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', [ $this, 'register' ], 0 );
	}

	/**
	 * Register CPT.
	 *
	 * @return void
	 */
	public function register(): void {
		$labels = [
			'name'              => _x( 'Cours', 'Post Type General Name', 'roi' ),
			'singular_name'     => _x( 'Cours', 'Post Type Singular Name', 'roi' ),
			'menu_name'         => __( 'Cours', 'roi' ),
			'name_admin_bar'    => __( 'Cours', 'roi' ),
			'archives'          => __( 'Archives des cours', 'roi' ),
			'attributes'        => __( 'Attributs du cours', 'roi' ),
			'parent_item_colon' => __( 'Cours parent :', 'roi' ),
			'all_items'         => __( 'Tous les cours', 'roi' ),
			'add_new_item'      => __( 'Ajouter un nouveau cours', 'roi' ),
			'add_new'           => __( 'Ajouter', 'roi' ),
			'new_item'          => __( 'Nouveau cours', 'roi' ),
			'edit_item'         => __( 'Modifier le cours', 'roi' ),
			'update_item'       => __( 'Mettre à jour le cours', 'roi' ),
			'view_item'         => __( 'Voir le cours', 'roi' ),
			'view_items'        => __( 'Voir les cours', 'roi' ),
			'search_items'      => __( 'Rechercher un cours', 'roi' ),
		];

		$args = [
			'label'               => __( 'Cours', 'roi' ),
			'description'         => __( 'Cours constitués de leçons et d\'exercices', 'roi' ),
			'labels'              => $labels,
			'supports'            => [ 'title', 'author' ],
			'taxonomies'          => [ 'roi_chess_category' ],
			'hierarchical'        => false,
			'public'              => true,
			'show_ui'             => true,
			'show_in_menu'        => 'roi-apprentissage',
			'show_in_admin_bar'   => true,
			'show_in_nav_menus'   => true,
			'can_export'          => true,
			'has_archive'         => true,
			'exclude_from_search' => false,
			'publicly_queryable'  => true,
			'capability_type'     => 'post',
			'capabilities'        => [
				'edit_post'          => 'edit_cours_item',
				'read_post'          => 'read_cours_item',
				'delete_post'        => 'delete_cours_item',
				'edit_posts'         => 'edit_cours',
				'edit_others_posts'  => 'edit_others_cours',
				'publish_posts'      => 'publish_cours',
				'read_private_posts' => 'read_private_cours',
			],
			'map_meta_cap'        => true,
			'show_in_rest'        => true,
		];

		register_post_type( 'roi_cours', $args );
	}
}
