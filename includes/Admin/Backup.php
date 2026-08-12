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
		add_action( 'admin_menu', array( $this, 'add_backup_restore_page' ) );
		add_action( 'admin_init', array( $this, 'handle_backup_action' ) );
		add_action( 'admin_init', array( $this, 'handle_restore_action' ) );
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
		$post_types = array( 'roi_lecon', 'roi_exercice', 'roi_cours' );
		$taxonomy   = 'roi_chapitre';

		$export_data = array(
			'posts' => array(),
			'terms' => array(),
		);

		// Export terms
		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
			)
		);

		if ( is_array( $terms ) ) {
			foreach ( $terms as $term ) {
				$export_data['terms'][] = array(
					'term_id'     => $term->term_id,
					'name'        => $term->name,
					'slug'        => $term->slug,
					'description' => $term->description,
					'parent'      => $term->parent,
				);
			}
		}

		// Export posts
		$posts_query = new WP_Query(
			array(
				'post_type'      => $post_types,
				'posts_per_page' => -1,
				'post_status'    => 'any',
			)
		);

		if ( $posts_query->have_posts() ) {
			while ( $posts_query->have_posts() ) {
				$posts_query->the_post();
				$post_id   = get_the_ID();
				$post_data = array(
					'post_title'   => get_the_title(),
					'post_content' => get_the_content(),
					'post_excerpt' => get_the_excerpt(),
					'post_status'  => get_post_status(),
					'post_type'    => get_post_type(),
					'post_name'    => get_post_field( 'post_name' ),
					'meta_input'   => array(),
					'tax_input'    => array(),
				);

				$meta = get_post_meta( $post_id );
				if ( is_array( $meta ) ) {
					foreach ( $meta as $key => $value ) {
						$post_data['meta_input'][ $key ] = maybe_unserialize( $value[0] );
					}
				}

				$post_terms = wp_get_post_terms( $post_id, $taxonomy, array( 'fields' => 'slugs' ) );
				if ( ! is_wp_error( $post_terms ) && is_array( $post_terms ) ) {
					$post_data['tax_input'][ $taxonomy ] = $post_terms;
				}

				$export_data['posts'][] = $post_data;
			}
			wp_reset_postdata();
		}

		return $export_data;
	}

	/**
	 * Handles the export of learning data.
	 *
	 * @return void
	 */
	public function handle_backup_action(): void {
		if ( ! isset( $_POST['roi_backup_action'] ) || ! isset( $_POST['roi_backup_nonce'] ) || ! wp_verify_nonce( $_POST['roi_backup_nonce'], 'roi_backup_nonce_action' ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", 'roi' ) );
		}

		$export_data = $this->get_apprentissage_export_data();

		$filename         = 'roi-apprentissage-backup-' . date( 'Y-m-d' ) . '.json.gz';
		$data_to_compress = json_encode( $export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
		$compressed_data  = gzcompress( $data_to_compress );

		if ( false === $compressed_data ) {
			wp_die( esc_html__( 'Erreur lors de la compression des données.', 'roi' ) );
		}

		ob_clean();
		header( 'Content-Type: application/octet-stream' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		header( 'Content-Length: ' . strlen( $compressed_data ) );
		echo $compressed_data;
		exit;
	}

	/**
	 * Handles the import of learning data.
	 *
	 * @return void
	 */
	public function handle_restore_action(): void {
		if ( ! isset( $_POST['roi_restore_action'] ) || ! isset( $_POST['roi_restore_nonce'] ) || ! wp_verify_nonce( $_POST['roi_restore_nonce'], 'roi_restore_nonce_action' ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( "Vous n'avez pas la permission d'effectuer cette action.", 'roi' ) );
		}

		if ( ! isset( $_FILES['roi_restore_file'] ) || $_FILES['roi_restore_file']['error'] !== UPLOAD_ERR_OK ) {
			$this->add_admin_notice( __( 'Erreur lors du téléversement du fichier.', 'roi' ), 'error' );
			return;
		}

		$file            = $_FILES['roi_restore_file'];
		$filename        = $file['name'];
		$file_ext        = pathinfo( $filename, PATHINFO_EXTENSION );
		$file_ext_double = pathinfo( str_replace( '.gz', '', $filename ), PATHINFO_EXTENSION );

		if ( $file_ext !== 'gz' || $file_ext_double !== 'json' ) {
			$this->add_admin_notice( __( "Le fichier téléversé n'est pas une sauvegarde valide (format .json.gz attendu).", 'roi' ), 'error' );
			return;
		}

		$compressed_data = file_get_contents( $file['tmp_name'] );
		if ( false === $compressed_data ) {
			$this->add_admin_notice( __( 'Erreur lors de la lecture du fichier temporaire.', 'roi' ), 'error' );
			return;
		}

		$json_data = gzuncompress( $compressed_data );
		if ( false === $json_data ) {
			$this->add_admin_notice( __( 'Erreur lors de la décompression du fichier.', 'roi' ), 'error' );
			return;
		}

		$import_data = json_decode( $json_data, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			$this->add_admin_notice( __( 'Erreur lors de la lecture des données JSON.', 'roi' ), 'error' );
			return;
		}

		// Clear existing data
		$post_types = array( 'roi_lecon', 'roi_exercice', 'roi_cours' );
		$taxonomy   = 'roi_chapitre';

		$existing_posts = get_posts(
			array(
				'post_type'      => $post_types,
				'posts_per_page' => -1,
				'fields'         => 'ids',
			)
		);
		foreach ( $existing_posts as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		$existing_terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'fields'     => 'ids',
			)
		);
		if ( is_array( $existing_terms ) ) {
			foreach ( $existing_terms as $term_id ) {
				wp_delete_term( (int) $term_id, $taxonomy );
			}
		}

		// Import terms
		$term_map = array();
		if ( ! empty( $import_data['terms'] ) ) {
			foreach ( $import_data['terms'] as $term_data ) {
				$new_term = wp_insert_term(
					$term_data['name'],
					$taxonomy,
					array(
						'slug'        => $term_data['slug'],
						'description' => $term_data['description'],
						'parent'      => 0,
					)
				);
				if ( ! is_wp_error( $new_term ) ) {
					$term_map[ $term_data['term_id'] ] = $new_term['term_id'];
				}
			}

			// Update term parents
			foreach ( $import_data['terms'] as $term_data ) {
				if ( $term_data['parent'] && isset( $term_map[ $term_data['term_id'] ], $term_map[ $term_data['parent'] ] ) ) {
					wp_update_term(
						$term_map[ $term_data['term_id'] ],
						$taxonomy,
						array(
							'parent' => $term_map[ $term_data['parent'] ],
						)
					);
				}
			}
		}

		// Import posts
		if ( ! empty( $import_data['posts'] ) ) {
			foreach ( $import_data['posts'] as $post_data ) {
				wp_insert_post( $post_data, true );
			}
		}

		$this->add_admin_notice( __( "La restauration des données d'apprentissage a été effectuée avec succès.", 'roi' ) );
	}

	/**
	 * Adds a transient-based admin notice.
	 *
	 * @param string $message The message.
	 * @param string $type    The type ('success', 'error', etc.)
	 * @return void
	 */
	private function add_admin_notice( string $message, string $type = 'success' ): void {
		$transient_name = 'roi_admin_notice_' . md5( $message );
		set_transient(
			$transient_name,
			array(
				'message' => $message,
				'type'    => $type,
			),
			5
		);
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
					<p><?php esc_html_e( 'Cliquez sur le bouton ci-dessous pour télécharger une sauvegarde de toutes les leçons, exercices et cours, ainsi que leurs catégories.', 'roi' ); ?></p>
					<form method="post" action="">
						<?php wp_nonce_field( 'roi_backup_nonce_action', 'roi_backup_nonce' ); ?>
						<?php submit_button( __( 'Sauvegarder la base de données', 'roi' ), 'primary', 'roi_backup_action', false ); ?>
					</form>
				</div>

				<hr>

				<!-- Restore Section -->
				<div class="roi-restore-section">
					<h2><?php esc_html_e( 'Restaurer les données d\'apprentissage', 'roi' ); ?></h2>
					<p><strong><span style="color: red;"><?php esc_html_e( 'Attention :', 'roi' ); ?></span></strong> <?php esc_html_e( "L'importation depuis un fichier de sauvegarde effacera et remplacera TOUTES les données d'apprentissage existantes (leçons, exercices, cours et catégories). Assurez-vous d'avoir une sauvegarde si nécessaire.", 'roi' ); ?></p>
					<form method="post" enctype="multipart/form-data" id="roi-restore-form" action="">
						<?php wp_nonce_field( 'roi_restore_nonce_action', 'roi_restore_nonce' ); ?>
						<p>
							<label for="roi_restore_file"><?php esc_html_e( 'Choisissez un fichier de sauvegarde (.json.gz) à importer :', 'roi' ); ?></label>
							<input type="file" id="roi_restore_file" name="roi_restore_file" accept=".gz" required>
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
							if (!confirm("<?php echo esc_js( __( 'Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Toutes les leçons, exercices, cours et catégories existants seront supprimés et remplacés. Cette action est irréversible.', 'roi' ) ); ?>")) {
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
