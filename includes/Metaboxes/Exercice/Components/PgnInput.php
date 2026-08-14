<?php
/**
 * PgnInput Component
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Exercice\Components;

/**
 * Class PgnInput
 * Renders a standardized PGN input group with edit button.
 */
class PgnInput {

	/**
	 * Renders the unified PGN input control group.
	 *
	 * @param array<string, mixed> $args Configuration arguments.
	 * @return void
	 */
	public static function render( array $args = array() ): void {
		$id               = isset( $args['id'] ) && is_string( $args['id'] ) ? $args['id'] : 'roi_pgn_input';
		$name             = isset( $args['name'] ) && is_string( $args['name'] ) ? $args['name'] : '';
		$value            = isset( $args['value'] ) && is_string( $args['value'] ) ? $args['value'] : '';
		$label            = isset( $args['label'] ) && is_string( $args['label'] ) ? $args['label'] : __( 'Séquence PGN :', 'roi' );
		$rows             = isset( $args['rows'] ) ? (int) $args['rows'] : 4;
		$placeholder      = isset( $args['placeholder'] ) && is_string( $args['placeholder'] ) ? $args['placeholder'] : __( 'Saisir ou éditer la séquence PGN...', 'roi' );
		$button_id        = isset( $args['button_id'] ) && is_string( $args['button_id'] ) ? $args['button_id'] : $id . '_btn';
		$button_label     = isset( $args['button_label'] ) && is_string( $args['button_label'] ) ? $args['button_label'] : __( 'Éditer le PGN', 'roi' );
		$input_class      = isset( $args['input_class'] ) && is_string( $args['input_class'] ) ? $args['input_class'] : 'roi-pgn-field';
		$button_class     = isset( $args['button_class'] ) && is_string( $args['button_class'] ) ? $args['button_class'] : 'button roi-btn-open-pgn-editor';
		$readonly         = isset( $args['readonly'] ) && (bool) $args['readonly'];
		$show_orientation = isset( $args['show_orientation'] ) && (bool) $args['show_orientation'];
		$color            = isset( $args['color'] ) && is_string( $args['color'] ) ? $args['color'] : 'white';
		$orientation_id   = isset( $args['orientation_id'] ) && is_string( $args['orientation_id'] ) ? $args['orientation_id'] : $id . '_color';
		$orientation_name = isset( $args['orientation_name'] ) && is_string( $args['orientation_name'] ) ? $args['orientation_name'] : '';
		$color_class      = isset( $args['color_class'] ) && is_string( $args['color_class'] ) ? $args['color_class'] : 'roi-color-field';

		// Build data attributes string.
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

		$container_class = 'roi-control-group roi-control-pgn';
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

			<div class="roi-control-textarea-wrapper">
				<textarea id="<?php echo esc_attr( $id ); ?>" 
							<?php
							if ( ! empty( $name ) ) :
								?>
								name="<?php echo esc_attr( $name ); ?>"<?php endif; ?> 
							rows="<?php echo (int) $rows; ?>" 
							class="large-text code roi-control-textarea <?php echo esc_attr( $input_class ); ?>" 
							placeholder="<?php echo esc_attr( $placeholder ); ?>"
							<?php echo $readonly ? 'readonly' : ''; ?>
							<?php echo $data_attrs_str; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_textarea( $value ); ?></textarea>

				<div class="roi-control-actions">
					<button type="button" 
							id="<?php echo esc_attr( $button_id ); ?>" 
							class="<?php echo esc_attr( $button_class ); ?>" 
							title="<?php esc_attr_e( 'Éditer le PGN dans l\'éditeur interactif', 'roi' ); ?>"
							data-target-pgn="<?php echo esc_attr( $id ); ?>"
							<?php echo $data_attrs_str; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
						<span class="dashicons dashicons-edit"></span>
						<span class="roi-btn-text"><?php echo esc_html( $button_label ); ?></span>
					</button>

					<?php if ( $show_orientation ) : ?>
						<div class="roi-control-orientation-wrapper" style="margin-left: auto;">
							<label for="<?php echo esc_attr( $orientation_id ); ?>" class="roi-control-sublabel">
								<strong><?php esc_html_e( 'Orientation :', 'roi' ); ?></strong>
							</label>
							<select id="<?php echo esc_attr( $orientation_id ); ?>" 
									<?php
									if ( ! empty( $orientation_name ) ) :
										?>
										name="<?php echo esc_attr( $orientation_name ); ?>"<?php endif; ?> 
									class="roi-control-select <?php echo esc_attr( $color_class ); ?>"
									<?php echo $data_attrs_str; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
								<option value="white" <?php selected( $color, 'white' ); ?>>♔ <?php esc_html_e( 'Blancs', 'roi' ); ?></option>
								<option value="black" <?php selected( $color, 'black' ); ?>>♚ <?php esc_html_e( 'Noirs', 'roi' ); ?></option>
							</select>
						</div>
					<?php endif; ?>
				</div>
			</div>
		</div>
		<?php
	}
}
