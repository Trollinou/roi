<?php
/**
 * Class TypeQuiSuisJe
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

/**
 * Class TypeQuiSuisJe
 * Gère l'affichage du type 12 : Qui-suis-je ?.
 */
class TypeQuiSuisJe implements TypeInterface {

	/**
	 * Affiche le HTML spécifique à ce type d'exercice.
	 *
	 * @param \WP_Post             $post        L'objet post actuel.
	 * @param array<string, mixed> $config_data Les données de configuration JSON décodées.
	 * @return void
	 */
	public function render( \WP_Post $post, array $config_data ): void {
		$indices       = isset( $config_data['indices'] ) && is_array( $config_data['indices'] ) ? $config_data['indices'] : [];
		$type_reponse  = $config_data['type_reponse'] ?? 'piece';
		$reponse_piece = $config_data['reponse_piece'] ?? 'wN';
		$reponse_case  = $config_data['reponse_case'] ?? '';
		$reponse_qcm   = isset( $config_data['reponse_qcm'] ) && is_array( $config_data['reponse_qcm'] ) ? $config_data['reponse_qcm'] : [];

		$qcm_choix         = isset( $reponse_qcm['choix'] ) && is_array( $reponse_qcm['choix'] ) ? $reponse_qcm['choix'] : [];
		$qcm_bonne_reponse = isset( $reponse_qcm['bonne_reponse'] ) ? (int) $reponse_qcm['bonne_reponse'] : 0;

		if ( empty( $indices ) ) {
			$indices = [ '' ];
		}

		$pieces = [
			'wK' => __( "Roi Blanc (wK)", "roi" ),
			'wQ' => __( "Dame Blanche (wQ)", "roi" ),
			'wR' => __( "Tour Blanche (wR)", "roi" ),
			'wB' => __( "Fou Blanc (wB)", "roi" ),
			'wN' => __( "Cavalier Blanc (wN)", "roi" ),
			'wP' => __( "Pion Blanc (wP)", "roi" ),
			'bK' => __( "Roi Noir (bK)", "roi" ),
			'bQ' => __( "Dame Noire (bQ)", "roi" ),
			'bR' => __( "Tour Noire (bR)", "roi" ),
			'bB' => __( "Fou Noir (bB)", "roi" ),
			'bN' => __( "Cavalier Noir (bN)", "roi" ),
			'bP' => __( "Pion Noir (bP)", "roi" ),
		];
		?>
		<div id="roi_builder_type_12" class="roi-builder-section" style="display:none; margin-top:15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Qui-suis-je ?)", "roi" ); ?></h4>

			<div style="display: flex; flex-direction: column; gap: 20px; margin-top: 15px;">
				<!-- Section Indices -->
				<div>
					<label><strong><?php esc_html_e( "Indices :", "roi" ); ?></strong></label>
					<p class="description" style="margin-top: 2px; margin-bottom: 8px;"><?php esc_html_e( "Ajoutez les indices qui seront révélés progressivement au joueur.", "roi" ); ?></p>
					
					<div id="roi_t12_indices_container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
						<?php foreach ( $indices as $index => $indice_texte ) : ?>
							<div class="roi-t12-indice-item" style="display: flex; gap: 10px; align-items: center;">
								<span style="font-weight: 600; width: 80px; color: #50575e;"><?php printf( esc_html__( "Indice %d :", "roi" ), $index + 1 ); ?></span>
								<input type="text" class="roi_t12_indice_input" value="<?php echo esc_attr( $indice_texte ); ?>" placeholder="<?php esc_attr_e( "Saisir un indice...", "roi" ); ?>" style="flex: 1; height: 30px;">
								<button type="button" class="button button-link-delete roi_t12_remove_indice" style="color: #b32d2e; text-decoration: none;" title="<?php esc_attr_e( "Supprimer l'indice", "roi" ); ?>">&times;</button>
							</div>
						<?php endforeach; ?>
					</div>

					<button type="button" id="roi_t12_add_indice" class="button button-secondary">
						<?php esc_html_e( "Ajouter un indice", "roi" ); ?>
					</button>
				</div>

				<hr style="border: 0; border-top: 1px solid #eee; margin: 0;">

				<!-- Section Type de réponse -->
				<div>
					<label for="roi_t12_type_reponse"><strong><?php esc_html_e( "Type de réponse :", "roi" ); ?></strong></label><br>
					<select id="roi_t12_type_reponse" style="min-width: 250px; height: 30px; margin-top: 4px;">
						<option value="piece" <?php selected( $type_reponse, 'piece' ); ?>><?php esc_html_e( "Pièce", "roi" ); ?></option>
						<option value="square" <?php selected( $type_reponse, 'square' ); ?>><?php esc_html_e( "Case de l'échiquier", "roi" ); ?></option>
						<option value="qcm" <?php selected( $type_reponse, 'qcm' ); ?>><?php esc_html_e( "Choix multiple", "roi" ); ?></option>
					</select>
				</div>

				<!-- Bloc Conditionnel : Pièce -->
				<div id="roi_t12_bloc_piece" style="display: <?php echo 'piece' === $type_reponse ? 'block' : 'none'; ?>; background: #f9f9f9; border: 1px solid #e5e5e5; padding: 15px; border-radius: 4px;">
					<label for="roi_t12_reponse_piece"><strong><?php esc_html_e( "Pièce attendue :", "roi" ); ?></strong></label><br>
					<select id="roi_t12_reponse_piece" style="min-width: 250px; height: 30px; margin-top: 4px;">
						<?php foreach ( $pieces as $code => $libelle ) : ?>
							<option value="<?php echo esc_attr( $code ); ?>" <?php selected( $reponse_piece, $code ); ?>><?php echo esc_html( $libelle ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>

				<!-- Bloc Conditionnel : Case -->
				<div id="roi_t12_bloc_square" style="display: <?php echo 'square' === $type_reponse ? 'block' : 'none'; ?>; background: #f9f9f9; border: 1px solid #e5e5e5; padding: 15px; border-radius: 4px;">
					<div style="margin-bottom: 10px;">
						<label for="roi_t12_reponse_case"><strong><?php esc_html_e( "Case attendue :", "roi" ); ?></strong></label><br>
						<input type="text" id="roi_t12_reponse_case" maxlength="2" readonly value="<?php echo esc_attr( $reponse_case ); ?>" placeholder="Ex: e4" style="width: 100px; height: 30px; margin-top: 4px; background: #f0f0f1; text-align: center; font-weight: bold; font-size: 14px;">
					</div>
					<p class="description"><?php esc_html_e( "Cliquez sur une case de l'échiquier ci-dessous pour sélectionner la case attendue :", "roi" ); ?></p>
					<div id="roi_t12_board_case" style="width: 350px; aspect-ratio: 1; margin-top: 10px; position: relative;"></div>
				</div>

				<!-- Bloc Conditionnel : QCM -->
				<div id="roi_t12_bloc_qcm" style="display: <?php echo 'qcm' === $type_reponse ? 'block' : 'none'; ?>; background: #f9f9f9; border: 1px solid #e5e5e5; padding: 15px; border-radius: 4px;">
					<strong style="display: block; margin-bottom: 10px;"><?php esc_html_e( "Choix multiples (QCM) :", "roi" ); ?></strong>
					<p class="description" style="margin-bottom: 12px;"><?php esc_html_e( "Cochez le bouton radio correspondant à la bonne réponse.", "roi" ); ?></p>
					
					<div style="display: flex; flex-direction: column; gap: 12px;">
						<?php for ( $i = 0; $i < 3; $i++ ) :
							$txt  = $qcm_choix[ $i ]['texte'] ?? '';
							$expl = $qcm_choix[ $i ]['explication'] ?? '';
						?>
							<div class="roi-t12-qcm-item" style="border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #fff;">
								<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
									<input type="radio" name="roi_t12_qcm_good" value="<?php echo $i; ?>" <?php checked( $qcm_bonne_reponse, $i ); ?> id="roi_t12_qcm_good_<?php echo $i; ?>">
									<label for="roi_t12_qcm_good_<?php echo $i; ?>" style="font-weight: 600;"><?php printf( esc_html__( "Option %s", "roi" ), chr( 65 + $i ) ); ?></label>
								</div>
								<div style="display: flex; flex-direction: column; gap: 8px; margin-left: 25px;">
									<div>
										<label style="font-size: 12px; color: #50575e;"><?php esc_html_e( "Texte du choix :", "roi" ); ?></label>
										<input type="text" class="roi_t12_qcm_texte" data-index="<?php echo $i; ?>" value="<?php echo esc_attr( $txt ); ?>" placeholder="<?php printf( esc_attr__( "Texte de l'option %s", "roi" ), chr( 65 + $i ) ); ?>" style="width: 100%; height: 30px;">
									</div>
									<div>
										<label style="font-size: 12px; color: #50575e;"><?php esc_html_e( "Explication si erreur :", "roi" ); ?></label>
										<input type="text" class="roi_t12_qcm_explication" data-index="<?php echo $i; ?>" value="<?php echo esc_attr( $expl ); ?>" placeholder="<?php esc_attr_e( "Explication si ce choix est sélectionné par erreur...", "roi" ); ?>" style="width: 100%; height: 30px;">
									</div>
								</div>
							</div>
						<?php endfor; ?>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
