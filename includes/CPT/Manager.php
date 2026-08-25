<?php
/**
 * Centralized CPT & Taxonomy Manager.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\CPT;

/**
 * Class Manager
 * Handles initializing and coordinating all CPTs and Taxonomies.
 */
class Manager {

	/**
	 * List of CPT classes to initialize.
	 *
	 * @var array<class-string>
	 */
	private array $cpts = array(
		Lecon::class,
		Exercice::class,
		Cours::class,
		Partie::class,
		Chapitre_Taxonomy::class,
	);

	/**
	 * Initializes all CPTs and Taxonomies.
	 *
	 * @return void
	 */
	public function init(): void {
		foreach ( $this->cpts as $cpt_class ) {
			( new $cpt_class() )->init();
		}
	}
}
