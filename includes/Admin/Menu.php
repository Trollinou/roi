<?php
declare(strict_types=1);

namespace ROI\Admin;

/**
 * Gestion des menus d'administration.
 */
final class Menu {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'admin_menu', [ $this, 'add_menus' ] );
        add_filter( 'parent_file', [ $this, 'correct_highlighting' ] );
    }

    /**
     * Ajoute les menus.
     */
    public function add_menus(): void {
        add_menu_page(
            __( "Apprentissage", "roi" ),
            __( "Apprentissage", "roi" ),
            'edit_posts',
            'roi-apprentissage',
            '',
            'dashicons-book',
            22
        );

        add_submenu_page(
            'roi-apprentissage',
            __( "Catégories", "roi" ),
            __( "Catégories", "roi" ),
            'manage_options',
            'edit-tags.php?taxonomy=roi_chess_category&post_type=roi_lecon'
        );
    }

    /**
     * Corrige la mise en surbrillance du menu pour les taxonomies.
     *
     * @param string $parent_file Le fichier parent déterminé par WordPress.
     * @return string Le slug du menu parent corrigé.
     */
    public function correct_highlighting( string $parent_file ): string {
        global $current_screen;

        if ( isset( $current_screen->taxonomy ) && $current_screen->taxonomy === 'roi_chess_category' ) {
            $parent_file = 'roi-apprentissage';
        }

        return $parent_file;
    }
}
