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

		// Gutenberg Blocks
		( new \ROI\Blocks\Manager() )->init();

		// Custom Post Types
		( new \ROI\CPT\Lecon() )->init();
		( new \ROI\CPT\Exercice() )->init();
		( new \ROI\CPT\Cours() )->init();
		( new \ROI\CPT\Partie() )->init();


		// Taxonomies
		( new \ROI\CPT\Chapitre_Taxonomy() )->init();

		// Roles & capabilities
		$roles = new Roles();
		$roles->init();

		// REST API endpoints
		add_action( 'init', function() {
			$games_rest = new \ROI\API\REST\Games_Controller();
			$games_rest->init();
			$stockfish_rest = new \ROI\API\REST\Stockfish_Controller();
			$stockfish_rest->init();
			$contenu_rest = new \ROI\API\REST\Contenu_Controller();
			$contenu_rest->init();
			$progression_rest = new \ROI\API\REST\Progression_Controller();
			$progression_rest->init();
			$parcours_rest = new \ROI\API\REST\Parcours_Controller();
			$parcours_rest->init();
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
			( new \ROI\Admin\Suivi_Page() )->init();
			new \ROI\Metaboxes\Exercice\Manager();
			new \ROI\Metaboxes\Cours\Builder();
			new \ROI\Metaboxes\Lecon\Settings();
			( new \ROI\Metaboxes\Partie() )->init();
			$backup = new \ROI\Admin\Backup();
			$backup->init();
			( new \ROI\Admin\Columns() )->init();
		}
	}
}
