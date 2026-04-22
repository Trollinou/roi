<?php
declare(strict_types=1);

namespace ROI\Core;

use ROI\Admin\BackupRestore\Manager as BackupManager;
use WP_Error;

/**
 * Gestion des tâches planifiées.
 */
final class Cron {

    /**
     * Génère un fichier de sauvegarde des données d'apprentissage.
     *
     * @return string|WP_Error Le chemin du fichier ou une erreur.
     */
    public function generate_backup_file(): string|WP_Error {
        $backup_manager = new BackupManager();
        $export_data    = $backup_manager->get_export_data();
        
        $data_to_compress = json_encode( $export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
        $compressed_data  = gzcompress( (string) $data_to_compress );

        if ( false === $compressed_data ) {
            return new WP_Error( 'compression_error', __( "Erreur lors de la compression des données.", "roi" ) );
        }

        $upload_dir = wp_upload_dir();
        $backup_dir = trailingslashit( $upload_dir['basedir'] ) . 'roi-backups';
        wp_mkdir_p( $backup_dir );

        $filename = 'roi-apprentissage-backup-' . date( 'Y-m-d' ) . '.json.gz';
        $filepath = trailingslashit( $backup_dir ) . $filename;

        if ( file_put_contents( $filepath, $compressed_data ) === false ) {
            return new WP_Error( 'file_write_error', __( "Impossible d'écrire le fichier de sauvegarde sur le disque.", "roi" ) );
        }

        return $filepath;
    }
}
