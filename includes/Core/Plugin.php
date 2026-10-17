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

		// Gutenberg Blocks.
		( new \ROI\Blocks\Manager() )->init();

		// Custom Post Types & Taxonomies.
		( new \ROI\CPT\Manager() )->init();

		// Roles & capabilities.
		$roles = new Roles();
		$roles->init();

		// Cache invalidation & object cache handlers.
		\ROI\API\REST\Parcours_Controller::register_cache_hooks();

		// REST API controllers (lazy loaded on rest_api_init).
		add_action(
			'rest_api_init',
			function (): void {
				( new \ROI\API\REST\Parcours_Controller() )->register_routes();
				( new \ROI\API\REST\Games_Controller() )->register_routes();
				( new \ROI\API\REST\Contenu_Controller() )->register_routes();
				( new \ROI\API\REST\Progression_Controller() )->register_routes();
				( new \ROI\API\REST\Config_Controller() )->register_routes();
			}
		);

		// Chess Engine Integration.
		add_action(
			'init',
			function (): void {
				\ROI\Chess\ChessEngine::get_instance(
					ROI_PLUGIN_URL,
					ROI_PLUGIN_DIR
				);
			},
			5
		);

		// Clean playlists when elements are trashed or deleted (Admin, REST, or CLI).
		( new \ROI\Metaboxes\Cours\Builder\Playlist_Cleaner() )->init();

		// Lazy-load DAME backup hook (for WP-Cron & background tasks).
		add_filter(
			'dame_scheduled_backup_attachments',
			static function ( array $attachments, string $backup_dir ): array {
				return ( new \ROI\Admin\Backup\Exporter() )->add_to_dame_scheduled_backup( $attachments, $backup_dir );
			},
			10,
			2
		);

		// Admin pages, metaboxes & assets UI (strictly isolated under is_admin()).
		if ( is_admin() ) {
			new \ROI\Metaboxes\Exercice\Manager();
			new \ROI\Metaboxes\Cours\Builder();
			new \ROI\Metaboxes\Cours\Audience();
			new \ROI\Metaboxes\Lecon\Settings();
			new \ROI\Metaboxes\Video\Settings();
			( new \ROI\Metaboxes\Partie() )->init();

			$admin_menu = new \ROI\Admin\Menu();
			$admin_menu->init();
			$admin_assets = new \ROI\Admin\Assets();
			$admin_assets->init();
			( new \ROI\Admin\Suivi_Page() )->init();
			( new \ROI\Admin\Backup() )->init();
			( new \ROI\Admin\Columns() )->init();
			( new \ROI\Admin\Settings\Main() )->init();
		}
	}
}
