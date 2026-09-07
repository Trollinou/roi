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
		foreach ( array( 'roi_exercice', 'roi_lecon', 'roi_cours', 'roi_video' ) as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", array( $this, 'ajouter_colonnes' ) );
			add_action( "manage_{$post_type}_posts_custom_column", array( $this, 'afficher_colonnes' ), 10, 2 );
			add_filter( "manage_edit-{$post_type}_sortable_columns", array( $this, 'colonnes_triables' ) );
		}
		add_filter( 'request', array( $this, 'trier_colonnes' ) );
		add_filter( 'posts_clauses', array( $this, 'trier_liste_cours_defaut' ), 10, 2 );
		add_filter( 'views_edit-roi_cours', array( $this, 'ajouter_onglets_audience' ) );
		add_action( 'pre_get_posts', array( $this, 'filtrer_requete_audience' ) );
		add_action( 'restrict_manage_posts', array( $this, 'filtrer_dropdown_audience' ) );
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
					$new_columns['roi_audience'] = __( 'Audience', 'roi' );
					$new_columns['roi_ordre']    = __( 'Ordre', 'roi' );
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
			} elseif ( 'roi_video' === $post_type ) {
				$meta_key = '_roi_video_niveau';
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

		if ( 'roi_audience' === $column ) {
			$audience_type = (string) get_post_meta( $post_id, '_roi_cours_audience_type', true );
			if ( empty( $audience_type ) || 'all' === $audience_type ) {
				echo '<span title="' . esc_attr__( 'Méthode École d\'Échecs à la Française', 'roi' ) . '" style="display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; background:#e7f3ff; color:#0073aa; border:1px solid #cce5ff;">📚 EEF</span>';
				return;
			}

			echo '<div style="line-height: 1.4;">';
			echo '<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; background:#fcf0f0; color:#b32d2e; border:1px solid #f5c6cb; margin-bottom:4px;">📌 ' . esc_html__( 'Assigné', 'roi' ) . '</span>';

			// Groupes ciblés.
			$raw_groups = get_post_meta( $post_id, '_roi_cours_target_groups', true );
			$groups     = is_string( $raw_groups ) ? json_decode( $raw_groups, true ) : array();
			if ( is_array( $groups ) && ! empty( $groups ) ) {
				echo '<div style="margin-top:2px; font-size:11px; color:#50575e;">';
				foreach ( $groups as $gid ) {
					$term = get_term( (int) $gid, 'dame_group' );
					if ( $term instanceof \WP_Term ) {
						echo '<span style="display:inline-block; background:#f0f0f1; border-radius:3px; padding:1px 5px; margin-right:3px; margin-bottom:2px;">👥 ' . esc_html( $term->name ) . '</span>';
					}
				}
				echo '</div>';
			}

			// Élèves ciblés.
			$raw_members = get_post_meta( $post_id, '_roi_cours_target_members', true );
			$members     = is_string( $raw_members ) ? json_decode( $raw_members, true ) : array();
			if ( is_array( $members ) && ! empty( $members ) ) {
				$names = array();
				foreach ( $members as $mid ) {
					$prenom = (string) ( get_post_meta( (int) $mid, '_dame_first_name', true ) ?: get_post_meta( (int) $mid, '_dame_prenom', true ) );
					$nom    = (string) ( get_post_meta( (int) $mid, '_dame_last_name', true ) ?: ( get_post_meta( (int) $mid, '_dame_birth_name', true ) ?: get_post_meta( (int) $mid, '_dame_nom', true ) ) );
					$label  = trim( $prenom . ' ' . $nom );
					if ( empty( $label ) ) {
						$p     = get_post( (int) $mid );
						$label = $p ? $p->post_title : '#' . $mid;
					}
					$names[] = $label;
				}

				$count = count( $names );
				echo '<div style="margin-top:2px; font-size:11px; color:#2c3338;">';
				if ( $count <= 2 ) {
					foreach ( $names as $n ) {
						echo '<span style="display:inline-block; background:#edf7ed; color:#1e4620; border-radius:3px; padding:1px 5px; margin-right:3px; margin-bottom:2px;">👤 ' . esc_html( $n ) . '</span>';
					}
				} else {
					$summary = sprintf( esc_html__( '%d élèves', 'roi' ), $count );
					$tooltip = implode( ', ', $names );
					echo '<span title="' . esc_attr( $tooltip ) . '" style="display:inline-block; background:#edf7ed; color:#1e4620; border-radius:3px; padding:1px 5px; cursor:help; font-weight:600;">👤 ' . esc_html( $summary ) . ' ℹ️</span>';
				}
				echo '</div>';
			}

			if ( ( empty( $groups ) || ! is_array( $groups ) ) && ( empty( $members ) || ! is_array( $members ) ) ) {
				echo '<div style="font-size:10px; color:#8c8f94; font-style:italic;">' . esc_html__( 'Aucune cible définie', 'roi' ) . '</div>';
			}

			echo '</div>';
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
			} elseif ( 'roi_video' === $post_type ) {
				$meta_key = '_roi_video_niveau';
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

	/**
	 * Adds audience view tabs to edit.php?post_type=roi_cours.
	 *
	 * @param array<string, string> $views Existing views.
	 * @return array<string, string> Updated views.
	 */
	public function ajouter_onglets_audience( array $views ): array {
		global $wpdb;

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$current = isset( $_GET['roi_audience'] ) ? sanitize_key( (string) $_GET['roi_audience'] ) : '';

		$total_cours = (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'roi_cours' AND post_status NOT IN ('trash', 'auto-draft')"
		);

		$assigned_cours = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT p.ID) 
			 FROM {$wpdb->posts} p
			 INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
			 WHERE p.post_type = 'roi_cours'
			   AND p.post_status NOT IN ('trash', 'auto-draft')
			   AND pm.meta_key = '_roi_cours_audience_type'
			   AND pm.meta_value = 'restricted'"
		);

		$eef_cours = max( 0, $total_cours - $assigned_cours );

		$base_url = admin_url( 'edit.php?post_type=roi_cours' );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['post_status'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$base_url = add_query_arg( 'post_status', sanitize_key( (string) $_GET['post_status'] ), $base_url );
		}

		$class_all      = ( '' === $current ) ? ' class="current"' : '';
		$class_eef      = ( 'eef' === $current ) ? ' class="current"' : '';
		$class_assigned = ( 'restricted' === $current ) ? ' class="current"' : '';

		$custom_views = array(
			'all_audience' => sprintf(
				'<a href="%s"%s>%s <span class="count">(%d)</span></a>',
				esc_url( remove_query_arg( 'roi_audience', $base_url ) ),
				$class_all,
				esc_html__( 'Tous les cours', 'roi' ),
				$total_cours
			),
			'eef'          => sprintf(
				'<a href="%s"%s title="%s">%s <span class="count">(%d)</span></a>',
				esc_url( add_query_arg( 'roi_audience', 'eef', $base_url ) ),
				$class_eef,
				esc_attr__( 'Méthode École d\'Échecs à la Française', 'roi' ),
				'📚 EEF',
				$eef_cours
			),
			'restricted'   => sprintf(
				'<a href="%s"%s>%s <span class="count">(%d)</span></a>',
				esc_url( add_query_arg( 'roi_audience', 'restricted', $base_url ) ),
				$class_assigned,
				'📌 ' . esc_html__( 'Cours assignés', 'roi' ),
				$assigned_cours
			),
		);

		// Si une vue d'audience spécifique est sélectionnée, retirer la classe 'current' de la vue 'all' de base.
		if ( '' !== $current && isset( $views['all'] ) ) {
			$views['all'] = str_replace( 'class="current"', '', $views['all'] );
			$views['all'] = str_replace( "class='current'", '', $views['all'] );
		}

		return array_merge( $custom_views, $views );
	}

	/**
	 * Filters query in WP_List_Table for roi_cours audience.
	 *
	 * @param \WP_Query $query Main query.
	 * @return void
	 */
	public function filtrer_requete_audience( \WP_Query $query ): void {
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}

		$post_type = $query->get( 'post_type' );
		if ( 'roi_cours' !== $post_type ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$audience = isset( $_GET['roi_audience'] ) ? sanitize_key( (string) $_GET['roi_audience'] ) : '';
		if ( 'eef' === $audience ) {
			$raw_mq       = $query->get( 'meta_query' );
			$meta_query   = is_array( $raw_mq ) ? $raw_mq : array();
			$meta_query[] = array(
				'relation' => 'OR',
				array(
					'key'     => '_roi_cours_audience_type',
					'value'   => 'all',
					'compare' => '=',
				),
				array(
					'key'     => '_roi_cours_audience_type',
					'compare' => 'NOT EXISTS',
				),
			);
			$query->set( 'meta_query', $meta_query );
		} elseif ( 'restricted' === $audience ) {
			$raw_mq       = $query->get( 'meta_query' );
			$meta_query   = is_array( $raw_mq ) ? $raw_mq : array();
			$meta_query[] = array(
				'key'     => '_roi_cours_audience_type',
				'value'   => 'restricted',
				'compare' => '=',
			);
			$query->set( 'meta_query', $meta_query );
		}
	}

	/**
	 * Displays audience dropdown filter in restrict_manage_posts.
	 *
	 * @param string $post_type Current post type.
	 * @return void
	 */
	public function filtrer_dropdown_audience( string $post_type ): void {
		if ( 'roi_cours' !== $post_type ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$current = isset( $_GET['roi_audience'] ) ? sanitize_key( (string) $_GET['roi_audience'] ) : '';
		?>
		<select name="roi_audience">
			<option value=""><?php esc_html_e( 'Toutes les audiences', 'roi' ); ?></option>
			<option value="eef" <?php selected( $current, 'eef' ); ?>><?php esc_html_e( '📚 EEF (Tronc commun)', 'roi' ); ?></option>
			<option value="restricted" <?php selected( $current, 'restricted' ); ?>><?php esc_html_e( '📌 Cours assignés', 'roi' ); ?></option>
		</select>
		<?php
	}
}
