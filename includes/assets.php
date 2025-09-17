<?php
/**
 * Handles asset enqueuing for the ROI plugin.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Enqueues front-end scripts and styles.
 */
function roi_enqueue_public_assets() {
    // Enqueue the public-facing stylesheet.
    wp_enqueue_style(
        'roi-public-styles',
        plugin_dir_url( __FILE__ ) . '../public/css/roi-public-styles.css',
        array(),
        ROI_VERSION
    );
}
add_action( 'wp_enqueue_scripts', 'roi_enqueue_public_assets' );
