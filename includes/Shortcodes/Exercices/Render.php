<?php
declare(strict_types=1);

namespace ROI\Shortcodes\Exercices;

/**
 * Rendu du shortcode [roi_exercices].
 */
final class Render {

    /**
     * Rendu HTML du shortcode.
     *
     * @param array<string, mixed> $atts Attributs du shortcode.
     * @return string HTML de sortie.
     */
    public function display( array $atts ): string {
        wp_enqueue_script( 'roi-exercices', ROI_PLUGIN_URL . 'assets/js/exercices.js', [ 'jquery' ], ROI_VERSION, true );
        wp_localize_script( 'roi-exercices', 'roi_exercices_ajax', [
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'roi_exercice_nonce' )
        ] );

        ob_start();
        ?>
        <div id="roi-exercices-wrapper">
            <div id="roi-exercices-filters">
                <div class="roi-filter-item">
                    <label for="roi-difficulty-filter"><?php _e( "Difficulté:", "roi" ); ?></label>
                    <select id="roi-difficulty-filter">
                        <option value="any"><?php _e( "Toutes", "roi" ); ?></option>
                        <option value="1"><?php _e( "1 - Très facile", "roi" ); ?></option>
                        <option value="2"><?php _e( "2 - Facile", "roi" ); ?></option>
                        <option value="3"><?php _e( "3 - Modéré", "roi" ); ?></option>
                        <option value="4"><?php _e( "4 - Difficile", "roi" ); ?></option>
                        <option value="5"><?php _e( "5 - Très Difficile", "roi" ); ?></option>
                        <option value="6"><?php _e( "6 - Expert", "roi" ); ?></option>
                    </select>
                </div>
                <div class="roi-filter-item">
                    <label for="roi-category-filter"><?php _e( "Catégorie:", "roi" ); ?></label>
                    <?php
                    wp_dropdown_categories( [
                        'taxonomy'        => 'roi_chess_category',
                        'name'            => 'roi-category-filter',
                        'id'              => 'roi-category-filter',
                        'show_option_all' => __( "Toutes les catégories", "roi" ),
                        'hierarchical'    => true,
                        'value_field'     => 'slug',
                    ] );
                    ?>
                </div>
                <button id="roi-start-exercices"><?php _e( "Commencer les exercices", "roi" ); ?></button>
            </div>

            <div id="roi-exercice-display">
                <!-- Le contenu de l'exercice sera chargé via AJAX -->
            </div>

            <div id="roi-exercice-score">
                <h3><?php _e( "Votre Score", "roi" ); ?></h3>
                <p>
                    <?php _e( "Correct:", "roi" ); ?> <span id="roi-score-correct">0</span> /
                    <?php _e( "Tentés:", "roi" ); ?> <span id="roi-score-attempted">0</span>
                </p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
