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
		foreach ( [ 'roi_exercice', 'roi_lecon', 'roi_cours' ] as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", [ $this, 'ajouter_colonnes' ] );
			add_action( "manage_{$post_type}_posts_custom_column", [ $this, 'afficher_colonnes' ], 10, 2 );
			add_filter( "manage_edit-{$post_type}_sortable_columns", [ $this, 'colonnes_triables' ] );
		}
		add_filter( 'request', [ $this, 'trier_colonnes' ] );
	}

	/**
	 * Inserts custom columns.
	 *
	 * @param array<string, string> $columns Default columns.
	 * @return array<string, string> Customized columns.
	 */
	public function ajouter_colonnes( array $columns ): array {
		global $post_type;
		$new_columns = [];
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
	 * @param int $post_id Post ID.
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
				$term = reset( $terms );
				$color = get_term_meta( $term->term_id, '_roi_chapitre_couleur', true );
				$color_palette = [
					'primary'  => '#0073aa',
					'warning'  => '#d94f00',
					'danger'   => '#d63638',
					'success'  => '#00a32a',
					'tertiary' => '#8224e3',
				];
				$hex = $color_palette[ $color ] ?? '#666';

				echo sprintf(
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
	 * @param array $vars Query variables.
	 * @return array Query variables.
	 */
	public function trier_colonnes( array $vars ): array {
		if ( isset( $vars['orderby'] ) && 'roi_niveau' === $vars['orderby'] ) {
			$post_type = $vars['post_type'] ?? '';
			$meta_key = '';
			if ( 'roi_exercice' === $post_type ) {
				$meta_key = '_roi_exercice_niveau';
			} elseif ( 'roi_lecon' === $post_type ) {
				$meta_key = '_roi_lecon_niveau';
			} elseif ( 'roi_cours' === $post_type ) {
				$meta_key = '_roi_cours_niveau';
			}

			if ( $meta_key ) {
				$vars = array_merge( $vars, [
					'meta_key' => $meta_key,
					'orderby'  => 'meta_value_num',
				] );
			}
		}
		return $vars;
	}
}
