<?php
/**
 * Manager for Exercice Metabox.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice;

use ROI\Metaboxes\Exercice\Types\Type100Commandements;
use ROI\Metaboxes\Exercice\Types\TypePopEchecs;
use ROI\Metaboxes\Exercice\Types\TypeABCDaire;
use ROI\Metaboxes\Exercice\Types\TypePartieHeros;
use ROI\Metaboxes\Exercice\Types\TypePosiPlan;
use ROI\Metaboxes\Exercice\Types\TypeAssociPlan;
use ROI\Metaboxes\Exercice\Types\TypeMarcheHeros;
use ROI\Metaboxes\Exercice\Types\TypeVisionChecs;
use ROI\Metaboxes\Exercice\Types\TypeParcours;
use ROI\Metaboxes\Exercice\Types\TypeClassEchecs;
use ROI\Metaboxes\Exercice\Types\TypeQuiSuisJe;

/**
 * Class Manager
 * Coordinates registration, display, and saving of exercise CPT metadata.
 */
class Manager {

	/**
	 * Constructor.
	 * Registers actions.
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', [ $this, 'ajouter_metabox' ] );
		add_action( 'save_post', [ $this, 'sauvegarder_metabox' ] );
		add_filter( 'wp_insert_post_data', [ $this, 'valider_exercice_donnees' ], 10, 2 );
		add_action( 'admin_notices', [ $this, 'afficher_validation_erreurs' ] );
	}

	/**
	 * Adds the config metabox.
	 *
	 * @return void
	 */
	public function ajouter_metabox(): void {
		add_meta_box(
			'roi_exercice_config_box',
			'Configuration de l\'Exercice (Headless)',
			[ $this, 'afficher_metabox' ],
			'roi_exercice',
			'normal',
			'high'
		);
	}

	/**
	 * Renders the metabox content.
	 *
	 * @param \WP_Post $post The post object.
	 * @return void
	 */
	public function afficher_metabox( $post ): void {
		wp_nonce_field( 'roi_sauvegarder_exercice', 'roi_exercice_nonce' );

		$type     = get_post_meta( $post->ID, '_roi_exercice_type', true );
		$niveau   = get_post_meta( $post->ID, '_roi_exercice_niveau', true );
		$config   = get_post_meta( $post->ID, '_roi_exercice_config', true );

		if ( empty( $config ) ) {
			$config = '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "color": "white", "solution": []}';
		}

		$config_data = json_decode( $config, true );
		if ( ! is_array( $config_data ) ) {
			$config_data = [];
		}
		?>
		<p>
			<label for="roi_exercice_type"><strong>Type d'exercice :</strong></label><br>
			<select name="roi_exercice_type" id="roi_exercice_type">
				<option value="1" <?php selected( $type, '1' ); ?>>1 - 100 Commandements</option>
				<option value="2" <?php selected( $type, '2' ); ?>>2 - Pop'Echecs</option>
				<option value="3" <?php selected( $type, '3' ); ?>>3 - ABCDaire Tactique</option>
				<option value="4" <?php selected( $type, '4' ); ?>>4 - La Partie dont tu es le Héros</option>
				<option value="5" <?php selected( $type, '5' ); ?>>5 - Posi'Plan</option>
				<option value="6" <?php selected( $type, '6' ); ?>>6 - Associ'Plan</option>
				<option value="7" <?php selected( $type, '7' ); ?>>7 - Marche du Héros</option>
				<option value="8" <?php selected( $type, '8' ); ?>>8 - Vision'checs</option>
				<option value="9" <?php selected( $type, '9' ); ?>>9 - Parcours</option>
				<option value="10" <?php selected( $type, '10' ); ?>>10 - Echec'éval</option>
				<option value="11" <?php selected( $type, '11' ); ?>>11 - Class'échecs</option>
				<option value="12" <?php selected( $type, '12' ); ?>>12 - Qui-suis-je ?</option>
				<option value="13" <?php selected( $type, '13' ); ?>>13 - Ouvre'boite</option>
				<option value="14" <?php selected( $type, '14' ); ?>>14 - Cap ou pas cap ?</option>
				<option value="15" <?php selected( $type, '15' ); ?>>15 - Jugement final</option>
				<option value="16" <?php selected( $type, '16' ); ?>>16 - Destination finale</option>
			</select>
		</p>
		<p>
			<label for="roi_exercice_niveau"><strong>Niveau de difficulté :</strong></label><br>
			<select name="roi_exercice_niveau" id="roi_exercice_niveau">
				<?php for ( $i = 1; $i <= 6; $i++ ) : ?>
					<option value="<?php echo $i; ?>" <?php selected( $niveau, (string) $i ); ?>><?php echo $i; ?></option>
				<?php endfor; ?>
			</select>
		</p>

		<?php
		// Render components
		( new Type100Commandements() )->render( $post, $config_data );
		( new TypePopEchecs() )->render( $post, $config_data );
		( new TypePartieHeros() )->render( $post, $config_data );
		( new TypePosiPlan() )->render( $post, $config_data );
		( new TypeAssociPlan() )->render( $post, $config_data );
		( new TypeABCDaire() )->render( $post, $config_data );
		( new TypeMarcheHeros() )->render( $post, $config_data );
		( new TypeVisionChecs() )->render( $post, $config_data );
		( new TypeParcours() )->render( $post, $config_data );
		( new TypeClassEchecs() )->render( $post, $config_data );
		( new TypeQuiSuisJe() )->render( $post, $config_data );
		?>

		<textarea name="roi_exercice_config" id="roi_config_json" style="display:none;"><?php echo esc_textarea( $config ); ?></textarea>

		<!-- Fenêtre Modale Éditeur FEN -->
		<div id="roi_fen_modal_overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 100000; align-items: center; justify-content: center;">
			<div style="position: relative; background: #fff; border-radius: 12px; max-width: 800px; width: 95%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.25); animation: roiModalFadeIn 0.3s ease;">
				<div style="padding: 20px 25px 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; position: relative;">
					<h3 style="margin: 0; font-size: 18px; font-weight: 600;">Éditeur de Position FEN</h3>
					<button type="button" id="roi_fen_modal_close" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: #aaa; transition: color 0.2s;" onmouseover="this.style.color='#000'" onmouseout="this.style.color='#aaa'">&times;</button>
				</div>
				<div style="padding: 25px; overflow: visible !important; overflow-y: visible !important; flex: 1; box-sizing: border-box;">
					<div id="roi_fen_react_root"></div>
				</div>
			</div>
		</div>

		<!-- Fenêtre Modale Éditeur PGN -->
		<div id="roi_pgn_modal_overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 100000; align-items: center; justify-content: center;">
			<div style="position: relative; background: #fff; border-radius: 12px; max-width: 820px; width: 95%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.25); animation: roiModalFadeIn 0.3s ease;">
				<div style="padding: 20px 25px 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; position: relative;">
					<h3 style="margin: 0; font-size: 18px; font-weight: 600;">Éditeur de Séquence PGN</h3>
					<button type="button" id="roi_pgn_modal_close" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: #aaa; transition: color 0.2s;" onmouseover="this.style.color='#000'" onmouseout="this.style.color='#aaa'">&times;</button>
				</div>
				<div style="padding: 25px; overflow: visible !important; overflow-y: visible !important; flex: 1; box-sizing: border-box;">
					<div id="roi_pgn_react_root"></div>
				</div>
			</div>
		</div>

		<style>
			@keyframes roiModalFadeIn {
				from { opacity: 0; transform: translateY(-20px); }
				to { opacity: 1; transform: translateY(0); }
			}
		</style>
		<?php
	}

	/**
	 * Saves metabox fields.
	 *
	 * @param int $post_id The post ID.
	 * @return void
	 */
	public function sauvegarder_metabox( int $post_id ): void {
		// Nonce check
		if ( ! isset( $_POST['roi_exercice_nonce'] ) || ! wp_verify_nonce( $_POST['roi_exercice_nonce'], 'roi_sauvegarder_exercice' ) ) {
			return;
		}

		// Autosave check
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Permissions check
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Save exercise type (integer value)
		if ( isset( $_POST['roi_exercice_type'] ) ) {
			update_post_meta( $post_id, '_roi_exercice_type', (int) $_POST['roi_exercice_type'] );
		}

		// Save exercise level (integer value between 1 and 6)
		if ( isset( $_POST['roi_exercice_niveau'] ) ) {
			$niveau = (int) $_POST['roi_exercice_niveau'];
			if ( $niveau >= 1 && $niveau <= 6 ) {
				update_post_meta( $post_id, '_roi_exercice_niveau', $niveau );
			}
		}

		// Save raw JSON config
		if ( isset( $_POST['roi_exercice_config'] ) ) {
			$json_raw = wp_unslash( $_POST['roi_exercice_config'] );

			// Validate JSON structure
			json_decode( $json_raw );
			if ( json_last_error() === JSON_ERROR_NONE ) {
				update_post_meta( $post_id, '_roi_exercice_config', wp_slash( $json_raw ) );
			} else {
				// Save anyway but avoid corruption by preserving raw layout
				update_post_meta( $post_id, '_roi_exercice_config', wp_slash( $json_raw ) );
			}
		}
	}

	/**
	 * Validates Exercice post data before saving to database.
	 * If mandatory fields are missing, forces status to 'draft' and stores errors.
	 *
	 * @param array<string, mixed> $data An array of sanitized post data.
	 * @param array<string, mixed> $postarr An array of unsanitized post data.
	 * @return array<string, mixed>
	 */
	public function valider_exercice_donnees( array $data, array $postarr ): array {
		// Only validate 'roi_exercice' post type
		if ( 'roi_exercice' !== ( $data['post_type'] ?? '' ) ) {
			return $data;
		}

		// Avoid validation on autosave, revision, or trash/untrash actions
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $data;
		}
		if ( 'inherit' === $data['post_status'] ) {
			return $data;
		}

		$is_publishing = 'publish' === $data['post_status'];
		$errors        = [];

		// 1. Title validation
		$title = trim( $data['post_title'] ?? '' );
		if ( empty( $title ) || 'Brouillon automatique' === $title ) {
			$errors[] = __( "Le titre de l'exercice est obligatoire.", 'roi' );
		}

		// 2. Difficulty level validation (value between 1 and 6)
		$niveau = isset( $_POST['roi_exercice_niveau'] ) ? (int) $_POST['roi_exercice_niveau'] : 0;
		if ( ! isset( $_POST['roi_exercice_niveau'] ) && isset( $postarr['ID'] ) ) {
			$niveau = (int) get_post_meta( (int) $postarr['ID'], '_roi_exercice_niveau', true );
		}
		if ( $niveau < 1 || $niveau > 6 ) {
			$errors[] = __( "Le niveau de difficulté (1 à 6) est obligatoire.", 'roi' );
		}

		// 3. Exercise type validation (value between 1 and 16)
		$type = isset( $_POST['roi_exercice_type'] ) ? (int) $_POST['roi_exercice_type'] : 0;
		if ( ! isset( $_POST['roi_exercice_type'] ) && isset( $postarr['ID'] ) ) {
			$type = (int) get_post_meta( (int) $postarr['ID'], '_roi_exercice_type', true );
		}
		if ( $type < 1 || $type > 16 ) {
			$errors[] = __( "Le type d'exercice est obligatoire.", 'roi' );
		}

		// 4. Chapter validation (taxonomy 'roi_chapitre')
		$has_chapitre = false;
		if ( ! empty( $_POST['tax_input']['roi_chapitre'] ) ) {
			$chapitres = (array) $_POST['tax_input']['roi_chapitre'];
			$chapitres = array_filter( array_map( 'intval', $chapitres ) );
			if ( ! empty( $chapitres ) ) {
				$has_chapitre = true;
			}
		} elseif ( isset( $postarr['ID'] ) ) {
			$terms = get_the_terms( (int) $postarr['ID'], 'roi_chapitre' );
			if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
				$has_chapitre = true;
			}
		}

		if ( ! $has_chapitre && ! empty( $postarr['roi_chapitre'] ) ) {
			$chapitres = (array) $postarr['roi_chapitre'];
			$chapitres = array_filter( array_map( 'intval', $chapitres ) );
			if ( ! empty( $chapitres ) ) {
				$has_chapitre = true;
			}
		}

		if ( ! $has_chapitre ) {
			$errors[] = __( "Le chapitre auquel appartient l'exercice est obligatoire.", 'roi' );
		}

		if ( ! empty( $errors ) && $is_publishing ) {
			$data['post_status'] = 'draft';
			if ( isset( $postarr['ID'] ) ) {
				set_transient( 'roi_exercice_errors_' . $postarr['ID'], $errors, 45 );
			}
		}

		return $data;
	}

	/**
	 * Displays validation errors if any are stored in transient.
	 *
	 * @return void
	 */
	public function afficher_validation_erreurs(): void {
		global $post, $pagenow;
		if ( ! $post || 'post.php' !== $pagenow || 'roi_exercice' !== $post->post_type ) {
			return;
		}

		$errors = get_transient( 'roi_exercice_errors_' . $post->ID );
		if ( $errors ) {
			delete_transient( 'roi_exercice_errors_' . $post->ID );
			?>
			<div class="notice notice-error is-dismissible">
				<p><strong><?php _e( "Impossible de publier l'exercice. Des informations obligatoires sont manquantes :", 'roi' ); ?></strong></p>
				<ul>
					<?php foreach ( $errors as $error ) : ?>
						<li><?php echo esc_html( $error ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<?php
		}
	}
}
