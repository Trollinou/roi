<?php
declare(strict_types=1);

namespace ROI\CPT\Lecon;

/**
 * Gestion de la complétion des leçons.
 */
final class Completion {

    /**
     * Initialisation des hooks.
     */
    public function init(): void {
        add_filter( 'the_content', [ $this, 'add_button' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
        add_action( 'wp_ajax_roi_complete_lesson', [ $this, 'ajax_handler' ] );
    }

    /**
     * Ajoute le bouton "Marquer comme terminée" à la fin de la leçon.
     *
     * @param string $content Le contenu de la leçon.
     * @return string Le contenu modifié.
     */
    public function add_button( string $content ): string {
        if ( is_singular( 'roi_lecon' ) && is_user_logged_in() ) {
            $current_user  = wp_get_current_user();
            $user_roles    = (array) $current_user->roles;
            $allowed_roles = [ 'membre', 'entraineur', 'administrator' ];
            
            if ( count( array_intersect( $user_roles, $allowed_roles ) ) > 0 ) {
                $lesson_id         = get_the_ID();
                $user_id           = get_current_user_id();
                $completed_lessons = get_user_meta( $user_id, 'roi_completed_lessons', true );

                if ( ! is_array( $completed_lessons ) ) {
                    $completed_lessons = [];
                }

                if ( in_array( $lesson_id, $completed_lessons, true ) ) {
                    $button = '<p class="roi-lesson-completed">' . __( "Vous avez déjà terminé cette leçon.", "roi" ) . '</p>';
                } else {
                    $button = '<button id="roi-complete-lesson-btn" data-lesson-id="' . esc_attr( (string) $lesson_id ) . '">' . __( "Marquer comme terminée", "roi" ) . '</button>';
                    $button .= '<div id="roi-lesson-completion-feedback"></div>';
                }
                $content .= $button;
            }
        }
        return $content;
    }

    /**
     * Scripts pour la complétion des leçons.
     */
    public function enqueue_scripts(): void {
        if ( is_singular( 'roi_lecon' ) ) {
            wp_enqueue_script( 'roi-lesson-completion', ROI_PLUGIN_URL . 'assets/js/lesson-completion.js', [ 'jquery' ], ROI_VERSION, true );
            wp_localize_script( 'roi-lesson-completion', 'roi_ajax', [
                'ajax_url' => admin_url( 'admin-ajax.php' ),
                'nonce'    => wp_create_nonce( 'roi_complete_lesson_nonce' )
            ] );
        }
    }

    /**
     * Handler AJAX pour marquer une leçon comme terminée.
     */
    public function ajax_handler(): void {
        check_ajax_referer( 'roi_complete_lesson_nonce', 'nonce' );

        if ( isset( $_POST['lesson_id'] ) && is_user_logged_in() ) {
            $lesson_id = intval( $_POST['lesson_id'] );
            $user_id   = get_current_user_id();

            $completed_lessons = get_user_meta( $user_id, 'roi_completed_lessons', true );
            if ( ! is_array( $completed_lessons ) ) {
                $completed_lessons = [];
            }

            if ( ! in_array( $lesson_id, $completed_lessons, true ) ) {
                $completed_lessons[] = $lesson_id;
                update_user_meta( $user_id, 'roi_completed_lessons', $completed_lessons );
                wp_send_json_success( __( "Leçon marquée comme terminée !", "roi" ) );
            } else {
                wp_send_json_error( __( "Leçon déjà terminée.", "roi" ) );
            }
        }
        wp_die();
    }
}
