<?php
declare(strict_types=1);

namespace ROI\CPT\Taxonomies;

/**
 * Gestion de la taxonomie "Catégorie d'échecs".
 */
final class ChessCategory {

    /** @var string Slug de la taxonomie */
    public const SLUG = 'roi_chess_category';

    /**
     * Initialisation.
     */
    public function register(): void {
        $labels = [
            'name'              => _x( "Catégories d'échecs", "taxonomy general name", "roi" ),
            'singular_name'     => _x( "Catégorie d'échecs", "taxonomy singular name", "roi" ),
            'search_items'      => __( "Rechercher les catégories", "roi" ),
            'all_items'         => __( "Toutes les catégories", "roi" ),
            'parent_item'       => __( "Catégorie parente", "roi" ),
            'parent_item_colon' => __( "Catégorie parente :", "roi" ),
            'edit_item'         => __( "Modifier la catégorie", "roi" ),
            'update_item'       => __( "Mettre à jour la catégorie", "roi" ),
            'add_new_item'      => __( "Ajouter une nouvelle catégorie", "roi" ),
            'new_item_name'     => __( "Nom de la nouvelle catégorie", "roi" ),
            'menu_name'         => __( "Catégories d'échecs", "roi" ),
        ];

        $args = [
            'hierarchical'      => true,
            'labels'            => $labels,
            'show_ui'           => true,
            'show_admin_column' => true,
            'query_var'         => true,
            'rewrite'           => [ 'slug' => 'chess-category' ],
            'show_in_rest'      => true,
        ];

        register_taxonomy( self::SLUG, [ 'roi_lecon', 'roi_exercice', 'roi_cours' ], $args );
    }
}
