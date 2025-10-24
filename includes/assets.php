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
 *
 * This function is hooked into 'wp_enqueue_scripts' and is responsible for
 * adding the public-facing stylesheet for the plugin to the website's front-end.
 *
 * @since 1.0.0
 * @return void
 */
function roi_enqueue_public_assets() {
    // Enqueue the public-facing stylesheet.
    wp_enqueue_style(
        'roi-public-styles',
        plugin_dir_url( __FILE__ ) . '../assets/css/public-style.css',
        array(),
        ROI_VERSION
    );
}
add_action( 'wp_enqueue_scripts', 'roi_enqueue_public_assets' );
