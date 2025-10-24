<?php
/**
 * File for handling custom roles and capabilities.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Returns the capabilities for the Exercice CPT.
 *
 * This helper function provides a consistent array of custom capabilities
 * related to the 'roi_exercice' custom post type.
 *
 * @since 1.0.0
 * @return array The list of capabilities.
 */
function roi_get_exercice_capabilities() {
    return array(
        'edit_exercice'          => true,
        'read_exercice'          => true,
        'delete_exercice'        => true,
        'edit_exercices'         => true,
        'edit_others_exercices'  => true,
        'publish_exercices'      => true,
        'read_private_exercices' => true,
    );
}

/**
 * Returns the capabilities for the Cours CPT.
 *
 * This helper function provides a consistent array of custom capabilities
 * related to the 'roi_cours' custom post type.
 *
 * @since 1.0.0
 * @return array The list of capabilities.
 */
function roi_get_cours_capabilities() {
    return array(
        'edit_cours_item'    => true,
        'read_cours_item'    => true,
        'delete_cours_item'  => true,
        'edit_cours'         => true,
        'edit_others_cours'  => true,
        'publish_cours'      => true,
        'read_private_cours' => true,
    );
}

/**
 * Adds the custom capabilities for the plugin to the relevant roles.
 *
 * This function grants the custom capabilities for managing 'roi_exercice' and
 * 'roi_cours' post types to the 'entraineur' (Coach) and 'administrator' roles.
 * It is hooked into the 'init' action to ensure roles are available.
 *
 * @since 1.0.0
 * @return void
 */
function roi_add_capabilities_to_roles() {
    // Add caps to Entraineur
    $entraineur = get_role( 'entraineur' );
    if ( $entraineur ) {
        $caps_to_add = array_merge(
            roi_get_exercice_capabilities(),
            roi_get_cours_capabilities()
        );
        foreach ( $caps_to_add as $cap => $grant ) {
            $entraineur->add_cap( $cap, $grant );
        }
    }

    // Add caps to Administrator
    $admin = get_role( 'administrator' );
    if ( $admin ) {
        $admin_caps = array_merge(
            roi_get_exercice_capabilities(),
            roi_get_cours_capabilities()
        );
        foreach ( $admin_caps as $cap => $grant ) {
            $admin->add_cap( $cap, $grant );
        }
    }
}
add_action( 'init', 'roi_add_capabilities_to_roles' );

/**
 * Remove custom capabilities on plugin deactivation.
 *
 * This function removes all the custom capabilities added by the plugin from the
 * 'entraineur' and 'administrator' roles. It is intended to be called upon
 * plugin deactivation to clean up the database.
 *
 * @since 1.0.0
 * @return void
 */
function roi_remove_capabilities_from_roles() {
    // Remove caps from Entraineur
    $entraineur = get_role( 'entraineur' );
    if ( $entraineur ) {
        $caps_to_remove = array_merge(
            roi_get_exercice_capabilities(),
            roi_get_cours_capabilities()
        );
        foreach ( $caps_to_remove as $cap => $grant ) {
            $entraineur->remove_cap( $cap );
        }
    }

    // Remove caps from Administrator
    $admin = get_role( 'administrator' );
    if ( $admin ) {
        $admin_caps = array_merge(
            roi_get_exercice_capabilities(),
            roi_get_cours_capabilities()
        );
        foreach ( $admin_caps as $cap => $grant ) {
            $admin->remove_cap( $cap );
        }
    }
}

register_activation_hook( __FILE__, 'roi_add_capabilities_to_roles' );
register_deactivation_hook( __FILE__, 'roi_remove_capabilities_from_roles' );
