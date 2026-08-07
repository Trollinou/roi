/**
 * Handler for Type 15: Jugement final.
 */

import { setupFenControl, setupPgnControl } from '../utils/controls';

const textarea = document.getElementById( 'roi_config_json' );

/**
 * Serializes configuration to JSON.
 */
export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const consigneInput = document.getElementById( 'roi_t15_consigne' );
	const fenInput = document.getElementById( 'roi_t15_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t15_couleur' );
	const pgnExplicationInput = document.getElementById(
		'roi_t15_pgn_explication'
	);
	const correctRadio = document.querySelector(
		'input[name="roi_t15_correct"]:checked'
	);

	const consigneText = consigneInput ? consigneInput.value.trim() : '';
	const fenDepart = fenInput
		? fenInput.value.trim()
		: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	const couleurJoueur = couleurSelect ? couleurSelect.value : 'white';
	const bonneReponseIndex = correctRadio
		? parseInt( correctRadio.value, 10 )
		: 0;
	const pgnExplicationText = pgnExplicationInput
		? pgnExplicationInput.value.trim()
		: '';

	const scenariosList = [];
	for ( let i = 0; i < 3; i++ ) {
		const scenarioPgnArea = document.querySelector(
			`.roi_t15_scenario_pgn[data-index="${ i }"]`
		);

		scenariosList.push( {
			pgn: scenarioPgnArea ? scenarioPgnArea.value.trim() : '',
			is_correct: i === bonneReponseIndex,
		} );
	}

	const configData = {
		consigne: consigneText,
		fen_depart: fenDepart,
		couleur_joueur: couleurJoueur,
		scenarios: scenariosList,
		pgn_explication: pgnExplicationText,
	};

	textarea.value = JSON.stringify( configData, null, 4 );
}

/**
 * Initializes Type 15 handlers.
 */
export function init() {
	if ( ! textarea ) {
		return;
	}

	const consigneInput = document.getElementById( 'roi_t15_consigne' );
	const fenInput = document.getElementById( 'roi_t15_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t15_couleur' );
	const pgnExplicationInput = document.getElementById(
		'roi_t15_pgn_explication'
	);
	const btnFenEditor = document.getElementById( 'btn_open_fen_editor_t15' );

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

				if ( Array.isArray( parsed.scenarios ) ) {
					for ( let i = 0; i < 3; i++ ) {
						const scenarioData = parsed.scenarios[ i ];
						if ( scenarioData ) {
							const scenarioPgnArea = document.querySelector(
								`.roi_t15_scenario_pgn[data-index="${ i }"]`
							);

							if (
								scenarioPgnArea &&
								typeof scenarioData.pgn === 'string'
							) {
								scenarioPgnArea.value = scenarioData.pgn;
							}

							if ( scenarioData.is_correct === true ) {
								const radioToSelect = document.querySelector(
									`input[name="roi_t15_correct"][value="${ i }"]`
								);
								if ( radioToSelect ) {
									radioToSelect.checked = true;
								}
							}
						}
					}
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 15 initial :', e );
		}
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

	// PGN Control Setup for 3 Scenarios
	for ( let i = 0; i < 3; i++ ) {
		const scenarioPgnArea = document.querySelector(
			`.roi_t15_scenario_pgn[data-index="${ i }"]`
		);
		const btnScenario = document.getElementById(
			`btn_open_pgn_editor_t15_scenario_${ i }`
		);
		setupPgnControl( {
			textarea: scenarioPgnArea,
			button: btnScenario,
			initialFen() {
				return fenInput ? fenInput.value : '';
			},
			onChange() {
				updateConfig();
			},
		} );
	}

	// PGN Control Setup for Explication Finale
	const btnPgnExplication = document.getElementById(
		'btn_open_pgn_editor_t15_explication'
	);
	setupPgnControl( {
		textarea: pgnExplicationInput,
		button: btnPgnExplication,
		initialFen() {
			return fenInput ? fenInput.value : '';
		},
		onChange() {
			updateConfig();
		},
	} );

	// Real-time update event listeners
	const inputsToWatch = document.querySelectorAll(
		'#roi_builder_type_15 input, #roi_builder_type_15 select, #roi_builder_type_15 textarea'
	);

	inputsToWatch.forEach( ( input ) => {
		input.addEventListener( 'input', updateConfig );
		input.addEventListener( 'change', updateConfig );
	} );

	// Initial update
	updateConfig();
}
