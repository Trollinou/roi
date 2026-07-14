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
		$chapitre = get_post_meta( $post->ID, '_roi_exercice_chapitre', true );
		$couleur  = get_post_meta( $post->ID, '_roi_exercice_couleur', true );
		$ordre    = get_post_meta( $post->ID, '_roi_exercice_ordre', true );
		$config   = get_post_meta( $post->ID, '_roi_exercice_config', true );

		if ( empty( $config ) ) {
			$config = '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "color": "white", "solution": []}';
		}

		$config_data = json_decode( $config, true );
		if ( ! is_array( $config_data ) ) {
			$config_data = [];
		}

		$ordre_val = ( '' === $ordre ) ? 0 : (int) $ordre;
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
		<p>
			<label for="roi_exercice_chapitre"><strong>Chapitre :</strong></label><br>
			<input type="text" name="roi_exercice_chapitre" id="roi_exercice_chapitre" value="<?php echo esc_attr( $chapitre ); ?>" style="width: 100%; max-width: 400px;">
		</p>
		<p>
			<label for="roi_exercice_couleur"><strong>Couleur du chapitre :</strong></label><br>
			<select name="roi_exercice_couleur" id="roi_exercice_couleur">
				<option value="primary" <?php selected( $couleur, "primary" ); ?>>Bleu (primary)</option>
				<option value="warning" <?php selected( $couleur, "warning" ); ?>>Orange (warning)</option>
				<option value="danger" <?php selected( $couleur, "danger" ); ?>>Rouge (danger)</option>
				<option value="success" <?php selected( $couleur, "success" ); ?>>Vert (success)</option>
				<option value="tertiary" <?php selected( $couleur, "tertiary" ); ?>>Violet (tertiary)</option>
			</select>
		</p>
		<p>
			<label for="roi_exercice_ordre"><strong>Ordre d'affichage dans le chapitre :</strong></label><br>
			<input type="number" name="roi_exercice_ordre" id="roi_exercice_ordre" value="<?php echo (int) $ordre_val; ?>" min="0" step="1">
		</p>

		<?php
		// Render components
		( new Type100Commandements() )->render( $post, $config_data );
		( new TypePopEchecs() )->render( $post, $config_data );
		( new TypePartieHeros() )->render( $post, $config_data );
		( new TypePosiPlan() )->render( $post, $config_data );
		( new TypeAssociPlan() )->render( $post, $config_data );
		( new TypeABCDaire() )->render( $post, $config_data );
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

		// Save exercise chapter (string)
		if ( isset( $_POST['roi_exercice_chapitre'] ) ) {
			update_post_meta( $post_id, '_roi_exercice_chapitre', sanitize_text_field( wp_unslash( $_POST['roi_exercice_chapitre'] ) ) );
		}

		// Save exercise color (string)
		if ( isset( $_POST['roi_exercice_couleur'] ) ) {
			$couleur        = sanitize_text_field( wp_unslash( $_POST['roi_exercice_couleur'] ) );
			$allowed_colors = [ 'primary', 'warning', 'danger', 'success', 'tertiary' ];
			if ( in_array( $couleur, $allowed_colors, true ) ) {
				update_post_meta( $post_id, '_roi_exercice_couleur', $couleur );
			}
		}

		// Save exercise order (integer value)
		if ( isset( $_POST['roi_exercice_ordre'] ) ) {
			update_post_meta( $post_id, '_roi_exercice_ordre', intval( $_POST['roi_exercice_ordre'] ) );
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
}
