<?php
/**
 * Handles plugin activation and deactivation.
 *
 * @package ROI
 */

// If this file is a called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * The code that runs during plugin activation.
 *
 * This function is hooked to run on plugin activation. It adds custom
 * capabilities to user roles and flushes the rewrite rules to ensure that
 * the custom post types are correctly registered.
 *
 * @since 1.0.0
 * @return void
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
 *
 * This function is hooked to run on plugin deactivation. It removes the
 * custom capabilities from user roles and flushes the rewrite rules to
 * ensure that the custom post types are correctly unregistered.
 *
 * @since 1.0.0
 * @return void
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
