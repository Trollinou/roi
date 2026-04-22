<?php
declare(strict_types=1);

namespace ROI\Admin\Metaboxes;

/**
 * Gestion AJAX pour le constructeur de cours.
 */
final class CoursAjax {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'wp_ajax_roi_get_course_builder_items', [ $this, 'get_items' ] );
    }

    /**
     * Récupère les leçons et exercices disponibles pour un niveau de difficulté.
     */
    public function get_items(): void {
        check_ajax_referer( 'roi_course_builder_nonce', 'nonce' );

        $difficulty = isset( $_POST['difficulty'] ) ? intval( $_POST['difficulty'] ) : 0;
        $course_id  = isset( $_POST['course_id'] ) ? intval( $_POST['course_id'] ) : 0;

        if ( ! $difficulty ) {
            wp_send_json_success( [ 'lessons' => [], 'exercices' => [] ] );
            return;
        }

        $used_ids = [];
        if ( $course_id ) {
            $course_items_raw = get_post_meta( $course_id, '_roi_course_items', true );
            if ( is_array( $course_items_raw ) ) {
                $used_ids = array_map( fn( $item ) => (int) $item['id'], $course_items_raw );
            }
        }

        $args = [
            'post_type'      => [ 'roi_lecon', 'roi_exercice' ],
            'posts_per_page' => -1,
            'orderby'        => 'title',
            'order'          => 'ASC',
            'meta_query'     => [
                [
                    'key'     => '_roi_difficulty',
                    'value'   => $difficulty,
                    'compare' => '=',
                ],
            ],
            'post__not_in'   => $used_ids,
        ];

        $posts = get_posts( $args );

        $lessons   = [];
        $exercices = [];

        foreach ( $posts as $post ) {
            $item = [
                'id'    => $post->ID,
                'title' => $post->post_title,
            ];

            if ( $post->post_type === 'roi_lecon' ) {
                $lessons[] = $item;
            } elseif ( $post->post_type === 'roi_exercice' ) {
                $exercices[] = $item;
            }
        }

        wp_send_json_success( [ 'lessons' => $lessons, 'exercices' => $exercices ] );
    }
}
