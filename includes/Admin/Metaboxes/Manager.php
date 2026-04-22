<?php
declare(strict_types=1);

namespace ROI\Admin\Metaboxes;

/**
 * Manager des Metaboxes.
 */
final class Manager {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'admin_notices', [ $this, 'display_notices' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_scripts' ] );

        // Initialisation des metaboxes par CPT
        ( new Lecon() )->init();
        ( new Exercice() )->init();
        ( new Cours() )->init();
    }

    /**
     * Affiche les notifications d'administration.
     */
    public function display_notices(): void {
        $error_message = get_transient( 'roi_error_message' );
        if ( $error_message ) {
            ?>
            <div class="notice notice-error is-dismissible">
                <p><?php echo esc_html( (string) $error_message ); ?></p>
            </div>
            <?php
            delete_transient( 'roi_error_message' );
        }

        // Ancienne logique de notices multiples via transient
        $all_transients = get_transient( 'roi_admin_notices' );
        if ( ! empty( $all_transients ) && is_array( $all_transients ) ) {
            foreach ( $all_transients as $transient ) {
                ?>
                <div class="notice notice-<?php echo esc_attr( (string) $transient['type'] ); ?> is-dismissible">
                    <p><?php echo wp_kses_post( (string) $transient['message'] ); ?></p>
                </div>
                <?php
            }
            delete_transient( 'roi_admin_notices' );
        }
    }

    /**
     * Scripts d'administration globaux.
     */
    public function enqueue_admin_scripts( string $hook ): void {
        global $post;

        if ( ! isset( $post->post_type ) ) {
            return;
        }

        // Styles admin pour Exercices et Cours
        if ( in_array( $post->post_type, [ 'roi_exercice', 'roi_cours' ], true ) ) {
            wp_enqueue_style(
                'roi-admin-styles',
                ROI_PLUGIN_URL . 'assets/css/admin-style.css',
                [],
                ROI_VERSION
            );
        }

        // Scripts spécifiques déplacés dans les classes respectives ou gérés ici si partagés
    }
}
