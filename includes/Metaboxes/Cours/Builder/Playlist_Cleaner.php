<?php
/**
 * Playlist Cleaner for Cours CPT.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Metaboxes\Cours\Builder;

/**
 * Class Playlist_Cleaner
 * Removes deleted or trashed lessons, exercises and videos from all course playlists.
 */
class Playlist_Cleaner {

	/**
	 * Registers deletion/trash hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'wp_trash_post', array( $this, 'handle_deleted_element' ) );
		add_action( 'before_delete_post', array( $this, 'handle_deleted_element' ) );
	}

	/**
	 * Removes deleted or trashed lessons, exercises and videos from all course playlists.
	 *
	 * @param int $post_id The post ID being deleted or trashed.
	 * @return void
	 */
	public function handle_deleted_element( int $post_id ): void {
		$post_type = get_post_type( $post_id );
		if ( ! in_array( $post_type, array( 'roi_exercice', 'roi_lecon', 'roi_video' ), true ) ) {
			return;
		}

		global $wpdb;
		// Find all roi_cours meta containing this ID.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Direct cleanup lookup for postmeta referencing deleted element.
		$courses = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_roi_cours_playlist' AND (meta_value LIKE %s OR meta_value LIKE %s)",
				'%"id":' . $post_id . '%',
				'%"id":"' . $post_id . '"%'
			)
		);

		if ( empty( $courses ) || ! is_array( $courses ) ) {
			return;
		}

		foreach ( $courses as $course_meta ) {
			$course_id = (int) $course_meta->post_id;
			$raw_meta  = (string) $course_meta->meta_value;
			$decoded   = json_decode( $raw_meta, true );
			if ( ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $decoded ) ) ) {
				$decoded = json_decode( wp_unslash( $raw_meta ), true );
			}

			if ( is_array( $decoded ) ) {
				$new_playlist = array_values(
					array_filter(
						$decoded,
						function ( $item ) use ( $post_id ): bool {
							return isset( $item['id'] ) && (int) $item['id'] !== $post_id;
						}
					)
				);

				update_post_meta( $course_id, '_roi_cours_playlist', wp_json_encode( $new_playlist ) );
			}
		}
	}
}
