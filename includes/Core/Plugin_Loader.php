<?php
declare(strict_types=1);

namespace ROI\Core;

use ROI\Services\Chess\Engine as ChessEngine;

/**
 * Classe de chargement principale du plugin.
 * 
 * Orchestre l'initialisation de tous les modules du plugin.
 */
final class Plugin_Loader {

    /**
     * Initialisation globale.
     * 
     * @return void
     */
    public function init(): void {
        // Initialisation des composants (Façades ou Managers)
        $this->load_components();
    }

    /**
     * Chargement et initialisation des composants.
     * 
     * @return void
     */
    private function load_components(): void {
        // Assets globaux
        ( new \ROI\Core\Assets() )->init();

        // Moteur d'échecs
        ( new ChessEngine() )->init();

        // CPT Manager
        ( new \ROI\CPT\Manager() )->init();

        // Rôles et Capacités
        ( new \ROI\Core\Roles() )->init();

        // Shortcodes Manager
        ( new \ROI\Shortcodes\Manager() )->init();

        // Services Chess
        ( new \ROI\Services\Chess\Pieces_Filter() )->init();
        
        if ( is_admin() ) {
            ( new \ROI\Admin\Manager() )->init();
        }
    }
}
