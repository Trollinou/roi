<?php
declare(strict_types=1);

namespace ROI\Shortcodes;

use ROI\Shortcodes\Exercices\Render as ExercicesRender;
use ROI\Shortcodes\Exercices\Ajax as ExercicesAjax;

/**
 * Manager des shortcodes.
 */
final class Manager {

    /**
     * Initialisation.
     */
    public function init(): void {
        // Shortcode [roi_exercices]
        add_shortcode( 'roi_exercices', [ new ExercicesRender(), 'display' ] );
        
        // AJAX pour les exercices
        ( new ExercicesAjax() )->init();
    }
}
