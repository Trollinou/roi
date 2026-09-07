<?php
/**
 * Register Video Custom Post Type.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\CPT;

/**
 * Class Video
 * Handles 'roi_video' custom post type registration.
 */
class Video {

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
			'name'                  => _x( 'Vidéos', 'Post Type General Name', 'roi' ),
			'singular_name'         => _x( 'Vidéo', 'Post Type Singular Name', 'roi' ),
			'menu_name'             => __( 'Vidéos', 'roi' ),
			'name_admin_bar'        => __( 'Vidéo', 'roi' ),
			'archives'              => __( 'Archives des vidéos', 'roi' ),
			'attributes'            => __( 'Attributs de la vidéo', 'roi' ),
			'parent_item_colon'     => __( 'Vidéo parente :', 'roi' ),
			'all_items'             => __( 'Toutes les vidéos', 'roi' ),
			'add_new_item'          => __( 'Ajouter une nouvelle vidéo', 'roi' ),
			'add_new'               => __( 'Ajouter', 'roi' ),
			'new_item'              => __( 'Nouvelle vidéo', 'roi' ),
			'edit_item'             => __( 'Modifier la vidéo', 'roi' ),
			'update_item'           => __( 'Mettre à jour la vidéo', 'roi' ),
			'view_item'             => __( 'Voir la vidéo', 'roi' ),
			'view_items'            => __( 'Voir les vidéos', 'roi' ),
			'search_items'          => __( 'Rechercher une vidéo', 'roi' ),
			'not_found'             => __( 'Non trouvé', 'roi' ),
			'not_found_in_trash'    => __( 'Non trouvé dans la corbeille', 'roi' ),
			'featured_image'        => __( 'Image mise en avant', 'roi' ),
			'set_featured_image'    => __( 'Définir l\'image mise en avant', 'roi' ),
			'remove_featured_image' => __( 'Supprimer l\'image mise en avant', 'roi' ),
			'use_featured_image'    => __( 'Utiliser comme image mise en avant', 'roi' ),
			'insert_into_item'      => __( 'Insérer dans la vidéo', 'roi' ),
			'uploaded_to_this_item' => __( 'Téléversé sur cette vidéo', 'roi' ),
			'items_list'            => __( 'Liste des vidéos', 'roi' ),
			'items_list_navigation' => __( 'Navigation de la liste des vidéos', 'roi' ),
			'filter_items_list'     => __( 'Filtrer la liste des vidéos', 'roi' ),
		);

		$args = array(
			'label'               => __( 'Vidéo', 'roi' ),
			'description'         => __( 'Vidéos pédagogiques de la section Échecs', 'roi' ),
			'labels'              => $labels,
			'supports'            => array( 'title', 'revision' ),
			'taxonomies'          => array( 'roi_chapitre' ),
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
			'capabilities'        => array(
				'edit_post'          => 'edit_exercice',
				'read_post'          => 'read_exercice',
				'delete_post'        => 'delete_exercice',
				'edit_posts'         => 'edit_exercices',
				'edit_others_posts'  => 'edit_others_exercices',
				'publish_posts'      => 'publish_exercices',
				'read_private_posts' => 'read_private_exercices',
			),
			'map_meta_cap'        => true,
			'show_in_rest'        => true,
			'menu_icon'           => 'dashicons-video-alt3',
		);

		register_post_type( 'roi_video', $args );
	}
}
