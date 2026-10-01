<?php
/**
 * Learning data export and backup generation.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin\Backup;

/**
 * Class Exporter
 * Handles gathering, serializing and downloading learning content backup.
 */
class Exporter {

	/**
	 * Gathers all learning content data for export.
	 *
	 * @return array<string, mixed> The complete export data.
	 */
	public function get_export_data(): array {
		global $wpdb;

		$post_types = array( 'roi_lecon', 'roi_exercice', 'roi_cours', 'roi_video', 'roi_partie' );
		$taxonomy   = 'roi_chapitre';

		$export_data = array(
			'version'        => defined( 'ROI_VERSION' ) ? ROI_VERSION : '1.0.0',
			'posts'          => array(),
			'terms'          => array(),
			'taxonomy_terms' => array(
				$taxonomy => array(),
			),
			'options'        => array(),
			'user_progress'  => array(),
		);

		// 1. Export Terms with Term Meta.
		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
			)
		);

		if ( ! is_wp_error( $terms ) && is_array( $terms ) ) {
			foreach ( $terms as $term ) {
				$term_meta = get_term_meta( (int) $term->term_id );
				$meta_data = array();
				if ( is_array( $term_meta ) ) {
					foreach ( $term_meta as $mk => $mvals ) {
						$meta_data[ $mk ] = array_map( 'maybe_unserialize', $mvals );
					}
				}

				$term_entry = array(
					'term_id'          => (int) $term->term_id,
					'term_taxonomy_id' => (int) $term->term_taxonomy_id,
					'name'             => (string) $term->name,
					'slug'             => (string) $term->slug,
					'description'      => (string) $term->description,
					'parent'           => (int) $term->parent,
					'meta_data'        => $meta_data,
				);

				$export_data['terms'][]                       = $term_entry;
				$export_data['taxonomy_terms'][ $taxonomy ][] = $term_entry;
			}
		}

		// 2. Export Posts with Meta and Taxonomies.
		$posts = get_posts(
			array(
				'post_type'      => $post_types,
				'posts_per_page' => -1,
				'post_status'    => 'any',
			)
		);

		if ( ! empty( $posts ) ) {
			update_meta_cache( 'post', wp_list_pluck( $posts, 'ID' ) );

			foreach ( $posts as $p ) {
				$meta          = array();
				$post_meta_raw = get_post_meta( (int) $p->ID );
				if ( is_array( $post_meta_raw ) ) {
					foreach ( $post_meta_raw as $k => $vals ) {
						$meta[ $k ] = array_map( 'maybe_unserialize', $vals );
					}
				}

				$tax_relationships = array();
				$post_terms        = wp_get_post_terms( (int) $p->ID, $taxonomy, array( 'fields' => 'slugs' ) );
				if ( ! is_wp_error( $post_terms ) && ! empty( $post_terms ) ) {
					$tax_relationships[ $taxonomy ] = $post_terms;
				}

				$export_data['posts'][] = array(
					'ID'            => (int) $p->ID,
					'post_author'   => (int) $p->post_author,
					'post_date'     => (string) $p->post_date,
					'post_date_gmt' => (string) $p->post_date_gmt,
					'post_content'  => (string) $p->post_content,
					'post_title'    => (string) $p->post_title,
					'post_excerpt'  => (string) $p->post_excerpt,
					'post_status'   => (string) $p->post_status,
					'post_name'     => (string) $p->post_name,
					'post_parent'   => (int) $p->post_parent,
					'menu_order'    => (int) $p->menu_order,
					'post_type'     => (string) $p->post_type,
					'meta_data'     => $meta,
					'taxonomies'    => $tax_relationships,
				);
			}
		}

		// 3. Export Plugin Options.
		$export_data['options']['roi_apprentissage_allowed_roles'] = get_option( 'roi_apprentissage_allowed_roles', array() );

		// 4. Export Student Progressions.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$progress_rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT u.ID as user_id, u.user_login, u.user_email, um.meta_key, um.meta_value
				 FROM {$wpdb->users} u
				 INNER JOIN {$wpdb->usermeta} um ON u.ID = um.user_id
				 WHERE um.meta_key LIKE %s",
				$wpdb->esc_like( '_roi_element_valide' ) . '%'
			)
		);

		if ( is_array( $progress_rows ) ) {
			foreach ( $progress_rows as $row ) {
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key, WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- Backup extraction.
				$export_data['user_progress'][] = array(
					'user_id'    => (int) $row->user_id,
					'user_login' => (string) $row->user_login,
					'user_email' => (string) $row->user_email,
					'meta_key'   => (string) $row->meta_key,
					'meta_value' => maybe_unserialize( $row->meta_value ),
				);
			}
		}

		return $export_data;
	}

	/**
	 * Exports the learning data as a compressed GZ download to the browser.
	 *
	 * @return void
	 */
	public function download_export_gz(): void {
		$export_data      = $this->get_export_data();
		$filename         = 'roi-apprentissage-backup-' . wp_date( 'Y-m-d' ) . '.json.gz';
		$data_to_compress = wp_json_encode( $export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
		$compressed_data  = gzcompress( (string) $data_to_compress );

		if ( false === $compressed_data ) {
			wp_die( esc_html__( 'Erreur lors de la compression des données.', 'roi' ) );
		}

		ob_clean();
		header( 'Content-Type: application/octet-stream' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		header( 'Content-Length: ' . strlen( $compressed_data ) );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $compressed_data;
		exit;
	}

	/**
	 * Automatically attaches ROI backup to DAME's scheduled daily backup email.
	 *
	 * @param array<int, string> $attachments List of attachments paths.
	 * @param string             $backup_dir  Temporary backup directory.
	 * @return array<int, string> Updated list of attachments.
	 */
	public function add_to_dame_scheduled_backup( array $attachments, string $backup_dir ): array {
		global $wp_filesystem;
		if ( empty( $wp_filesystem ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
		}

		$export_data = $this->get_export_data();
		$filename    = 'roi-apprentissage-backup-' . wp_date( 'Y-m-d' ) . '.json.gz';
		$file_roi    = trailingslashit( $backup_dir ) . $filename;
		$compressed  = gzcompress( (string) wp_json_encode( $export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) );

		if ( false !== $compressed && $wp_filesystem ) {
			$written = $wp_filesystem->put_contents( $file_roi, $compressed );
			if ( $written ) {
				$attachments[] = $file_roi;
			}
		}

		return $attachments;
	}
}
