<?php
/**
 * Class TypeQuiSuisJe
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Types;

use ROI\Metaboxes\Exercice\Components\FenInput;

/**
 * Class TypeQuiSuisJe
 * Gère l'affichage du type 12 : Qui-suis-je ? (Série de 6 cartes).
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
		$consigne_globale = isset( $config_data['consigne'] ) && is_string( $config_data['consigne'] ) ? $config_data['consigne'] : '';
		$variante         = isset( $config_data['variante'] ) && is_string( $config_data['variante'] ) ? $config_data['variante'] : 'pieces';
		if ( 'piece' === $variante ) {
			$variante = 'pieces';
		} elseif ( 'case' === $variante || 'square' === $variante ) {
			$variante = 'cases';
		}

		$series = isset( $config_data['series'] ) && is_array( $config_data['series'] ) ? $config_data['series'] : array();

		$pieces = array(
			'R' => array( 'label' => __( 'Roi (R)', 'roi' ), 'symbol' => '♔' ),
			'D' => array( 'label' => __( 'Dame (D)', 'roi' ), 'symbol' => '♕' ),
			'T' => array( 'label' => __( 'Tour (T)', 'roi' ), 'symbol' => '♖' ),
			'F' => array( 'label' => __( 'Fou (F)', 'roi' ), 'symbol' => '♗' ),
			'C' => array( 'label' => __( 'Cavalier (C)', 'roi' ), 'symbol' => '♘' ),
			'P' => array( 'label' => __( 'Pion (P)', 'roi' ), 'symbol' => '♙' ),
		);
		?>
		<div id="roi_builder_type_12" class="roi-builder-section" style="display:none; margin-top:15px; padding: 15px; border: 1px solid #ccd0d4; background: #fff; border-radius: 4px;">
			<h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><?php esc_html_e( "Constructeur d'exercice (Qui-suis-je ? - Série de 6)", 'roi' ); ?></h4>

			<p class="description" style="margin-bottom: 15px; color: #1d2327; background: #f0f6fc; border-left: 4px solid #72aee6; padding: 10px 12px; border-radius: 2px;">
				<strong><?php esc_html_e( 'Format :', 'roi' ); ?></strong> <?php esc_html_e( "Série de 6 cartes. Pour chaque carte, saisissez les indices/affirmations (multilignes).", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Variante Pièces :', 'roi' ); ?></strong> <?php esc_html_e( "L'élève doit déduire la pièce blanche parmi les 6 choix en notation française : R (Roi), D (Dame), T (Tour), F (Fou), C (Cavalier), P (Pion).", 'roi' ); ?><br>
				• <strong><?php esc_html_e( 'Variante Cases :', 'roi' ); ?></strong> <?php esc_html_e( "L'élève doit cliquer sur la case de l'échiquier. Placez un cercle vert sur la case attendue via l'éditeur de position.", 'roi' ); ?>
			</p>

			<div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
				<div>
					<label for="roi_t12_consigne"><strong><?php esc_html_e( 'Consigne générale (optionnelle) :', 'roi' ); ?></strong></label><br>
					<input type="text" id="roi_t12_consigne" value="<?php echo esc_attr( $consigne_globale ); ?>" style="width:100%; height: 30px; margin-top: 4px;" placeholder="<?php esc_attr_e( 'ex: Devinez la pièce ou la case mystère d\'après les indices.', 'roi' ); ?>">
				</div>

				<div>
					<label for="roi_t12_variante"><strong><?php esc_html_e( 'Variante de la série :', 'roi' ); ?></strong></label><br>
					<select id="roi_t12_variante" style="min-width: 320px; height: 30px; margin-top: 4px;">
						<option value="pieces" <?php selected( $variante, 'pieces' ); ?>><?php esc_html_e( 'Pièces — Découvrir une pièce blanche parmi 6 (Notation FR : R, D, T, F, C, P)', 'roi' ); ?></option>
						<option value="cases" <?php selected( $variante, 'cases' ); ?>><?php esc_html_e( 'Cases — Découvrir une case de l\'échiquier (Cercle Vert)', 'roi' ); ?></option>
					</select>
				</div>
			</div>

			<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

			<h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;"><?php esc_html_e( 'Cartes de l\'exercice (Série de 6)', 'roi' ); ?></h5>

			<div id="roi_t12_series_container" style="display: flex; flex-direction: column; gap: 18px;">
				<?php
				for ( $i = 0; $i < 6; $i++ ) :
					$item          = isset( $series[ $i ] ) && is_array( $series[ $i ] ) ? $series[ $i ] : array();
					$item_indices  = isset( $item['indices'] ) && is_string( $item['indices'] ) ? $item['indices'] : '';
					$raw_piece     = isset( $item['piece'] ) && is_string( $item['piece'] ) ? $item['piece'] : ( isset( $item['piece_attendue'] ) && is_string( $item['piece_attendue'] ) ? $item['piece_attendue'] : 'R' );
					
					// Normalisation en notation française
					$item_piece = strtoupper( trim( $raw_piece ) );
					if ( str_starts_with( $item_piece, 'W' ) && strlen( $item_piece ) === 2 ) {
						$item_piece = substr( $item_piece, 1 );
					}
					$item_piece = match ( $item_piece ) {
						'Q', 'D' => 'D',
						'K', 'R' => 'R',
						'T'      => 'T',
						'B', 'F' => 'F',
						'N', 'C' => 'C',
						'P'      => 'P',
						default  => ! empty( $item_piece ) ? substr( $item_piece, 0, 1 ) : 'R',
					};

					$item_fen      = isset( $item['fen'] ) && is_string( $item['fen'] ) ? $item['fen'] : '8/8/8/8/8/8/8/8 w - - 0 1';
					$item_shapes   = isset( $item['shapes'] ) && is_array( $item['shapes'] ) ? $item['shapes'] : array();
					$item_case     = isset( $item['case_attendue'] ) && is_string( $item['case_attendue'] ) ? $item['case_attendue'] : ( isset( $item['reponse_case'] ) && is_string( $item['reponse_case'] ) ? $item['reponse_case'] : '' );
					?>
					<div class="roi-t12-card-item" data-index="<?php echo (int) $i; ?>" style="border: 1px solid #e5e5e5; padding: 14px; border-radius: 4px; background: #f9f9f9;">
						<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1d2327;">
							<?php
							/* translators: %d: Card number */
							echo esc_html( sprintf( __( 'Carte %d / 6', 'roi' ), $i + 1 ) );
							?>
						</h4>

						<!-- Zone de saisie des indices (multiligne) -->
						<div style="margin-bottom: 12px;">
							<label for="roi_t12_indices_<?php echo (int) $i; ?>"><strong><?php esc_html_e( 'Indices / Affirmations (multiligne) :', 'roi' ); ?></strong></label><br>
							<textarea id="roi_t12_indices_<?php echo (int) $i; ?>" class="roi_t12_indices_input" data-index="<?php echo (int) $i; ?>" rows="5" style="width: 100%; margin-top: 4px; font-family: inherit; resize: vertical;" placeholder="<?php esc_attr_e( "Saisir les indices (un par ligne ou texte explicatif)...\nEx:\n- Je me déplace en diagonale\n- Je ne change jamais de couleur de case", 'roi' ); ?>"><?php echo esc_textarea( $item_indices ); ?></textarea>
						</div>

						<!-- Bloc Conditionnel Variante Pièces -->
						<div class="roi_t12_bloc_pieces" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'pieces' === $variante ? 'block' : 'none'; ?>; border: 1px solid #e2e4e7; background: #fff; padding: 12px; border-radius: 4px;">
							<label><strong><?php esc_html_e( 'Pièce blanche attendue (Notation FR) :', 'roi' ); ?></strong></label>
							<p class="description" style="margin: 2px 0 8px 0;"><?php esc_html_e( 'Cliquez sur la pièce blanche correspondant à la bonne réponse :', 'roi' ); ?></p>
							<div class="roi-t12-pieces-palette" style="display: flex; gap: 8px; flex-wrap: wrap;">
								<?php foreach ( $pieces as $code => $piece_data ) : ?>
									<button type="button" class="button roi_t12_piece_btn <?php echo $item_piece === $code ? 'button-primary is-active' : 'button-secondary'; ?>" data-index="<?php echo (int) $i; ?>" data-piece="<?php echo esc_attr( $code ); ?>" style="display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px;">
										<span style="font-size: 18px; line-height: 1;"><?php echo esc_html( $piece_data['symbol'] ); ?></span>
										<span><?php echo esc_html( $piece_data['label'] ); ?></span>
									</button>
								<?php endforeach; ?>
							</div>
							<input type="hidden" class="roi_t12_piece_input" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $item_piece ); ?>">
						</div>

						<!-- Bloc Conditionnel Variante Cases -->
						<div class="roi_t12_bloc_cases" data-index="<?php echo (int) $i; ?>" style="display: <?php echo 'cases' === $variante ? 'block' : 'none'; ?>; border: 1px solid #e2e4e7; background: #fff; padding: 12px; border-radius: 4px;">
							<?php
							FenInput::render(
								array(
									'id'              => 'roi_t12_fen_' . $i,
									'value'           => $item_fen,
									'shapes'          => $item_shapes,
									'show_orientation'=> false,
									'button_id'       => 'btn_open_fen_editor_t12_' . $i,
									'input_class'     => 'roi_t12_fen',
									'button_class'    => 'button btn_open_fen_editor_t12',
									'label'           => __( 'Position & Case attendue (FEN + Cercle Vert) :', 'roi' ),
									'button_label'    => __( 'Placer la case attendue (Cercle Vert)', 'roi' ),
									'data_attributes' => array( 'index' => $i ),
								)
							);
							?>

							<div style="margin-top: 10px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
								<div>
									<label for="roi_t12_case_attendue_<?php echo (int) $i; ?>"><strong><?php esc_html_e( 'Case attendue (Cercle Vert) :', 'roi' ); ?></strong></label><br>
									<input type="text" id="roi_t12_case_attendue_<?php echo (int) $i; ?>" class="roi_t12_case_attendue" data-index="<?php echo (int) $i; ?>" value="<?php echo esc_attr( $item_case ); ?>" readonly style="width: 120px; height: 30px; margin-top: 4px; background: #f0f0f1; text-align: center; font-weight: bold; font-size: 14px;">
								</div>
								<p class="description" style="margin: 0; align-self: flex-end; padding-bottom: 6px;">
									<?php esc_html_e( "Ouvrez l'éditeur et tracez un cercle vert (clic droit ou bouton cercle) sur la case cible.", 'roi' ); ?>
								</p>
							</div>

							<!-- Aperçu visuel statique non-interactif -->
							<div style="margin-top: 12px;">
								<label style="display: block; margin-bottom: 4px; font-size: 12px; color: #50575e;">
									<strong><?php esc_html_e( 'Aperçu de la position (non interactif) :', 'roi' ); ?></strong>
								</label>
								<div id="roi_t12_preview_container_<?php echo (int) $i; ?>" class="main-wrap fit-container piece-set-cburnett board-theme-brown" style="width: 240px; height: 240px; position: relative; border: 1px solid #ccd0d4; border-radius: 4px; background: #fff; overflow: hidden;">
									<div id="roi_t12_preview_board_<?php echo (int) $i; ?>" class="main-board roi_t12_preview_board" data-index="<?php echo (int) $i; ?>" style="width: 100%; height: 100%;"></div>
								</div>
							</div>
						</div>
					</div>
				<?php endfor; ?>
			</div>
		</div>
		<?php
	}
}
