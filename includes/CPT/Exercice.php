<?php
/**
 * Register Exercice Custom Post Type.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\CPT;

/**
 * Class Exercice
 * Handles 'roi_exercice' custom post type registration.
 */
class Exercice {

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
			'name'                  => _x( 'Exercices', 'Post Type General Name', 'roi' ),
			'singular_name'         => _x( 'Exercice', 'Post Type Singular Name', 'roi' ),
			'menu_name'             => __( 'Exercices', 'roi' ),
			'name_admin_bar'        => __( 'Exercice', 'roi' ),
			'archives'              => __( 'Archives des exercices', 'roi' ),
			'attributes'            => __( 'Attributs de l\'exercice', 'roi' ),
			'parent_item_colon'     => __( 'Exercice parent :', 'roi' ),
			'all_items'             => __( 'Tous les exercices', 'roi' ),
			'add_new_item'          => __( 'Ajouter un nouvel exercice', 'roi' ),
			'add_new'               => __( 'Ajouter', 'roi' ),
			'new_item'              => __( 'Nouvel exercice', 'roi' ),
			'edit_item'             => __( 'Modifier l\'exercice', 'roi' ),
			'update_item'           => __( 'Mettre à jour l\'exercice', 'roi' ),
			'view_item'             => __( 'Voir l\'exercice', 'roi' ),
			'view_items'            => __( 'Voir les exercices', 'roi' ),
			'search_items'          => __( 'Rechercher un exercice', 'roi' ),
			'not_found'             => __( 'Non trouvé', 'roi' ),
			'not_found_in_trash'    => __( 'Non trouvé dans la corbeille', 'roi' ),
			'items_list'            => __( 'Liste des exercices', 'roi' ),
			'items_list_navigation' => __( 'Navigation de la liste des exercices', 'roi' ),
			'filter_items_list'     => __( 'Filtrer la liste des exercices', 'roi' ),
		];

		$args = [
			'label'               => __( 'Exercice', 'roi' ),
			'description'         => __( 'Exercices de la section Échecs', 'roi' ),
			'labels'              => $labels,
			'supports'            => [ 'title', 'revision' ],
			'taxonomies'          => [ 'roi_chapitre' ],
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
				'edit_post'          => 'edit_exercice',
				'read_post'          => 'read_exercice',
				'delete_post'        => 'delete_exercice',
				'edit_posts'         => 'edit_exercices',
				'edit_others_posts'  => 'edit_others_exercices',
				'publish_posts'      => 'publish_exercices',
				'read_private_posts' => 'read_private_exercices',
			],
			'map_meta_cap'        => true,
			'show_in_rest'        => true,
		];

		register_post_type( 'roi_exercice', $args );
	}
}
