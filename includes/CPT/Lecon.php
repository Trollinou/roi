<?php
declare(strict_types=1);

namespace ROI\CPT;

/**
 * Gestion du Custom Post Type "Leçon".
 */
final class Lecon {

    public const SLUG = 'roi_lecon';

    /**
     * Initialisation.
     */
    public function register(): void {
        $labels = [
            'name'                  => _x( "Leçons", "Post Type General Name", "roi" ),
            'singular_name'         => _x( "Leçon", "Post Type Singular Name", "roi" ),
            'menu_name'             => __( "Leçons", "roi" ),
            'name_admin_bar'        => __( "Leçon", "roi" ),
            'archives'              => __( "Archives des leçons", "roi" ),
            'attributes'            => __( "Attributs de la leçon", "roi" ),
            'parent_item_colon'     => __( "Leçon parente :", "roi" ),
            'all_items'             => __( "Toutes les leçons", "roi" ),
            'add_new_item'          => __( "Ajouter une nouvelle leçon", "roi" ),
            'add_new'               => __( "Ajouter", "roi" ),
            'new_item'              => __( "Nouvelle leçon", "roi" ),
            'edit_item'             => __( "Modifier la leçon", "roi" ),
            'update_item'           => __( "Mettre à jour la leçon", "roi" ),
            'view_item'             => __( "Voir la leçon", "roi" ),
            'view_items'            => __( "Voir les leçons", "roi" ),
            'search_items'          => __( "Rechercher une leçon", "roi" ),
            'not_found'             => __( "Non trouvé", "roi" ),
            'not_found_in_trash'    => __( "Non trouvé dans la corbeille", "roi" ),
            'featured_image'        => __( "Image mise en avant", "roi" ),
            'set_featured_image'    => __( "Définir l'image mise en avant", "roi" ),
            'remove_featured_image' => __( "Supprimer l'image mise en avant", "roi" ),
            'use_featured_image'    => __( "Utiliser comme image mise en avant", "roi" ),
            'insert_into_item'      => __( "Insérer dans la leçon", "roi" ),
            'uploaded_to_this_item' => __( "Téléversé sur cette leçon", "roi" ),
            'items_list'            => __( "Liste des leçons", "roi" ),
            'items_list_navigation' => __( "Navigation de la liste des leçons", "roi" ),
            'filter_items_list'     => __( "Filtrer la liste des leçons", "roi" ),
        ];

        $args = [
            'label'               => __( "Leçon", "roi" ),
            'description'         => __( "Leçons de la section Échecs", "roi" ),
            'labels'              => $labels,
            'supports'            => [ 'title', 'editor', 'thumbnail', 'revisions', 'author' ],
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
            'capability_type'     => 'page',
            'show_in_rest'        => true,
        ];

        register_post_type( self::SLUG, $args );
    }
}
