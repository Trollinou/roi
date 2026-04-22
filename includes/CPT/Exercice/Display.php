<?php
declare(strict_types=1);

namespace ROI\CPT\Exercice;

use ROI\Services\Chess\Pieces_Filter;

/**
 * Gestion de l'affichage des exercices.
 */
final class Display {

    /**
     * Initialisation des hooks.
     */
    public function init(): void {
        add_filter( 'the_content', [ $this, 'append_form' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
    }

    /**
     * Ajoute le formulaire de réponse au contenu des exercices.
     *
     * @param string $content Le contenu initial.
     * @return string Le contenu modifié.
     */
    public function append_form( string $content ): string {
        if ( is_singular( 'roi_exercice' ) ) {
            $exercice_id   = get_the_ID();
            $pieces_filter = new Pieces_Filter();

            ob_start();
            ?>
            <div id="roi-single-exercice-wrapper">
                <form id="roi-exercice-form">
                    <input type="hidden" id="roi-exercice-id" value="<?php echo esc_attr( (string) $exercice_id ); ?>">

                    <?php
                    $question_type = get_post_meta( $exercice_id, '_roi_question_type', true );
                    $answers       = get_post_meta( $exercice_id, '_roi_answers', true );
                    $input_type    = $question_type === 'qcm_multiple' ? 'checkbox' : 'radio';

                    if ( ! empty( $answers ) && is_array( $answers ) ) {
                        echo '<div class="roi-answers">';
                        echo '<h4>' . __( "Choisissez votre réponse :", "roi" ) . '</h4>';
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

                    <button type="button" id="roi-submit-answer" class="button button-primary"><?php _e( "Valider la réponse", "roi" ); ?></button>
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

    /**
     * Scripts pour la page d'exercice unique.
     */
    public function enqueue_scripts(): void {
        if ( is_singular( 'roi_exercice' ) ) {
            wp_enqueue_script(
                'roi-single-exercice',
                ROI_PLUGIN_URL . 'assets/js/single-exercice.js',
                [ 'jquery' ],
                ROI_VERSION,
                true
            );
            wp_localize_script(
                'roi-single-exercice',
                'roi_single_exercice_ajax',
                [
                    'ajax_url' => admin_url( 'admin-ajax.php' ),
                    'nonce'    => wp_create_nonce( 'roi_exercice_nonce' )
                ]
            );
        }
    }
}
