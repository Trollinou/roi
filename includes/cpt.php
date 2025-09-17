<?php
/**
 * File for registering the LMS Custom Post Types.
 *
 * @package ROI - Ressources et Organisation pour l’Initiation aux échecs
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Register the Leçon CPT.
 */
function roi_register_lecon_cpt() {

    $labels = array(
        'name'                  => _x( 'Leçons', 'Post Type General Name', 'roi' ),
        'singular_name'         => _x( 'Leçon', 'Post Type Singular Name', 'roi' ),
        'menu_name'             => __( 'Leçons', 'roi' ),
        'name_admin_bar'        => __( 'Leçon', 'roi' ),
        'archives'              => __( 'Archives des leçons', 'roi' ),
        'attributes'            => __( 'Attributs de la leçon', 'roi' ),
        'parent_item_colon'     => __( 'Leçon parente :', 'roi' ),
        'all_items'             => __( 'Toutes les leçons', 'roi' ),
        'add_new_item'          => __( 'Ajouter une nouvelle leçon', 'roi' ),
        'add_new'               => __( 'Ajouter', 'roi' ),
        'new_item'              => __( 'Nouvelle leçon', 'roi' ),
        'edit_item'             => __( 'Modifier la leçon', 'roi' ),
        'update_item'           => __( 'Mettre à jour la leçon', 'roi' ),
        'view_item'             => __( 'Voir la leçon', 'roi' ),
        'view_items'            => __( 'Voir les leçons', 'roi' ),
        'search_items'          => __( 'Rechercher une leçon', 'roi' ),
        'not_found'             => __( 'Non trouvé', 'roi' ),
        'not_found_in_trash'    => __( 'Non trouvé dans la corbeille', 'roi' ),
        'featured_image'        => __( 'Image mise en avant', 'roi' ),
        'set_featured_image'    => __( 'Définir l\'image mise en avant', 'roi' ),
        'remove_featured_image' => __( 'Supprimer l\'image mise en avant', 'roi' ),
        'use_featured_image'    => __( 'Utiliser comme image mise en avant', 'roi' ),
        'insert_into_item'      => __( 'Insérer dans la leçon', 'roi' ),
        'uploaded_to_this_item' => __( 'Téléversé sur cette leçon', 'roi' ),
        'items_list'            => __( 'Liste des leçons', 'roi' ),
        'items_list_navigation' => __( 'Navigation de la liste des leçons', 'roi' ),
        'filter_items_list'     => __( 'Filtrer la liste des leçons', 'roi' ),
    );

    $args = array(
        'label'                 => __( 'Leçon', 'roi' ),
        'description'           => __( 'Leçons de la section Échecs', 'roi' ),
        'labels'                => $labels,
        'supports'              => array( 'title', 'editor', 'thumbnail', 'revisions', 'author' ),
        'taxonomies'            => array( 'roi_chess_category' ),
        'hierarchical'          => false,
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => 'roi-apprentissage',
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => true,
        'can_export'            => true,
        'has_archive'           => true,
        'exclude_from_search'   => false,
        'publicly_queryable'    => true,
        'capability_type'       => 'page',
        'show_in_rest'          => true,
    );

    register_post_type( 'roi_lecon', $args );
}
add_action( 'init', 'roi_register_lecon_cpt', 0 );

/**
 * Register the Exercice CPT.
 */
function roi_register_exercice_cpt() {

    $labels = array(
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
    );

    $args = array(
        'label'                 => __( 'Exercice', 'roi' ),
        'description'           => __( 'Exercices de la section Échecs', 'roi' ),
        'labels'                => $labels,
        'supports'              => array( 'title', 'editor', 'revisions', 'author' ),
        'taxonomies'            => array( 'roi_chess_category' ),
        'hierarchical'          => false,
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => 'roi-apprentissage',
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => true,
        'can_export'            => true,
        'has_archive'           => true,
        'exclude_from_search'   => false,
        'publicly_queryable'    => true,
        'capability_type'       => 'post', // Changed to 'post' for more granular control
        'capabilities' => array(
            'edit_post'          => 'edit_exercice',
            'read_post'          => 'read_exercice',
            'delete_post'        => 'delete_exercice',
            'edit_posts'         => 'edit_exercices',
            'edit_others_posts'  => 'edit_others_exercices',
            'publish_posts'      => 'publish_exercices',
            'read_private_posts' => 'read_private_exercices',
        ),
        'map_meta_cap'          => true, // Required to make meta capabilities work
        'show_in_rest'          => true,
    );

    register_post_type( 'roi_exercice', $args );
}
add_action( 'init', 'roi_register_exercice_cpt', 0 );

/**
 * Register the Cours CPT.
 */
function roi_register_cours_cpt() {

    $labels = array(
        'name'                  => _x( 'Cours', 'Post Type General Name', 'roi' ),
        'singular_name'         => _x( 'Cours', 'Post Type Singular Name', 'roi' ),
        'menu_name'             => __( 'Cours', 'roi' ),
        'name_admin_bar'        => __( 'Cours', 'roi' ),
        'archives'              => __( 'Archives des cours', 'roi' ),
        'attributes'            => __( 'Attributs du cours', 'roi' ),
        'parent_item_colon'     => __( 'Cours parent :', 'roi' ),
        'all_items'             => __( 'Tous les cours', 'roi' ),
        'add_new_item'          => __( 'Ajouter un nouveau cours', 'roi' ),
        'add_new'               => __( 'Ajouter', 'roi' ),
        'new_item'              => __( 'Nouveau cours', 'roi' ),
        'edit_item'             => __( 'Modifier le cours', 'roi' ),
        'update_item'           => __( 'Mettre à jour le cours', 'roi' ),
        'view_item'             => __( 'Voir le cours', 'roi' ),
        'view_items'            => __( 'Voir les cours', 'roi' ),
        'search_items'          => __( 'Rechercher un cours', 'roi' ),
    );

    $args = array(
        'label'                 => __( 'Cours', 'roi' ),
        'description'           => __( 'Cours constitués de leçons et d\'exercices', 'roi' ),
        'labels'                => $labels,
        'supports'              => array( 'title', 'editor', 'author' ),
        'taxonomies'            => array( 'roi_chess_category' ),
        'hierarchical'          => false,
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => 'roi-apprentissage',
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => true,
        'can_export'            => true,
        'has_archive'           => true,
        'exclude_from_search'   => false,
        'publicly_queryable'    => true,
        'capability_type'       => 'post', // Using 'post' and custom capabilities like for exercices
        'capabilities' => array(
            'edit_post'          => 'edit_cours_item',
            'read_post'          => 'read_cours_item',
            'delete_post'        => 'delete_cours_item',
            'edit_posts'         => 'edit_cours',
            'edit_others_posts'  => 'edit_others_cours',
            'publish_posts'      => 'publish_cours',
            'read_private_posts' => 'read_private_cours',
        ),
        'map_meta_cap'          => true,
        'show_in_rest'          => true,
    );

    register_post_type( 'roi_cours', $args );
}
add_action( 'init', 'roi_register_cours_cpt', 0 );
