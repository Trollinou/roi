<?php
declare(strict_types=1);

namespace ROI\Core;

/**
 * Gestion des rôles et des capacités.
 */
final class Roles {

    /**
     * Initialisation.
     */
    public function init(): void {
        add_action( 'init', [ $this, 'add_capabilities' ] );
    }

    /**
     * Retourne les capacités pour le CPT Exercice.
     *
     * @return array<string, bool>
     */
    public function get_exercice_capabilities(): array {
        return [
            'edit_exercice'          => true,
            'read_exercice'          => true,
            'delete_exercice'        => true,
            'edit_exercices'         => true,
            'edit_others_exercices'  => true,
            'publish_exercices'      => true,
            'read_private_exercices' => true,
        ];
    }

    /**
     * Retourne les capacités pour le CPT Cours.
     *
     * @return array<string, bool>
     */
    public function get_cours_capabilities(): array {
        return [
            'edit_cours_item'    => true,
            'read_cours_item'    => true,
            'delete_cours_item'  => true,
            'edit_cours'         => true,
            'edit_others_cours'  => true,
            'publish_cours'      => true,
            'read_private_cours' => true,
        ];
    }

    /**
     * Ajoute les capacités personnalisées aux rôles concernés.
     */
    public function add_capabilities(): void {
        $caps = array_merge(
            $this->get_exercice_capabilities(),
            $this->get_cours_capabilities()
        );

        foreach ( [ 'entraineur', 'administrator' ] as $role_name ) {
            $role = get_role( $role_name );
            if ( $role ) {
                foreach ( $caps as $cap => $grant ) {
                    $role->add_cap( $cap, $grant );
                }
            }
        }
    }

    /**
     * Supprime les capacités personnalisées (Désactivation).
     */
    public function remove_capabilities(): void {
        $caps = array_merge(
            $this->get_exercice_capabilities(),
            $this->get_cours_capabilities()
        );

        foreach ( [ 'entraineur', 'administrator' ] as $role_name ) {
            $role = get_role( $role_name );
            if ( $role ) {
                foreach ( $caps as $cap => $grant ) {
                    $role->remove_cap( $cap );
                }
            }
        }
    }
}
