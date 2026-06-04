<?php
/**
 * Shortcodes registration and logic.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Shortcodes;

use WP_Query;

/**
 * Class Shortcodes
 * Handles front-end shortcodes and their associated AJAX actions.
 */
class Shortcodes {

	/**
	 * Initialize the shortcodes and AJAX handlers.
	 *
	 * @return void
	 */
	public function init(): void {
		add_shortcode( 'roi_exercices', [ $this, 'exercices_shortcode' ] );

		// AJAX actions
		add_action( 'wp_ajax_roi_fetch_exercice', [ $this, 'fetch_exercice_ajax_handler' ] );
		add_action( 'wp_ajax_nopriv_roi_fetch_exercice', [ $this, 'fetch_exercice_ajax_handler' ] );

		add_action( 'wp_ajax_roi_check_answer', [ $this, 'check_answer_ajax_handler' ] );
		add_action( 'wp_ajax_nopriv_roi_check_answer', [ $this, 'check_answer_ajax_handler' ] );

		// Filters
		add_filter( 'the_content', [ self::class, 'chess_pieces_filter' ] );
		add_filter( 'widget_text_content', [ self::class, 'chess_pieces_filter' ] );
		add_filter( 'comment_text', [ self::class, 'chess_pieces_filter' ] );
	}

	/**
	 * Renders [roi_exercices] shortcode.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string HTML output.
	 */
	public function exercices_shortcode( $atts ): string {
		$plugin_url = plugin_dir_url( dirname( __DIR__, 2 ) . '/roi.php' );
		wp_enqueue_script(
			'roi-exercices',
			$plugin_url . 'assets/js/public-exercices.js',
			[ 'jquery' ],
			ROI_VERSION,
			true
		);
		wp_localize_script(
			'roi-exercices',
			'roi_exercices_ajax',
			[
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'roi_exercice_nonce' ),
			]
		);

		ob_start();
		?>
		<div id="roi-exercices-wrapper">
			<div id="roi-exercices-filters">
				<div class="roi-filter-item">
					<label for="roi-difficulty-filter"><?php _e( 'Difficulté:', 'roi' ); ?></label>
					<select id="roi-difficulty-filter">
						<option value="any"><?php _e( 'Toutes', 'roi' ); ?></option>
						<option value="1"><?php _e( '1 - Très facile', 'roi' ); ?></option>
						<option value="2"><?php _e( '2 - Facile', 'roi' ); ?></option>
						<option value="3"><?php _e( '3 - Modéré', 'roi' ); ?></option>
						<option value="4"><?php _e( '4 - Difficile', 'roi' ); ?></option>
						<option value="5"><?php _e( '5 - Très Difficile', 'roi' ); ?></option>
						<option value="6"><?php _e( '6 - Expert', 'roi' ); ?></option>
					</select>
				</div>
				<div class="roi-filter-item">
					<label for="roi-category-filter"><?php _e( 'Catégorie:', 'roi' ); ?></label>
					<?php
					wp_dropdown_categories(
						[
							'taxonomy'        => 'roi_chess_category',
							'name'            => 'roi-category-filter',
							'id'              => 'roi-category-filter',
							'show_option_all' => __( 'Toutes les catégories', 'roi' ),
							'hierarchical'    => true,
							'value_field'     => 'slug',
						]
					);
					?>
				</div>
				<button id="roi-start-exercices"><?php _e( 'Commencer les exercices', 'roi' ); ?></button>
			</div>

			<div id="roi-exercice-display">
				<!-- Exercise content will be loaded here via AJAX -->
			</div>

			<div id="roi-exercice-score">
				<h3><?php _e( 'Votre Score', 'roi' ); ?></h3>
				<p>
					<?php _e( 'Correct:', 'roi' ); ?> <span id="roi-score-correct">0</span> /
					<?php _e( 'Tentés:', 'roi' ); ?> <span id="roi-score-attempted">0</span>
				</p>
			</div>
		</div>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * AJAX handler to fetch a random exercise.
	 *
	 * @return void
	 */
	public function fetch_exercice_ajax_handler(): void {
		check_ajax_referer( 'roi_exercice_nonce', 'nonce' );

		$difficulty    = isset( $_POST['difficulty'] ) ? sanitize_key( (string) $_POST['difficulty'] ) : 'any';
		$category_slug = isset( $_POST['category'] ) ? sanitize_key( (string) $_POST['category'] ) : 'any';
		$exclude_id    = isset( $_POST['exclude'] ) ? (int) $_POST['exclude'] : 0;

		$args = [
			'post_type'      => 'roi_exercice',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'orderby'        => 'rand',
			'post__not_in'   => [ $exclude_id ],
		];

		$meta_query = [];
		if ( $difficulty !== 'any' ) {
			$meta_query[] = [
				'key'     => '_roi_difficulty',
				'value'   => $difficulty,
				'compare' => '=',
			];
		}

		$tax_query = [];
		if ( $category_slug !== 'any' && ! empty( $category_slug ) ) {
			$tax_query[] = [
				'taxonomy' => 'roi_chess_category',
				'field'    => 'slug',
				'terms'    => $category_slug,
			];
		}

		if ( ! empty( $meta_query ) ) {
			$args['meta_query'] = $meta_query;
		}
		if ( ! empty( $tax_query ) ) {
			$args['tax_query'] = $tax_query;
		}

		$exercice_query = new WP_Query( $args );

		if ( $exercice_query->have_posts() ) {
			$exercice_query->the_post();
			$exercice_id = get_the_ID();

			ob_start();
			?>
			<form id="roi-exercice-form">
				<input type="hidden" id="roi-exercice-id" value="<?php echo esc_attr( (string) $exercice_id ); ?>">
				<h2><?php the_title(); ?></h2>
				<div class="roi-exercice-content">
					<?php echo apply_filters( 'the_content', get_the_content() ); ?>
				</div>

				<?php
				$question_type = get_post_meta( $exercice_id, '_roi_question_type', true );
				$answers       = get_post_meta( $exercice_id, '_roi_answers', true );
				$input_type    = $question_type === 'qcm_multiple' ? 'checkbox' : 'radio';

				if ( ! empty( $answers ) && is_array( $answers ) ) {
					echo '<div class="roi-answers">';
					foreach ( $answers as $index => $answer ) {
						?>
						<label>
							<input type="<?php echo esc_attr( $input_type ); ?>" name="roi_answer[]" value="<?php echo esc_attr( (string) $index ); ?>">
							<?php echo wp_kses_post( self::chess_pieces_filter( $answer['text'] ?? '' ) ); ?>
						</label><br>
						<?php
					}
					echo '</div>';
				}
				?>

				<button type="button" id="roi-submit-answer"><?php _e( 'Valider la réponse', 'roi' ); ?></button>
				<button type="button" id="roi-next-exercice" style="display:none;"><?php _e( 'Exercice Suivant', 'roi' ); ?></button>
			</form>
			<div id="roi-exercice-solution" style="display:none; border-top: 1px solid #ccc; margin-top: 20px; padding-top: 15px;"></div>
			<?php
			$html = ob_get_clean();

			wp_send_json_success( [
				'html' => $html,
				'id'   => $exercice_id,
			] );
		} else {
			wp_send_json_error( __( 'Aucun exercice trouvé avec ces critères.', 'roi' ) );
		}

		wp_reset_postdata();
		wp_die();
	}

	/**
	 * AJAX handler to check user's answer.
	 *
	 * @return void
	 */
	public function check_answer_ajax_handler(): void {
		check_ajax_referer( 'roi_exercice_nonce', 'nonce' );

		if ( ! isset( $_POST['exercise_id'] ) ) {
			wp_send_json_error( 'ID d\'exercice manquant.' );
		}

		$exercise_id = (int) $_POST['exercise_id'];
		parse_str( (string) $_POST['answer'], $submitted_data );
		$user_answers_indices = isset( $submitted_data['roi_answer'] ) ? array_map( 'intval', (array) $submitted_data['roi_answer'] ) : [];

		$correct_answers_indices = [];
		$all_answers             = get_post_meta( $exercise_id, '_roi_answers', true );
		if ( is_array( $all_answers ) ) {
			foreach ( $all_answers as $index => $answer ) {
				if ( ! empty( $answer['correct'] ) ) {
					$correct_answers_indices[] = $index;
				}
			}
		}

		sort( $user_answers_indices );
		sort( $correct_answers_indices );

		$is_correct = ( $user_answers_indices === $correct_answers_indices );

		$solution_html = (string) get_post_meta( $exercise_id, '_roi_solution', true );
		$solution_html = apply_filters( 'the_content', $solution_html );

		$response_data = [
			'correct'               => $is_correct,
			'solution'              => $solution_html,
			'user_selected_indices' => $user_answers_indices,
			'correct_indices'       => $correct_answers_indices,
		];

		if ( $is_correct ) {
			$response_data['message'] = __( 'Bonne réponse !', 'roi' );
		} else {
			$response_data['message'] = __( 'Réponse incorrecte.', 'roi' );
		}

		wp_send_json_success( $response_data );
		wp_die();
	}

	/**
	 * Replaces chess piece shortcodes with Unicode.
	 *
	 * @param string $content Raw content.
	 * @return string Filtered content.
	 */
	public static function chess_pieces_filter( string $content ): string {
		$chess_pieces = [
			// White
			'[RB]' => '<span class="roi-chess-piece">♔</span>',
			'[DB]' => '<span class="roi-chess-piece">♕</span>',
			'[TB]' => '<span class="roi-chess-piece">♖</span>',
			'[FB]' => '<span class="roi-chess-piece">♗</span>',
			'[CB]' => '<span class="roi-chess-piece">♘</span>',
			'[PB]' => '<span class="roi-chess-piece">♙</span>',
			// Black
			'[RN]' => '<span class="roi-chess-piece">♚</span>',
			'[DN]' => '<span class="roi-chess-piece">♛</span>',
			'[TN]' => '<span class="roi-chess-piece">♜</span>',
			'[FN]' => '<span class="roi-chess-piece">♝</span>',
			'[CN]' => '<span class="roi-chess-piece">♞</span>',
			'[PN]' => '<span class="roi-chess-piece">♟</span>',
		];

		return str_replace( array_keys( $chess_pieces ), array_values( $chess_pieces ), $content );
	}
}
