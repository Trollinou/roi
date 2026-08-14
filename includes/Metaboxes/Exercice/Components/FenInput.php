<?php
/**
 * FenInput Component
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Components;

/**
 * Class FenInput
 * Renders a standardized FEN input group with edit button and orientation selector.
 */
class FenInput {

	/**
	 * Renders the unified FEN & Diagram input control group.
	 *
	 * @param array<string, mixed> $args Configuration arguments.
	 * @return void
	 */
	public static function render( array $args = array() ): void {
		$id                = isset( $args['id'] ) && is_string( $args['id'] ) ? $args['id'] : 'roi_fen_input';
		$name              = isset( $args['name'] ) && is_string( $args['name'] ) ? $args['name'] : '';
		$value             = isset( $args['value'] ) && is_string( $args['value'] ) ? $args['value'] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		$shapes            = $args['shapes'] ?? array();
		$label             = isset( $args['label'] ) && is_string( $args['label'] ) ? $args['label'] : __( 'Position de départ (FEN) :', 'roi' );
		$show_orientation  = ! isset( $args['show_orientation'] ) || (bool) $args['show_orientation'];
		$orientation_id    = isset( $args['orientation_id'] ) && is_string( $args['orientation_id'] ) ? $args['orientation_id'] : $id . '_color';
		$orientation_name  = isset( $args['orientation_name'] ) && is_string( $args['orientation_name'] ) ? $args['orientation_name'] : '';
		$shapes_id         = isset( $args['shapes_id'] ) && is_string( $args['shapes_id'] ) ? $args['shapes_id'] : $id . '_shapes';
		$shapes_name       = isset( $args['shapes_name'] ) && is_string( $args['shapes_name'] ) ? $args['shapes_name'] : '';
		$shapes_summary_id = isset( $args['shapes_summary_id'] ) && is_string( $args['shapes_summary_id'] ) ? $args['shapes_summary_id'] : $id . '_shapes_summary';
		$button_id         = isset( $args['button_id'] ) && is_string( $args['button_id'] ) ? $args['button_id'] : $id . '_btn';
		$button_label      = isset( $args['button_label'] ) && is_string( $args['button_label'] ) ? $args['button_label'] : __( 'Éditer la position', 'roi' );
		$input_class       = isset( $args['input_class'] ) && is_string( $args['input_class'] ) ? $args['input_class'] : 'roi-fen-field';
		$color_class       = isset( $args['color_class'] ) && is_string( $args['color_class'] ) ? $args['color_class'] : 'roi-color-field';
		$button_class      = isset( $args['button_class'] ) && is_string( $args['button_class'] ) ? $args['button_class'] : 'button roi-btn-open-fen-editor';
		$readonly          = isset( $args['readonly'] ) && (bool) $args['readonly'];

		// Build data attributes string.
		$data_attrs_str = '';
		if ( isset( $args['data_attributes'] ) ) {
			if ( is_array( $args['data_attributes'] ) ) {
				foreach ( $args['data_attributes'] as $attr_key => $attr_val ) {
					$data_attrs_str .= ' data-' . esc_attr( (string) $attr_key ) . '="' . esc_attr( (string) $attr_val ) . '"';
				}
			} elseif ( is_string( $args['data_attributes'] ) ) {
				$data_attrs_str = ' ' . trim( $args['data_attributes'] );
			}
		}

		$container_class = 'roi-control-group roi-control-fen';
		if ( isset( $args['container_class'] ) && is_string( $args['container_class'] ) ) {
			$container_class .= ' ' . trim( $args['container_class'] );
		}

		// Calculate active color and orientation display.
		$parts               = explode( ' ', trim( $value ) );
		$active_color        = ( isset( $parts[1] ) && 'b' === strtolower( $parts[1] ) ) ? 'black' : 'white';
		$orientation_display = ( 'black' === $active_color ) ? __( 'Noir', 'roi' ) : __( 'Blanc', 'roi' );

		// Process initial shapes array & count circles and arrows.
		$shapes_list = array();
		if ( is_string( $shapes ) && ! empty( $shapes ) ) {
			$decoded = json_decode( $shapes, true );
			if ( is_array( $decoded ) ) {
				$shapes_list = $decoded;
			}
		} elseif ( is_array( $shapes ) ) {
			$shapes_list = $shapes;
		}

		$circles = 0;
		$arrows  = 0;
		foreach ( $shapes_list as $s ) {
			if ( is_array( $s ) && isset( $s['orig'] ) ) {
				if ( isset( $s['dest'] ) && $s['dest'] !== $s['orig'] ) {
					++$arrows;
				} else {
					++$circles;
				}
			}
		}
		$shapes_summary = sprintf( '%d ◯ - %d ➔', $circles, $arrows );
		$shapes_json    = wp_json_encode( $shapes_list );
		?>
		<div class="<?php echo esc_attr( $container_class ); ?>">
			<?php if ( ! empty( $label ) ) : ?>
				<label for="<?php echo esc_attr( $id ); ?>" class="roi-control-label">
					<strong><?php echo esc_html( $label ); ?></strong>
				</label>
			<?php endif; ?>

			<div class="roi-control-inline roi-fen-input-group">
				<div class="roi-control-input-wrapper roi-fen-wrapper">
					<input type="text" 
							id="<?php echo esc_attr( $id ); ?>" 
							<?php
							if ( ! empty( $name ) ) :
								?>
								name="<?php echo esc_attr( $name ); ?>"<?php endif; ?> 
							value="<?php echo esc_attr( $value ); ?>" 
							class="regular-text roi-control-input <?php echo esc_attr( $input_class ); ?>" 
							placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
							<?php echo $readonly ? 'readonly' : ''; ?>
							<?php echo $data_attrs_str; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
				</div>

				<?php if ( $show_orientation ) : ?>
					<div class="roi-control-orientation-wrapper">
						<label for="<?php echo esc_attr( $orientation_id ); ?>" class="roi-control-sublabel">
							<strong><?php esc_html_e( 'Orientation :', 'roi' ); ?></strong>
						</label>
						<input type="text" 
								id="<?php echo esc_attr( $orientation_id ); ?>" 
								<?php
								if ( ! empty( $orientation_name ) ) :
									?>
									name="<?php echo esc_attr( $orientation_name ); ?>"<?php endif; ?> 
								value="<?php echo esc_attr( $orientation_display ); ?>" 
								class="roi-control-input-readonly roi-orientation-field <?php echo esc_attr( $color_class ); ?>"
								readonly 
								tabindex="-1"
								data-color="<?php echo esc_attr( $active_color ); ?>"
								<?php echo $data_attrs_str; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
					</div>
				<?php endif; ?>

				<div class="roi-control-shapes-wrapper">
					<label for="<?php echo esc_attr( $shapes_summary_id ); ?>" class="roi-control-sublabel">
						<strong><?php esc_html_e( 'Formes :', 'roi' ); ?></strong>
					</label>
					<input type="text" 
							id="<?php echo esc_attr( $shapes_summary_id ); ?>" 
							value="<?php echo esc_attr( $shapes_summary ); ?>" 
							class="roi-control-input-readonly roi-shapes-summary-field" 
							readonly 
							tabindex="-1"
							title="<?php esc_attr_e( 'Nombre de cercles (◯) et flèches (➔)', 'roi' ); ?>">
					<input type="hidden" 
							id="<?php echo esc_attr( $shapes_id ); ?>" 
							<?php
							if ( ! empty( $shapes_name ) ) :
								?>
								name="<?php echo esc_attr( $shapes_name ); ?>"<?php endif; ?> 
							value="<?php echo esc_attr( false !== $shapes_json ? $shapes_json : '[]' ); ?>" 
							class="roi-shapes-field">
				</div>

				<div class="roi-control-button-wrapper">
					<button type="button" 
							id="<?php echo esc_attr( $button_id ); ?>" 
							class="<?php echo esc_attr( $button_class ); ?>" 
							title="<?php esc_attr_e( 'Éditer la position visuellement', 'roi' ); ?>"
							data-target-fen="<?php echo esc_attr( $id ); ?>"
							<?php
							if ( $show_orientation ) :
								?>
								data-target-color="<?php echo esc_attr( $orientation_id ); ?>"<?php endif; ?>
							data-target-shapes="<?php echo esc_attr( $shapes_id ); ?>"
							data-target-shapes-summary="<?php echo esc_attr( $shapes_summary_id ); ?>"
							<?php echo $data_attrs_str; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
						<span class="dashicons dashicons-edit"></span>
						<span class="roi-btn-text"><?php echo esc_html( $button_label ); ?></span>
					</button>
				</div>
			</div>
		</div>
		<?php
	}
}
