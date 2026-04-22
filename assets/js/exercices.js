/**
 * @file Gère l'interface interactive des exercices pour le shortcode [roi_exercices].
 * @author ROI
 * @version 2.0.0
 */

document.addEventListener( 'DOMContentLoaded', () => {
	'use strict';

	let scoreCorrect = 0;
	let scoreAttempted = 0;
	let currentExerciseId = null;

	const wrapper = document.getElementById( 'roi-exercices-wrapper' );
	if ( ! wrapper ) {
		return;
	}

	const displayDiv = document.getElementById( 'roi-exercice-display' );
	const scoreCorrectSpan = document.getElementById( 'roi-score-correct' );
	const scoreAttemptedSpan = document.getElementById( 'roi-score-attempted' );

	// Démarrer les exercices
	const startBtn = document.getElementById( 'roi-start-exercices' );
	startBtn?.addEventListener( 'click', () => fetchNextExercise() );

	// Délégation d'événements pour le conteneur d'affichage
	displayDiv?.addEventListener( 'click', ( event ) => {
		const target = event.target;
		if ( target.id === 'roi-submit-answer' ) {
			submitAnswer();
		} else if ( target.id === 'roi-next-exercice' ) {
			fetchNextExercise();
		}
	} );

	/**
	 * Récupère l'exercice suivant via AJAX (Fetch API).
	 */
	async function fetchNextExercise() {
		const difficulty = document.getElementById(
			'roi-difficulty-filter'
		)?.value;
		const category = document.getElementById(
			'roi-category-filter'
		)?.value;

		if ( displayDiv ) {
			displayDiv.innerHTML = '<p>Chargement du prochain exercice...</p>';
		}

		try {
			const formData = new FormData();
			formData.append( 'action', 'roi_fetch_exercice' );
			formData.append( 'nonce', roi_exercices_ajax.nonce );
			formData.append( 'difficulty', difficulty ?? 'any' );
			formData.append( 'category', category ?? 'any' );
			if ( currentExerciseId ) {
				formData.append( 'exclude', currentExerciseId );
			}

			const response = await fetch( roi_exercices_ajax.ajax_url, {
				method: 'POST',
				body: formData,
			} );

			const data = await response.json();

			if ( data.success ) {
				if ( displayDiv ) {
					displayDiv.innerHTML = data.data.html;
				}
				currentExerciseId = data.data.id;
			} else if ( displayDiv ) {
				displayDiv.innerHTML = `<p>${ data.data }</p>`;
			}
		} catch ( error ) {
			if ( displayDiv ) {
				displayDiv.innerHTML =
					'<p>Une erreur est survenue lors du chargement.</p>';
			}
			console.error( 'ROI Error:', error );
		}
	}

	/**
	 * Soumet la réponse de l'utilisateur.
	 */
	async function submitAnswer() {
		const form = document.getElementById( 'roi-exercice-form' );
		const exerciseId = document.getElementById( 'roi-exercice-id' )?.value;
		const submitButton = document.getElementById( 'roi-submit-answer' );

		if ( ! form || ! exerciseId || ! submitButton ) {
			return;
		}

		const solutionDiv = document.getElementById( 'roi-exercice-solution' );
		submitButton.disabled = true;

		try {
			// Sérialisation manuelle simple pour cet usage
			const formData = new FormData( form );
			const searchParams = new URLSearchParams();
			for ( const pair of formData.entries() ) {
				searchParams.append( pair[ 0 ], pair[ 1 ] );
			}

			const requestData = new FormData();
			requestData.append( 'action', 'roi_check_answer' );
			requestData.append( 'nonce', roi_exercices_ajax.nonce );
			requestData.append( 'exercise_id', exerciseId );
			requestData.append( 'answer', searchParams.toString() );

			const response = await fetch( roi_exercices_ajax.ajax_url, {
				method: 'POST',
				body: requestData,
			} );

			const data = await response.json();

			scoreAttempted++;
			if ( scoreAttemptedSpan ) {
				scoreAttemptedSpan.textContent = scoreAttempted.toString();
			}

			if ( data.success ) {
				const result = data.data;
				const feedbackColor = result.correct ? 'green' : 'red';
				const feedbackHtml = `<p style="color:${ feedbackColor }; font-weight: bold;">${ result.message }</p>`;

				if ( result.correct ) {
					scoreCorrect++;
					if ( scoreCorrectSpan ) {
						scoreCorrectSpan.textContent = scoreCorrect.toString();
					}
				}

				if ( solutionDiv ) {
					solutionDiv.insertAdjacentHTML(
						'beforebegin',
						feedbackHtml
					);
					solutionDiv.innerHTML = result.solution;
					solutionDiv.style.display = 'block';
				}

				submitButton.style.display = 'none';
				document.getElementById( 'roi-next-exercice' ).style.display =
					'inline-block';
			} else {
				solutionDiv?.insertAdjacentHTML(
					'beforebegin',
					`<p style="color:red;">${ data.data }</p>`
				);
				submitButton.disabled = false;
			}
		} catch ( error ) {
			solutionDiv?.insertAdjacentHTML(
				'beforebegin',
				'<p style="color:red;">Une erreur est survenue lors de la validation.</p>'
			);
			submitButton.disabled = false;
			console.error( 'ROI Error:', error );
		}
	}
} );
