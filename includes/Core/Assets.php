<?php
/**
 * Handles asset enqueuing.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Core;

/**
 * Class Assets
 * Manages front-end CSS and JS enqueuing.
 */
class Assets {

	/**
	 * Initialize the class and register hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_public_assets' ] );
	}

	/**
	 * Enqueue front-end stylesheets and scripts.
	 *
	 * @return void
	 */
	public function enqueue_public_assets(): void {
		$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
		wp_enqueue_style(
			'roi-public-styles',
			$plugin_url . 'assets/css/public-style.css',
			[],
			ROI_VERSION
		);
	}
}
