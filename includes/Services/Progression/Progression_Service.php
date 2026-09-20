<?php
/**
 * Student Progression Service.
 *
 * @package ROI
 */

declare(strict_types=1);

namespace ROI\Services\Progression;

/**
 * Class Progression_Service
 * Handles business logic for student exercise and lesson progression.
 */
class Progression_Service {

	/**
	 * Enregistre la progression d'un élève pour une liste d'éléments.
	 *
	 * @param int        $user_id       WordPress user ID.
	 * @param string     $meta_key      User meta key for the student/identity.
	 * @param array<int> $elements_todo List of post IDs to validate.
	 * @param int        $time_spent    Time spent in seconds.
	 * @param int        $attempts      Attempt count.
	 * @param bool       $is_trainer    Whether the validation is triggered by a trainer.
	 * @return int Number of newly validated items.
	 */
	public function enregistrer(
		int $user_id,
		string $meta_key,
		array $elements_todo,
		int $time_spent = 0,
		int $attempts = 1,
		bool $is_trainer = false
	): int {
		$meta_entries    = get_user_meta( $user_id, $meta_key, false );
		$already_val_map = array();

		if ( is_array( $meta_entries ) ) {
			foreach ( $meta_entries as $entry ) {
				if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
					$already_val_map[ (int) $entry['element_id'] ] = $entry;
				}
			}
		}

		$validated_count = 0;

		foreach ( $elements_todo as $elem_id ) {
			$post = get_post( $elem_id );
			if ( ! $post || ! in_array( $post->post_type, array( 'roi_exercice', 'roi_lecon', 'roi_video' ), true ) ) {
				continue;
			}

			if ( ! isset( $already_val_map[ $elem_id ] ) ) {
				$data = array(
					'element_id' => $elem_id,
					'date'       => current_time( 'mysql' ),
					'time_spent' => max( 0, $time_spent ),
					'attempts'   => max( 1, $attempts ),
				);
				if ( $is_trainer ) {
					$data['source'] = 'club';
				}
				add_user_meta( $user_id, $meta_key, $data, false );
				$already_val_map[ $elem_id ] = $data;
				++$validated_count;
			} elseif ( ! $is_trainer && $time_spent > 0 ) {
				$old_entry = $already_val_map[ $elem_id ];
				if ( empty( $old_entry['time_spent'] ) ) {
					$updated_entry               = $old_entry;
					$updated_entry['time_spent'] = $time_spent;
					if ( $attempts > 0 ) {
						$updated_entry['attempts'] = $attempts;
					}
					update_user_meta( $user_id, $meta_key, $updated_entry, $old_entry );
					$already_val_map[ $elem_id ] = $updated_entry;
				}
			}
		}

		return $validated_count;
	}

	/**
	 * Récupère les IDs d'éléments validés pour un utilisateur et une clé d'identité.
	 *
	 * @param int    $user_id  WordPress user ID.
	 * @param string $meta_key User meta key.
	 * @return array<int> List of validated element IDs.
	 */
	public function obtenir( int $user_id, string $meta_key ): array {
		$meta_entries = get_user_meta( $user_id, $meta_key, false );
		$elements     = array();

		if ( is_array( $meta_entries ) ) {
			foreach ( $meta_entries as $entry ) {
				if ( is_array( $entry ) && isset( $entry['element_id'] ) ) {
					$elem_id = (int) $entry['element_id'];
					if ( $elem_id > 0 ) {
						$elements[] = $elem_id;
					}
				}
			}
		}

		return array_values( array_unique( $elements ) );
	}
}
