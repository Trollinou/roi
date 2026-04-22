<?php
declare(strict_types=1);

namespace ROI\CPT;

use ROI\CPT\Taxonomies\ChessCategory;

/**
 * Manager des Custom Post Types et Taxonomies.
 */
final class Manager {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'init', [ $this, 'register_all' ], 0 );

        // Affichage des exercices
        ( new \ROI\CPT\Exercice\Display() )->init();

        // Complétion des leçons
        ( new \ROI\CPT\Lecon\Completion() )->init();

        // Affichage des cours
        ( new \ROI\CPT\Cours\Display() )->init();
    }

    /**
     * Enregistre tout.
     */
    public function register_all(): void {
        // Taxonomies
        ( new ChessCategory() )->register();

        // CPTs
        ( new Lecon() )->register();
        ( new Exercice() )->register();
        ( new Cours() )->register();
    }
}
