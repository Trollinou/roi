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
			22
		);

		add_submenu_page(
			'roi-apprentissage',
			__( 'Catégories', 'roi' ),
			__( 'Catégories', 'roi' ),
			'manage_options',
			'edit-tags.php?taxonomy=roi_chess_category&post_type=roi_lecon'
		);
	}

	/**
	 * Corrects the highlighting for the "Catégories" submenu.
	 *
	 * @param string $parent_file The parent file determined by WordPress.
	 * @return string The corrected parent file slug.
	 */
	public function apprentissage_menu_highlight( string $parent_file ): string {
		global $current_screen;

		if ( isset( $current_screen->taxonomy ) && $current_screen->taxonomy === 'roi_chess_category' ) {
			$parent_file = 'roi-apprentissage';
		}

		return $parent_file;
	}
}
