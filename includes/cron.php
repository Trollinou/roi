<?php
/**
 * File for handling scheduled tasks (WP-Cron).
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Generates a backup file for the "Apprentissage" data and saves it to a temporary directory.
 *
 * This function gathers all learning content (posts and terms), JSON-encodes and
 * compresses it, and then saves it to a file in the `wp-content/uploads/roi-backups`
 * directory.
 *
 * @since 1.0.0
 * @return string|WP_Error The full path to the backup file on success, or a WP_Error object on failure.
 */
function roi_generate_apprentissage_backup_file() {
    $backup = new \ROI\Admin\Backup();
    $export_data = $backup->get_apprentissage_export_data();
    $data_to_compress = json_encode( $export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
    $compressed_data = gzcompress( $data_to_compress );

    $upload_dir = wp_upload_dir();
    $backup_dir = trailingslashit( $upload_dir['basedir'] ) . 'roi-backups';
    wp_mkdir_p( $backup_dir );

    $filename = 'roi-apprentissage-backup-' . date( 'Y-m-d' ) . '.json.gz';
    $filepath = trailingslashit( $backup_dir ) . $filename;

    if ( file_put_contents( $filepath, $compressed_data ) === false ) {
        return new WP_Error( 'file_write_error', __( "Impossible d'écrire le fichier de sauvegarde sur le disque.", 'roi' ) );
    }

    return $filepath;
}
