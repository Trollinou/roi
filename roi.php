<?php
/**
 * Plugin Name:       ROI - Ressources et Organisation pour l’Initiation (aux échecs)
 * Plugin URI:        https://example.com/plugins/the-basics/
 * Description:       Ressources et Organisation pour l’Initiation aux échecs.
 * Version:           1.1.0
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
 * Autoloader SPL pour le namespace ROI\
 */
spl_autoload_register( function ( $class ) {
    $prefix = 'ROI\\';
    $base_dir = plugin_dir_path( __FILE__ ) . 'includes/';

    $len = strlen( $prefix );
    if ( strncmp( $prefix, $class, $len ) !== 0 ) {
        return;
    }

    $relative_class = substr( $class, $len );
    $file = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

    if ( file_exists( $file ) ) {
        require $file;
    }
});

define( 'ROI_VERSION', '1.1.0' );
define( 'ROI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ROI_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Initialisation du plugin
 */
add_action( 'plugins_loaded', function() {
    // Vérification de la dépendance DAME
    if ( ! is_plugin_active( 'dame/dame.php' ) ) {
        add_action( 'admin_notices', function() {
            ?>
            <div class="notice notice-error is-dismissible">
                <p><?php _e( "Le plugin ROI requiert que le plugin DAME soit activé. Le plugin ROI a été désactivé.", "roi" ); ?></p>
            </div>
            <?php
        });
        deactivate_plugins( plugin_basename( __FILE__ ) );
        return;
    }

    // Chargement du Textdomain
    load_plugin_textdomain( 'roi', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

    // Lanceur principal
    ( new ROI\Core\Plugin_Loader() )->init();
});

/**
 * Activation du plugin
 */
register_activation_hook( __FILE__, function() {
    // Enregistrement manuel des CPT pour le flush
    ( new ROI\CPT\Manager() )->register_all();
    
    // Ajout des capacités
    ( new ROI\Core\Roles() )->add_capabilities();
    
    flush_rewrite_rules();
});

/**
 * Désactivation du plugin
 */
register_deactivation_hook( __FILE__, function() {
    // Suppression des capacités
    ( new ROI\Core\Roles() )->remove_capabilities();
    
    flush_rewrite_rules();
});
