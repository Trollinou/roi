<?php
/**
 * File for handling custom meta boxes and fields for the ROI CPTs.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Adds a transient-based admin notice.
 *
 * @param string $message The message to display.
 * @param string $type    The type of notice ('success', 'warning', 'error', 'info').
 */
function roi_add_admin_notice( $message, $type = 'success' ) {
    $transient_name = 'roi_admin_notice_' . md5( $message );
    set_transient( $transient_name, array( 'message' => $message, 'type' => $type ), 5 );
}

/**
 * Displays admin notices stored in transients.
 */
function roi_display_admin_notices() {
    global $wp_version;
    $all_transients = get_transient( 'roi_admin_notices' );
    if ( empty( $all_transients ) ) {
        return;
    }

    foreach ( $all_transients as $transient ) {
        $message = $transient['message'];
        $type = $transient['type'];
        ?>
        <div class="notice notice-<?php echo esc_attr( $type ); ?> is-dismissible">
            <p><?php echo wp_kses_post( $message ); ?></p>
        </div>
        <?php
    }
    delete_transient( 'roi_admin_notices' );
}
add_action( 'admin_notices', 'roi_display_admin_notices' );

// --- Meta Box for Lecon CPT ---

/**
 * Adds the meta boxes for the Lecon CPT.
 */
function roi_add_lecon_meta_boxes() {
    add_meta_box(
        'roi_lecon_details_metabox',
        __( 'Détails de la leçon', 'roi' ),
        'roi_render_lecon_details_metabox',
        'roi_lecon',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'roi_add_lecon_meta_boxes' );

/**
 * Renders the meta box for lecon details.
 *
 * @param WP_Post $post The post object.
 */
function roi_render_lecon_details_metabox( $post ) {
    wp_nonce_field( 'roi_save_lecon_meta', 'roi_lecon_metabox_nonce' );

    $difficulty = get_post_meta( $post->ID, '_roi_difficulty', true );
    ?>
    <table class="form-table">
        <tr>
            <th><label for="roi_difficulty"><?php _e( 'Difficulté', 'roi' ); ?></label></th>
            <td>
                <select name="roi_difficulty" id="roi_difficulty">
                    <option value="" <?php selected( $difficulty, '' ); ?>><?php _e( '— Sélectionner une difficulté —', 'roi' ); ?></option>
                    <option value="1" <?php selected( $difficulty, 1 ); ?>><?php _e( '1 - Très facile', 'roi' ); ?></option>
                    <option value="2" <?php selected( $difficulty, 2 ); ?>><?php _e( '2 - Facile', 'roi' ); ?></option>
                    <option value="3" <?php selected( $difficulty, 3 ); ?>><?php _e( '3 - Modéré', 'roi' ); ?></option>
                    <option value="4" <?php selected( $difficulty, 4 ); ?>><?php _e( '4 - Difficile', 'roi' ); ?></option>
                    <option value="5" <?php selected( $difficulty, 5 ); ?>><?php _e( '5 - Très Difficile', 'roi' ); ?></option>
                    <option value="6" <?php selected( $difficulty, 6 ); ?>><?php _e( '6 - Expert', 'roi' ); ?></option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Save meta box content for Lecon CPT.
 *
 * @param int $post_id Post ID
 */
function roi_save_lecon_meta( $post_id ) {
    // --- Security checks ---
    if ( ! isset( $_POST['roi_lecon_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_lecon_metabox_nonce'], 'roi_save_lecon_meta' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    // --- Validation ---
    if ( empty( $_POST['roi_difficulty'] ) ) {
        set_transient( 'roi_error_message', __( 'La difficulté est un champ obligatoire. La lecon n\'a pas été publiée.', 'roi' ), 10 );

        remove_action( 'save_post_roi_lecon', 'roi_save_lecon_meta' );
        wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) );
        add_action( 'save_post_roi_lecon', 'roi_save_lecon_meta' );

        return;
    }

    // --- Sanitize and Save Data ---
    if ( isset( $_POST['roi_difficulty'] ) && '' !== $_POST['roi_difficulty'] ) {
        update_post_meta( $post_id, '_roi_difficulty', intval( $_POST['roi_difficulty'] ) );
    } else {
        delete_post_meta( $post_id, '_roi_difficulty' );
    }
}
add_action( 'save_post_roi_lecon', 'roi_save_lecon_meta' );

// --- Meta Box for Exercice CPT ---

/**
 * Adds the meta boxes for the Exercice CPT.
 */
function roi_add_exercice_meta_boxes() {
    add_meta_box(
        'roi_exercice_details_metabox',
        __( 'Détails de l\'exercice', 'roi' ),
        'roi_render_exercice_details_metabox',
        'roi_exercice',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'roi_add_exercice_meta_boxes' );

/**
 * Renders the meta box for exercice details.
 *
 * @param WP_Post $post The post object.
 */
function roi_render_exercice_details_metabox( $post ) {
    wp_nonce_field( 'roi_save_exercice_meta', 'roi_exercice_metabox_nonce' );

    $difficulty = get_post_meta( $post->ID, '_roi_difficulty', true );
    $question_type = get_post_meta( $post->ID, '_roi_question_type', true );
    $solution = get_post_meta( $post->ID, '_roi_solution', true );
    $answers = get_post_meta( $post->ID, '_roi_answers', true );
    ?>
    <table class="form-table">
        <tr>
            <th><label for="roi_difficulty"><?php _e( 'Difficulté', 'roi' ); ?></label></th>
            <td>
                <select name="roi_difficulty" id="roi_difficulty">
                    <option value="" <?php selected( $difficulty, '' ); ?>><?php _e( '— Sélectionner une difficulté —', 'roi' ); ?></option>
                    <option value="1" <?php selected( $difficulty, 1 ); ?>><?php _e( '1 - Très facile', 'roi' ); ?></option>
                    <option value="2" <?php selected( $difficulty, 2 ); ?>><?php _e( '2 - Facile', 'roi' ); ?></option>
                    <option value="3" <?php selected( $difficulty, 3 ); ?>><?php _e( '3 - Modéré', 'roi' ); ?></option>
                    <option value="4" <?php selected( $difficulty, 4 ); ?>><?php _e( '4 - Difficile', 'roi' ); ?></option>
                    <option value="5" <?php selected( $difficulty, 5 ); ?>><?php _e( '5 - Très Difficile', 'roi' ); ?></option>
                    <option value="6" <?php selected( $difficulty, 6 ); ?>><?php _e( '6 - Expert', 'roi' ); ?></option>
                </select>
            </td>
        </tr>
        <tr>
            <th><?php _e( 'Type de question', 'roi' ); ?></th>
            <td>
                <label><input type="radio" name="roi_question_type" value="true_false" <?php checked( $question_type, 'true_false' ); ?>> <?php _e( 'Vrai/Faux', 'roi' ); ?></label><br>
                <label><input type="radio" name="roi_question_type" value="qcm_single" <?php checked( $question_type, 'qcm_single' ); ?>> <?php _e( 'QCM - Choix unique', 'roi' ); ?></label><br>
                <label><input type="radio" name="roi_question_type" value="qcm_multiple" <?php checked( $question_type, 'qcm_multiple' ); ?>> <?php _e( 'QCM - Choix multiples', 'roi' ); ?></label>
            </td>
        </tr>
        <tr>
            <th><?php _e( 'Réponses possibles', 'roi' ); ?></th>
            <td>
                <p class="description"><?php _e('Pour chaque réponse, entrez le texte (les shortcodes sont autorisés) et cochez la case si c\'est une réponse correcte.', 'roi'); ?></p>
                <?php
                $answers = is_array($answers) ? $answers : array_fill(0, 5, ['text' => '', 'correct' => false]);
                for ($i = 0; $i < 5; $i++) :
                    $answer_text = isset($answers[$i]['text']) ? $answers[$i]['text'] : '';
                    $is_correct = isset($answers[$i]['correct']) ? (bool)$answers[$i]['correct'] : false;
                ?>
                <div style="margin-bottom: 15px;">
                    <label for="roi_answer_text_<?php echo $i; ?>"><?php printf(__('Réponse %d', 'roi'), $i + 1); ?></label>
                    <input type="text" name="roi_answers[<?php echo $i; ?>][text]" id="roi_answer_text_<?php echo $i; ?>" value="<?php echo esc_attr($answer_text); ?>" style="width: 80%;" />
                    <label><input type="checkbox" name="roi_answers[<?php echo $i; ?>][correct]" value="1" <?php checked($is_correct); ?> /> <?php _e('Correcte', 'roi'); ?></label>
                </div>
                <?php endfor; ?>
            </td>
        </tr>
        <tr>
            <th><label for="roi_exercice_solution"><?php _e( 'Solution', 'roi' ); ?></label></th>
            <td>
                <?php
                wp_editor( $solution, 'roi_exercice_solution', array(
                    'textarea_name' => 'roi_exercice_solution',
                    'media_buttons' => false,
                    'textarea_rows' => 10,
                ) );
                ?>
                <p class="description"><?php _e('La solution sera affichée après que l\'utilisateur a répondu à l\'exercice.', 'roi'); ?></p>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Save meta box content for Exercice CPT.
 *
 * @param int $post_id Post ID
 */
function roi_save_exercice_meta( $post_id ) {
    // --- Security checks ---
    if ( ! isset( $_POST['roi_exercice_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_exercice_metabox_nonce'], 'roi_save_exercice_meta' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    // The capability check is handled by the CPT definition, but an explicit check is good practice.
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    // --- Validation ---
    if ( empty( $_POST['roi_difficulty'] ) ) {
        set_transient( 'roi_error_message', __( 'La difficulté est un champ obligatoire. L\'exercice n\'a pas été publié.', 'roi' ), 10 );

        remove_action( 'save_post_roi_exercice', 'roi_save_exercice_meta' );
        wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) );
        add_action( 'save_post_roi_exercice', 'roi_save_exercice_meta' );

        return;
    }

    // --- Sanitize and Save Data ---
    if ( isset( $_POST['roi_difficulty'] ) && '' !== $_POST['roi_difficulty'] ) {
        update_post_meta( $post_id, '_roi_difficulty', intval( $_POST['roi_difficulty'] ) );
    } else {
        delete_post_meta( $post_id, '_roi_difficulty' );
    }
    if ( isset( $_POST['roi_question_type'] ) ) {
        update_post_meta( $post_id, '_roi_question_type', sanitize_key( $_POST['roi_question_type'] ) );
    }
    if ( isset( $_POST['roi_exercice_solution'] ) ) {
        update_post_meta( $post_id, '_roi_solution', wp_kses_post( $_POST['roi_exercice_solution'] ) );
    }
    if ( isset( $_POST['roi_answers'] ) && is_array( $_POST['roi_answers'] ) ) {
        $sanitized_answers = array();
        foreach ( $_POST['roi_answers'] as $answer ) {
            // Ignore empty answer fields
            if ( ! empty( $answer['text'] ) ) {
                // The answer text is not sanitized here to allow for shortcode syntax.
                // It is sanitized on output in the AJAX handlers using wp_kses_post().
                $sanitized_answers[] = array(
                    'text'    => $answer['text'],
                    'correct' => isset( $answer['correct'] ) ? true : false,
                );
            }
        }
        update_post_meta( $post_id, '_roi_answers', $sanitized_answers );
    }
}
add_action( 'save_post_roi_exercice', 'roi_save_exercice_meta' );

// --- Meta Box for Cours CPT (Dual List Interface) ---

/**
 * Adds the meta box for the Cours CPT.
 */
function roi_add_cours_meta_boxes() {
    add_meta_box(
        'roi_cours_builder_metabox',
        __( 'Constructeur de Cours', 'roi' ),
        'roi_render_cours_builder_metabox',
        'roi_cours',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'roi_add_cours_meta_boxes' );

/**
 * Renders the dual list meta box for the course builder.
 *
 * @param WP_Post $post The post object.
 */
function roi_render_cours_builder_metabox( $post ) {
    wp_nonce_field( 'roi_save_cours_meta', 'roi_cours_metabox_nonce' );

    $difficulty = get_post_meta( $post->ID, '_roi_difficulty', true );
    ?>
    <table class="form-table">
        <tr>
            <th><label for="roi_difficulty"><?php _e( 'Difficulté du cours', 'roi' ); ?></label></th>
            <td>
                <select name="roi_difficulty" id="roi_difficulty">
                    <option value="" <?php selected( $difficulty, '' ); ?>><?php _e( '— Sélectionner une difficulté —', 'roi' ); ?></option>
                    <option value="1" <?php selected( $difficulty, 1 ); ?>><?php _e( '1 - Très facile', 'roi' ); ?></option>
                    <option value="2" <?php selected( $difficulty, 2 ); ?>><?php _e( '2 - Facile', 'roi' ); ?></option>
                    <option value="3" <?php selected( $difficulty, 3 ); ?>><?php _e( '3 - Modéré', 'roi' ); ?></option>
                    <option value="4" <?php selected( $difficulty, 4 ); ?>><?php _e( '4 - Difficile', 'roi' ); ?></option>
                    <option value="5" <?php selected( $difficulty, 5 ); ?>><?php _e( '5 - Très Difficile', 'roi' ); ?></option>
                    <option value="6" <?php selected( $difficulty, 6 ); ?>><?php _e( '6 - Expert', 'roi' ); ?></option>
                </select>
                <p class="description"><?php _e( 'La difficulté du cours déterminera les leçons et exercices qui peuvent y être inclus.', 'roi' ); ?></p>
            </td>
        </tr>
    </table>
    <hr>
    <?php

    // Get current course items
    $course_items_raw = get_post_meta( $post->ID, '_roi_course_items', true );
    if ( ! is_array( $course_items_raw ) ) {
        $course_items_raw = array();
    }
    ?>
    <style>
        .roi-dual-list-wrapper { display: flex; align-items: center; gap: 15px; }
        .roi-dual-list-box { flex: 1; }
        .roi-dual-list-box select { width: 100%; height: 300px; }
        .roi-dual-list-controls { display: flex; flex-direction: column; gap: 10px; }
        .roi-dual-list-controls button { width: 100px; }
        #roi-available-items-select:disabled { background-color: #f0f0f0; }
    </style>
    <div class="roi-dual-list-wrapper">
        <!-- Available Items List -->
        <div class="roi-dual-list-box">
            <strong><?php _e( 'Contenus Disponibles', 'roi' ); ?></strong>
            <select id="roi-available-items-select" multiple disabled></select>
            <p class="description" id="roi-available-items-placeholder">
                <?php
                if ( get_post_meta( $post->ID, '_roi_difficulty', true ) ) {
                    _e( 'Chargement...', 'roi' );
                } else {
                    _e( 'Veuillez d\'abord sélectionner et enregistrer une difficulté pour le cours.', 'roi' );
                }
                ?>
            </p>
        </div>

        <!-- Controls -->
        <div class="roi-dual-list-controls">
            <button type="button" id="roi-add-to-course" class="button">&gt;&gt;</button>
            <button type="button" id="roi-remove-from-course" class="button">&lt;&lt;</button>
        </div>

        <!-- Course Items List -->
        <div class="roi-dual-list-box">
            <strong><?php _e( 'Contenu du Cours', 'roi' ); ?></strong>
            <select id="roi-course-items-select" multiple>
                <?php
                if ( ! empty( $course_items_raw ) ) {
                    foreach ( $course_items_raw as $item ) {
                        $post_obj = get_post( $item['id'] );
                        if ( $post_obj ) {
                            $post_type_name = 'roi_' . $item['type'];
                            $post_type_obj  = get_post_type_object( $post_type_name );
                            $type_label     = $post_type_obj ? $post_type_obj->labels->singular_name : ucfirst( $item['type'] );

                            $value = esc_attr( $item['type'] . ':' . $item['id'] );
                            $label = esc_html( $post_obj->post_title . ' (' . $type_label . ')' );
                            echo "<option value=\"{$value}\">{$label}</option>";
                        }
                    }
                }
                ?>
            </select>
            <div id="roi-course-items-hidden-inputs">
                <?php
                if ( ! empty( $course_items_raw ) ) {
                    foreach ( $course_items_raw as $item ) {
                        $value = esc_attr( $item['type'] . ':' . $item['id'] );
                        echo '<input type="hidden" name="roi_course_items[]" value="' . $value . '">';
                    }
                }
                ?>
            </div>
        </div>

        <!-- Reorder Controls -->
        <div class="roi-dual-list-controls">
            <button type="button" id="roi-move-up" class="button">&#9650;</button>
            <button type="button" id="roi-move-down" class="button">&#9660;</button>
        </div>
    </div>
    <?php
}

/**
 * Save meta box content for Cours CPT.
 */
function roi_save_cours_meta( $post_id ) {
    if ( ! isset( $_POST['roi_cours_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['roi_cours_metabox_nonce'], 'roi_save_cours_meta' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    // --- Validation ---
    if ( empty( $_POST['roi_difficulty'] ) ) {
        set_transient( 'roi_error_message', __( 'La difficulté est un champ obligatoire. Le cours n\'a pas été publié.', 'roi' ), 10 );

        remove_action( 'save_post_roi_cours', 'roi_save_cours_meta' );
        wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) );
        add_action( 'save_post_roi_cours', 'roi_save_cours_meta' );

        return;
    }

    if ( isset( $_POST['roi_difficulty'] ) && '' !== $_POST['roi_difficulty'] ) {
        update_post_meta( $post_id, '_roi_difficulty', intval( $_POST['roi_difficulty'] ) );
    } else {
        delete_post_meta( $post_id, '_roi_difficulty' );
    }

    if ( isset( $_POST['roi_course_items'] ) && is_array( $_POST['roi_course_items'] ) ) {
        $sanitized_items = array();
        foreach ( $_POST['roi_course_items'] as $item ) {
            // Value is in format "type:id"
            list($type, $id) = explode(':', sanitize_text_field($item));
            if ( in_array($type, ['lecon', 'exercice']) && is_numeric($id) ) {
                $sanitized_items[] = array(
                    'type' => $type,
                    'id'   => intval($id),
                );
            }
        }
        update_post_meta( $post_id, '_roi_course_items', $sanitized_items );
    } else {
        // If the list is empty, it means no items are in the course.
        delete_post_meta( $post_id, '_roi_course_items' );
    }
}
add_action( 'save_post_roi_cours', 'roi_save_cours_meta' );

function roi_get_course_builder_items() {
    check_ajax_referer( 'roi_course_builder_nonce', 'nonce' );

    $difficulty = isset( $_POST['difficulty'] ) ? intval( $_POST['difficulty'] ) : 0;
    $course_id = isset( $_POST['course_id'] ) ? intval( $_POST['course_id'] ) : 0;

    if ( ! $difficulty ) {
        wp_send_json_success( array( 'lessons' => array(), 'exercices' => array() ) );
        return;
    }

    $used_ids = array();
    if ( $course_id ) {
        $course_items_raw = get_post_meta( $course_id, '_roi_course_items', true );
        if ( is_array( $course_items_raw ) ) {
            $used_ids = array_map( function($item) { return $item['id']; }, $course_items_raw );
        }
    }

    $args = array(
        'post_type' => array('roi_lecon', 'roi_exercice'),
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
        'meta_query' => array(
            array(
                'key' => '_roi_difficulty',
                'value' => $difficulty,
                'compare' => '=',
            ),
        ),
        'post__not_in' => $used_ids,
    );

    $posts = get_posts( $args );

    $lessons = array();
    $exercices = array();

    foreach($posts as $post) {
        if ($post->post_type === 'roi_lecon') {
            $lessons[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
            );
        } else if ($post->post_type === 'roi_exercice') {
            $exercices[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
            );
        }
    }

    wp_send_json_success( array( 'lessons' => $lessons, 'exercices' => $exercices ) );
}
add_action( 'wp_ajax_roi_get_course_builder_items', 'roi_get_course_builder_items' );

/**
 * Enqueues admin scripts for the plugin.
 *
 * @param string $hook The current admin page.
 */
function roi_enqueue_admin_scripts( $hook ) {
	global $post;
    // Enqueue script for the course builder dual list
    if ( ( 'post.php' === $hook || 'post-new.php' === $hook ) && isset( $post->post_type ) && 'roi_cours' === $post->post_type ) {
        wp_enqueue_script(
            'roi-course-builder',
            plugin_dir_url( __FILE__ ) . 'js/course-builder.js',
            array('jquery'),
            ROI_VERSION,
            true
        );
        wp_localize_script(
            'roi-course-builder',
            'roi_course_builder_data',
            array(
                'ajax_url'  => admin_url( 'admin-ajax.php' ),
                'nonce'     => wp_create_nonce( 'roi_course_builder_nonce' ),
                'course_id' => $post->ID,
                'i18n'      => array(
                    'loading' => __( 'Chargement...', 'roi' ),
                    'no_content' => __( 'Aucun contenu disponible pour ce niveau de difficulté.', 'roi' ),
                    'error' => __( 'Une erreur est survenue lors du chargement.', 'roi' ),
                    'lessons' => __( 'Leçons', 'roi' ),
                    'exercices' => __( 'Exercices', 'roi' ),
                ),
            )
        );
    }

    // Ensure editor scripts are loaded for the Exercice CPT solution field
    if ( ( 'post.php' === $hook || 'post-new.php' === $hook ) && isset( $post->post_type ) && in_array( $post->post_type, array( 'roi_exercice' ), true ) ) {
        if ( 'roi_exercice' === $post->post_type ) {
            wp_enqueue_editor();
        }
        // Enqueue admin styles for the z-index fix and reconciliation table
        wp_enqueue_style(
            'roi-admin-styles',
            plugin_dir_url( __FILE__ ) . 'css/admin-styles.css',
            array(),
            ROI_VERSION
        );
    }
}
add_action( 'admin_enqueue_scripts', 'roi_enqueue_admin_scripts' );
