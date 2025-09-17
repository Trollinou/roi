<?php
/**
 * Handles plugin activation and deactivation.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * The code that runs during plugin activation.
 */
function roi_activate() {
    // Add custom capabilities to roles.
    if ( function_exists( 'roi_add_capabilities_to_roles' ) ) {
        roi_add_capabilities_to_roles();
    }
    // Flush rewrite rules to register CPTs.
    flush_rewrite_rules();
}

/**
 * The code that runs during plugin deactivation.
 */
function roi_deactivate() {
    // Remove custom capabilities from roles.
    if ( function_exists( 'roi_remove_capabilities_from_roles' ) ) {
        roi_remove_capabilities_from_roles();
    }
    // Flush rewrite rules to unregister CPTs.
    flush_rewrite_rules();
}

register_activation_hook( ROI_PLUGIN_DIR . 'roi.php', 'roi_activate' );
register_deactivation_hook( ROI_PLUGIN_DIR . 'roi.php', 'roi_deactivate' );
