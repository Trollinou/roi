<?php
/**
 * Settings Apprentissage Tab.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Admin\Settings\Tabs;

/**
 * Class Apprentissage
 * Settings tab for Apprentissage module.
 */
class Apprentissage {

	/**
	 * Renders the settings fields.
	 *
	 * @return void
	 */
	public function render(): void {
		// Default allowed roles if not set: administrator, staff, entraineur, editor, membre
		$default_roles = [ 'administrator', 'staff', 'entraineur', 'editor', 'membre' ];
		$allowed_roles = get_option( 'roi_apprentissage_allowed_roles', $default_roles );

		if ( false === $allowed_roles ) {
			$allowed_roles = $default_roles;
		}

		$wp_roles = wp_roles()->get_names();
		?>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label><?php esc_html_e( 'Rôles autorisés', 'roi' ); ?></label>
					</th>
					<td>
						<fieldset>
							<legend class="screen-reader-text">
								<span><?php esc_html_e( 'Rôles autorisés pour le module Apprentissage', 'roi' ); ?></span>
							</legend>
							<?php foreach ( $wp_roles as $role_key => $role_name ) : ?>
								<label for="role_<?php echo esc_attr( $role_key ); ?>" style="display: block; margin-bottom: 8px;">
									<input 
										name="roi_apprentissage_allowed_roles[]" 
										type="checkbox" 
										id="role_<?php echo esc_attr( $role_key ); ?>" 
										value="<?php echo esc_attr( $role_key ); ?>" 
										<?php checked( in_array( $role_key, $allowed_roles, true ) ); ?>
									>
									<?php echo esc_html( translate_user_role( $role_name ) ); ?>
								</label>
							<?php endforeach; ?>
							<p class="description">
								<?php esc_html_e( 'Sélectionnez les rôles autorisés à accéder aux leçons, exercices et parcours de l\'apprentissage.', 'roi' ); ?>
							</p>
						</fieldset>
					</td>
				</tr>
			</tbody>
		</table>
		<?php
	}
}
