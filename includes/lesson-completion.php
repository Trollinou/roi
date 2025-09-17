<?php
/**
 * Handles lesson completion tracking.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Adds a "Mark as Completed" button to the end of a lesson's content.
 *
 * @param string $content The post content.
 * @return string The modified post content.
 */
function roi_add_lesson_completion_button( $content ) {
    // Check if it's a single 'roi_lecon' and user has access
    if ( is_singular( 'roi_lecon' ) && is_user_logged_in() ) {
        $current_user = wp_get_current_user();
        $user_roles = (array) $current_user->roles;
        $allowed_roles = array( 'membre', 'entraineur', 'administrator' );
        $has_access = count( array_intersect( $user_roles, $allowed_roles ) ) > 0;

        if ( $has_access ) {
            $lesson_id = get_the_ID();
            $completed_lessons = get_user_meta( get_current_user_id(), 'roi_completed_lessons', true );

            if ( ! is_array( $completed_lessons ) ) {
                $completed_lessons = array();
            }

            if ( in_array( $lesson_id, $completed_lessons ) ) {
                // Lesson is already completed
                $button = '<p class="roi-lesson-completed">' . __( "Vous avez déjà terminé cette leçon.", "roi" ) . '</p>';
            } else {
                // Lesson not completed, show the button
                $button = '<button id="roi-complete-lesson-btn" data-lesson-id="' . esc_attr( $lesson_id ) . '">' . __( "Marquer comme terminée", "roi" ) . '</button>';
                $button .= '<div id="roi-lesson-completion-feedback"></div>';
                // We'll need to add JS for this button to work.
            }
            $content .= $button;
        }
    }
    return $content;
}
add_filter( 'the_content', 'roi_add_lesson_completion_button' );

/**
 * Enqueue scripts for lesson completion.
 */
function roi_enqueue_lesson_completion_scripts() {
    if ( is_singular( 'roi_lecon' ) ) {
        wp_enqueue_script( 'roi-lesson-completion', plugin_dir_url( __FILE__ ) . '../public/js/lesson-completion.js', array( 'jquery' ), ROI_VERSION, true );
        wp_localize_script( 'roi-lesson-completion', 'roi_ajax', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'roi_complete_lesson_nonce' )
        ) );
    }
}
add_action( 'wp_enqueue_scripts', 'roi_enqueue_lesson_completion_scripts' );

/**
 * AJAX handler for marking a lesson as complete.
 */
function roi_complete_lesson_ajax_handler() {
    // Check nonce
    check_ajax_referer( 'roi_complete_lesson_nonce', 'nonce' );

    if ( isset( $_POST['lesson_id'] ) && is_user_logged_in() ) {
        $lesson_id = intval( $_POST['lesson_id'] );
        $user_id = get_current_user_id();

        $completed_lessons = get_user_meta( $user_id, 'roi_completed_lessons', true );
        if ( ! is_array( $completed_lessons ) ) {
            $completed_lessons = array();
        }

        if ( ! in_array( $lesson_id, $completed_lessons ) ) {
            $completed_lessons[] = $lesson_id;
            update_user_meta( $user_id, 'roi_completed_lessons', $completed_lessons );
            wp_send_json_success( __( "Leçon marquée comme terminée !", "roi" ) );
        } else {
            wp_send_json_error( __( "Leçon déjà terminée.", "roi" ) );
        }
    }
    wp_die();
}
add_action( 'wp_ajax_roi_complete_lesson', 'roi_complete_lesson_ajax_handler' );
