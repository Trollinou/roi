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
 * @return string|WP_Error The path to the backup file on success, or a WP_Error object on failure.
 */
function roi_generate_apprentissage_backup_file() {
    if ( ! function_exists( 'roi_get_apprentissage_export_data' ) ) {
        require_once ROI_PLUGIN_DIR . 'admin/backup-restore.php';
    }

    $export_data = roi_get_apprentissage_export_data();
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
