<?php
/**
 * Register Partie Custom Post Type.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\CPT;

/**
 * Class Partie
 * Handles 'roi_partie' custom post type registration.
 */
class Partie {

	/**
	 * Register actions.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register' ), 0 );
	}

	/**
	 * Register CPT.
	 *
	 * @return void
	 */
	public function register(): void {
		$labels = array(
			'name'               => _x( 'Parties', 'Post Type General Name', 'roi' ),
			'singular_name'      => _x( 'Partie', 'Post Type Singular Name', 'roi' ),
			'menu_name'          => __( 'Parties', 'roi' ),
			'name_admin_bar'     => __( 'Partie', 'roi' ),
			'archives'           => __( 'Archives des parties', 'roi' ),
			'attributes'         => __( 'Attributs de la partie', 'roi' ),
			'all_items'          => __( 'Toutes les parties', 'roi' ),
			'add_new_item'       => __( 'Ajouter une nouvelle partie', 'roi' ),
			'add_new'            => __( 'Ajouter', 'roi' ),
			'new_item'           => __( 'Nouvelle partie', 'roi' ),
			'edit_item'          => __( 'Modifier la partie', 'roi' ),
			'update_item'        => __( 'Mettre à jour la partie', 'roi' ),
			'view_item'          => __( 'Voir la partie', 'roi' ),
			'view_items'         => __( 'Voir les parties', 'roi' ),
			'search_items'       => __( 'Rechercher une partie', 'roi' ),
			'not_found'          => __( 'Non trouvé', 'roi' ),
			'not_found_in_trash' => __( 'Non trouvé dans la corbeille', 'roi' ),
		);

		$args = array(
			'label'               => __( 'Partie', 'roi' ),
			'description'         => __( 'Parties d\'échecs enregistrées depuis la PWA', 'roi' ),
			'labels'              => $labels,
			'supports'            => array( 'title', 'author' ),
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
			'show_in_rest'        => false,
		);

		register_post_type( 'roi_partie', $args );
	}
}
