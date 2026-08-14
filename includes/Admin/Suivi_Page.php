<?php
/**
 * Admin page for student tracking (suivi des élèves).
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin;

/**
 * Class Suivi_Page
 * Handles registration and rendering of the Suivi page in WP Admin.
 */
class Suivi_Page {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_menu', array( $this, 'add_suivi_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_suivi_assets' ) );
	}

	/**
	 * Adds the "Suivi des élèves" submenu page.
	 *
	 * @return void
	 */
	public function add_suivi_menu(): void {
		add_submenu_page(
			'roi-apprentissage',
			__( 'Suivi des élèves', 'roi' ),
			__( 'Suivi des élèves', 'roi' ),
			// phpcs:ignore WordPress.WP.Capabilities.Unknown
			'edit_others_exercices',
			'roi-suivi-eleves',
			array( $this, 'render_suivi_page' )
		);
	}

	/**
	 * Enqueues React scripts and styles for the Suivi page.
	 *
	 * @param string $hook The current admin page hook.
	 * @return void
	 */
	public function enqueue_suivi_assets( string $hook ): void {
		if ( 'apprentissage_page_roi-suivi-eleves' !== $hook ) {
			return;
		}

		$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
		$script_url = $plugin_url . 'build/suivi/index.js';

		wp_enqueue_script(
			'roi-suivi-react',
			$script_url,
			array( 'wp-element' ),
			ROI_VERSION,
			true
		);

		wp_localize_script(
			'roi-suivi-react',
			'roiSuiviConfig',
			array(
				'apiUrl' => rest_url( 'roi/v1' ),
				'nonce'  => wp_create_nonce( 'wp_rest' ),
			)
		);
	}

	/**
	 * Renders the HTML container for the React application.
	 *
	 * @return void
	 */
	public function render_suivi_page(): void {
		?>
		<div class="wrap">
			<div id="roi-suivi-react-root"><?php esc_html_e( 'Chargement du tableau de bord...', 'roi' ); ?></div>
		</div>
		<?php
	}
}
