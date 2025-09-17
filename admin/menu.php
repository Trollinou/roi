<?php
/**
 * File for handling menu manipulations.
 *
 * @package ROI - Ressources et Organisation pour l’Initiation aux échecs
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Adds the main "Apprentissage" menu.
 */
function roi_add_apprentissage_menu() {
    add_menu_page(
        __( "Apprentissage", 'roi' ),
        __( "Apprentissage", 'roi' ),
        'edit_posts', // Capability required
        'roi-apprentissage', // Menu slug
        '', // Callback function - left empty as it will be handled by the first submenu item
        'dashicons-book', // Icon
        22 // Position
    );

    // Add a submenu for Categories
    add_submenu_page(
        'roi-apprentissage',
        __( "Catégories", 'roi' ),
        __( "Catégories", 'roi' ),
        'manage_options', // or a more specific capability
        'edit-tags.php?taxonomy=roi_chess_category&post_type=roi_lecon'
    );

}
add_action( 'admin_menu', 'roi_add_apprentissage_menu' );

/**
 * Corrects the highlighting for the "Catégories" submenu.
 *
 * @param string $parent_file The parent file.
 * @return string The corrected parent file.
 */
function roi_apprentissage_menu_highlight( $parent_file ) {
    global $current_screen;

    if ( $current_screen->taxonomy === 'roi_chess_category' ) {
        $parent_file = 'roi-apprentissage';
    }

    return $parent_file;
}
add_filter( 'parent_file', 'roi_apprentissage_menu_highlight' );
