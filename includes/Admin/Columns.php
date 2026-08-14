<?php
/**
 * Admin Columns customizer for CPT lists.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin;

/**
 * Class Columns
 * Handles displaying and sorting difficulty level and chapter columns in admin lists.
 */
class Columns {

	/**
	 * Initialize the class and register hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		foreach ( array( 'roi_exercice', 'roi_lecon', 'roi_cours' ) as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", array( $this, 'ajouter_colonnes' ) );
			add_action( "manage_{$post_type}_posts_custom_column", array( $this, 'afficher_colonnes' ), 10, 2 );
			add_filter( "manage_edit-{$post_type}_sortable_columns", array( $this, 'colonnes_triables' ) );
		}
		add_filter( 'request', array( $this, 'trier_colonnes' ) );
		add_filter( 'posts_clauses', array( $this, 'trier_liste_cours_defaut' ), 10, 2 );
	}

	/**
	 * Inserts custom columns.
	 *
	 * @param array<string, string> $columns Default columns.
	 * @return array<string, string> Customized columns.
	 */
	public function ajouter_colonnes( array $columns ): array {
		global $post_type;
		$new_columns = array();
		foreach ( $columns as $key => $value ) {
			if ( 'date' === $key ) {
				$new_columns['roi_niveau']   = __( 'Niveau', 'roi' );
				$new_columns['roi_chapitre'] = __( 'Chapitre', 'roi' );
				if ( 'roi_cours' === $post_type ) {
					$new_columns['roi_ordre'] = __( 'Ordre', 'roi' );
				}
			}
			$new_columns[ $key ] = $value;
		}
		return $new_columns;
	}

	/**
	 * Outputs the content of custom columns.
	 *
	 * @param string $column Column key.
	 * @param int    $post_id Post ID.
	 * @return void
	 */
	public function afficher_colonnes( string $column, int $post_id ): void {
		$post_type = get_post_type( $post_id );

		if ( 'roi_niveau' === $column ) {
			$meta_key = '';
			if ( 'roi_exercice' === $post_type ) {
				$meta_key = '_roi_exercice_niveau';
			} elseif ( 'roi_lecon' === $post_type ) {
				$meta_key = '_roi_lecon_niveau';
			} elseif ( 'roi_cours' === $post_type ) {
				$meta_key = '_roi_cours_niveau';
			}

			$niveau = $meta_key ? (int) get_post_meta( $post_id, $meta_key, true ) : 0;
			echo $niveau > 0 ? esc_html( (string) $niveau ) : '—';
		}

		if ( 'roi_chapitre' === $column ) {
			$terms = get_the_terms( $post_id, 'roi_chapitre' );
			if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
				$term       = reset( $terms );
				$color_slug = (string) get_term_meta( $term->term_id, '_roi_chapitre_couleur', true );
				$enum_color = \ROI\Enums\Chapitre_Couleur::tryFrom( $color_slug );
				$hex        = $enum_color ? $enum_color->hex() : '#666';

				printf(
					'<span style="display:inline-block; width:8px; height:8px; border-radius:50%%; background:%s; margin-right:6px;"></span>%s',
					esc_attr( $hex ),
					esc_html( $term->name )
				);
			} else {
				echo '—';
			}
		}

		if ( 'roi_ordre' === $column ) {
			$post = get_post( $post_id );
			echo $post ? (int) $post->menu_order : 0;
		}
	}

	/**
	 * Registers sortable columns.
	 *
	 * @param array<string, string> $columns Sortable columns.
	 * @return array<string, string> Updated sortable columns.
	 */
	public function colonnes_triables( array $columns ): array {
		global $post_type;
		$columns['roi_niveau'] = 'roi_niveau';
		if ( 'roi_cours' === $post_type ) {
			$columns['roi_ordre'] = 'menu_order';
		}
		return $columns;
	}

	/**
	 * Configures custom sorting queries for difficulty level.
	 *
	 * @param array<string, mixed> $vars Query variables.
	 * @return array<string, mixed> Query variables.
	 */
	public function trier_colonnes( array $vars ): array {
		if ( isset( $vars['orderby'] ) && 'roi_niveau' === $vars['orderby'] ) {
			$post_type = $vars['post_type'] ?? '';
			$meta_key  = '';
			if ( 'roi_exercice' === $post_type ) {
				$meta_key = '_roi_exercice_niveau';
			} elseif ( 'roi_lecon' === $post_type ) {
				$meta_key = '_roi_lecon_niveau';
			} elseif ( 'roi_cours' === $post_type ) {
				$meta_key = '_roi_cours_niveau';
			}

			if ( $meta_key ) {
				$vars = array_merge(
					$vars,
					array(
						// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
						'meta_key' => $meta_key,
						'orderby'  => 'meta_value_num',
					)
				);
			}
		}
		return $vars;
	}

	/**
	 * Configures default multi-criteria sorting for roi_cours admin list:
	 * 1. Niveau ASC (1 -> 4)
	 * 2. Chapitre in predefined order (Matérialité -> Activité des Pièces -> Sécurité du Roi -> Structure de Pions -> Combination)
	 * 3. Ordre (menu_order ASC)
	 *
	 * @param array<string, string> $clauses Query clauses.
	 * @param \WP_Query             $query Query object.
	 * @return array<string, string> Updated clauses.
	 */
	public function trier_liste_cours_defaut( array $clauses, \WP_Query $query ): array {
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return $clauses;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'roi_cours' === $query->get( 'post_type' ) && ! isset( $_GET['orderby'] ) ) {
			global $wpdb;

			$clauses['join'] .= " LEFT JOIN {$wpdb->postmeta} AS pm_lvl ON ({$wpdb->posts}.ID = pm_lvl.post_id AND pm_lvl.meta_key = '_roi_cours_niveau') ";
			$clauses['join'] .= " LEFT JOIN {$wpdb->term_relationships} AS tr ON ({$wpdb->posts}.ID = tr.object_id) ";
			$clauses['join'] .= " LEFT JOIN {$wpdb->term_taxonomy} AS tt ON (tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'roi_chapitre') ";
			$clauses['join'] .= " LEFT JOIN {$wpdb->terms} AS t ON (tt.term_id = t.term_id) ";

			$clauses['groupby'] = "{$wpdb->posts}.ID";

			$chapitre_order = "'Matérialité', 'Activité des Pièces', 'Sécurité du Roi', 'Structure de Pions', 'Combination'";

			$clauses['orderby'] = " CAST(COALESCE(pm_lvl.meta_value, '1') AS SIGNED) ASC, FIELD(t.name, {$chapitre_order}) ASC, {$wpdb->posts}.menu_order ASC, {$wpdb->posts}.post_title ASC ";
		}

		return $clauses;
	}
}
