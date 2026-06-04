<?php
/**
 * Plugin Name:       ROI - Ressources et Organisation pour l’Initiation (aux échecs)
 * Plugin URI:        https://example.com/plugins/the-basics/
 * Description:       Ressources et Organisation pour l’Initiation aux échecs.
 * Version:           1.0.6
 * Requires at least: 6.8
 * Requires PHP:      8.2
 * Author:            Etienne Gagnon
 * Author URI:        
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       roi
 * Domain Path:       /languages
 * Depends:           dame
 */

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
function roi_check_dame_dependency() {
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

define( 'ROI_VERSION', '1.0.6' );
define( 'ROI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

// Include plugin files
require_once plugin_dir_path( __FILE__ ) . 'includes/assets.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/cpt.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/taxonomies.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/lesson-completion.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/single-exercice-handler.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/single-course-handler.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/roles.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/shortcodes.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/activation.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/chess/class-chess-engine.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/REST/Games.php';

// Initialize REST API endpoints
add_action( 'init', function() {
    $games_rest = new \ROI\REST\Games();
    $games_rest->init();
} );


if ( is_admin() ) {
    require_once plugin_dir_path( __FILE__ ) . 'admin/menu.php';
    require_once plugin_dir_path( __FILE__ ) . 'admin/metaboxes.php';
    require_once plugin_dir_path( __FILE__ ) . 'admin/backup-restore.php';
    require_once plugin_dir_path( __FILE__ ) . 'admin/backup-restore-page.php';
}

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

/**
 * Initialize Chess Engine.
 *
 * Hooks into the 'init' action to get the singleton instance of the
 * Roi_Chess_Engine class, effectively initializing the chess-related
 * functionalities of the plugin.
 *
 * @since 1.0.0
 */
add_action('init', function() {
    Roi_Chess_Engine::get_instance(
        plugin_dir_url(__FILE__),
        plugin_dir_path(__FILE__)
    );
}, 5);
