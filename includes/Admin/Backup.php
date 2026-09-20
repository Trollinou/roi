<?php
/**
 * Backup and Restore of learning content.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin;

use WP_Query;

/**
 * Class Backup
 * Manages backup generation, backup restoring, and rendering the backup page.
 */
class Backup {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_menu', array( $this, 'add_backup_restore_page' ), 20 );
		add_action( 'admin_init', array( $this, 'handle_backup_action' ) );
		add_action( 'admin_init', array( $this, 'handle_restore_action' ) );
		add_filter( 'dame_scheduled_backup_attachments', array( $this, 'add_to_dame_scheduled_backup' ), 10, 2 );
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

		$export_data = $this->get_apprentissage_export_data();
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

	/**
	 * Add the Backup/Restore page to the Apprentissage menu.
	 *
	 * @return void
	 */
	public function add_backup_restore_page(): void {
		add_submenu_page(
			'roi-apprentissage',
			__( 'Sauvegarde / Restauration', 'roi' ),
			__( 'Sauvegarde / Restauration', 'roi' ),
			'manage_options',
			'roi-backup-restore',
			array( $this, 'render_backup_restore_page' )
		);
	}

	/**
	 * Gathers all learning content data for export.
	 *
	 * @return array<string, mixed> The complete export data.
	 */
	public function get_apprentissage_export_data(): array {
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
	 * Handles the export of learning data.
	 *
	 * @return void
	 */
	public function handle_backup_action(): void {
		if ( ! isset( $_POST['roi_backup_action'], $_POST['roi_backup_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['roi_backup_nonce'] ) ), 'roi_backup_nonce_action' ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", 'roi' ) );
		}

		$export_data = $this->get_apprentissage_export_data();

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
	 * Handles the import of learning data with strict ID preservation (ISO).
	 *
	 * @return void
	 */
	public function handle_restore_action(): void {
		if ( ! isset( $_POST['roi_restore_action'], $_POST['roi_restore_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['roi_restore_nonce'] ) ), 'roi_restore_nonce_action' ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", 'roi' ) );
		}

		if ( ! isset( $_FILES['roi_restore_file'] ) || ! is_array( $_FILES['roi_restore_file'] ) || ! isset( $_FILES['roi_restore_file']['error'] ) || UPLOAD_ERR_OK !== $_FILES['roi_restore_file']['error'] ) {
			$this->add_admin_notice( __( 'Erreur lors du téléversement du fichier.', 'roi' ), 'error' );
			wp_safe_redirect( add_query_arg( 'page', 'roi-backup-restore', admin_url( 'admin.php' ) ) );
			exit;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$file = $_FILES['roi_restore_file'];

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$raw_content = file_get_contents( (string) $file['tmp_name'] );
		if ( false === $raw_content || '' === $raw_content ) {
			$this->add_admin_notice( __( 'Erreur lors de la lecture du fichier temporaire.', 'roi' ), 'error' );
			wp_safe_redirect( add_query_arg( 'page', 'roi-backup-restore', admin_url( 'admin.php' ) ) );
			exit;
		}

		// Try decompressing with gzuncompress (zlib) or gzdecode (gzip), or fallback to raw content if uncompressed.
		$json_data = @gzuncompress( $raw_content );
		if ( false === $json_data ) {
			$json_data = @gzdecode( $raw_content );
		}
		if ( false === $json_data ) {
			$json_data = $raw_content;
		}

		$import_data = json_decode( (string) $json_data, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $import_data ) || ( empty( $import_data['posts'] ) && empty( $import_data['terms'] ) && empty( $import_data['taxonomy_terms'] ) ) ) {
			$this->add_admin_notice( __( 'Le fichier téléversé ne contient pas de données de sauvegarde valides.', 'roi' ), 'error' );
			wp_safe_redirect( add_query_arg( 'page', 'roi-backup-restore', admin_url( 'admin.php' ) ) );
			exit;
		}

		global $wpdb;
		$post_types = array( 'roi_lecon', 'roi_exercice', 'roi_cours', 'roi_video', 'roi_partie' );
		$taxonomy   = 'roi_chapitre';

		// 1. PURGE EXISTING DATA.
		$placeholders = implode( ',', array_fill( 0, count( $post_types ), '%s' ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$posts_to_delete = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} WHERE post_type IN ({$placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$post_types
			)
		);
		if ( is_array( $posts_to_delete ) ) {
			foreach ( $posts_to_delete as $post_id ) {
				wp_delete_post( (int) $post_id, true );
			}
		}

		$existing_terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'fields'     => 'ids',
			)
		);
		if ( ! is_wp_error( $existing_terms ) && is_array( $existing_terms ) ) {
			foreach ( $existing_terms as $term_id ) {
				wp_delete_term( (int) $term_id, $taxonomy );
			}
		}

		// 2. RESTORE TAXONOMIES (Forcing IDs).
		$max_term_id      = 0;
		$max_tt_id        = 0;
		$terms_to_restore = $import_data['taxonomy_terms'][ $taxonomy ] ?? ( $import_data['terms'] ?? array() );

		if ( is_array( $terms_to_restore ) ) {
			foreach ( $terms_to_restore as $t ) {
				$term_id = (int) ( $t['term_id'] ?? 0 );
				$tt_id   = (int) ( $t['term_taxonomy_id'] ?? $term_id );
				if ( $term_id <= 0 ) {
					continue;
				}
				$max_term_id = max( $max_term_id, $term_id );
				$max_tt_id   = max( $max_tt_id, $tt_id );

				// Term check / insert.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$term_exists = $wpdb->get_var( $wpdb->prepare( "SELECT term_id FROM {$wpdb->terms} WHERE term_id = %d", $term_id ) );
				if ( ! $term_exists ) {
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->insert(
						$wpdb->terms,
						array(
							'term_id'    => $term_id,
							'name'       => (string) ( $t['name'] ?? '' ),
							'slug'       => (string) ( $t['slug'] ?? '' ),
							'term_group' => 0,
						)
					);
				} else {
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->update(
						$wpdb->terms,
						array(
							'name' => (string) ( $t['name'] ?? '' ),
							'slug' => (string) ( $t['slug'] ?? '' ),
						),
						array( 'term_id' => $term_id )
					);
				}

				// Term taxonomy check / insert.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$tt_exists = $wpdb->get_var( $wpdb->prepare( "SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy} WHERE term_taxonomy_id = %d", $tt_id ) );
				if ( ! $tt_exists ) {
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->insert(
						$wpdb->term_taxonomy,
						array(
							'term_taxonomy_id' => $tt_id,
							'term_id'          => $term_id,
							'taxonomy'         => $taxonomy,
							'description'      => (string) ( $t['description'] ?? '' ),
							'parent'           => (int) ( $t['parent'] ?? 0 ),
							'count'            => 0,
						)
					);
				} else {
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->update(
						$wpdb->term_taxonomy,
						array(
							'term_id'     => $term_id,
							'taxonomy'    => $taxonomy,
							'description' => (string) ( $t['description'] ?? '' ),
							'parent'      => (int) ( $t['parent'] ?? 0 ),
						),
						array( 'term_taxonomy_id' => $tt_id )
					);
				}

				// Term Meta.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
				$wpdb->delete( $wpdb->termmeta, array( 'term_id' => $term_id ) );
				if ( ! empty( $t['meta_data'] ) && is_array( $t['meta_data'] ) ) {
					foreach ( $t['meta_data'] as $mk => $mvals ) {
						if ( is_array( $mvals ) ) {
							foreach ( $mvals as $mv ) {
								add_term_meta( $term_id, (string) $mk, $mv, false );
							}
						} else {
							add_term_meta( $term_id, (string) $mk, $mvals, false );
						}
					}
				}
				clean_term_cache( $term_id, $taxonomy );
			}
		}

		// 3. RESTORE POSTS (Forcing exact IDs).
		$max_post_id      = 0;
		$posts_to_restore = $import_data['posts'] ?? array();

		if ( is_array( $posts_to_restore ) ) {
			foreach ( $posts_to_restore as $p ) {
				$pid = (int) ( $p['ID'] ?? 0 );

				if ( $pid <= 0 ) {
					// Fallback for legacy format without ID.
					$post_data = array(
						'post_title'   => (string) ( $p['post_title'] ?? '' ),
						'post_content' => (string) ( $p['post_content'] ?? '' ),
						'post_excerpt' => (string) ( $p['post_excerpt'] ?? '' ),
						'post_status'  => (string) ( $p['post_status'] ?? 'publish' ),
						'post_type'    => (string) ( $p['post_type'] ?? 'roi_lecon' ),
						'post_name'    => (string) ( $p['post_name'] ?? '' ),
					);
					$new_pid   = wp_insert_post( $post_data, true );
					if ( is_wp_error( $new_pid ) || ! is_int( $new_pid ) ) {
						continue;
					}
					$pid = $new_pid;
				} else {
					$max_post_id   = max( $max_post_id, $pid );
					$post_date     = ! empty( $p['post_date'] ) ? (string) $p['post_date'] : current_time( 'mysql' );
					$post_date_gmt = ! empty( $p['post_date_gmt'] ) ? (string) $p['post_date_gmt'] : get_gmt_from_date( $post_date );

					$post_data = array(
						'ID'                    => $pid,
						'post_author'           => (int) ( $p['post_author'] ?? get_current_user_id() ),
						'post_date'             => $post_date,
						'post_date_gmt'         => $post_date_gmt,
						'post_content'          => (string) ( $p['post_content'] ?? '' ),
						'post_title'            => (string) ( $p['post_title'] ?? '' ),
						'post_excerpt'          => (string) ( $p['post_excerpt'] ?? '' ),
						'post_status'           => (string) ( $p['post_status'] ?? 'publish' ),
						'comment_status'        => 'closed',
						'ping_status'           => 'closed',
						'post_name'             => (string) ( $p['post_name'] ?? '' ),
						'post_modified'         => $post_date,
						'post_modified_gmt'     => $post_date_gmt,
						'post_parent'           => (int) ( $p['post_parent'] ?? 0 ),
						'menu_order'            => (int) ( $p['menu_order'] ?? 0 ),
						'post_type'             => (string) ( $p['post_type'] ?? 'roi_lecon' ),
						'post_content_filtered' => '',
						'to_ping'               => '',
						'pinged'                => '',
						'guid'                  => '',
					);

					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
					$post_exists = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE ID = %d", $pid ) );
					if ( ! $post_exists ) {
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
						$wpdb->insert( $wpdb->posts, $post_data );
					} else {
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
						$wpdb->update( $wpdb->posts, $post_data, array( 'ID' => $pid ) );
					}
				}

				// Clean and restore postmeta directly to preserve exact JSON strings and avoid unslashing artifacts.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
				$wpdb->delete( $wpdb->postmeta, array( 'post_id' => $pid ) );

				$raw_meta_pairs = array();
				if ( ! empty( $p['meta_data'] ) && is_array( $p['meta_data'] ) ) {
					foreach ( $p['meta_data'] as $k => $vals ) {
						if ( is_array( $vals ) ) {
							foreach ( $vals as $v ) {
								$raw_meta_pairs[] = array(
									'key'   => (string) $k,
									'value' => $v,
								);
							}
						} else {
							$raw_meta_pairs[] = array(
								'key'   => (string) $k,
								'value' => $vals,
							);
						}
					}
				} elseif ( ! empty( $p['meta_input'] ) && is_array( $p['meta_input'] ) ) {
					// Legacy fallback.
					foreach ( $p['meta_input'] as $k => $v ) {
						$raw_meta_pairs[] = array(
							'key'   => (string) $k,
							'value' => $v,
						);
					}
				}

				foreach ( $raw_meta_pairs as $meta_pair ) {
					$meta_k = $meta_pair['key'];
					$meta_v = $meta_pair['value'];

					// Specific handling for JSON fields: ensure valid JSON string and prevent PHP serialization.
					if ( in_array( $meta_k, array( '_roi_exercice_config', '_roi_cours_playlist' ), true ) ) {
						if ( is_array( $meta_v ) || is_object( $meta_v ) ) {
							$meta_v = wp_json_encode( $meta_v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
						} elseif ( is_string( $meta_v ) ) {
							$unserialized = maybe_unserialize( $meta_v );
							if ( is_array( $unserialized ) || is_object( $unserialized ) ) {
								$meta_v = wp_json_encode( $unserialized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
							}
						}
						$db_value = is_string( $meta_v ) ? $meta_v : (string) wp_json_encode( $meta_v );
					} else {
						$db_value = ( is_array( $meta_v ) || is_object( $meta_v ) ) ? maybe_serialize( $meta_v ) : (string) $meta_v;
					}

					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->insert(
						$wpdb->postmeta,
						array(
							'post_id'    => $pid,
							'meta_key'   => $meta_k,
							'meta_value' => $db_value,
						)
					);
				}

				// Restore taxonomy relationships.
				if ( ! empty( $p['taxonomies'] ) && is_array( $p['taxonomies'] ) ) {
					foreach ( $p['taxonomies'] as $tax => $slugs ) {
						wp_set_object_terms( $pid, (array) $slugs, (string) $tax );
					}
				} elseif ( ! empty( $p['tax_input'] ) && is_array( $p['tax_input'] ) ) {
					// Legacy fallback.
					foreach ( $p['tax_input'] as $tax => $slugs ) {
						wp_set_object_terms( $pid, (array) $slugs, (string) $tax );
					}
				}

				clean_post_cache( $pid );
			}
		}

		// 4. REALIGN AUTO_INCREMENT.
		if ( $max_post_id > 0 ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( $wpdb->prepare( "ALTER TABLE {$wpdb->posts} AUTO_INCREMENT = %d", $max_post_id + 1 ) );
		}
		if ( $max_term_id > 0 ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( $wpdb->prepare( "ALTER TABLE {$wpdb->terms} AUTO_INCREMENT = %d", $max_term_id + 1 ) );
		}
		if ( $max_tt_id > 0 ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query( $wpdb->prepare( "ALTER TABLE {$wpdb->term_taxonomy} AUTO_INCREMENT = %d", $max_tt_id + 1 ) );
		}

		// 5. RESTORE OPTIONS.
		if ( ! empty( $import_data['options'] ) && is_array( $import_data['options'] ) ) {
			if ( isset( $import_data['options']['roi_apprentissage_allowed_roles'] ) ) {
				update_option( 'roi_apprentissage_allowed_roles', $import_data['options']['roi_apprentissage_allowed_roles'] );
			}
		}

		// 6. RESTORE USER PROGRESSIONS.
		if ( ! empty( $import_data['user_progress'] ) && is_array( $import_data['user_progress'] ) ) {
			foreach ( $import_data['user_progress'] as $prog ) {
				$target_user_id = 0;
				if ( ! empty( $prog['user_email'] ) ) {
					$user = get_user_by( 'email', (string) $prog['user_email'] );
					if ( $user ) {
						$target_user_id = (int) $user->ID;
					}
				}
				if ( ! $target_user_id && ! empty( $prog['user_login'] ) ) {
					$user = get_user_by( 'login', (string) $prog['user_login'] );
					if ( $user ) {
						$target_user_id = (int) $user->ID;
					}
				}
				if ( ! $target_user_id && ! empty( $prog['user_id'] ) ) {
					$user = get_user_by( 'id', (int) $prog['user_id'] );
					if ( $user ) {
						$target_user_id = (int) $user->ID;
					}
				}

				if ( $target_user_id > 0 && ! empty( $prog['meta_key'] ) ) {
					$existing       = get_user_meta( $target_user_id, (string) $prog['meta_key'], false );
					$already_exists = false;
					if ( is_array( $existing ) ) {
						foreach ( $existing as $ex ) {
							if ( $ex === $prog['meta_value'] ) {
								$already_exists = true;
								break;
							}
						}
					}
					if ( ! $already_exists ) {
						add_user_meta( $target_user_id, (string) $prog['meta_key'], $prog['meta_value'], false );
					}
				}
			}
		}

		$this->add_admin_notice( __( "La restauration des données d'apprentissage a été effectuée avec succès (conservation stricte des identifiants ISO).", 'roi' ) );
		wp_safe_redirect( add_query_arg( 'page', 'roi-backup-restore', admin_url( 'admin.php' ) ) );
		exit;
	}

	/**
	 * Adds a transient-based admin notice.
	 *
	 * @param string $message The message.
	 * @param string $type    The type ('success', 'error', etc.).
	 * @return void
	 */
	private function add_admin_notice( string $message, string $type = 'success' ): void {
		$notices = get_transient( 'roi_admin_notices' );
		if ( ! is_array( $notices ) ) {
			$notices = array();
		}
		$notices[] = array(
			'message' => $message,
			'type'    => $type,
		);
		set_transient( 'roi_admin_notices', $notices, 30 );
	}

	/**
	 * Renders the backup/restore page.
	 *
	 * @return void
	 */
	public function render_backup_restore_page(): void {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

			<div class="roi-backup-restore-wrapper">

				<!-- Backup Section -->
				<div class="roi-backup-section" style="margin-bottom: 2em;">
					<h2><?php esc_html_e( 'Sauvegarder les données d\'apprentissage', 'roi' ); ?></h2>
					<p><?php esc_html_e( 'Cliquez sur le bouton ci-dessous pour télécharger une sauvegarde complète (leçons, exercices, cours, vidéos, parties, chapitres, configurations et progressions).', 'roi' ); ?></p>
					<form method="post" action="">
						<?php wp_nonce_field( 'roi_backup_nonce_action', 'roi_backup_nonce' ); ?>
						<?php submit_button( __( 'Sauvegarder la base de données', 'roi' ), 'primary', 'roi_backup_action', false ); ?>
					</form>
				</div>

				<hr>

				<!-- Restore Section -->
				<div class="roi-restore-section">
					<h2><?php esc_html_e( 'Restaurer les données d\'apprentissage', 'roi' ); ?></h2>
					<p><strong><span style="color: red;"><?php esc_html_e( 'Attention :', 'roi' ); ?></span></strong> <?php esc_html_e( "L'importation depuis un fichier de sauvegarde effacera et remplacera l'ensemble des données d'apprentissage existantes (leçons, exercices, cours, vidéos, parties et chapitres). Les identifiants (IDs) d'origine sont strictement préservés pour garantir la conformité ISO.", 'roi' ); ?></p>
					<form method="post" enctype="multipart/form-data" id="roi-restore-form" action="">
						<?php wp_nonce_field( 'roi_restore_nonce_action', 'roi_restore_nonce' ); ?>
						<p>
							<label for="roi_restore_file"><?php esc_html_e( 'Choisissez un fichier de sauvegarde (.json.gz ou .json) à importer :', 'roi' ); ?></label>
							<input type="file" id="roi_restore_file" name="roi_restore_file" accept=".gz,.json" required>
						</p>
						<?php submit_button( __( 'Restaurer la base de données', 'roi' ), 'delete', 'roi_restore_action' ); ?>
					</form>
				</div>

			</div>
			<script>
				document.addEventListener('DOMContentLoaded', function() {
					const restoreForm = document.getElementById('roi-restore-form');
					if (restoreForm) {
						restoreForm.addEventListener('submit', function(e) {
							if (!confirm("<?php echo esc_js( __( 'Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Toutes les données existantes du module seront remplacées en conservant les identifiants d\'origine. Cette action est irréversible.', 'roi' ) ); ?>")) {
								e.preventDefault();
							}
						});
					}
				});
			</script>
		</div>
		<?php
	}
}
