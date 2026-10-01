<?php
/**
 * Learning data import and restoration.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin\Backup;

use WP_Error;

/**
 * Class Importer
 * Handles file reading, decompression, validation, and restoration with strict ISO ID preservation.
 */
class Importer {

	/**
	 * Restores learning data from an uploaded file.
	 *
	 * @param array<string, mixed> $file The uploaded $_FILES item.
	 * @return true|WP_Error True on success or WP_Error on failure.
	 */
	public function restore_from_upload( array $file ): true|WP_Error {
		if ( ! isset( $file['error'] ) || UPLOAD_ERR_OK !== $file['error'] ) {
			return new WP_Error( 'upload_error', __( 'Erreur lors du téléversement du fichier.', 'roi' ) );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$raw_content = file_get_contents( (string) $file['tmp_name'] );
		if ( false === $raw_content || '' === $raw_content ) {
			return new WP_Error( 'read_error', __( 'Erreur lors de la lecture du fichier temporaire.', 'roi' ) );
		}

		// Try decompressing with gzuncompress (zlib) or gzdecode (gzip), or fallback to raw content.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$json_data = @gzuncompress( $raw_content );
		if ( false === $json_data ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$json_data = @gzdecode( $raw_content );
		}
		if ( false === $json_data ) {
			$json_data = $raw_content;
		}

		$import_data = json_decode( (string) $json_data, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $import_data ) || ( empty( $import_data['posts'] ) && empty( $import_data['terms'] ) && empty( $import_data['taxonomy_terms'] ) ) ) {
			return new WP_Error( 'invalid_data', __( 'Le fichier téléversé ne contient pas de données de sauvegarde valides.', 'roi' ) );
		}

		$this->execute_restoration( $import_data );
		return true;
	}

	/**
	 * Executes the database purge and restoration of posts, taxonomies, options, and progress.
	 *
	 * @param array<string, mixed> $import_data Parsed backup payload.
	 * @return void
	 */
	private function execute_restoration( array $import_data ): void {
		global $wpdb;
		$post_types = array( 'roi_lecon', 'roi_exercice', 'roi_cours', 'roi_video', 'roi_partie' );
		$taxonomy   = 'roi_chapitre';

		// 1. PURGE EXISTING DATA.
		$placeholders = implode( ',', array_fill( 0, count( $post_types ), '%s' ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$posts_to_delete = $wpdb->get_col(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
				"SELECT ID FROM {$wpdb->posts} WHERE post_type IN ($placeholders)",
				...$post_types
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

				// Clean and restore postmeta directly.
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
				}

				foreach ( $raw_meta_pairs as $meta_pair ) {
					$meta_k = $meta_pair['key'];
					$meta_v = $meta_pair['value'];

					if ( in_array( $meta_k, array( '_roi_exercice_config', '_roi_cours_playlist' ), true ) ) {
						$parsed_json = null;
						if ( is_array( $meta_v ) || is_object( $meta_v ) ) {
							$parsed_json = (array) $meta_v;
						} elseif ( is_string( $meta_v ) && '' !== trim( $meta_v ) ) {
							$unserialized = maybe_unserialize( $meta_v );
							if ( is_array( $unserialized ) || is_object( $unserialized ) ) {
								$parsed_json = (array) $unserialized;
							} else {
								$decoded = json_decode( $meta_v, true );
								while ( is_string( $decoded ) ) {
									$sub = json_decode( $decoded, true );
									if ( json_last_error() === JSON_ERROR_NONE ) {
										$decoded = $sub;
									} else {
										break;
									}
								}
								if ( is_array( $decoded ) ) {
									$parsed_json = $decoded;
								}
							}
						}

						if ( is_array( $parsed_json ) ) {
							$db_value = (string) wp_json_encode( $parsed_json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
						} else {
							$db_value = is_string( $meta_v ) ? $meta_v : (string) wp_json_encode( $meta_v );
						}
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
				}

				wp_cache_delete( $pid, 'posts' );
				wp_cache_delete( $pid, 'post_meta' );
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

		wp_cache_flush();
	}
}
