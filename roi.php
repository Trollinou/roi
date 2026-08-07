<?php
/**
 * Plugin Name:       ROI - Ressources et Organisation pour l’Initiation (aux échecs)
 * Plugin URI:        https://example.com/plugins/the-basics/
 * Description:       Ressources et Organisation pour l’Initiation aux échecs.
 * Version:           1.3.3
 * Requires at least: 6.9.1
 * Requires PHP:      8.4
 * Author:            Etienne Gagnon
 * Author URI:        
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       roi
 * Domain Path:       /languages
 * Depends:           dame
 */

declare(strict_types=1);

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Checks if the DAME plugin is active.
 *
 * This function is hooked into 'admin_init' and verifies if the required
 * 'dame/dame.php' plugin is active. If not, it displays an admin notice
 * and deactivates the current plugin.
 *
 * @since 1.0.0
 * @return void
 */
function roi_check_dame_dependency(): void {
	if ( ! function_exists( 'is_plugin_active' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	if ( ! is_plugin_active( 'dame/dame.php' ) ) {
		add_action( 'admin_notices', 'roi_dame_not_active_notice' );
		deactivate_plugins( plugin_basename( __FILE__ ) );
	}
}
add_action( 'admin_init', 'roi_check_dame_dependency' );

/**
 * Displays an admin notice if the DAME plugin is not active.
 *
 * This function renders an error notice in the WordPress admin area, informing
 * the user that the ROI plugin has been deactivated because its dependency,
 * the DAME plugin, is not active.
 *
 * @since 1.0.0
 * @return void
 */
function roi_dame_not_active_notice() {
	?>
	<div class="notice notice-error is-dismissible">
		<p><?php _e( 'Le plugin ROI requiert que le plugin DAME soit activé. Le plugin ROI a été désactivé.', 'roi' ); ?></p>
	</div>
	<?php
}

define( 'ROI_VERSION', '1.3.3' );
define( 'ROI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

// Autoloader SPL natif
spl_autoload_register( function ( $class ) {
	$prefix   = 'ROI\\';
	$base_dir = plugin_dir_path( __FILE__ ) . 'includes/';

	$len = strlen( $prefix );
	if ( strncmp( $prefix, $class, $len ) !== 0 ) {
		return;
	}

	$relative_class = substr( $class, $len );
	$file           = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

	if ( file_exists( $file ) ) {
		require $file;
	}
} );

// Initialisation du plugin
$roi_plugin = new \ROI\Core\Plugin();
$roi_plugin->run();

// Hooks d'activation et désactivation
register_activation_hook( __FILE__, [ \ROI\Core\Activator::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ \ROI\Core\Deactivator::class, 'deactivate' ] );

/**
 * Load plugin textdomain.
 *
 * Loads the plugin's translated strings. This function is hooked into the
 * 'plugins_loaded' action.
 *
 * @since 1.0.0
 * @return void
 */
function roi_load_textdomain() {
	load_plugin_textdomain( 'roi', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'plugins_loaded', 'roi_load_textdomain' );

