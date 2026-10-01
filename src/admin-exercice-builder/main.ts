/**
 * Entry point for admin exercise builder.
 */

import * as type1 from './types/type-1';
import * as type2 from './types/type-2';
import * as type3 from './types/type-3';
import * as type4 from './types/type-4';
import * as type5 from './types/type-5';
import * as type6 from './types/type-6';
import * as type7 from './types/type-7';
import * as type8 from './types/type-8';
import * as type9 from './types/type-9';
import * as type10 from './types/type-10';
import * as type11 from './types/type-11';
import * as type12 from './types/type-12';
import * as type13 from './types/type-13';
import * as type14 from './types/type-14';
import * as type15 from './types/type-15';
import * as type16 from './types/type-16';

document.addEventListener('DOMContentLoaded', function () {
	const typeSelect = document.getElementById('roi_exercice_type') as HTMLSelectElement | null;

	if (!typeSelect) {
		return;
	}

	const container = document.querySelector<HTMLElement>(
		'.roi-exercice-visual-builder-container'
	);
	const builderType1 = document.getElementById('roi_builder_type_1');
	const builderType2 = document.getElementById('roi_builder_type_2');
	const builderType3 = document.getElementById('roi_builder_type_3');
	const builderType4 = document.getElementById('roi_builder_type_4');
	const builderType5 = document.getElementById('roi_builder_type_5');
	const builderType6 = document.getElementById('roi_builder_type_6');
	const builderType7 = document.getElementById('roi_builder_type_7');
	const builderType8 = document.getElementById('roi_builder_type_8');
	const builderType9 = document.getElementById('roi_builder_type_9');
	const builderType10 = document.getElementById('roi_builder_type_10');
	const builderType11 = document.getElementById('roi_builder_type_11');
	const builderType12 = document.getElementById('roi_builder_type_12');
	const builderType13 = document.getElementById('roi_builder_type_13');
	const builderType14 = document.getElementById('roi_builder_type_14');
	const builderType15 = document.getElementById('roi_builder_type_15');
	const builderType16 = document.getElementById('roi_builder_type_16');
	const builderTitle = document.getElementById('roi_visual_builder_title');

	const visualTypes: string[] = [];

	function toggleVisibility(): void {
		if (!typeSelect) {
			return;
		}
		const val = typeSelect.value;

		// visualTypes (type 7, etc)
		if (container) {
			if (visualTypes.includes(val)) {
				container.style.display = '';
				if (builderTitle) {
					const selectedOption =
						typeSelect.options[typeSelect.selectedIndex];
					const selectedText = selectedOption
						? selectedOption.text
						: '';
					const cleanTitle = selectedText.replace(/^\d+\s*-\s*/, '');
					builderTitle.textContent =
						"Constructeur d'exercice visuel (" + cleanTitle + ')';
				}
			} else {
				container.style.display = 'none';
			}
		}

		if (builderType1) {
			builderType1.style.display = val === '1' ? '' : 'none';
		}
		if (builderType2) {
			builderType2.style.display = val === '2' ? '' : 'none';
		}
		if (builderType3) {
			builderType3.style.display = val === '3' ? '' : 'none';
		}
		if (builderType4) {
			builderType4.style.display = val === '4' ? '' : 'none';
		}
		if (builderType5) {
			builderType5.style.display = val === '5' ? '' : 'none';
		}
		if (builderType6) {
			builderType6.style.display = val === '6' ? '' : 'none';
		}
		if (builderType7) {
			builderType7.style.display = val === '7' ? '' : 'none';
		}
		if (builderType8) {
			builderType8.style.display = val === '8' ? '' : 'none';
		}
		if (builderType9) {
			builderType9.style.display = val === '9' ? '' : 'none';
		}
		if (builderType10) {
			builderType10.style.display = val === '10' ? '' : 'none';
		}
		if (builderType11) {
			builderType11.style.display = val === '11' ? '' : 'none';
		}
		if (builderType12) {
			builderType12.style.display = val === '12' ? '' : 'none';
		}
		if (builderType13) {
			builderType13.style.display = val === '13' ? '' : 'none';
		}
		if (builderType14) {
			builderType14.style.display = val === '14' ? '' : 'none';
		}
		if (builderType15) {
			builderType15.style.display = val === '15' ? '' : 'none';
		}
		if (builderType16) {
			builderType16.style.display = val === '16' ? '' : 'none';
		}
	}

	function initSelectedType(): void {
		if (!typeSelect) {
			return;
		}
		const val = typeSelect.value;

		if (val === '1') {
			type1.init();
		} else if (val === '2') {
			type2.init();
		} else if (val === '3') {
			type3.init();
		} else if (val === '4') {
			type4.init();
		} else if (val === '5') {
			type5.init();
		} else if (val === '6') {
			type6.init();
		} else if (val === '7') {
			type7.init();
		} else if (val === '8') {
			type8.init();
		} else if (val === '9') {
			type9.init();
		} else if (val === '10') {
			type10.init();
		} else if (val === '11') {
			type11.init();
		} else if (val === '12') {
			type12.init();
		} else if (val === '13') {
			type13.init();
		} else if (val === '14') {
			type14.init();
		} else if (val === '15') {
			type15.init();
		} else if (val === '16') {
			type16.init();
		} else if (visualTypes.includes(val)) {
			type3.init();
		}
	}

	// Validation of required fields
	function checkRequiredFields(): boolean {
		// Title
		let hasTitle = false;
		if (
			window.wp &&
			window.wp.data &&
			window.wp.data.select &&
			window.wp.data.select('core/editor')
		) {
			const editor = window.wp.data.select('core/editor') as {
				getEditedPostAttribute: (attr: string) => unknown;
				getCurrentPost: () => { title?: string | { raw?: string } };
			};
			const titleAttr = editor.getEditedPostAttribute('title');
			const currentPost = editor.getCurrentPost();
			const currentTitle =
				typeof currentPost?.title === 'object'
					? currentPost?.title?.raw
					: currentPost?.title;
			hasTitle = Boolean(
				(titleAttr &&
					typeof titleAttr === 'string' &&
					titleAttr.trim().length > 0) ||
				(currentTitle &&
					typeof currentTitle === 'string' &&
					currentTitle.trim().length > 0)
			);
		}
		if (!hasTitle) {
			const titleField = (document.getElementById('title') ||
				document.getElementById('post-title-0') ||
				document.querySelector('.editor-post-title__input')) as HTMLInputElement | null;
			hasTitle = Boolean(
				titleField &&
				titleField.value &&
				titleField.value.trim().length > 0
			);
		}

		// Chapter
		let hasChapter = false;
		if (
			window.wp &&
			window.wp.data &&
			window.wp.data.select &&
			window.wp.data.select('core/editor')
		) {
			const editor = window.wp.data.select('core/editor') as {
				getEditedPostAttribute: (attr: string) => unknown;
				getCurrentPost: () => { roi_chapitre?: unknown };
			};
			const chapitresAttr = editor.getEditedPostAttribute('roi_chapitre');
			const currentPost = editor.getCurrentPost();
			const currentChapitres = currentPost?.roi_chapitre;

			if (Array.isArray(chapitresAttr) && chapitresAttr.length > 0) {
				hasChapter = true;
			} else if (
				Array.isArray(currentChapitres) &&
				currentChapitres.length > 0
			) {
				hasChapter = true;
			} else if (chapitresAttr || currentChapitres) {
				hasChapter = true;
			}
		}
		if (!hasChapter) {
			const selectedChapters = document.querySelectorAll(
				'input[name^="tax_input[roi_chapitre]"]:checked, #roi_chapitrediv input:checked, #taxonomy-roi_chapitre input:checked'
			);
			hasChapter = selectedChapters.length > 0;
		}

		// Type and difficulty level
		const typeVal = typeSelect ? typeSelect.value : '';
		const niveauSelect = document.getElementById('roi_exercice_niveau') as HTMLSelectElement | null;
		const niveauVal = niveauSelect ? niveauSelect.value : '';

		const hasType = Boolean(typeVal && typeVal.trim().length > 0);
		const hasNiveau = Boolean(niveauVal && niveauVal.trim().length > 0);

		return hasTitle && hasChapter && hasType && hasNiveau;
	}

	let hasLocked = false;

	function runValidation(): void {
		const isGutenberg =
			window.wp &&
			window.wp.data &&
			window.wp.data.select &&
			window.wp.data.select('core/editor');
		const isValid = checkRequiredFields();

		if (isGutenberg) {
			const { dispatch } = window.wp.data;
			if (!isValid) {
				if (!hasLocked) {
					dispatch('core/editor')?.lockPostSaving(
						'roi_exercice_missing_fields'
					);
					dispatch('core/notices')?.createNotice(
						'error',
						"Veuillez renseigner tous les champs obligatoires : Titre, Niveau de difficulté, Type d'exercice et Chapitre.",
						{
							id: 'roi_exercice_missing_fields_notice',
							isDismissible: false,
						}
					);
					hasLocked = true;
				}
			} else if (hasLocked) {
				dispatch('core/editor')?.unlockPostSaving(
					'roi_exercice_missing_fields'
				);
				dispatch('core/notices')?.removeNotice(
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
		window.wp.data.select('core/editor')
	) {
		const { subscribe } = window.wp.data;
		subscribe(runValidation);
	}

	// Classic editor listener
	const postForm = document.getElementById('post') as HTMLFormElement | null;
	const publishBtn = document.getElementById('publish') as HTMLElement | null;
	if (postForm && publishBtn) {
		postForm.addEventListener('submit', function (e) {
			const activeEl = (e.target as HTMLFormElement | null)
				? (e.target as HTMLFormElement).ownerDocument.activeElement as HTMLInputElement | null
				: null;
			if (
				activeEl &&
				(activeEl.id === 'publish' || activeEl.value === 'Publish')
			) {
				if (!checkRequiredFields()) {
					e.preventDefault();
					alert(
						"Veuillez renseigner tous les champs obligatoires : Titre, Niveau de difficulté, Type d'exercice et Chapitre."
					);
					const spinner = document.querySelector(
						'#major-publishing-actions .spinner'
					);
					if (spinner) {
						spinner.classList.remove('is-active');
					}
					publishBtn.classList.remove('button-primary-disabled');
				}
			}
		});
	}

	typeSelect.addEventListener('change', function () {
		toggleVisibility();
		initSelectedType();
		runValidation();
	});

	const niveauSelect = document.getElementById('roi_exercice_niveau');
	if (niveauSelect) {
		niveauSelect.addEventListener('change', runValidation);
	}

	document.addEventListener('change', function (e) {
		const target = e.target as HTMLInputElement | null;
		if (
			target &&
			target.name &&
			(target.name.includes('roi_chapitre') ||
				target.name.includes('tax_input'))
		) {
			runValidation();
		}
	});

	// Initialisation
	toggleVisibility();
	initSelectedType();
	runValidation();
});
