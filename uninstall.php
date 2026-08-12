<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package ROI
 */

declare(strict_types=1);

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete options.
delete_option( 'roi_plugin_version' );
delete_option( 'roi_apprentissage_allowed_roles' );

global $wpdb;

// Delete all ROI custom post types (lecon, exercice, cours, partie).
$cpts = array( 'roi_lecon', 'roi_exercice', 'roi_cours', 'roi_partie' );

foreach ( $cpts as $cpt ) {
	$post_ids = $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type = %s", $cpt ) );
	if ( ! empty( $post_ids ) ) {
		$ids_str = implode( ',', array_map( 'absint', $post_ids ) );
		$wpdb->query( "DELETE FROM {$wpdb->posts} WHERE ID IN ($ids_str)" );
		$wpdb->query( "DELETE FROM {$wpdb->postmeta} WHERE post_id IN ($ids_str)" );
		$wpdb->query( "DELETE FROM {$wpdb->term_relationships} WHERE object_id IN ($ids_str)" );
	}
}

// Delete custom taxonomy terms for 'roi_chapitre'.
$taxonomy = 'roi_chapitre';
$term_ids = $wpdb->get_col( $wpdb->prepare( "SELECT t.term_id FROM {$wpdb->terms} AS t INNER JOIN {$wpdb->term_taxonomy} AS tt ON t.term_id = tt.term_id WHERE tt.taxonomy = %s", $taxonomy ) );
if ( ! empty( $term_ids ) ) {
	$term_ids_str = implode( ',', array_map( 'absint', $term_ids ) );
	$wpdb->query( "DELETE FROM {$wpdb->terms} WHERE term_id IN ($term_ids_str)" );
	$wpdb->query( "DELETE FROM {$wpdb->termmeta} WHERE term_id IN ($term_ids_str)" );
	$wpdb->query( "DELETE FROM {$wpdb->term_taxonomy} WHERE term_id IN ($term_ids_str)" );
}
