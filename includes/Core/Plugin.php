<?php
/**
 * Main Plugin bootstrapping class.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Core;

/**
 * Class Plugin
 * Bootstraps the application modules and actions.
 */
class Plugin {

	/**
	 * Run the plugin logic.
	 * Registers all hooks and loads dependencies.
	 *
	 * @return void
	 */
	public function run(): void {
		// Assets.
		$assets = new Assets();
		$assets->init();

		// Gutenberg Blocks.
		( new \ROI\Blocks\Manager() )->init();

		// Custom Post Types.
		( new \ROI\CPT\Lecon() )->init();
		( new \ROI\CPT\Exercice() )->init();
		( new \ROI\CPT\Cours() )->init();
		( new \ROI\CPT\Partie() )->init();

		// Taxonomies.
		( new \ROI\CPT\Chapitre_Taxonomy() )->init();

		// Roles & capabilities.
		$roles = new Roles();
		$roles->init();

		// REST API endpoints.
		add_action(
			'rest_api_init',
			function (): void {
				( new \ROI\API\REST\Games_Controller() )->register_routes();
				( new \ROI\API\REST\Stockfish_Controller() )->register_routes();
				( new \ROI\API\REST\Contenu_Controller() )->register_routes();
				( new \ROI\API\REST\Progression_Controller() )->register_routes();
				( new \ROI\API\REST\Parcours_Controller() )->register_routes();
				( new \ROI\API\REST\Config_Controller() )->register_routes();
			}
		);

		// Chess Engine Integration.
		add_action(
			'init',
			function (): void {
				\ROI\Chess\ChessEngine::get_instance(
					plugin_dir_url( ROI_PLUGIN_DIR . 'roi.php' ),
					ROI_PLUGIN_DIR
				);
			},
			5
		);

		// Metaboxes & Meta handlers (must run for both Admin UI and REST API requests).
		new \ROI\Metaboxes\Exercice\Manager();
		new \ROI\Metaboxes\Cours\Builder();
		new \ROI\Metaboxes\Lecon\Settings();
		( new \ROI\Metaboxes\Partie() )->init();

		// Admin pages & assets UI.
		if ( is_admin() ) {
			$admin_menu = new \ROI\Admin\Menu();
			$admin_menu->init();
			$admin_assets = new \ROI\Admin\Assets();
			$admin_assets->init();
			( new \ROI\Admin\Suivi_Page() )->init();
			$backup = new \ROI\Admin\Backup();
			$backup->init();
			( new \ROI\Admin\Columns() )->init();
			( new \ROI\Admin\Settings\Main() )->init();
		}
	}
}
