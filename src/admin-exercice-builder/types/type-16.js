/**
 * Handler for Type 16: Destination finale.
 */

import { setupFenControl, setupPgnControl } from '../utils/controls';

const textarea = document.getElementById( 'roi_config_json' );
let t16Etapes = [];

/**
 * Renders the list of text steps in the container.
 */
function renderT16Etapes() {
	const container = document.getElementById( 'roi_t16_etapes_container' );
	if ( ! container ) {
		return;
	}

	container.innerHTML = '';

	t16Etapes.forEach( ( etapeText, index ) => {
		const row = document.createElement( 'div' );
		row.className = 'roi-t16-etape-item';
		row.style.display = 'flex';
		row.style.gap = '10px';
		row.style.alignItems = 'center';

		const numSpan = document.createElement( 'span' );
		numSpan.className = 'roi-t16-etape-num';
		numSpan.style.fontWeight = '600';
		numSpan.style.minWidth = '24px';
		numSpan.textContent = `${ index + 1 }.`;

		const input = document.createElement( 'input' );
		input.type = 'text';
		input.className = 'roi_t16_etape_input';
		input.style.flex = '1';
		input.style.height = '30px';
		input.placeholder = "Saisir le texte de l'étape...";
		input.value = etapeText;

		input.addEventListener( 'input', ( e ) => {
			t16Etapes[ index ] = e.target.value;
			updateConfig();
		} );

		const removeBtn = document.createElement( 'button' );
		removeBtn.type = 'button';
		removeBtn.className = 'button roi_t16_remove_etape';
		removeBtn.style.color = '#b32d2e';
		removeBtn.style.borderColor = '#b32d2e';
		removeBtn.style.fontWeight = 'bold';
		removeBtn.innerHTML = '&times;';

		removeBtn.addEventListener( 'click', () => {
			t16Etapes.splice( index, 1 );
			renderT16Etapes();
			updateConfig();
		} );

		row.appendChild( numSpan );
		row.appendChild( input );
		row.appendChild( removeBtn );
		container.appendChild( row );
	} );
}

/**
 * Serializes configuration to JSON.
 */
export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const consigneInput = document.getElementById( 'roi_t16_consigne' );
	const fenInput = document.getElementById( 'roi_t16_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t16_couleur' );
	const pgnExplicationInput = document.getElementById(
		'roi_t16_pgn_explication'
	);

	const consigneText = consigneInput
		? consigneInput.value.trim()
		: "Remettez les étapes de ce plan d'attaque dans le bon ordre :";
	const fenDepart = fenInput
		? fenInput.value.trim()
		: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5';
	const couleurJoueur = couleurSelect ? couleurSelect.value : 'white';
	const pgnExplicationText = pgnExplicationInput
		? pgnExplicationInput.value.trim()
		: '';

	const configData = {
		consigne: consigneText,
		fen_depart: fenDepart,
		couleur_joueur: couleurJoueur,
		etapes_texte: t16Etapes,
		pgn_explication: pgnExplicationText,
	};

	textarea.value = JSON.stringify( configData, null, 4 );
}

/**
 * Initializes Type 16 handlers.
 */
export function init() {
	if ( ! textarea ) {
		return;
	}

	const consigneInput = document.getElementById( 'roi_t16_consigne' );
	const fenInput = document.getElementById( 'roi_t16_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t16_couleur' );
	const pgnExplicationInput = document.getElementById(
		'roi_t16_pgn_explication'
	);
	const btnFenEditor = document.getElementById( 'btn_open_fen_editor_t16' );
	const btnAddEtape = document.getElementById( 'roi_t16_add_etape' );

	t16Etapes = [];

	// Restoration from saved JSON
	if ( textarea.value.trim() !== '' ) {
		try {
			const parsed = JSON.parse( textarea.value );
			if ( parsed && typeof parsed === 'object' ) {
				if ( typeof parsed.consigne === 'string' && consigneInput ) {
					consigneInput.value = parsed.consigne;
				}
				if ( typeof parsed.fen_depart === 'string' && fenInput ) {
					fenInput.value = parsed.fen_depart;
				}
				if (
					typeof parsed.couleur_joueur === 'string' &&
					couleurSelect
				) {
					couleurSelect.value = parsed.couleur_joueur;
				}
				if (
					typeof parsed.pgn_explication === 'string' &&
					pgnExplicationInput
				) {
					pgnExplicationInput.value = parsed.pgn_explication;
				}
				if ( Array.isArray( parsed.etapes_texte ) ) {
					t16Etapes = [ ...parsed.etapes_texte ];
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 16 initial :', e );
		}
	}

	// Read initial DOM if t16Etapes is empty but PHP rendered elements exist
	if ( t16Etapes.length === 0 ) {
		const existingInputs = document.querySelectorAll(
			'.roi_t16_etape_input'
		);
		if ( existingInputs.length > 0 ) {
			existingInputs.forEach( ( input ) => {
				if ( input.value.trim() !== '' ) {
					t16Etapes.push( input.value.trim() );
				}
			} );
		}
	}

	renderT16Etapes();

	// Button "Ajouter une étape"
	if ( btnAddEtape ) {
		btnAddEtape.addEventListener( 'click', () => {
			t16Etapes.push( '' );
			renderT16Etapes();
			updateConfig();

			// Focus the newly created input
			const container = document.getElementById(
				'roi_t16_etapes_container'
			);
			if ( container ) {
				const inputs = container.querySelectorAll(
					'.roi_t16_etape_input'
				);
				if ( inputs.length > 0 ) {
					inputs[ inputs.length - 1 ].focus();
				}
			}
		} );
	}

	// FEN Control Setup
	setupFenControl( {
		input: fenInput,
		button: btnFenEditor,
		colorSelect: couleurSelect,
		onChange() {
			updateConfig();
		},
	} );

	// PGN Control Setup for Explication Finale
	const btnPgnExplication = document.getElementById(
		'btn_open_pgn_editor_t16_explication'
	);
	setupPgnControl( {
		textarea: pgnExplicationInput,
		button: btnPgnExplication,
		initialFen() {
			return fenInput
				? fenInput.value ||
						'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5'
				: '';
		},
		onChange() {
			updateConfig();
		},
	} );

	// Real-time update event listeners for direct inputs
	if ( consigneInput ) {
		consigneInput.addEventListener( 'input', updateConfig );
	}
	if ( fenInput ) {
		fenInput.addEventListener( 'input', updateConfig );
	}
	if ( couleurSelect ) {
		couleurSelect.addEventListener( 'change', updateConfig );
	}
	if ( pgnExplicationInput ) {
		pgnExplicationInput.addEventListener( 'input', updateConfig );
	}

	// Initial update
	updateConfig();
}
