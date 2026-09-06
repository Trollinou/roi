<?php
/**
 * Audience metabox for Cours CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Cours;

use WP_Post;
use WP_Term;

/**
 * Class Audience
 * Handles the audience and assignment targeting for Cours (all students vs assigned groups/members).
 */
class Audience {

	/**
	 * Constructor.
	 * Registers actions.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'enregistrer_meta' ) );
		add_action( 'add_meta_boxes', array( $this, 'ajouter_metabox' ) );
		add_action( 'save_post_roi_cours', array( $this, 'sauvegarder_metabox' ) );
	}

	/**
	 * Registers post meta fields for roi_cours.
	 *
	 * @return void
	 */
	public function enregistrer_meta(): void {
		register_post_meta(
			'roi_cours',
			'_roi_cours_audience_type',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'default'           => 'all',
				'sanitize_callback' => array( $this, 'sanitize_audience_type' ),
				'auth_callback'     => function ( bool $allowed, string $meta_key, int $post_id ): bool {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);

		register_post_meta(
			'roi_cours',
			'_roi_cours_target_groups',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'default'           => '[]',
				'auth_callback'     => function ( bool $allowed, string $meta_key, int $post_id ): bool {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);

		register_post_meta(
			'roi_cours',
			'_roi_cours_target_members',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'default'           => '[]',
				'auth_callback'     => function ( bool $allowed, string $meta_key, int $post_id ): bool {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);
	}

	/**
	 * Sanitizes audience type.
	 *
	 * @param mixed $value Input value.
	 * @return string 'all' or 'restricted'.
	 */
	public function sanitize_audience_type( mixed $value ): string {
		$str = is_string( $value ) ? sanitize_key( $value ) : 'all';
		return in_array( $str, array( 'all', 'restricted' ), true ) ? $str : 'all';
	}

	/**
	 * Adds audience metabox.
	 *
	 * @return void
	 */
	public function ajouter_metabox(): void {
		add_meta_box(
			'roi_cours_audience_box',
			__( 'Audience & Assignation', 'roi' ),
			array( $this, 'afficher_metabox' ),
			'roi_cours',
			'side',
			'high'
		);
	}

	/**
	 * Renders audience metabox content.
	 *
	 * @param WP_Post $post Current post.
	 * @return void
	 */
	public function afficher_metabox( WP_Post $post ): void {
		wp_nonce_field( 'roi_sauvegarder_cours_audience', 'roi_cours_audience_nonce' );

		$audience_type = (string) get_post_meta( $post->ID, '_roi_cours_audience_type', true );
		if ( empty( $audience_type ) ) {
			$audience_type = 'all';
		}

		$raw_groups    = get_post_meta( $post->ID, '_roi_cours_target_groups', true );
		$target_groups = array();
		if ( is_string( $raw_groups ) && '' !== $raw_groups ) {
			$decoded = json_decode( $raw_groups, true );
			if ( is_array( $decoded ) ) {
				$target_groups = array_map( 'intval', $decoded );
			}
		}

		$raw_members    = get_post_meta( $post->ID, '_roi_cours_target_members', true );
		$target_members = array();
		if ( is_string( $raw_members ) && '' !== $raw_members ) {
			$decoded = json_decode( $raw_members, true );
			if ( is_array( $decoded ) ) {
				$target_members = array_map( 'intval', $decoded );
			}
		}

		// Récupération des groupes disponibles.
		$available_groups = array();
		if ( taxonomy_exists( 'dame_group' ) ) {
			$terms = get_terms(
				array(
					'taxonomy'   => 'dame_group',
					'hide_empty' => false,
				)
			);
			if ( is_array( $terms ) ) {
				foreach ( $terms as $t ) {
					if ( $t instanceof WP_Term ) {
						$available_groups[] = $t;
					}
				}
			}
		}

		// Récupération des adhérents actifs pour la sélection nominative.
		$available_members = array();
		if ( post_type_exists( 'adherent' ) ) {
			$adherents = get_posts(
				array(
					'post_type'      => 'adherent',
					'post_status'    => 'publish',
					'posts_per_page' => -1,
					'orderby'        => 'title',
					'order'          => 'ASC',
				)
			);
			foreach ( $adherents as $adh ) {
				$prenom = (string) ( get_post_meta( $adh->ID, '_dame_first_name', true ) ?: get_post_meta( $adh->ID, '_dame_prenom', true ) );
				$nom    = (string) ( get_post_meta( $adh->ID, '_dame_last_name', true ) ?: ( get_post_meta( $adh->ID, '_dame_birth_name', true ) ?: get_post_meta( $adh->ID, '_dame_nom', true ) ) );
				$label  = trim( $prenom . ' ' . $nom );
				if ( empty( $label ) ) {
					$label = $adh->post_title;
				}
				$available_members[] = array(
					'id'    => $adh->ID,
					'label' => $label,
				);
			}

			usort(
				$available_members,
				fn( $a, $b ) => strcasecmp( $a['label'], $b['label'] )
			);

			// Éléments sélectionnés placés en premier (comme dans Dame pour les participants).
			$selected_list   = array();
			$unselected_list = array();
			foreach ( $available_members as $m ) {
				if ( in_array( (int) $m['id'], $target_members, true ) ) {
					$selected_list[] = $m;
				} else {
					$unselected_list[] = $m;
				}
			}
			$available_members = array_merge( $selected_list, $unselected_list );
		}
		?>
		<div class="roi-audience-metabox-wrapper">
			<p style="margin-top: 0; font-size: 12px; color: #50575e;">
				<?php esc_html_e( 'Choisissez à qui ce cours est destiné.', 'roi' ); ?>
			</p>

			<div style="margin-bottom: 12px;">
				<label style="display: block; margin-bottom: 6px; cursor: pointer;">
					<input type="radio" name="roi_cours_audience_type" value="all" <?php checked( $audience_type, 'all' ); ?> onchange="roiToggleAudienceSection(this.value)">
					<strong><?php esc_html_e( 'Tous les membres', 'roi' ); ?></strong>
					<span style="display: block; font-size: 11px; color: #646970; margin-left: 20px;">
						<?php esc_html_e( 'Parcours commun du club', 'roi' ); ?>
					</span>
				</label>
				<label style="display: block; cursor: pointer;">
					<input type="radio" name="roi_cours_audience_type" value="restricted" <?php checked( $audience_type, 'restricted' ); ?> onchange="roiToggleAudienceSection(this.value)">
					<strong><?php esc_html_e( 'Cours assigné', 'roi' ); ?></strong>
					<span style="display: block; font-size: 11px; color: #646970; margin-left: 20px;">
						<?php esc_html_e( 'Affecté à des groupes ou élèves ciblés', 'roi' ); ?>
					</span>
				</label>
			</div>

			<div id="roi-audience-restricted-container" style="<?php echo ( 'restricted' === $audience_type ) ? '' : 'display: none;'; ?> border-top: 1px solid #dcdcde; padding-top: 10px; margin-top: 10px;">
				<?php if ( ! empty( $available_groups ) ) : ?>
					<div style="margin-bottom: 12px;">
						<strong style="display: block; font-size: 12px; margin-bottom: 4px;"><?php esc_html_e( 'Groupes ciblés :', 'roi' ); ?></strong>
						<div style="max-height: 120px; overflow-y: auto; border: 1px solid #dcdcde; padding: 6px; background: #fff; border-radius: 3px;">
							<?php foreach ( $available_groups as $group_term ) : ?>
								<label style="display: block; font-size: 12px; margin-bottom: 3px; cursor: pointer;">
									<input type="checkbox" name="roi_cours_target_groups[]" value="<?php echo (int) $group_term->term_id; ?>" <?php checked( in_array( (int) $group_term->term_id, $target_groups, true ) ); ?>>
									<?php echo esc_html( $group_term->name ); ?>
								</label>
							<?php endforeach; ?>
						</div>
					</div>
				<?php endif; ?>

				<?php if ( ! empty( $available_members ) ) : ?>
					<div>
						<strong style="display: block; font-size: 12px; margin-bottom: 4px;"><?php esc_html_e( 'Élèves assignés individuellement :', 'roi' ); ?></strong>
						<input type="text" id="roi_audience_member_filter" placeholder="<?php esc_attr_e( 'Filtrer par nom...', 'roi' ); ?>" style="width: 100%; margin-bottom: 6px; font-size: 12px; padding: 3px 8px; border: 1px solid #8c8f94; border-radius: 4px;" oninput="roiFilterAudienceMembers(this.value)" onkeydown="if(event.key === 'Enter'){event.preventDefault(); return false;}">
						<div class="roi-audience-members-checklist" style="max-height: 180px; overflow-y: auto; border: 1px solid #dcdcde; padding: 6px; background: #fff; border-radius: 3px;">
							<ul id="roi_audience_members_list" style="margin: 0; padding: 0; list-style: none;">
								<?php foreach ( $available_members as $m ) : ?>
									<li style="margin-bottom: 3px;">
										<label style="display: block; font-size: 12px; cursor: pointer;">
											<input type="checkbox" name="roi_cours_target_members[]" value="<?php echo (int) $m['id']; ?>" <?php checked( in_array( (int) $m['id'], $target_members, true ) ); ?>>
											<?php echo esc_html( $m['label'] ); ?>
										</label>
									</li>
								<?php endforeach; ?>
							</ul>
						</div>
					</div>
				<?php endif; ?>
			</div>
		</div>

		<script>
		function roiToggleAudienceSection(val) {
			var c = document.getElementById('roi-audience-restricted-container');
			if (c) {
				c.style.display = (val === 'restricted') ? 'block' : 'none';
			}
		}

		function roiFilterAudienceMembers(val) {
			var filter = (val || '').toLowerCase().trim();
			var items = document.querySelectorAll('#roi_audience_members_list li');
			for (var i = 0; i < items.length; i++) {
				var text = (items[i].textContent || items[i].innerText || '').toLowerCase();
				items[i].style.display = (text.indexOf(filter) > -1) ? '' : 'none';
			}
		}
		</script>
		<?php
	}

	/**
	 * Saves audience metabox fields.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function sauvegarder_metabox( int $post_id ): void {
		// Nonce check.
		if ( ! isset( $_POST['roi_cours_audience_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['roi_cours_audience_nonce'] ) ), 'roi_sauvegarder_cours_audience' ) ) {
			return;
		}

		// Autosave check.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Permission check.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$audience_type = isset( $_POST['roi_cours_audience_type'] ) ? $this->sanitize_audience_type( wp_unslash( $_POST['roi_cours_audience_type'] ) ) : 'all';
		update_post_meta( $post_id, '_roi_cours_audience_type', $audience_type );

		$target_groups = array();
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( 'restricted' === $audience_type && isset( $_POST['roi_cours_target_groups'] ) && is_array( $_POST['roi_cours_target_groups'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			foreach ( wp_unslash( $_POST['roi_cours_target_groups'] ) as $gid ) {
				$gid_int = absint( $gid );
				if ( $gid_int > 0 ) {
					$target_groups[] = $gid_int;
				}
			}
		}
		update_post_meta( $post_id, '_roi_cours_target_groups', wp_json_encode( array_values( array_unique( $target_groups ) ) ) );

		$target_members = array();
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( 'restricted' === $audience_type && isset( $_POST['roi_cours_target_members'] ) && is_array( $_POST['roi_cours_target_members'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			foreach ( wp_unslash( $_POST['roi_cours_target_members'] ) as $mid ) {
				$mid_int = absint( $mid );
				if ( $mid_int > 0 ) {
					$target_members[] = $mid_int;
				}
			}
		}
		update_post_meta( $post_id, '_roi_cours_target_members', wp_json_encode( array_values( array_unique( $target_members ) ) ) );
	}
}
