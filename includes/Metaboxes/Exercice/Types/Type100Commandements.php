<?php
/**
 * Class Type100Commandements
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class Type100Commandements
 * Handles rendering for Type 1: 100 Commandements.
 */
class Type100Commandements implements TypeInterface {

	/**
	 * Renders the HTML for this type.
	 *
	 * @param \WP_Post             $post        The current post object.
	 * @param array<string, mixed> $config_data The decoded config JSON data.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$qcms = array();

		if ( isset( $config_data['qcms'] ) && is_array( $config_data['qcms'] ) ) {
			foreach ( $config_data['qcms'] as $qcm_item ) {
				if ( is_array( $qcm_item ) ) {
					$qcms[] = array(
						'question'      => isset( $qcm_item['question'] ) && is_string( $qcm_item['question'] ) ? $qcm_item['question'] : '',
						'reponses'      => isset( $qcm_item['reponses'] ) && is_array( $qcm_item['reponses'] ) ? array_values( array_map( 'strval', $qcm_item['reponses'] ) ) : array( '', '', '' ),
						'bonne_reponse' => isset( $qcm_item['bonne_reponse'] ) && is_numeric( $qcm_item['bonne_reponse'] ) ? (int) $qcm_item['bonne_reponse'] : 0,
					);
				}
			}
		} elseif ( isset( $config_data['question'] ) ) {
			// Backward compatibility with single QCM configuration.
			$reponses = isset( $config_data['reponses'] ) && is_array( $config_data['reponses'] ) ? array_values( array_map( 'strval', $config_data['reponses'] ) ) : array( '', '', '' );
			$qcms[]   = array(
				'question'      => is_string( $config_data['question'] ) ? $config_data['question'] : '',
				'reponses'      => $reponses,
				'bonne_reponse' => isset( $config_data['bonne_reponse'] ) && is_numeric( $config_data['bonne_reponse'] ) ? (int) $config_data['bonne_reponse'] : 0,
			);
		}

		if ( empty( $qcms ) ) {
			$qcms[] = array(
				'question'      => '',
				'reponses'      => array( '', '', '' ),
				'bonne_reponse' => 0,
			);
		}
		?>
		<div id="roi_builder_type_1" class="roi-builder-section" style="display:none; margin-top: 15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (100 Commandements)", 'roi' ); ?></h4>
			
			<div id="roi_t1_qcms_container" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 15px;">
				<?php foreach ( $qcms as $idx => $qcm ) : ?>
					<?php
					$q_text = $qcm['question'];
					$reps   = $qcm['reponses'];
					while ( count( $reps ) < 3 ) {
						$reps[] = '';
					}
					$bonne = $qcm['bonne_reponse'];
					?>
					<div class="roi-t1-qcm-item" data-index="<?php echo (int) $idx; ?>" style="border: 1px solid #e0e0e0; padding: 12px; border-radius: 4px; background-color: #fafafa;">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 6px;">
							<strong class="roi-t1-qcm-title"><?php printf( esc_html__( 'QCM #%d', 'roi' ), (int) $idx + 1 ); ?></strong>
							<button type="button" class="button roi_t1_remove_qcm" style="color: #b32d2e; border-color: #b32d2e; font-weight: bold;"><?php esc_html_e( 'Supprimer ce QCM', 'roi' ); ?></button>
						</div>
						<p style="margin-top: 0;">
							<label><strong><?php esc_html_e( 'Question :', 'roi' ); ?></strong></label><br>
							<input type="text" class="roi_t1_question large-text" value="<?php echo esc_attr( $q_text ); ?>" style="width: 100%;">
						</p>
						<p style="margin-bottom: 5px;"><strong><?php esc_html_e( 'Réponses (sélectionnez la bonne réponse) :', 'roi' ); ?></strong></p>
						<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
							<input type="radio" class="roi_t1_correct" name="roi_t1_correct_<?php echo (int) $idx; ?>" value="0" <?php checked( $bonne, 0 ); ?>>
							<input type="text" class="roi_t1_reponse" data-opt="0" value="<?php echo esc_attr( $reps[0] ?? '' ); ?>" style="flex: 1;" placeholder="<?php esc_attr_e( 'Réponse 1', 'roi' ); ?>">
						</div>
						<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
							<input type="radio" class="roi_t1_correct" name="roi_t1_correct_<?php echo (int) $idx; ?>" value="1" <?php checked( $bonne, 1 ); ?>>
							<input type="text" class="roi_t1_reponse" data-opt="1" value="<?php echo esc_attr( $reps[1] ?? '' ); ?>" style="flex: 1;" placeholder="<?php esc_attr_e( 'Réponse 2', 'roi' ); ?>">
						</div>
						<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
							<input type="radio" class="roi_t1_correct" name="roi_t1_correct_<?php echo (int) $idx; ?>" value="2" <?php checked( $bonne, 2 ); ?>>
							<input type="text" class="roi_t1_reponse" data-opt="2" value="<?php echo esc_attr( $reps[2] ?? '' ); ?>" style="flex: 1;" placeholder="<?php esc_attr_e( 'Réponse 3', 'roi' ); ?>">
						</div>
					</div>
				<?php endforeach; ?>
			</div>

			<button type="button" id="roi_t1_add_qcm" class="button button-secondary"><?php esc_html_e( 'Ajouter un QCM', 'roi' ); ?></button>
		</div>
		<?php
	}
}

