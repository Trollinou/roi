<?php
/**
 * File for registering custom taxonomies.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Register Chess Category Taxonomy
 */
function roi_register_chess_category_taxonomy() {
    $labels = array(
        'name'              => _x( 'Catégories d\'échecs', 'taxonomy general name', 'roi' ),
        'singular_name'     => _x( 'Catégorie d\'échecs', 'taxonomy singular name', 'roi' ),
        'search_items'      => __( 'Rechercher les catégories', 'roi' ),
        'all_items'         => __( 'Toutes les catégories', 'roi' ),
        'parent_item'       => __( 'Catégorie parente', 'roi' ),
        'parent_item_colon' => __( 'Catégorie parente :', 'roi' ),
        'edit_item'         => __( 'Modifier la catégorie', 'roi' ),
        'update_item'       => __( 'Mettre à jour la catégorie', 'roi' ),
        'add_new_item'      => __( 'Ajouter une nouvelle catégorie', 'roi' ),
        'new_item_name'     => __( 'Nom de la nouvelle catégorie', 'roi' ),
        'menu_name'         => __( 'Catégories d\'échecs', 'roi' ),
    );

    $args = array(
        'hierarchical'      => true,
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'chess-category' ),
        'show_in_rest'      => true, // Available in block editor
    );

    // We will register this for the CPTs later
    register_taxonomy( 'roi_chess_category', array( 'roi_lecon', 'roi_exercice', 'roi_cours' ), $args );
}
add_action( 'init', 'roi_register_chess_category_taxonomy', 0 );
