<?php
declare(strict_types=1);

namespace ROI\Admin\Metaboxes;

use WP_Post;

/**
 * Metabox pour le CPT Cours (Constructeur de cours).
 */
final class Cours {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
        add_action( 'save_post_roi_cours', [ $this, 'save_meta' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
        
        // Initialisation de l'AJAX
        ( new CoursAjax() )->init();
    }

    /**
     * Scripts spécifiques pour le constructeur de cours.
     */
    public function enqueue_scripts( string $hook ): void {
        global $post;
        if ( in_array( $hook, [ 'post.php', 'post-new.php' ], true ) && isset( $post->post_type ) && $post->post_type === 'roi_cours' ) {
            wp_enqueue_script(
                'roi-course-builder',
                ROI_PLUGIN_URL . 'assets/js/admin-script.js',
                [ 'jquery' ],
                ROI_VERSION,
                true
            );
            wp_localize_script(
                'roi-course-builder',
                'roi_course_builder_data',
                [
                    'ajax_url'  => admin_url( 'admin-ajax.php' ),
                    'nonce'     => wp_create_nonce( 'roi_course_builder_nonce' ),
                    'course_id' => $post->ID,
                    'i18n'      => [
                        'loading'    => __( "Chargement...", "roi" ),
                        'no_content' => __( "Aucun contenu disponible pour ce niveau de difficulté.", "roi" ),
                        'error'      => __( "Une erreur est survenue lors du chargement.", "roi" ),
                        'lessons'    => __( "Leçons", "roi" ),
                        'exercices'  => __( "Exercices", "roi" ),
                    ],
                ]
            );
        }
    }

    /**
     * Enregistre la metabox.
     */
    public function add_meta_boxes(): void {
        add_meta_box(
            'roi_cours_builder_metabox',
            __( "Constructeur de Cours", "roi" ),
            [ $this, 'render_metabox' ],
            'roi_cours',
            'normal',
            'high'
        );
    }

    /**
     * Rendu de la metabox.
     */
    public function render_metabox( WP_Post $post ): void {
        wp_nonce_field( 'roi_save_cours_meta', 'roi_cours_metabox_nonce' );

        $difficulty       = get_post_meta( $post->ID, '_roi_difficulty', true );
        $course_items_raw = get_post_meta( $post->ID, '_roi_course_items', true );
        if ( ! is_array( $course_items_raw ) ) {
            $course_items_raw = [];
        }
        ?>
        <table class="form-table">
            <tr>
                <th><label for="roi_difficulty"><?php _e( "Difficulté du cours", "roi" ); ?></label></th>
                <td>
                    <select name="roi_difficulty" id="roi_difficulty">
                        <option value="" <?php selected( $difficulty, '' ); ?>><?php _e( "— Sélectionner une difficulté —", "roi" ); ?></option>
                        <option value="1" <?php selected( $difficulty, 1 ); ?>><?php _e( "1 - Très facile", "roi" ); ?></option>
                        <option value="2" <?php selected( $difficulty, 2 ); ?>><?php _e( "2 - Facile", "roi" ); ?></option>
                        <option value="3" <?php selected( $difficulty, 3 ); ?>><?php _e( "3 - Modéré", "roi" ); ?></option>
                        <option value="4" <?php selected( $difficulty, 4 ); ?>><?php _e( "4 - Difficile", "roi" ); ?></option>
                        <option value="5" <?php selected( $difficulty, 5 ); ?>><?php _e( "5 - Très Difficile", "roi" ); ?></option>
                        <option value="6" <?php selected( $difficulty, 6 ); ?>><?php _e( "6 - Expert", "roi" ); ?></option>
                    </select>
                    <p class="description"><?php _e( "La difficulté du cours déterminera les leçons et exercices qui peuvent y être inclus.", "roi" ); ?></p>
                </td>
            </tr>
        </table>
        <hr>
        <style>
            .roi-dual-list-wrapper { display: flex; align-items: center; gap: 15px; }
            .roi-dual-list-box { flex: 1; }
            .roi-dual-list-box select { width: 100%; height: 300px; }
            .roi-dual-list-controls { display: flex; flex-direction: column; gap: 10px; }
            .roi-dual-list-controls button { width: 100px; }
            #roi-available-items-select:disabled { background-color: #f0f0f0; }
        </style>
        <div class="roi-dual-list-wrapper">
            <div class="roi-dual-list-box">
                <strong><?php _e( "Contenus Disponibles", "roi" ); ?></strong>
                <select id="roi-available-items-select" multiple disabled></select>
                <p class="description" id="roi-available-items-placeholder">
                    <?php
                    if ( get_post_meta( $post->ID, '_roi_difficulty', true ) ) {
                        _e( "Chargement...", "roi" );
                    } else {
                        _e( "Veuillez d'abord sélectionner et enregistrer une difficulté pour le cours.", "roi" );
                    }
                    ?>
                </p>
            </div>

            <div class="roi-dual-list-controls">
                <button type="button" id="roi-add-to-course" class="button">&gt;&gt;</button>
                <button type="button" id="roi-remove-from-course" class="button">&lt;&lt;</button>
            </div>

            <div class="roi-dual-list-box">
                <strong><?php _e( "Contenu du Cours", "roi" ); ?></strong>
                <select id="roi-course-items-select" multiple>
                    <?php
                    foreach ( $course_items_raw as $item ) {
                        $post_obj = get_post( (int) $item['id'] );
                        if ( $post_obj ) {
                            $post_type_name = 'roi_' . $item['type'];
                            $post_type_obj  = get_post_type_object( $post_type_name );
                            $type_label     = $post_type_obj ? $post_type_obj->labels->singular_name : ucfirst( (string) $item['type'] );

                            $value = esc_attr( $item['type'] . ':' . $item['id'] );
                            $label = esc_html( $post_obj->post_title . ' (' . $type_label . ')' );
                            echo "<option value=\"{$value}\">{$label}</option>";
                        }
                    }
                    ?>
                </select>
                <div id="roi-course-items-hidden-inputs">
                    <?php
                    foreach ( $course_items_raw as $item ) {
                        $value = esc_attr( $item['type'] . ':' . $item['id'] );
                        echo '<input type="hidden" name="roi_course_items[]" value="' . $value . '">';
                    }
                    ?>
                </div>
            </div>

            <div class="roi-dual-list-controls">
                <button type="button" id="roi-move-up" class="button">&#9650;</button>
                <button type="button" id="roi-move-down" class="button">&#9660;</button>
            </div>
        </div>
        <?php
    }

    /**
     * Sauvegarde les données.
     */
    public function save_meta( int $post_id ): void {
        if ( ! isset( $_POST['roi_cours_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_cours_metabox_nonce'], 'roi_save_cours_meta' ) ) {
            return;
        }
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }
        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        if ( empty( $_POST['roi_difficulty'] ) ) {
            set_transient( 'roi_error_message', __( "La difficulté est un champ obligatoire. Le cours n'a pas été publié.", "roi" ), 10 );

            remove_action( 'save_post_roi_cours', [ $this, 'save_meta' ] );
            wp_update_post( [ 'ID' => $post_id, 'post_status' => 'draft' ] );
            add_action( 'save_post_roi_cours', [ $this, 'save_meta' ] );
            return;
        }

        update_post_meta( $post_id, '_roi_difficulty', intval( $_POST['roi_difficulty'] ) );

        if ( isset( $_POST['roi_course_items'] ) && is_array( $_POST['roi_course_items'] ) ) {
            $sanitized_items = [];
            foreach ( $_POST['roi_course_items'] as $item ) {
                $parts = explode( ':', sanitize_text_field( (string) $item ) );
                if ( count( $parts ) === 2 ) {
                    list( $type, $id ) = $parts;
                    if ( in_array( $type, [ 'lecon', 'exercice' ], true ) && is_numeric( $id ) ) {
                        $sanitized_items[] = [
                            'type' => $type,
                            'id'   => intval( $id ),
                        ];
                    }
                }
            }
            update_post_meta( $post_id, '_roi_course_items', $sanitized_items );
        } else {
            delete_post_meta( $post_id, '_roi_course_items' );
        }
    }
}
