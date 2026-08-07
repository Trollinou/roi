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
	 * Renders the unified FEN input control group.
	 *
	 * @param array<string, mixed> $args Configuration arguments.
	 * @return void
	 */
	public static function render( array $args = [] ): void {
		$id               = isset( $args['id'] ) && is_string( $args['id'] ) ? $args['id'] : 'roi_fen_input';
		$name             = isset( $args['name'] ) && is_string( $args['name'] ) ? $args['name'] : '';
		$value            = isset( $args['value'] ) && is_string( $args['value'] ) ? $args['value'] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		$color            = isset( $args['color'] ) && is_string( $args['color'] ) ? $args['color'] : 'white';
		$label            = isset( $args['label'] ) && is_string( $args['label'] ) ? $args['label'] : __( 'Position de départ (FEN) :', 'roi' );
		$show_orientation = ! isset( $args['show_orientation'] ) || (bool) $args['show_orientation'];
		$orientation_id   = isset( $args['orientation_id'] ) && is_string( $args['orientation_id'] ) ? $args['orientation_id'] : $id . '_color';
		$orientation_name = isset( $args['orientation_name'] ) && is_string( $args['orientation_name'] ) ? $args['orientation_name'] : '';
		$button_id        = isset( $args['button_id'] ) && is_string( $args['button_id'] ) ? $args['button_id'] : $id . '_btn';
		$button_label     = isset( $args['button_label'] ) && is_string( $args['button_label'] ) ? $args['button_label'] : __( 'Éditer la position', 'roi' );
		$input_class      = isset( $args['input_class'] ) && is_string( $args['input_class'] ) ? $args['input_class'] : 'roi-fen-field';
		$color_class      = isset( $args['color_class'] ) && is_string( $args['color_class'] ) ? $args['color_class'] : 'roi-color-field';
		$button_class     = isset( $args['button_class'] ) && is_string( $args['button_class'] ) ? $args['button_class'] : 'button roi-btn-open-fen-editor';
		$readonly         = isset( $args['readonly'] ) && (bool) $args['readonly'];
		
		// Build data attributes string
		$data_attrs_str = '';
		if ( isset( $args['data_attributes'] ) ) {
			if ( is_array( $args['data_attributes'] ) ) {
				foreach ( $args['data_attributes'] as $attr_key => $attr_val ) {
					$data_attrs_str .= ' data-' . esc_attr( $attr_key ) . '="' . esc_attr( (string) $attr_val ) . '"';
				}
			} elseif ( is_string( $args['data_attributes'] ) ) {
				$data_attrs_str = ' ' . trim( $args['data_attributes'] );
			}
		}

		$container_class = 'roi-control-group roi-control-fen';
		if ( isset( $args['container_class'] ) && is_string( $args['container_class'] ) ) {
			$container_class .= ' ' . trim( $args['container_class'] );
		}
		?>
		<div class="<?php echo esc_attr( $container_class ); ?>">
			<?php if ( ! empty( $label ) ) : ?>
				<label for="<?php echo esc_attr( $id ); ?>" class="roi-control-label">
					<strong><?php echo esc_html( $label ); ?></strong>
				</label>
			<?php endif; ?>

			<div class="roi-control-inline">
				<div class="roi-control-input-wrapper">
					<input type="text" 
					       id="<?php echo esc_attr( $id ); ?>" 
					       <?php if ( ! empty( $name ) ) : ?>name="<?php echo esc_attr( $name ); ?>"<?php endif; ?> 
					       value="<?php echo esc_attr( $value ); ?>" 
					       class="regular-text roi-control-input <?php echo esc_attr( $input_class ); ?>" 
					       placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
					       <?php echo $readonly ? 'readonly' : ''; ?>
					       <?php echo $data_attrs_str; ?>>
					
					<button type="button" 
					        id="<?php echo esc_attr( $button_id ); ?>" 
					        class="<?php echo esc_attr( $button_class ); ?>" 
					        title="<?php esc_attr_e( 'Éditer la position visuellement', 'roi' ); ?>"
					        data-target-fen="<?php echo esc_attr( $id ); ?>"
					        <?php if ( $show_orientation ) : ?>data-target-color="<?php echo esc_attr( $orientation_id ); ?>"<?php endif; ?>
					        <?php echo $data_attrs_str; ?>>
						<span class="dashicons dashicons-edit"></span>
						<span class="roi-btn-text"><?php echo esc_html( $button_label ); ?></span>
					</button>
				</div>

				<?php if ( $show_orientation ) : ?>
					<div class="roi-control-orientation-wrapper">
						<label for="<?php echo esc_attr( $orientation_id ); ?>" class="roi-control-sublabel">
							<strong><?php esc_html_e( 'Orientation :', 'roi' ); ?></strong>
						</label>
						<select id="<?php echo esc_attr( $orientation_id ); ?>" 
						        <?php if ( ! empty( $orientation_name ) ) : ?>name="<?php echo esc_attr( $orientation_name ); ?>"<?php endif; ?> 
						        class="roi-control-select <?php echo esc_attr( $color_class ); ?>"
						        <?php echo $data_attrs_str; ?>>
							<option value="white" <?php selected( $color, 'white' ); ?>>♔ <?php esc_html_e( 'Blancs', 'roi' ); ?></option>
							<option value="black" <?php selected( $color, 'black' ); ?>>♚ <?php esc_html_e( 'Noirs', 'roi' ); ?></option>
						</select>
					</div>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}
}
