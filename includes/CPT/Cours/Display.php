<?php
declare(strict_types=1);

namespace ROI\CPT\Cours;

/**
 * Gestion de l'affichage des cours.
 */
final class Display {

    /**
     * Initialisation des hooks.
     */
    public function init(): void {
        add_filter( 'the_content', [ $this, 'append_content' ] );
    }

    /**
     * Ajoute la liste des éléments du cours au contenu.
     *
     * @param string $content Le contenu initial.
     * @return string Le contenu modifié.
     */
    public function append_content( string $content ): string {
        if ( is_singular( 'roi_cours' ) ) {
            $course_id         = get_the_ID();
            $course_difficulty = get_post_meta( $course_id, '_roi_difficulty', true );
            $course_items_raw  = get_post_meta( $course_id, '_roi_course_items', true );

            if ( ! empty( $course_items_raw ) && is_array( $course_items_raw ) ) {
                $items_html = '';
                foreach ( $course_items_raw as $item ) {
                    $item_id         = $item['id'];
                    $item_difficulty = get_post_meta( (int) $item_id, '_roi_difficulty', true );

                    // On n'affiche que si la difficulté correspond
                    if ( (string) $course_difficulty === (string) $item_difficulty ) {
                        $post_obj = get_post( (int) $item_id );
                        if ( $post_obj ) {
                            $post_type_name = 'roi_' . $item['type'];
                            $post_type_obj  = get_post_type_object( $post_type_name );
                            $type_label     = $post_type_obj ? $post_type_obj->labels->singular_name : ucfirst( (string) $item['type'] );

                            $items_html .= '<li>';
                            $items_html .= '<a href="' . esc_url( get_permalink( $post_obj->ID ) ) . '">' . esc_html( $post_obj->post_title ) . '</a>';
                            $items_html .= ' <span class="roi-course-item-type">(' . esc_html( (string) $type_label ) . ')</span>';
                            $items_html .= '</li>';
                        }
                    }
                }

                if ( ! empty( $items_html ) ) {
                    $course_html = '<div class="roi-course-content-list">';
                    $course_html .= '<h3>' . __( "Contenu du cours", "roi" ) . '</h3>';
                    $course_html .= '<ol>' . $items_html . '</ol>';
                    $course_html .= '</div>';
                    $content .= $course_html;
                }
            }
        }
        return $content;
    }
}
