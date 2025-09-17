<?php
/**
 * Plugin Name:       ROI
 * Plugin URI:        https://example.com/plugins/the-basics/
 * Description:       Ressources et Organisation pour l’Initiation aux échecs.
 * Version:           1.0.0
 * Requires at least: 5.2
 * Requires PHP:      7.2
 * Author:            Jules
 * Author URI:        https://author.example.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Update URI:        https://example.com/my-plugin/
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
 */
function roi_dame_not_active_notice() {
    ?>
    <div class="notice notice-error is-dismissible">
        <p><?php _e( 'Le plugin ROI requiert que le plugin DAME soit activé. Le plugin ROI a été désactivé.', 'roi' ); ?></p>
    </div>
    <?php
}

define( 'ROI_VERSION', '1.0.0' );
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

if ( is_admin() ) {
    require_once plugin_dir_path( __FILE__ ) . 'admin/menu.php';
    require_once plugin_dir_path( __FILE__ ) . 'admin/metaboxes.php';
    require_once plugin_dir_path( __FILE__ ) . 'admin/backup-restore.php';
    require_once plugin_dir_path( __FILE__ ) . 'admin/backup-restore-page.php';
}

/**
 * Load plugin textdomain.
 */
function roi_load_textdomain() {
    load_plugin_textdomain( 'roi', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'plugins_loaded', 'roi_load_textdomain' );
