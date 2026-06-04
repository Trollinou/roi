<?php
/**
 * Lesson Completion Logic.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Services;

/**
 * Class LessonCompletion
 * Handles lesson completion button injection and AJAX logic.
 */
class LessonCompletion {

	/**
	 * Initialize the actions and filters.
	 *
	 * @return void
	 */
	public function init(): void {
		add_filter( 'the_content', [ $this, 'add_lesson_completion_button' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_lesson_completion_scripts' ] );
		add_action( 'wp_ajax_roi_complete_lesson', [ $this, 'complete_lesson_ajax_handler' ] );
	}

	/**
	 * Adds a "Mark as Completed" button to the end of a lesson's content.
	 *
	 * @param string $content The post content.
	 * @return string The modified content.
	 */
	public function add_lesson_completion_button( string $content ): string {
		if ( is_singular( 'roi_lecon' ) && is_user_logged_in() ) {
			$current_user  = wp_get_current_user();
			$user_roles    = (array) $current_user->roles;
			$allowed_roles = [ 'membre', 'entraineur', 'administrator' ];
			$has_access    = count( array_intersect( $user_roles, $allowed_roles ) ) > 0;

			if ( $has_access ) {
				$lesson_id         = get_the_ID();
				$completed_lessons = get_user_meta( get_current_user_id(), 'roi_completed_lessons', true );

				if ( ! is_array( $completed_lessons ) ) {
					$completed_lessons = [];
				}

				if ( in_array( $lesson_id, $completed_lessons, true ) ) {
					$button = '<p class="roi-lesson-completed">' . __( 'Vous avez déjà terminé cette leçon.', 'roi' ) . '</p>';
				} else {
					$button  = '<button id="roi-complete-lesson-btn" data-lesson-id="' . esc_attr( (string) $lesson_id ) . '">' . __( 'Marquer comme terminée', 'roi' ) . '</button>';
					$button .= '<div id="roi-lesson-completion-feedback"></div>';
				}
				$content .= $button;
			}
		}
		return $content;
	}

	/**
	 * Enqueue scripts for lesson completion.
	 *
	 * @return void
	 */
	public function enqueue_lesson_completion_scripts(): void {
		if ( is_singular( 'roi_lecon' ) ) {
			$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
			wp_enqueue_script(
				'roi-lesson-completion',
				$plugin_url . 'assets/js/public-lesson-completion.js',
				[ 'jquery' ],
				ROI_VERSION,
				true
			);
			wp_localize_script(
				'roi-lesson-completion',
				'roi_ajax',
				[
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'roi_complete_lesson_nonce' ),
				]
			);
		}
	}

	/**
	 * AJAX handler for marking a lesson as complete.
	 *
	 * @return void
	 */
	public function complete_lesson_ajax_handler(): void {
		check_ajax_referer( 'roi_complete_lesson_nonce', 'nonce' );

		if ( isset( $_POST['lesson_id'] ) && is_user_logged_in() ) {
			$lesson_id = (int) $_POST['lesson_id'];
			$user_id   = get_current_user_id();

			$completed_lessons = get_user_meta( $user_id, 'roi_completed_lessons', true );
			if ( ! is_array( $completed_lessons ) ) {
				$completed_lessons = [];
			}

			if ( ! in_array( $lesson_id, $completed_lessons, true ) ) {
				$completed_lessons[] = $lesson_id;
				update_user_meta( $user_id, 'roi_completed_lessons', $completed_lessons );
				wp_send_json_success( __( 'Leçon marquée comme terminée !', 'roi' ) );
			} else {
				wp_send_json_error( __( 'Leçon déjà terminée.', 'roi' ) );
			}
		}
		wp_die();
	}
}
