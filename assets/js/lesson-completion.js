/**
 * @file Gère la fonctionnalité AJAX pour le bouton "Marquer comme terminée" sur les pages de leçons.
 * @author ROI
 * @version 2.0.0
 */

document.addEventListener( 'DOMContentLoaded', () => {
	'use strict';

	const completeBtn = document.getElementById( 'roi-complete-lesson-btn' );
	if ( ! completeBtn ) {
		return;
	}

	const feedbackDiv = document.getElementById(
		'roi-lesson-completion-feedback'
	);

	completeBtn.addEventListener( 'click', async () => {
		const lessonId = completeBtn.getAttribute( 'data-lesson-id' );
		if ( ! lessonId ) {
			return;
		}

		completeBtn.disabled = true;
		if ( feedbackDiv ) {
			feedbackDiv.textContent = 'Traitement en cours...';
			feedbackDiv.style.color = 'inherit';
		}

		try {
			const formData = new FormData();
			formData.append( 'action', 'roi_complete_lesson' );
			formData.append( 'nonce', roi_ajax.nonce );
			formData.append( 'lesson_id', lessonId );

			const response = await fetch( roi_ajax.ajax_url, {
				method: 'POST',
				body: formData,
			} );

			const data = await response.json();

			if ( data.success ) {
				if ( feedbackDiv ) {
					feedbackDiv.textContent = data.data;
					feedbackDiv.style.color = 'green';
				}
				completeBtn.style.display = 'none';
			} else {
				if ( feedbackDiv ) {
					feedbackDiv.textContent = data.data;
					feedbackDiv.style.color = 'red';
				}
				completeBtn.disabled = false;
			}
		} catch ( error ) {
			if ( feedbackDiv ) {
				feedbackDiv.textContent = 'Une erreur est survenue.';
				feedbackDiv.style.color = 'red';
			}
			completeBtn.disabled = false;
			console.error( 'ROI Error:', error );
		}
	} );
} );
