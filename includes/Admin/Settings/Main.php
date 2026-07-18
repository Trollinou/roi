<?php
/**
 * Main Settings Controller.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin\Settings;

/**
 * Class Main
 * Main controller for the settings page.
 */
class Main {

	/**
	 * Active tab.
	 *
	 * @var string
	 */
	private string $active_tab = 'apprentissage';

	/**
	 * Available tabs.
	 *
	 * @var array<string, string>
	 */
	private array $tabs = [];

	/**
	 * Initialize the settings page hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_menu', [ $this, 'register_settings_page' ] );
		add_action( 'admin_init', [ $this, 'save_settings' ] );
	}

	/**
	 * Registers the settings page under the Apprentissage menu.
	 *
	 * @return void
	 */
	public function register_settings_page(): void {
		add_submenu_page(
			'roi-apprentissage',
			__( 'Configuration', 'roi' ),
			__( 'Configuration', 'roi' ),
			'manage_options',
			'roi-settings',
			[ $this, 'render' ]
		);
	}

	/**
	 * Saves the settings when the form is submitted.
	 *
	 * @return void
	 */
	public function save_settings(): void {
		if ( ! isset( $_POST['roi_settings_nonce'] ) ) {
			return;
		}

		if ( ! wp_verify_nonce( sanitize_key( $_POST['roi_settings_nonce'] ), 'roi_save_settings_action' ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'apprentissage';

		if ( 'apprentissage' === $tab ) {
			$allowed_roles = [];
			if ( isset( $_POST['roi_apprentissage_allowed_roles'] ) && is_array( $_POST['roi_apprentissage_allowed_roles'] ) ) {
				$wp_roles = wp_roles()->get_names();
				foreach ( $_POST['roi_apprentissage_allowed_roles'] as $role ) {
					$role_sanitized = sanitize_key( $role );
					if ( isset( $wp_roles[ $role_sanitized ] ) ) {
						$allowed_roles[] = $role_sanitized;
					}
				}
			}
			update_option( 'roi_apprentissage_allowed_roles', $allowed_roles );
		}

		// Store notice in transient
		$notices = get_transient( 'roi_admin_notices' );
		if ( ! is_array( $notices ) ) {
			$notices = [];
		}
		$notices[] = [
			'message' => __( 'Configuration enregistrée avec succès.', 'roi' ),
			'type'    => 'success',
		];
		set_transient( 'roi_admin_notices', $notices, 30 );

		// Redirect to avoid form resubmission
		wp_safe_redirect(
			add_query_arg(
				[
					'page' => 'roi-settings',
					'tab'  => $tab,
				],
				admin_url( 'admin.php' )
			)
		);
		exit;
	}

	/**
	 * Renders the settings page.
	 *
	 * @return void
	 */
	public function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Accès non autorisé.', 'roi' ) );
		}

		$this->active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'apprentissage';
		$this->tabs       = [
			'apprentissage' => __( 'Apprentissage', 'roi' ),
		];

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Configuration ROI', 'roi' ); ?></h1>

			<h2 class="nav-tab-wrapper">
				<?php foreach ( $this->tabs as $tab_key => $tab_title ) : ?>
					<a href="<?php echo esc_url( add_query_arg( 'tab', $tab_key ) ); ?>" class="nav-tab <?php echo $this->active_tab === $tab_key ? 'nav-tab-active' : ''; ?>">
						<?php echo esc_html( $tab_title ); ?>
					</a>
				<?php endforeach; ?>
			</h2>

			<form method="post" action="">
				<?php wp_nonce_field( 'roi_save_settings_action', 'roi_settings_nonce' ); ?>
				
				<div class="roi-settings-tab-content" style="margin-top: 20px;">
					<?php
					if ( 'apprentissage' === $this->active_tab ) {
						$tab = new Tabs\Apprentissage();
						$tab->render();
					}
					?>
				</div>

				<?php submit_button( __( 'Enregistrer les modifications', 'roi' ) ); ?>
			</form>
		</div>
		<?php
	}
}
