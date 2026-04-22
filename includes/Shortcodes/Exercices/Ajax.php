<?php
declare(strict_types=1);

namespace ROI\Shortcodes\Exercices;

use WP_Query;
use ROI\Services\Chess\Pieces_Filter;

/**
 * Gestion des requêtes AJAX pour les exercices.
 */
final class Ajax {

    /**
     * Initialisation des hooks AJAX.
     */
    public function init(): void {
        add_action( 'wp_ajax_roi_fetch_exercice', [ $this, 'fetch_exercice' ] );
        add_action( 'wp_ajax_nopriv_roi_fetch_exercice', [ $this, 'fetch_exercice' ] );
        add_action( 'wp_ajax_roi_check_answer', [ $this, 'check_answer' ] );
        add_action( 'wp_ajax_nopriv_roi_check_answer', [ $this, 'check_answer' ] );
    }

    /**
     * Récupère un exercice aléatoire.
     */
    public function fetch_exercice(): void {
        check_ajax_referer( 'roi_exercice_nonce', 'nonce' );

        $difficulty    = isset( $_POST['difficulty'] ) ? sanitize_key( $_POST['difficulty'] ) : 'any';
        $category_slug = isset( $_POST['category'] ) ? sanitize_key( $_POST['category'] ) : 'any';
        $exclude_id    = isset( $_POST['exclude'] ) ? intval( $_POST['exclude'] ) : 0;

        $args = [
            'post_type'      => 'roi_exercice',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'orderby'        => 'rand',
            'post__not_in'   => [ $exclude_id ],
        ];

        $meta_query = [];
        if ( $difficulty !== 'any' ) {
            $meta_query[] = [
                'key'     => '_roi_difficulty',
                'value'   => $difficulty,
                'compare' => '=',
            ];
        }

        $tax_query = [];
        if ( $category_slug !== 'any' && ! empty( $category_slug ) ) {
            $tax_query[] = [
                'taxonomy' => 'roi_chess_category',
                'field'    => 'slug',
                'terms'    => $category_slug,
            ];
        }

        if ( ! empty( $meta_query ) ) {
            $args['meta_query'] = $meta_query;
        }
        if ( ! empty( $tax_query ) ) {
            $args['tax_query'] = $tax_query;
        }

        $query = new WP_Query( $args );

        if ( $query->have_posts() ) {
            $query->the_post();
            $exercice_id = get_the_ID();
            $pieces_filter = new Pieces_Filter();

            ob_start();
            ?>
            <form id="roi-exercice-form">
                <input type="hidden" id="roi-exercice-id" value="<?php echo esc_attr( (string) $exercice_id ); ?>">
                <h2><?php the_title(); ?></h2>
                <div class="roi-exercice-content">
                    <?php echo apply_filters( 'the_content', get_the_content() ); ?>
                </div>

                <?php
                $question_type = get_post_meta( $exercice_id, '_roi_question_type', true );
                $answers       = get_post_meta( $exercice_id, '_roi_answers', true );
                $input_type    = $question_type === 'qcm_multiple' ? 'checkbox' : 'radio';

                if ( ! empty( $answers ) && is_array( $answers ) ) {
                    echo '<div class="roi-answers">';
                    foreach ( $answers as $index => $answer ) {
                        ?>
                        <label>
                            <input type="<?php echo $input_type; ?>" name="roi_answer[]" value="<?php echo esc_attr( (string) $index ); ?>">
                            <?php echo wp_kses_post( $pieces_filter->filter_content( $answer['text'] ) ); ?>
                        </label><br>
                        <?php
                    }
                    echo '</div>';
                }
                ?>

                <button type="button" id="roi-submit-answer"><?php _e( "Valider la réponse", "roi" ); ?></button>
                <button type="button" id="roi-next-exercice" style="display:none;"><?php _e( "Exercice Suivant", "roi" ); ?></button>
            </form>
            <div id="roi-exercice-solution" style="display:none; border-top: 1px solid #ccc; margin-top: 20px; padding-top: 15px;"></div>
            <?php
            $html = ob_get_clean();

            wp_send_json_success( [ 'html' => $html, 'id' => $exercice_id ] );
        } else {
            wp_send_json_error( __( "Aucun exercice trouvé avec ces critères.", "roi" ) );
        }

        wp_reset_postdata();
        wp_die();
    }

    /**
     * Vérifie la réponse de l'utilisateur.
     */
    public function check_answer(): void {
        check_ajax_referer( 'roi_exercice_nonce', 'nonce' );

        if ( ! isset( $_POST['exercise_id'] ) ) {
            wp_send_json_error( __( "ID d'exercice manquant.", "roi" ) );
        }

        $exercise_id = intval( $_POST['exercise_id'] );
        parse_str( (string) $_POST['answer'], $submitted_data );
        $user_answers_indices = isset( $submitted_data['roi_answer'] ) ? array_map( 'intval', (array) $submitted_data['roi_answer'] ) : [];

        $correct_answers_indices = [];
        $all_answers = get_post_meta( $exercise_id, '_roi_answers', true );
        
        if ( is_array( $all_answers ) ) {
            foreach ( $all_answers as $index => $answer ) {
                if ( ! empty( $answer['correct'] ) ) {
                    $correct_answers_indices[] = $index;
                }
            }
        }

        sort( $user_answers_indices );
        sort( $correct_answers_indices );

        $is_correct = ( $user_answers_indices === $correct_answers_indices );

        $solution_html = get_post_meta( $exercise_id, '_roi_solution', true );
        $solution_html = apply_filters( 'the_content', (string) $solution_html );

        $response_data = [
            'correct'               => $is_correct,
            'solution'              => $solution_html,
            'user_selected_indices' => $user_answers_indices,
            'correct_indices'       => $correct_answers_indices,
            'message'               => $is_correct ? __( "Bonne réponse !", "roi" ) : __( "Réponse incorrecte.", "roi" )
        ];

        wp_send_json_success( $response_data );
        wp_die();
    }
}
