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
		// Assets
		$assets = new Assets();
		$assets->init();

		// Custom Post Types
		( new \ROI\CPT\Lecon() )->init();
		( new \ROI\CPT\Exercice() )->init();
		( new \ROI\CPT\Cours() )->init();
		( new \ROI\CPT\Partie() )->init();


		// Taxonomies
		$taxonomies = new \ROI\CPT\Taxonomies();
		$taxonomies->init();

		// Roles & capabilities
		$roles = new Roles();
		$roles->init();

		// REST API endpoints
		add_action( 'init', function() {
			$games_rest = new \ROI\REST\Games();
			$games_rest->init();
			$stockfish_rest = new \ROI\REST\Stockfish();
			$stockfish_rest->init();
			$exercices_rest = new \ROI\REST\Exercices();
			$exercices_rest->init();
			$progression_rest = new \ROI\REST\Progression();
			$progression_rest->init();
		} );

		// Chess Engine Integration
		add_action( 'init', function() {
			\ROI\Chess\ChessEngine::get_instance(
				plugin_dir_url( ROI_PLUGIN_DIR . 'roi.php' ),
				ROI_PLUGIN_DIR
			);
		}, 5 );

		// Admin pages & functionalities
		if ( is_admin() ) {
			$admin_menu = new \ROI\Admin\Menu();
			$admin_menu->init();
			$admin_assets = new \ROI\Admin\Assets();
			$admin_assets->init();
			new \ROI\Metaboxes\Exercice();
			( new \ROI\Metaboxes\Partie() )->init();
			$backup = new \ROI\Admin\Backup();
			$backup->init();
		}
	}
}
