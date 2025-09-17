<?php
/**
 * File for handling the Backup/Restore admin page for learning content.
 *
 * @package ROI
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Add the Backup/Restore page to the Apprentissage menu.
 */
function roi_add_backup_restore_page() {
    add_submenu_page(
        'roi-apprentissage',
        __( 'Sauvegarde / Restauration', 'roi' ),
        __( 'Sauvegarde / Restauration', 'roi' ),
        'manage_options',
        'roi-backup-restore',
        'roi_render_backup_restore_page'
    );
}
add_action( 'admin_menu', 'roi_add_backup_restore_page' );

/**
 * Renders the backup/restore page.
 */
function roi_render_backup_restore_page() {
    ?>
    <div class="wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

        <div class="roi-backup-restore-wrapper">

            <!-- Backup Section -->
            <div class="roi-backup-section" style="margin-bottom: 2em;">
                <h2><?php esc_html_e( 'Sauvegarder les données d\'apprentissage', 'roi' ); ?></h2>
                <p><?php esc_html_e( "Cliquez sur le bouton ci-dessous pour télécharger une sauvegarde de toutes les leçons, exercices et cours, ainsi que leurs catégories.", 'roi' ); ?></p>
                <form method="post" action="">
                    <?php wp_nonce_field( 'roi_backup_nonce_action', 'roi_backup_nonce' ); ?>
                    <?php submit_button( __( 'Sauvegarder la base de données', 'roi' ), 'primary', 'roi_backup_action', false ); ?>
                </form>
            </div>

            <hr>

            <!-- Restore Section -->
            <div class="roi-restore-section">
                <h2><?php esc_html_e( 'Restaurer les données d\'apprentissage', 'roi' ); ?></h2>
                <p><strong><span style="color: red;"><?php esc_html_e( 'Attention :', 'roi' ); ?></span></strong> <?php esc_html_e( "L'importation depuis un fichier de sauvegarde effacera et remplacera TOUTES les données d'apprentissage existantes (leçons, exercices, cours et catégories). Assurez-vous d'avoir une sauvegarde si nécessaire.", 'roi' ); ?></p>
                <form method="post" enctype="multipart/form-data" id="roi-restore-form" action="">
                    <?php wp_nonce_field( 'roi_restore_nonce_action', 'roi_restore_nonce' ); ?>
                    <p>
                        <label for="roi_restore_file"><?php esc_html_e( 'Choisissez un fichier de sauvegarde (.json.gz) à importer :', 'roi' ); ?></label>
                        <input type="file" id="roi_restore_file" name="roi_restore_file" accept=".gz" required>
                    </p>
                    <?php submit_button( __( 'Restaurer la base de données', 'roi' ), 'delete', 'roi_restore_action' ); ?>
                </form>
            </div>

        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const restoreForm = document.getElementById('roi-restore-form');
                if (restoreForm) {
                    restoreForm.addEventListener('submit', function(e) {
                        if (!confirm("<?php echo esc_js( __( 'Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Toutes les leçons, exercices, cours et catégories existants seront supprimés et remplacés. Cette action est irréversible.', 'roi' ) ); ?>")) {
                            e.preventDefault();
                        }
                    });
                }
            });
        </script>
    </div>
    <?php
}
