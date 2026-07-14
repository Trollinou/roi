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

	typeSelect.addEventListener( 'change', function () {
		toggleVisibility();
		initSelectedType();
	} );

	// Initialisation
	toggleVisibility();
	initSelectedType();
} );
