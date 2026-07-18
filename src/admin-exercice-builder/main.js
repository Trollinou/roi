/**
 * Entry point for admin exercise builder.
 */

import * as type1 from './types/type-1';
import * as type2 from './types/type-2';
import * as type3 from './types/type-3';
import * as type4 from './types/type-4';
import * as type5 from './types/type-5';
import * as type6 from './types/type-6';

document.addEventListener( 'DOMContentLoaded', function () {
	const typeSelect = document.getElementById( 'roi_exercice_type' );

	if ( ! typeSelect ) {
		return;
	}

	const container = document.querySelector(
		'.roi-exercice-visual-builder-container'
	);
	const builderType1 = document.getElementById( 'roi_builder_type_1' );
	const builderType2 = document.getElementById( 'roi_builder_type_2' );
	const builderType4 = document.getElementById( 'roi_builder_type_4' );
	const builderType5 = document.getElementById( 'roi_builder_type_5' );
	const builderType6 = document.getElementById( 'roi_builder_type_6' );
	const builderTitle = document.getElementById( 'roi_visual_builder_title' );

	const visualTypes = [
		'3',
		'7',
		'8',
		'9',
		'10',
		'11',
		'12',
		'13',
		'14',
		'15',
		'16',
	];

	function toggleVisibility() {
		const val = typeSelect.value;

		// visualTypes (type 3, 7, etc)
		if ( container ) {
			if ( visualTypes.includes( val ) ) {
				container.style.display = '';
				if ( builderTitle ) {
					const selectedOption =
						typeSelect.options[ typeSelect.selectedIndex ];
					const selectedText = selectedOption
						? selectedOption.text
						: 'ABCDaire Tactique';
					const cleanTitle = selectedText.replace(
						/^\d+\s*-\s*/,
						''
					);
					builderTitle.textContent =
						"Constructeur d'exercice visuel (" + cleanTitle + ')';
				}
			} else {
				container.style.display = 'none';
			}
		}

		// Type 1
		if ( builderType1 ) {
			builderType1.style.display = val === '1' ? '' : 'none';
		}

		// Type 2
		if ( builderType2 ) {
			builderType2.style.display = val === '2' ? '' : 'none';
		}

		// Type 4
		if ( builderType4 ) {
			builderType4.style.display = val === '4' ? '' : 'none';
		}

		// Type 5
		if ( builderType5 ) {
			builderType5.style.display = val === '5' ? '' : 'none';
		}

		// Type 6
		if ( builderType6 ) {
			builderType6.style.display = val === '6' ? '' : 'none';
		}
	}

	function initSelectedType() {
		const val = typeSelect.value;

		if ( val === '1' ) {
			type1.init();
		} else if ( val === '2' ) {
			type2.init();
		} else if ( val === '4' ) {
			type4.init();
		} else if ( val === '5' ) {
			type5.init();
		} else if ( val === '6' ) {
			type6.init();
		} else if ( visualTypes.includes( val ) ) {
			type3.init();
		}
	}

	// Validation of required fields
	function checkRequiredFields() {
		// Title
		let hasTitle = false;
		if (
			window.wp &&
			window.wp.data &&
			window.wp.data.select &&
			window.wp.data.select( 'core/editor' )
		) {
			const titleAttr = window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'title' );
			hasTitle = titleAttr && titleAttr.trim().length > 0;
		} else {
			const titleField = document.getElementById( 'title' );
			hasTitle = titleField && titleField.value.trim().length > 0;
		}

		// Chapter
		let hasChapter = false;
		if (
			window.wp &&
			window.wp.data &&
			window.wp.data.select &&
			window.wp.data.select( 'core/editor' )
		) {
			const chapitresAttr =
				window.wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'roi_chapitre' ) || [];
			hasChapter = Array.isArray( chapitresAttr )
				? chapitresAttr.length > 0
				: !! chapitresAttr;
		} else {
			const selectedChapters = document.querySelectorAll(
				'input[name^="tax_input[roi_chapitre]"]:checked'
			);
			hasChapter = selectedChapters.length > 0;
		}

		// Type and difficulty level
		const typeVal = typeSelect.value;
		const niveauSelect = document.getElementById( 'roi_exercice_niveau' );
		const niveauVal = niveauSelect ? niveauSelect.value : '';

		const hasType = typeVal && typeVal.trim().length > 0;
		const hasNiveau = niveauVal && niveauVal.trim().length > 0;

		return hasTitle && hasChapter && hasType && hasNiveau;
	}

	let hasLocked = false;

	function runValidation() {
		const isGutenberg =
			window.wp &&
			window.wp.data &&
			window.wp.data.select &&
			window.wp.data.select( 'core/editor' );
		const isValid = checkRequiredFields();

		if ( isGutenberg ) {
			const { dispatch } = window.wp.data;
			if ( ! isValid ) {
				if ( ! hasLocked ) {
					dispatch( 'core/editor' ).lockPostSaving(
						'roi_exercice_missing_fields'
					);
					dispatch( 'core/notices' ).createNotice(
						'error',
						"Veuillez renseigner tous les champs obligatoires : Titre, Niveau de difficulté, Type d'exercice et Chapitre.",
						{
							id: 'roi_exercice_missing_fields_notice',
							isDismissible: false,
						}
					);
					hasLocked = true;
				}
			} else if ( hasLocked ) {
				dispatch( 'core/editor' ).unlockPostSaving(
					'roi_exercice_missing_fields'
				);
				dispatch( 'core/notices' ).removeNotice(
					'roi_exercice_missing_fields_notice'
				);
				hasLocked = false;
			}
		}
	}

	// Gutenberg subscriber
	if (
		window.wp &&
		window.wp.data &&
		window.wp.data.select &&
		window.wp.data.select( 'core/editor' )
	) {
		const { subscribe } = window.wp.data;
		subscribe( runValidation );
	}

	// Classic editor listener
	const postForm = document.getElementById( 'post' );
	const publishBtn = document.getElementById( 'publish' );
	if ( postForm && publishBtn ) {
		postForm.addEventListener( 'submit', function ( e ) {
			const activeEl = e.target
				? e.target.ownerDocument.activeElement
				: null;
			if (
				activeEl &&
				( activeEl.id === 'publish' || activeEl.value === 'Publish' )
			) {
				if ( ! checkRequiredFields() ) {
					e.preventDefault();
					alert(
						"Veuillez renseigner tous les champs obligatoires : Titre, Niveau de difficulté, Type d'exercice et Chapitre."
					);
					const spinner = document.querySelector(
						'#major-publishing-actions .spinner'
					);
					if ( spinner ) {
						spinner.classList.remove( 'is-active' );
					}
					publishBtn.classList.remove( 'button-primary-disabled' );
				}
			}
		} );
	}

	typeSelect.addEventListener( 'change', function () {
		toggleVisibility();
		initSelectedType();
		runValidation();
	} );

	const niveauSelect = document.getElementById( 'roi_exercice_niveau' );
	if ( niveauSelect ) {
		niveauSelect.addEventListener( 'change', runValidation );
	}

	// Initialisation
	toggleVisibility();
	initSelectedType();
	runValidation();
} );
