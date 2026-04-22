<?php
declare(strict_types=1);

namespace ROI\Admin;

use ROI\Admin\Metaboxes\Manager as MetaboxManager;
use ROI\Admin\BackupRestore\Manager as BackupManager;
use ROI\Admin\BackupRestore\Page as BackupPage;

/**
 * Manager global de l'administration.
 */
final class Manager {

    /**
     * Initialisation.
     */
    public function init(): void {
        ( new Menu() )->init();
        ( new MetaboxManager() )->init();
        ( new BackupManager() )->init();
        ( new BackupPage() )->init();
    }
}
