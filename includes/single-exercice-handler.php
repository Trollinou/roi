<?php
/**
 * Handles the display of the answer form on single 'roi_exercice' pages.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Appends the exercise answer form to the content on single exercise pages.
 *
 * @param string $content The post content.
 * @return string The modified post content.
 */
function roi_display_single_exercice_form( $content ) {
    if ( is_singular( 'roi_exercice' ) ) {
        $exercice_id = get_the_ID();

        ob_start();
        ?>
        <div id="roi-single-exercice-wrapper">
            <form id="roi-exercice-form">
                <input type="hidden" id="roi-exercice-id" value="<?php echo esc_attr( $exercice_id ); ?>">

                <?php
                $question_type = get_post_meta( $exercice_id, '_roi_question_type', true );
                $answers = get_post_meta( $exercice_id, '_roi_answers', true );
                $input_type = $question_type === 'qcm_multiple' ? 'checkbox' : 'radio';

                if ( !empty($answers) && is_array($answers) ) {
                    echo '<div class="roi-answers">';
                    echo '<h4>' . __("Choisissez votre réponse :", "roi") . '</h4>';
                    foreach ($answers as $index => $answer) {
                        ?>
                        <label>
                            <input type="<?php echo $input_type; ?>" name="roi_answer[]" value="<?php echo esc_attr($index); ?>">
                            <?php echo wp_kses_post( roi_chess_pieces_shortcodes_filter( $answer['text'] ) ); ?>
                        </label><br>
                        <?php
                    }
                    echo '</div>';
                }
                ?>

                <button type="button" id="roi-submit-answer" class="button button-primary"><?php _e( 'Valider la réponse', 'roi' ); ?></button>
            </form>
            <div id="roi-exercice-feedback" style="margin-top: 20px;"></div>
            <div id="roi-exercice-solution" style="display:none; border-top: 1px solid #ccc; margin-top: 20px; padding-top: 15px;"></div>
        </div>
        <?php
        $form_html = ob_get_clean();

        $content .= $form_html;
    }
    return $content;
}
add_filter( 'the_content', 'roi_display_single_exercice_form' );

/**
 * Enqueues scripts for the single exercise page.
 */
function roi_enqueue_single_exercice_scripts() {
    if ( is_singular( 'roi_exercice' ) ) {
        wp_enqueue_script(
            'roi-single-exercice',
            plugin_dir_url( __FILE__ ) . '../public/js/single-exercice.js',
            array( 'jquery' ),
            ROI_VERSION,
            true
        );
        wp_localize_script(
            'roi-single-exercice',
            'roi_single_exercice_ajax',
            array(
                'ajax_url' => admin_url( 'admin-ajax.php' ),
                'nonce'    => wp_create_nonce( 'roi_exercice_nonce' ) // Reusing the same nonce
            )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'roi_enqueue_single_exercice_scripts' );
