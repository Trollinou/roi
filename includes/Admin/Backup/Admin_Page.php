<?php
/**
 * Backup and Restore Admin Page.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin\Backup;

/**
 * Class Admin_Page
 * Handles menu registration, admin notice transients and UI rendering.
 */
class Admin_Page {

	/**
	 * Register the submenu page.
	 *
	 * @return void
	 */
	public function register_page(): void {
		add_submenu_page(
			'roi-apprentissage',
			__( 'Sauvegarde / Restauration', 'roi' ),
			__( 'Sauvegarde / Restauration', 'roi' ),
			'manage_options',
			'roi-backup-restore',
			array( $this, 'render' )
		);
	}

	/**
	 * Adds a transient-based admin notice.
	 *
	 * @param string $message The message.
	 * @param string $type    The type ('success', 'error', etc.).
	 * @return void
	 */
	public function add_admin_notice( string $message, string $type = 'success' ): void {
		$notices = get_transient( 'roi_admin_notices' );
		if ( ! is_array( $notices ) ) {
			$notices = array();
		}
		$notices[] = array(
			'message' => $message,
			'type'    => $type,
		);
		set_transient( 'roi_admin_notices', $notices, 30 );
	}

	/**
	 * Enqueues assets for the backup/restore page.
	 *
	 * @param string $hook The current admin page hook.
	 * @return void
	 */
	public function enqueue_assets( string $hook ): void {
		if ( ! str_contains( $hook, 'roi-backup-restore' ) ) {
			return;
		}

		$asset_file = ROI_PLUGIN_DIR . 'build/admin-backup.asset.php';
		$asset      = file_exists( $asset_file ) ? include $asset_file : array(
			'dependencies' => array(),
			'version'      => ROI_VERSION,
		);

		wp_enqueue_script(
			'roi-admin-backup',
			ROI_PLUGIN_URL . 'build/admin-backup.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);
	}

	/**
	 * Renders the backup/restore admin view.
	 *
	 * @return void
	 */
	public function render(): void {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

			<div class="roi-backup-restore-wrapper">

				<!-- Backup Section -->
				<div class="roi-backup-section" style="margin-bottom: 2em;">
					<h2><?php esc_html_e( 'Sauvegarder les données d\'apprentissage', 'roi' ); ?></h2>
					<p><?php esc_html_e( 'Cliquez sur le bouton ci-dessous pour télécharger une sauvegarde complète (leçons, exercices, cours, vidéos, parties, chapitres, configurations et progressions).', 'roi' ); ?></p>
					<form method="post" action="">
						<?php wp_nonce_field( 'roi_backup_nonce_action', 'roi_backup_nonce' ); ?>
						<?php submit_button( __( 'Sauvegarder la base de données', 'roi' ), 'primary', 'roi_backup_action', false ); ?>
					</form>
				</div>

				<hr>

				<!-- Restore Section -->
				<div class="roi-restore-section">
					<h2><?php esc_html_e( 'Restaurer les données d\'apprentissage', 'roi' ); ?></h2>
					<p><strong><span style="color: red;"><?php esc_html_e( 'Attention :', 'roi' ); ?></span></strong> <?php esc_html_e( "L'importation depuis un fichier de sauvegarde effacera et remplacera l'ensemble des données d'apprentissage existantes (leçons, exercices, cours, vidéos, parties et chapitres). Les identifiants (IDs) d'origine sont strictement préservés pour garantir la conformité ISO.", 'roi' ); ?></p>
					<form method="post" enctype="multipart/form-data" id="roi-restore-form" action="" data-confirm-message="<?php esc_attr_e( 'Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Toutes les données existantes du module seront remplacées en conservant les identifiants d\'origine. Cette action est irréversible.', 'roi' ); ?>">
						<?php wp_nonce_field( 'roi_restore_nonce_action', 'roi_restore_nonce' ); ?>
						<p>
							<label for="roi_restore_file"><?php esc_html_e( 'Choisissez un fichier de sauvegarde (.json.gz ou .json) à importer :', 'roi' ); ?></label>
							<input type="file" id="roi_restore_file" name="roi_restore_file" accept=".gz,.json" required>
						</p>
						<?php submit_button( __( 'Restaurer la base de données', 'roi' ), 'delete', 'roi_restore_action' ); ?>
					</form>
				</div>

			</div>
		</div>
		<?php
	}
}
