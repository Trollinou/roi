<?php
declare(strict_types=1);

namespace ROI\Admin\BackupRestore;

/**
 * Page d'administration pour la sauvegarde et restauration.
 */
final class Page {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'admin_menu', [ $this, 'add_submenu' ] );
    }

    /**
     * Ajoute le sous-menu.
     */
    public function add_submenu(): void {
        add_submenu_page(
            'roi-apprentissage',
            __( "Sauvegarde & Restauration", "roi" ),
            __( "Sauvegarde / Restauration", "roi" ),
            'manage_options',
            'roi-backup-restore',
            [ $this, 'render_page' ]
        );
    }

    /**
     * Rendu de la page.
     */
    public function render_page(): void {
        ?>
        <div class="wrap">
            <h1><?php _e( "Sauvegarde & Restauration des données d'apprentissage", "roi" ); ?></h1>
            <p><?php _e( "Utilisez cette page pour exporter tout le contenu d'apprentissage (leçons, exercices, cours et catégories) ou pour restaurer des données à partir d'un fichier de sauvegarde.", "roi" ); ?></p>

            <div class="card">
                <h2><?php _e( "Sauvegarde", "roi" ); ?></h2>
                <p><?php _e( "Générez un fichier .json.gz contenant toutes vos données d'apprentissage.", "roi" ); ?></p>
                <form method="post">
                    <?php wp_nonce_field( 'roi_backup_nonce_action', 'roi_backup_nonce' ); ?>
                    <input type="submit" name="roi_backup_action" class="button button-primary" value="<?php esc_attr_e( "Télécharger la sauvegarde", "roi" ); ?>">
                </form>
            </div>

            <div class="card">
                <h2><?php _e( "Restauration", "roi" ); ?></h2>
                <p style="color: #d63638; font-weight: bold;">
                    <?php _e( "ATTENTION : La restauration remplacera TOUT le contenu d'apprentissage existant par les données du fichier de sauvegarde. Cette action est irréversible.", "roi" ); ?>
                </p>
                <form method="post" enctype="multipart/form-data">
                    <?php wp_nonce_field( 'roi_restore_nonce_action', 'roi_restore_nonce' ); ?>
                    <p>
                        <label for="roi_restore_file"><?php _e( "Sélectionnez le fichier de sauvegarde (.json.gz) :", "roi" ); ?></label><br><br>
                        <input type="file" name="roi_restore_file" id="roi_restore_file" accept=".gz">
                    </p>
                    <input type="submit" name="roi_restore_action" class="button button-secondary" value="<?php esc_attr_e( "Restaurer les données", "roi" ); ?>" onclick="return confirm('<?php esc_attr_e( "Êtes-vous sûr de vouloir écraser toutes les données actuelles ?", "roi" ); ?>');">
                </form>
            </div>
        </div>
        <?php
    }
}
