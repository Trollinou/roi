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
		add_action( 'admin_menu', array( $this, 'add_apprentissage_menu' ) );
		add_action( 'admin_menu', array( $this, 'reorder_apprentissage_submenus' ), 999 );
		add_filter( 'parent_file', array( $this, 'apprentissage_menu_highlight' ) );
		add_action( 'admin_notices', array( $this, 'display_admin_notices' ) );
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
			__( 'ROI', 'roi' ),
			'edit_posts',
			'roi-apprentissage',
			'',
			'dashicons-book',
			35
		);
	}

	/**
	 * Reorders the submenus under the "Apprentissage" parent menu.
	 *
	 * Desired order:
	 * 1. Suivi des élèves
	 * 2. Tous les cours
	 * 3. Toutes les leçons
	 * 4. Toutes les vidéos
	 * 5. Tous les exercices
	 * 6. Toutes les parties
	 * 7. Sauvegarde / Restauration
	 * 8. Réglage
	 *
	 * @return void
	 */
	public function reorder_apprentissage_submenus(): void {
		global $submenu;

		$menu_slug = 'roi-apprentissage';
		if ( ! isset( $submenu[ $menu_slug ] ) || ! is_array( $submenu[ $menu_slug ] ) ) {
			return;
		}

		// Remove the default duplicate entry created by add_menu_page (slug === parent slug).
		foreach ( $submenu[ $menu_slug ] as $key => $item ) {
			if ( isset( $item[2] ) && $item[2] === $menu_slug ) {
				unset( $submenu[ $menu_slug ][ $key ] );
			}
		}

		// Expected order by slug ($item[2]).
		$desired_order = array(
			'roi-suivi-eleves'                => 1,
			'edit.php?post_type=roi_cours'    => 2,
			'edit.php?post_type=roi_lecon'    => 3,
			'edit.php?post_type=roi_video'    => 4,
			'edit.php?post_type=roi_exercice' => 5,
			'edit.php?post_type=roi_partie'   => 6,
			'roi-backup-restore'              => 7,
			'roi-settings'                    => 8,
		);

		$items_by_slug = array();
		$other_items   = array();

		foreach ( $submenu[ $menu_slug ] as $item ) {
			$slug = $item[2] ?? '';
			if ( isset( $desired_order[ $slug ] ) ) {
				$items_by_slug[ $slug ] = $item;
			} else {
				$other_items[] = $item;
			}
		}

		$ordered_submenu = array();
		foreach ( $desired_order as $slug => $priority ) {
			if ( isset( $items_by_slug[ $slug ] ) ) {
				$ordered_submenu[] = $items_by_slug[ $slug ];
			}
		}

		// Append any remaining items if any.
		foreach ( $other_items as $item ) {
			$ordered_submenu[] = $item;
		}

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu[ $menu_slug ] = $ordered_submenu;
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
