<?php
/**
 * Backup and Restore coordinator of learning content.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin;

use ROI\Admin\Backup\Exporter;
use ROI\Admin\Backup\Importer;
use ROI\Admin\Backup\Admin_Page;

/**
 * Class Backup
 * Coordinates backup generation, backup restoring, and delegating to specialized services.
 */
class Backup {

	/**
	 * Exporter instance.
	 *
	 * @var Exporter
	 */
	private Exporter $exporter;

	/**
	 * Importer instance.
	 *
	 * @var Importer
	 */
	private Importer $importer;

	/**
	 * Admin page renderer instance.
	 *
	 * @var Admin_Page
	 */
	private Admin_Page $admin_page;

	/**
	 * Constructor.
	 *
	 * @param Exporter|null   $exporter   Exporter service.
	 * @param Importer|null   $importer   Importer service.
	 * @param Admin_Page|null $admin_page Admin page service.
	 */
	public function __construct(
		?Exporter $exporter = null,
		?Importer $importer = null,
		?Admin_Page $admin_page = null
	) {
		$this->exporter   = $exporter ?? new Exporter();
		$this->importer   = $importer ?? new Importer();
		$this->admin_page = $admin_page ?? new Admin_Page();
	}

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_menu', array( $this->admin_page, 'register_page' ), 20 );
		add_action( 'admin_enqueue_scripts', array( $this->admin_page, 'enqueue_assets' ) );
		add_action( 'admin_init', array( $this, 'handle_backup_action' ) );
		add_action( 'admin_init', array( $this, 'handle_restore_action' ) );
		add_filter( 'dame_scheduled_backup_attachments', array( $this, 'add_to_dame_scheduled_backup' ), 10, 2 );
	}

	/**
	 * Automatically attaches ROI backup to DAME's scheduled daily backup email.
	 *
	 * @param array<int, string> $attachments List of attachments paths.
	 * @param string             $backup_dir  Temporary backup directory.
	 * @return array<int, string> Updated list of attachments.
	 */
	public function add_to_dame_scheduled_backup( array $attachments, string $backup_dir ): array {
		return $this->exporter->add_to_dame_scheduled_backup( $attachments, $backup_dir );
	}

	/**
	 * Gathers all learning content data for export.
	 *
	 * @return array<string, mixed> The complete export data.
	 */
	public function get_apprentissage_export_data(): array {
		return $this->exporter->get_export_data();
	}

	/**
	 * Handles the export of learning data.
	 *
	 * @return void
	 */
	public function handle_backup_action(): void {
		if ( ! isset( $_POST['roi_backup_action'], $_POST['roi_backup_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['roi_backup_nonce'] ) ), 'roi_backup_nonce_action' ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", 'roi' ) );
		}

		$this->exporter->download_export_gz();
	}

	/**
	 * Handles the import of learning data with strict ID preservation (ISO).
	 *
	 * @return void
	 */
	public function handle_restore_action(): void {
		if ( ! isset( $_POST['roi_restore_action'], $_POST['roi_restore_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['roi_restore_nonce'] ) ), 'roi_restore_nonce_action' ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", 'roi' ) );
		}

		if ( ! isset( $_FILES['roi_restore_file'] ) || ! is_array( $_FILES['roi_restore_file'] ) ) {
			$this->admin_page->add_admin_notice( __( 'Erreur lors du téléversement du fichier.', 'roi' ), 'error' );
			wp_safe_redirect( add_query_arg( 'page', 'roi-backup-restore', admin_url( 'admin.php' ) ) );
			exit;
		}

		$result = $this->importer->restore_from_upload( $_FILES['roi_restore_file'] );

		if ( is_wp_error( $result ) ) {
			$this->admin_page->add_admin_notice( $result->get_error_message(), 'error' );
		} else {
			$this->admin_page->add_admin_notice( __( "La restauration des données d'apprentissage a été effectuée avec succès (conservation stricte des identifiants ISO).", 'roi' ) );
		}

		wp_safe_redirect( add_query_arg( 'page', 'roi-backup-restore', admin_url( 'admin.php' ) ) );
		exit;
	}
}
