/**
 * Handler for Type 8: Vision'checs.
 */

import {
	setupFenControl,
	updateOrientationDisplay,
	getOrientationColor,
} from '../utils/controls';

const textarea = document.getElementById( 'roi_config_json' );
const fenInput = document.getElementById( 'roi_t8_fen' );
const colorInput = document.getElementById( 'roi_t8_couleur' );
const descInput = document.getElementById( 'roi_t8_desc' );
const caseDepartInput = document.getElementById( 'roi_t8_case_depart' );
const caseArriveeInput = document.getElementById( 'roi_t8_case_arrivee' );
const sanInput = document.getElementById( 'roi_t8_san' );
const boardContainer = document.getElementById( 'roi_t8_board' );
const generateBtn = document.getElementById( 'roi_t8_generate_btn' );
const openEditorBtn = document.getElementById( 'btn_open_fen_editor_t8' );

let boardAPI = null;

export function updateConfig() {
	if ( ! textarea ) {
		return;
	}
	const fenVal = fenInput ? fenInput.value.trim() : '';
	const configData = {
		fen_depart: fenVal,
		couleur_joueur: getOrientationColor( colorInput, fenVal ),
		description: descInput ? descInput.value.trim() : '',
		case_depart: caseDepartInput ? caseDepartInput.value.trim() : '',
		case_arrivee: caseArriveeInput ? caseArriveeInput.value.trim() : '',
		solution_san: sanInput ? sanInput.value.trim() : '',
	};
	textarea.value = JSON.stringify( configData, null, 4 );
}

export function init() {
	if ( ! fenInput || ! colorInput || ! textarea ) {
		return;
	}

	// Charger les données depuis le JSON existant
	if ( textarea.value.trim() !== '' ) {
		try {
			const parsed = JSON.parse( textarea.value );
			if ( parsed && typeof parsed === 'object' ) {
				if ( parsed.fen_depart && fenInput ) {
					fenInput.value = parsed.fen_depart;
				}
				if ( colorInput ) {
					updateOrientationDisplay(
						colorInput,
						parsed.couleur_joueur || parsed.fen_depart || 'white'
					);
				}
				if ( parsed.description && descInput ) {
					descInput.value = parsed.description;
				}
				if ( parsed.case_depart && caseDepartInput ) {
					caseDepartInput.value = parsed.case_depart;
				}
				if ( parsed.case_arrivee && caseArriveeInput ) {
					caseArriveeInput.value = parsed.case_arrivee;
				}
				if ( parsed.solution_san && sanInput ) {
					sanInput.value = parsed.solution_san;
				}

				// S'il y a déjà une FEN de départ, générer l'échiquier automatiquement
				if ( parsed.fen_depart ) {
					setTimeout( function () {
						if ( generateBtn ) {
							generateBtn.click();
						}
					}, 200 );
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 8 initial :', e );
		}
	}

	// Écouteurs d'événements
	if ( descInput ) {
		descInput.addEventListener( 'input', updateConfig );
	}

	setupFenControl( {
		input: fenInput,
		button: openEditorBtn,
		colorSelect: colorInput,
		onChange() {
			updateConfig();
			if ( boardAPI && generateBtn ) {
				generateBtn.click();
			}
		},
	} );

	if ( generateBtn ) {
		generateBtn.addEventListener( 'click', function () {
			const fen = fenInput ? fenInput.value.trim() : '';
			const color = colorInput ? colorInput.value : 'white';

			if ( ! fen ) {
				return;
			}

			if ( boardAPI ) {
				boardAPI.destroy();
				boardAPI = null;
			}

			boardContainer.innerHTML = '';
			const boardEl = document.createElement( 'div' );
			boardEl.id = 'roi-t8-chessboard-inner';
			boardEl.style.width = '100%';
			boardEl.style.height = '100%';
			boardContainer.appendChild( boardEl );

			const checkInterval = setInterval( function () {
				if ( window.EgBoardCore ) {
					clearInterval( checkInterval );

					const boardConfig = {
						mode: 'game',
						fen,
						orientation: color,
						coordinates: true,
						viewOnly: false,
						movable: {
							color: 'both',
						},
					};

					const boardState = {
						mode: 'game',
						showThreats: false,
						promotionDialogState: { isEnabled: false },
						historyViewerState: { isEnabled: false },
					};

					boardAPI = new window.EgBoardCore(
						boardEl,
						boardState,
						function () {},
						function ( event, move ) {
							if ( event === 'move' && move ) {
								if ( caseDepartInput ) {
									caseDepartInput.value = move.from;
								}
								if ( caseArriveeInput ) {
									caseArriveeInput.value = move.to;
								}
								if ( sanInput ) {
									sanInput.value = move.san;
								}

								// Annuler immédiatement le coup et dessiner la flèche verte
								setTimeout( function () {
									if ( boardAPI ) {
										boardAPI.undoLastMove();
										if (
											typeof boardAPI.setShapes ===
											'function'
										) {
											boardAPI.setShapes( [
												{
													orig: move.from,
													dest: move.to,
													brush: 'green',
												},
											] );
										}
									}
								}, 50 );

								updateConfig();
							}
						},
						boardConfig,
						{ workerUrl: '' }
					);

					// Si on a déjà une solution enregistrée au chargement, on affiche la flèche
					const startSq = caseDepartInput
						? caseDepartInput.value.trim()
						: '';
					const endSq = caseArriveeInput
						? caseArriveeInput.value.trim()
						: '';
					if ( startSq && endSq ) {
						setTimeout( function () {
							if ( boardAPI ) {
								boardAPI.setShapes( [
									{
										orig: startSq,
										dest: endSq,
										brush: 'green',
									},
								] );
							}
						}, 100 );
					}
				}
			}, 50 );
		} );
	}
}
