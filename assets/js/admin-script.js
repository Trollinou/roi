/**
 * @file Gère l'interface de double liste pour la métabox du Constructeur de Cours dans l'admin WordPress.
 * @author ROI
 * @version 2.0.0
 */

document.addEventListener( 'DOMContentLoaded', () => {
	'use strict';

	const courseList = document.getElementById( 'roi-course-items-select' );
	const difficultySelect = document.getElementById( 'roi_difficulty' );

	if ( ! courseList || ! difficultySelect ) {
		return;
	}

	const availableList = document.getElementById(
		'roi-available-items-select'
	);
	const hiddenInputsContainer = document.getElementById(
		'roi-course-items-hidden-inputs'
	);
	const availableItemsPlaceholder = document.getElementById(
		'roi-available-items-placeholder'
	);

	const i18n = roi_course_builder_data.i18n;

	/**
	 * Récupère les éléments disponibles via AJAX (Fetch API).
	 */
	async function fetchAvailableItems() {
		const difficulty = difficultySelect.value;

		if ( ! difficulty ) {
			if ( availableList ) {
				availableList.innerHTML = '';
				availableList.disabled = true;
			}
			if ( availableItemsPlaceholder ) {
				availableItemsPlaceholder.textContent = i18n.no_content;
				availableItemsPlaceholder.style.display = 'block';
			}
			return;
		}

		if ( availableList ) {
			availableList.innerHTML = '';
			availableList.disabled = true;
		}
		if ( availableItemsPlaceholder ) {
			availableItemsPlaceholder.textContent = i18n.loading;
			availableItemsPlaceholder.style.display = 'block';
		}

		try {
			const formData = new FormData();
			formData.append( 'action', 'roi_get_course_builder_items' );
			formData.append( 'nonce', roi_course_builder_data.nonce );
			formData.append( 'difficulty', difficulty );
			formData.append( 'course_id', roi_course_builder_data.course_id );

			const response = await fetch( roi_course_builder_data.ajax_url, {
				method: 'POST',
				body: formData,
			} );

			const data = await response.json();

			if ( data.success ) {
				const { lessons, exercices } = data.data;

				if ( availableList ) {
					if ( lessons.length > 0 ) {
						const lessonGroup =
							document.createElement( 'optgroup' );
						lessonGroup.label = i18n.lessons;
						lessons.forEach( ( item ) => {
							const opt = new Option(
								item.title,
								`lecon:${ item.id }`
							);
							lessonGroup.appendChild( opt );
						} );
						availableList.appendChild( lessonGroup );
					}

					if ( exercices.length > 0 ) {
						const exerciceGroup =
							document.createElement( 'optgroup' );
						exerciceGroup.label = i18n.exercices;
						exercices.forEach( ( item ) => {
							const opt = new Option(
								item.title,
								`exercice:${ item.id }`
							);
							exerciceGroup.appendChild( opt );
						} );
						availableList.appendChild( exerciceGroup );
					}

					if ( lessons.length === 0 && exercices.length === 0 ) {
						if ( availableItemsPlaceholder ) {
							availableItemsPlaceholder.textContent =
								i18n.no_content;
							availableItemsPlaceholder.style.display = 'block';
						}
					} else if ( availableItemsPlaceholder ) {
						availableItemsPlaceholder.style.display = 'none';
					}

					availableList.disabled = false;
				}
			} else if ( availableItemsPlaceholder ) {
				availableItemsPlaceholder.textContent = i18n.error;
			}
		} catch ( error ) {
			if ( availableItemsPlaceholder ) {
				availableItemsPlaceholder.textContent = i18n.error;
			}
			console.error( 'ROI Error:', error );
		}
	}

	// Gestion du changement de difficulté avec confirmation si la liste n'est pas vide
	let previousDifficulty = difficultySelect.value;
	difficultySelect.addEventListener( 'change', () => {
		if ( courseList.options.length > 0 ) {
			if (
				confirm(
					'Changer le niveau de difficulté videra la liste des leçons et exercices déjà sélectionnés. Voulez-vous continuer ?'
				)
			) {
				courseList.innerHTML = '';
				syncHiddenInputs();
				fetchAvailableItems();
				previousDifficulty = difficultySelect.value;
			} else {
				difficultySelect.value = previousDifficulty;
			}
		} else {
			fetchAvailableItems();
			previousDifficulty = difficultySelect.value;
		}
	} );

	// Chargement initial
	if ( difficultySelect.value ) {
		fetchAvailableItems();
	}

	/**
	 * Synchronise les champs cachés avec la liste du cours.
	 */
	function syncHiddenInputs() {
		if ( ! hiddenInputsContainer ) {
			return;
		}
		hiddenInputsContainer.innerHTML = '';
		Array.from( courseList.options ).forEach( ( opt ) => {
			const input = document.createElement( 'input' );
			input.type = 'hidden';
			input.name = 'roi_course_items[]';
			input.value = opt.value;
			hiddenInputsContainer.appendChild( input );
		} );
	}

	// Ajouter au cours
	document
		.getElementById( 'roi-add-to-course' )
		?.addEventListener( 'click', () => {
			if ( ! availableList ) {
				return;
			}
			Array.from( availableList.selectedOptions ).forEach( ( opt ) => {
				courseList.appendChild( opt );
			} );
			syncHiddenInputs();
		} );

	// Retirer du cours
	document
		.getElementById( 'roi-remove-from-course' )
		?.addEventListener( 'click', () => {
			if ( ! availableList ) {
				return;
			}
			Array.from( courseList.selectedOptions ).forEach( ( opt ) => {
				const [ type ] = opt.value.split( ':' );
				const groupLabel =
					type === 'lecon' ? i18n.lessons : i18n.exercices;

				let group = availableList.querySelector(
					`optgroup[label="${ groupLabel }"]`
				);
				if ( ! group ) {
					group = document.createElement( 'optgroup' );
					group.label = groupLabel;
					availableList.appendChild( group );
				}
				group.appendChild( opt );
			} );
			syncHiddenInputs();
		} );

	// Déplacer vers le haut
	document.getElementById( 'roi-move-up' )?.addEventListener( 'click', () => {
		Array.from( courseList.selectedOptions ).forEach( ( opt ) => {
			const prev = opt.previousElementSibling;
			if ( prev ) {
				courseList.insertBefore( opt, prev );
			}
		} );
		syncHiddenInputs();
	} );

	// Déplacer vers le bas
	document
		.getElementById( 'roi-move-down' )
		?.addEventListener( 'click', () => {
			// Inverser l'ordre pour le déplacement vers le bas afin de garder la sélection cohérente
			Array.from( courseList.selectedOptions )
				.reverse()
				.forEach( ( opt ) => {
					const next = opt.nextElementSibling;
					if ( next ) {
						courseList.insertBefore( next, opt );
					}
				} );
			syncHiddenInputs();
		} );

	// Init au chargement
	syncHiddenInputs();
} );
