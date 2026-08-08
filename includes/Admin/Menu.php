<?php
/**
 * Admin Menu registration and modifications.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin;

/**
 * Class Menu
 * Handles the admin menu and submenu highlights.
 */
class Menu {

	/**
	 * Initialize the admin menu hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_menu', [ $this, 'add_apprentissage_menu' ] );
		add_filter( 'parent_file', [ $this, 'apprentissage_menu_highlight' ] );
		add_action( 'admin_notices', [ $this, 'display_admin_notices' ] );
	}

	/**
	 * Displays admin notices stored in transients.
	 *
	 * @return void
	 */
	public function display_admin_notices(): void {
		$all_transients = get_transient( 'roi_admin_notices' );
		if ( empty( $all_transients ) || ! is_array( $all_transients ) ) {
			return;
		}

		foreach ( $all_transients as $transient ) {
			$message = $transient['message'] ?? '';
			$type    = $transient['type'] ?? 'success';
			?>
			<div class="notice notice-<?php echo esc_attr( $type ); ?> is-dismissible">
				<p><?php echo wp_kses_post( $message ); ?></p>
			</div>
			<?php
		}
		delete_transient( 'roi_admin_notices' );
	}

	/**
	 * Adds the main "Apprentissage" menu.
	 *
	 * @return void
	 */
	public function add_apprentissage_menu(): void {
		add_menu_page(
			__( 'Apprentissage', 'roi' ),
			__( 'Apprentissage', 'roi' ),
			'edit_posts',
			'roi-apprentissage',
			'',
			'dashicons-book',
			35
		);
	}

	/**
	 * Corrects the highlighting for the "Catégories" submenu.
	 *
	 * @param string $parent_file The parent file determined by WordPress.
	 * @return string The corrected parent file slug.
	 */
	public function apprentissage_menu_highlight( string $parent_file ): string {
		return $parent_file;
	}
}
