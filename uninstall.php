<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package ROI
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Delete the options.
delete_option( 'roi_plugin_version' );

global $wpdb;

// Delete all 'roi_lecon' custom post types.
$lecon_post_ids = $wpdb->get_col( "SELECT ID FROM $wpdb->posts WHERE post_type = 'roi_lecon'" );
if ( ! empty( $lecon_post_ids ) ) {
    $wpdb->query( "DELETE FROM $wpdb->posts WHERE ID IN (" . implode( ',', array_map( 'absint', $lecon_post_ids ) ) . ")" );
    $wpdb->query( "DELETE FROM $wpdb->postmeta WHERE post_id IN (" . implode( ',', array_map( 'absint', $lecon_post_ids ) ) . ")" );
    $wpdb->query( "DELETE FROM $wpdb->term_relationships WHERE object_id IN (" . implode( ',', array_map( 'absint', $lecon_post_ids ) ) . ")" );
}

// Delete all 'roi_exercice' custom post types.
$exercice_post_ids = $wpdb->get_col( "SELECT ID FROM $wpdb->posts WHERE post_type = 'roi_exercice'" );
if ( ! empty( $exercice_post_ids ) ) {
    $wpdb->query( "DELETE FROM $wpdb->posts WHERE ID IN (" . implode( ',', array_map( 'absint', $exercice_post_ids ) ) . ")" );
    $wpdb->query( "DELETE FROM $wpdb->postmeta WHERE post_id IN (" . implode( ',', array_map( 'absint', $exercice_post_ids ) ) . ")" );
    $wpdb->query( "DELETE FROM $wpdb->term_relationships WHERE object_id IN (" . implode( ',', array_map( 'absint', $exercice_post_ids ) ) . ")" );
}

// Delete all 'roi_cours' custom post types.
$cours_post_ids = $wpdb->get_col( "SELECT ID FROM $wpdb->posts WHERE post_type = 'roi_cours'" );
if ( ! empty( $cours_post_ids ) ) {
    $wpdb->query( "DELETE FROM $wpdb->posts WHERE ID IN (" . implode( ',', array_map( 'absint', $cours_post_ids ) ) . ")" );
    $wpdb->query( "DELETE FROM $wpdb->postmeta WHERE post_id IN (" . implode( ',', array_map( 'absint', $cours_post_ids ) ) . ")" );
    $wpdb->query( "DELETE FROM $wpdb->term_relationships WHERE object_id IN (" . implode( ',', array_map( 'absint', $cours_post_ids ) ) . ")" );
}

// Delete custom taxonomy terms for 'roi_chess_category'.
$taxonomy = 'roi_chess_category';
$term_ids = $wpdb->get_col( $wpdb->prepare( "SELECT t.term_id FROM $wpdb->terms AS t INNER JOIN $wpdb->term_taxonomy AS tt ON t.term_id = tt.term_id WHERE tt.taxonomy = %s", $taxonomy ) );
if ( ! empty( $term_ids ) ) {
    $term_ids_str = implode( ',', array_map( 'absint', $term_ids ) );
    $wpdb->query( "DELETE FROM $wpdb->terms WHERE term_id IN ($term_ids_str)" );
    $wpdb->query( "DELETE FROM $wpdb->termmeta WHERE term_id IN ($term_ids_str)" );
    $wpdb->query( "DELETE FROM $wpdb->term_taxonomy WHERE term_id IN ($term_ids_str)" );
}
