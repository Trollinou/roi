/**
 * @file Gère la soumission des réponses AJAX et le feedback sur les pages d'exercices individuels.
 * @author ROI
 * @version 2.0.0
 */

document.addEventListener( 'DOMContentLoaded', () => {
	'use strict';

	const submitBtn = document.getElementById( 'roi-submit-answer' );
	if ( ! submitBtn ) {
		return;
	}

	const exerciseIdInput = document.getElementById( 'roi-exercice-id' );
	const form = document.getElementById( 'roi-exercice-form' );
	const feedbackDiv = document.getElementById( 'roi-exercice-feedback' );
	const solutionDiv = document.getElementById( 'roi-exercice-solution' );

	submitBtn.addEventListener( 'click', async () => {
		const exerciseId = exerciseIdInput?.value;
		if ( ! form || ! exerciseId ) {
			return;
		}

		submitBtn.disabled = true;
		if ( feedbackDiv ) {
			feedbackDiv.innerHTML = '<p>Vérification...</p>';
		}

		try {
			const formData = new FormData( form );
			const searchParams = new URLSearchParams();
			for ( const pair of formData.entries() ) {
				searchParams.append( pair[ 0 ], pair[ 1 ] );
			}

			const requestData = new FormData();
			requestData.append( 'action', 'roi_check_answer' );
			requestData.append( 'nonce', roi_single_exercice_ajax.nonce );
			requestData.append( 'exercise_id', exerciseId );
			requestData.append( 'answer', searchParams.toString() );

			const response = await fetch( roi_single_exercice_ajax.ajax_url, {
				method: 'POST',
				body: requestData,
			} );

			const data = await response.json();

			if ( data.success ) {
				const result = data.data;
				const inputs = form.querySelectorAll(
					'input[name="roi_answer[]"]'
				);
				const userSelected = result.user_selected_indices || [];
				const correctAnswers = result.correct_indices || [];

				// Désactiver tous les champs et cacher le bouton
				inputs.forEach( ( input ) => ( input.disabled = true ) );
				submitBtn.style.display = 'none';

				// Appliquer la coloration
				inputs.forEach( ( input ) => {
					const inputValue = parseInt( input.value, 10 );
					const label = input.closest( 'label' );
					const isSelected = userSelected.includes( inputValue );
					const isCorrect = correctAnswers.includes( inputValue );

					if ( label ) {
						if ( isCorrect ) {
							label.classList.add( 'correct-answer' );
						}
						if ( isSelected && ! isCorrect ) {
							label.classList.add( 'user-incorrect-choice' );
						}
					}
				} );

				// Afficher le message de feedback
				if ( feedbackDiv ) {
					const color = result.correct ? 'green' : 'red';
					feedbackDiv.innerHTML = `<p style="color:${ color }; font-weight: bold;">${ result.message }</p>`;
				}

				if ( solutionDiv ) {
					solutionDiv.innerHTML = result.solution;
					solutionDiv.style.display = 'block';
				}
			} else {
				if ( feedbackDiv ) {
					feedbackDiv.innerHTML = `<p style="color:red;">${ data.data }</p>`;
				}
				submitBtn.disabled = false;
			}
		} catch ( error ) {
			if ( feedbackDiv ) {
				feedbackDiv.innerHTML =
					'<p style="color:red;">Une erreur est survenue lors de la validation.</p>';
			}
			submitBtn.disabled = false;
			console.error( 'ROI Error:', error );
		}
	} );
} );
