/**
 * Handler for Type 4: La Partie dont tu es le Héros.
 */

import { openFenEditor, openPgnEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );
const t4EtapesContainer = document.getElementById( 'roi_t4_etapes_container' );
const t4AddPgnBtn = document.getElementById( 'roi_t4_add_pgn' );
const t4AddQcmBtn = document.getElementById( 'roi_t4_add_qcm' );

let t4Etapes = [];

export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const t4Config = {
		etapes: t4Etapes,
	};
	textarea.value = JSON.stringify( t4Config, null, 4 );
}

export function renderT4Etapes() {
	if ( ! t4EtapesContainer ) {
		return;
	}
	t4EtapesContainer.innerHTML = '';

	if ( t4Etapes.length === 0 ) {
		t4EtapesContainer.innerHTML =
			'<p style="color: #646970; font-style: italic; text-align: center; padding: 15px 0;">Aucune étape ajoutée pour le moment.</p>';
		return;
	}

	t4Etapes.forEach( function ( etape, i ) {
		const div = document.createElement( 'div' );
		div.className = 'roi-t4-etape-card';
		div.setAttribute( 'data-index', i );
		div.style.border = '1px solid #ccd0d4';
		div.style.padding = '15px';
		div.style.marginBottom = '15px';
		div.style.background = '#fafafa';
		div.style.borderRadius = '6px';
		div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

		if ( etape.type === 'pgn' ) {
			div.innerHTML = `
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
					<strong style="font-size: 14px; color: #1e1e1e;">Étape ${
						i + 1
					} : Séquence PGN</strong>
					<span style="font-size: 11px; padding: 3px 8px; background: #e8f0fe; color: #3858e9; border-radius: 12px; font-weight: 600; text-transform: uppercase;">PGN</span>
				</div>
				<textarea class="roi-t4-pgn-preview" readonly style="width: 100%; height: 60px; font-family: monospace; font-size: 12px; background: #f0f0f1; resize: none; border: 1px solid #ccd0d4; border-radius: 4px; padding: 8px; margin-bottom: 10px; color: #50575e;">${
					etape.pgn_data || ''
				}</textarea>
				<div style="display: flex; gap: 8px;">
					<button type="button" class="button btn-edit-pgn" style="display: inline-flex; align-items: center; gap: 4px;"><span class="dashicons dashicons-edit" style="font-size: 16px; width: 16px; height: 16px; line-height: 1;"></span> Éditer le PGN</button>
					<button type="button" class="button button-link-delete btn-delete-step" style="color: #b32d2e;">Supprimer</button>
				</div>
			`;

			div.querySelector( '.btn-edit-pgn' ).addEventListener(
				'click',
				function () {
					openPgnEditor(
						etape.pgn_data || '',
						function ( nouveauPgn, finalFen ) {
							t4Etapes[ i ].pgn_data = nouveauPgn;
							if ( finalFen ) {
								t4Etapes[ i ].final_fen = finalFen;
							}
							renderT4Etapes();
							updateConfig();
						}
					);
				}
			);
		} else if ( etape.type === 'qcm' ) {
			div.innerHTML = `
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
					<strong style="font-size: 14px; color: #1e1e1e;">Étape ${ i + 1 } : QCM</strong>
					<span style="font-size: 11px; padding: 3px 8px; background: #fff8e1; color: #b78103; border-radius: 12px; font-weight: 600; text-transform: uppercase;">QCM</span>
				</div>
				<div style="display: flex; flex-direction: column; gap: 12px;">
					<div>
						<label style="font-weight: 600; display: block; margin-bottom: 4px;">Question :</label>
						<input type="text" class="qcm-question-input" style="width: 100%; height: 30px;" value="${
							etape.question || ''
						}">
					</div>
					<div style="display: flex; gap: 8px; align-items: flex-end;">
						<div style="flex: 1;">
							<label style="font-weight: 600; display: block; margin-bottom: 4px;">FEN de départ :</label>
							<input type="text" class="qcm-fen-input" style="width: 100%; height: 30px;" value="${
								etape.fen || ''
							}">
						</div>
						<button type="button" class="button btn-edit-fen-qcm" style="height: 30px;" title="Éditer la position visuellement">Éditer la position</button>
					</div>
					<div>
						<label style="font-weight: 600; display: block; margin-bottom: 6px;">Choix de réponse (sélectionnez la bonne réponse) :</label>
						<div style="display: flex; flex-direction: column; gap: 8px;">
							${ [ 0, 1, 2 ]
								.map( function ( idx ) {
									const choiceVal =
										etape.choix && etape.choix[ idx ]
											? etape.choix[ idx ]
											: '';
									const isChecked =
										parseInt( etape.bonne_reponse, 10 ) ===
										idx
											? 'checked'
											: '';
									return `
									<div style="display: flex; align-items: center; gap: 8px;">
										<input type="radio" name="roi_t4_qcm_correct_${ i }" class="qcm-correct-radio" value="${ idx }" ${ isChecked }>
										<input type="text" class="qcm-choix-input" data-choice-index="${ idx }" style="flex: 1; height: 30px;" placeholder="Réponse ${
											idx + 1
										}" value="${ choiceVal }">
									</div>
								`;
								} )
								.join( '' ) }
						</div>
					</div>
					<div>
						<button type="button" class="button button-link-delete btn-delete-step" style="color: #b32d2e;">Supprimer l'étape</button>
					</div>
				</div>
			`;

			const questionInput = div.querySelector( '.qcm-question-input' );
			questionInput.addEventListener( 'input', function ( e ) {
				t4Etapes[ i ].question = e.target.value;
				updateConfig();
			} );

			const fenInputQcm = div.querySelector( '.qcm-fen-input' );
			fenInputQcm.addEventListener( 'input', function ( e ) {
				t4Etapes[ i ].fen = e.target.value;
				updateConfig();
			} );

			const choiceInputs = div.querySelectorAll( '.qcm-choix-input' );
			choiceInputs.forEach( function ( ci ) {
				ci.addEventListener( 'input', function ( e ) {
					const cIdx = parseInt(
						e.target.getAttribute( 'data-choice-index' ),
						10
					);
					if ( ! t4Etapes[ i ].choix ) {
						t4Etapes[ i ].choix = [ '', '', '' ];
					}
					t4Etapes[ i ].choix[ cIdx ] = e.target.value;
					updateConfig();
				} );
			} );

			const radioButtons = div.querySelectorAll( '.qcm-correct-radio' );
			radioButtons.forEach( function ( rb ) {
				rb.addEventListener( 'change', function ( e ) {
					if ( e.target.checked ) {
						t4Etapes[ i ].bonne_reponse = parseInt(
							e.target.value,
							10
						);
						updateConfig();
					}
				} );
			} );

			div.querySelector( '.btn-edit-fen-qcm' ).addEventListener(
				'click',
				function () {
					const currentFen =
						etape.fen ||
						'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
					openFenEditor(
						{ fen: currentFen, shapes: etape.shapes || [] },
						function ( result ) {
							t4Etapes[ i ].fen = result.fen;
							t4Etapes[ i ].shapes = result.shapes;
							fenInputQcm.value = result.fen;
							updateConfig();
						}
					);
				}
			);
		}

		div.querySelector( '.btn-delete-step' ).addEventListener(
			'click',
			function () {
				t4Etapes.splice( i, 1 );
				renderT4Etapes();
				updateConfig();
			}
		);

		t4EtapesContainer.appendChild( div );
	} );
}

export function init() {
	if ( ! t4EtapesContainer ) {
		return;
	}

	// Initialisation des données depuis le JSON
	if ( textarea && textarea.value.trim() !== '' ) {
		try {
			const parsedT4 = JSON.parse( textarea.value );
			if ( parsedT4 && Array.isArray( parsedT4.etapes ) ) {
				t4Etapes = parsedT4.etapes.map( function ( etape ) {
					if ( etape.type === 'qcm' ) {
						etape.shapes = etape.shapes || [];
					}
					return etape;
				} );
			}
		} catch ( e ) {
			console.log( 'Erreur parsing JSON Type 4 initial :', e );
		}
	}

	renderT4Etapes();

	if ( t4AddPgnBtn ) {
		t4AddPgnBtn.addEventListener( 'click', function () {
			t4Etapes.push( {
				type: 'pgn',
				pgn_data: '',
			} );
			renderT4Etapes();
			updateConfig();
		} );
	}

	if ( t4AddQcmBtn ) {
		t4AddQcmBtn.addEventListener( 'click', function () {
			let initialQcmFen =
				'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

			if ( t4Etapes.length > 0 ) {
				for ( let i = t4Etapes.length - 1; i >= 0; i-- ) {
					if ( t4Etapes[ i ].type === 'pgn' ) {
						if ( t4Etapes[ i ].final_fen ) {
							initialQcmFen = t4Etapes[ i ].final_fen;
						} else if ( t4Etapes[ i ].pgn_data ) {
							try {
								if ( typeof window.Chess === 'function' ) {
									const tempChess = new window.Chess();
									tempChess.loadPgn( t4Etapes[ i ].pgn_data );
									initialQcmFen = tempChess.fen();
								}
							} catch ( e ) {
								console.warn(
									'Impossible de lire le PGN précédent pour la FEN du QCM',
									e
								);
							}
						}
						break;
					}
				}
			}

			t4Etapes.push( {
				type: 'qcm',
				question: '',
				fen: initialQcmFen,
				choix: [ '', '', '' ],
				bonne_reponse: 0,
				shapes: [],
			} );
			renderT4Etapes();
			updateConfig();
		} );
	}
}
