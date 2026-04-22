<?php
declare(strict_types=1);

namespace ROI\Admin\BackupRestore;

use WP_Query;

/**
 * Gestionnaire de sauvegarde et restauration des données.
 */
final class Manager {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'admin_init', [ $this, 'handle_backup_action' ] );
        add_action( 'admin_init', [ $this, 'handle_restore_action' ] );
    }

    /**
     * Récupère toutes les données d'apprentissage pour l'export.
     *
     * @return array<string, array<mixed>> Les données d'export.
     */
    public function get_export_data(): array {
        $post_types = [ 'roi_lecon', 'roi_exercice', 'roi_cours' ];
        $taxonomy   = 'roi_chess_category';

        $export_data = [
            'posts' => [],
            'terms' => [],
        ];

        // Export des termes
        $terms = get_terms( [
            'taxonomy'   => $taxonomy,
            'hide_empty' => false,
        ] );

        if ( ! is_wp_error( $terms ) && is_array( $terms ) ) {
            foreach ( $terms as $term ) {
                $export_data['terms'][] = [
                    'term_id'     => $term->term_id,
                    'name'        => $term->name,
                    'slug'        => $term->slug,
                    'description' => $term->description,
                    'parent'      => $term->parent,
                ];
            }
        }

        // Export des posts
        $query = new WP_Query( [
            'post_type'      => $post_types,
            'posts_per_page' => -1,
            'post_status'    => 'any',
        ] );

        if ( $query->have_posts() ) {
            while ( $query->have_posts() ) {
                $query->the_post();
                $post_id   = get_the_ID();
                $post_data = [
                    'post_title'   => get_the_title(),
                    'post_content' => get_the_content(),
                    'post_excerpt' => get_the_excerpt(),
                    'post_status'  => get_post_status(),
                    'post_type'    => get_post_type(),
                    'post_name'    => get_post_field( 'post_name' ),
                    'meta_input'   => [],
                    'tax_input'    => [],
                ];

                $meta = get_post_meta( $post_id );
                if ( is_array( $meta ) ) {
                    foreach ( $meta as $key => $value ) {
                        $post_data['meta_input'][ $key ] = maybe_unserialize( $value[0] );
                    }
                }

                $post_terms = wp_get_post_terms( $post_id, $taxonomy, [ 'fields' => 'slugs' ] );
                if ( ! is_wp_error( $post_terms ) ) {
                    $post_data['tax_input'][ $taxonomy ] = $post_terms;
                }

                $export_data['posts'][] = $post_data;
            }
            wp_reset_postdata();
        }

        return $export_data;
    }

    /**
     * Gère l'action de sauvegarde.
     */
    public function handle_backup_action(): void {
        if ( ! isset( $_POST['roi_backup_action'], $_POST['roi_backup_nonce'] ) || ! wp_verify_nonce( $_POST['roi_backup_nonce'], 'roi_backup_nonce_action' ) ) {
            return;
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", "roi" ) );
        }

        $export_data = $this->get_export_data();

        $filename         = 'roi-apprentissage-backup-' . date( 'Y-m-d' ) . '.json.gz';
        $data_to_compress = (string) json_encode( $export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
        $compressed_data  = gzcompress( $data_to_compress );

        if ( false === $compressed_data ) {
            wp_die( esc_html__( "Erreur lors de la compression des données.", "roi" ) );
        }

        ob_clean();
        header( 'Content-Type: application/octet-stream' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Content-Length: ' . strlen( $compressed_data ) );
        echo $compressed_data;
        exit;
    }

    /**
     * Gère l'action de restauration.
     */
    public function handle_restore_action(): void {
        if ( ! isset( $_POST['roi_restore_action'], $_POST['roi_restore_nonce'] ) || ! wp_verify_nonce( $_POST['roi_restore_nonce'], 'roi_restore_nonce_action' ) ) {
            return;
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", "roi" ) );
        }

        if ( ! isset( $_FILES['roi_restore_file'] ) || $_FILES['roi_restore_file']['error'] !== UPLOAD_ERR_OK ) {
            $this->add_notice( __( "Erreur lors du téléversement du fichier.", "roi" ), 'error' );
            return;
        }

        $file            = $_FILES['roi_restore_file'];
        $filename        = (string) $file['name'];
        $file_ext        = pathinfo( $filename, PATHINFO_EXTENSION );
        $file_ext_double = pathinfo( str_replace( '.gz', '', $filename ), PATHINFO_EXTENSION );

        if ( $file_ext !== 'gz' || $file_ext_double !== 'json' ) {
            $this->add_notice( __( "Le fichier téléversé n'est pas une sauvegarde valide (format .json.gz attendu).", "roi" ), 'error' );
            return;
        }

        $compressed_data = file_get_contents( (string) $file['tmp_name'] );
        if ( false === $compressed_data ) {
            $this->add_notice( __( "Erreur lors de la lecture du fichier temporaire.", "roi" ), 'error' );
            return;
        }

        $json_data   = gzuncompress( $compressed_data );
        if ( false === $json_data ) {
            $this->add_notice( __( "Erreur lors de la décompression des données.", "roi" ), 'error' );
            return;
        }

        $import_data = json_decode( $json_data, true );

        if ( json_last_error() !== JSON_ERROR_NONE ) {
            $this->add_notice( __( "Erreur lors de la lecture des données JSON.", "roi" ), 'error' );
            return;
        }

        // Nettoyage des données existantes
        $post_types = [ 'roi_lecon', 'roi_exercice', 'roi_cours' ];
        $taxonomy   = 'roi_chess_category';

        $existing_posts = get_posts( [ 'post_type' => $post_types, 'posts_per_page' => -1, 'fields' => 'ids' ] );
        foreach ( $existing_posts as $post_id ) {
            wp_delete_post( (int) $post_id, true );
        }

        $existing_terms = get_terms( [ 'taxonomy' => $taxonomy, 'hide_empty' => false, 'fields' => 'ids' ] );
        if ( is_array( $existing_terms ) ) {
            foreach ( $existing_terms as $term_id ) {
                wp_delete_term( (int) $term_id, $taxonomy );
            }
        }

        // Import des termes
        $term_map = []; // old_id => new_id
        if ( ! empty( $import_data['terms'] ) ) {
            foreach ( $import_data['terms'] as $term_data ) {
                $new_term = wp_insert_term( (string) $term_data['name'], $taxonomy, [
                    'slug'        => (string) $term_data['slug'],
                    'description' => (string) $term_data['description'],
                    'parent'      => 0,
                ] );
                if ( ! is_wp_error( $new_term ) ) {
                    $term_map[ $term_data['term_id'] ] = $new_term['term_id'];
                }
            }

            foreach ( $import_data['terms'] as $term_data ) {
                if ( $term_data['parent'] && isset( $term_map[ $term_data['term_id'] ], $term_map[ $term_data['parent'] ] ) ) {
                    wp_update_term( $term_map[ $term_data['term_id'] ], $taxonomy, [
                        'parent' => $term_map[ $term_data['parent'] ],
                    ] );
                }
            }
        }

        // Import des posts
        if ( ! empty( $import_data['posts'] ) ) {
            foreach ( $import_data['posts'] as $post_data ) {
                wp_insert_post( $post_data, true );
            }
        }

        $this->add_notice( __( "La restauration des données d'apprentissage a été effectuée avec succès.", "roi" ) );
    }

    /**
     * Ajoute une notification via transient.
     */
    private function add_notice( string $message, string $type = 'success' ): void {
        $notices = get_transient( 'roi_admin_notices' );
        if ( ! is_array( $notices ) ) {
            $notices = [];
        }
        $notices[] = [ 'message' => $message, 'type' => $type ];
        set_transient( 'roi_admin_notices', $notices, 60 );
    }
}
