<?php
declare(strict_types=1);

namespace ROI\Core;

/**
 * Gestion des assets globaux du plugin.
 */
final class Assets {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_public_assets' ] );
    }

    /**
     * Enqueue des styles publics.
     */
    public function enqueue_public_assets(): void {
        wp_enqueue_style(
            'roi-public-styles',
            ROI_PLUGIN_URL . 'assets/css/public-style.css',
            [],
            ROI_VERSION
        );
    }
}
