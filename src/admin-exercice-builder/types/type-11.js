/**
 * Handler for Type 11: Class'échecs.
 */

import { openFenEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );
const consigneInput = document.getElementById( 'roi_t11_consigne' );

let t11Positions = [
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
];

export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const consigneText = consigneInput
		? consigneInput.value.trim()
		: 'Classez ces positions de la plus forte (1) à la moins forte (5).';

	const configData = {
		consigne: consigneText,
		positions: t11Positions,
	};

	textarea.value = JSON.stringify( configData, null, 4 );
}

export function init() {
	if ( ! consigneInput || ! textarea ) {
		return;
	}

	// Restaurer les données depuis le JSON si présent
	if ( textarea.value.trim() !== '' ) {
		try {
			const parsed = JSON.parse( textarea.value );
			if ( parsed && typeof parsed === 'object' ) {
				if ( typeof parsed.consigne === 'string' ) {
					consigneInput.value = parsed.consigne;
				}
				if ( Array.isArray( parsed.positions ) ) {
					for ( let i = 0; i < 5; i++ ) {
						if ( parsed.positions[ i ] ) {
							t11Positions[ i ] = {
								fen: parsed.positions[ i ].fen || '',
								couleur_joueur:
									parsed.positions[ i ].couleur_joueur ||
									'white',
								shapes: parsed.positions[ i ].shapes || [],
							};
						}
					}
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 11 initial :', e );
		}
	}

	// Mettre à jour les champs DOM (inputs FEN et selects couleur) d'après l'état en mémoire
	const fenInputs = document.querySelectorAll( '.roi_t11_fen' );
	const couleurSelects = document.querySelectorAll( '.roi_t11_couleur' );

	fenInputs.forEach( ( input ) => {
		const index = parseInt( input.getAttribute( 'data-index' ), 10 );
		if ( ! isNaN( index ) && t11Positions[ index ] ) {
			input.value = t11Positions[ index ].fen;
		}
	} );

	couleurSelects.forEach( ( select ) => {
		const index = parseInt( select.getAttribute( 'data-index' ), 10 );
		if ( ! isNaN( index ) && t11Positions[ index ] ) {
			select.value = t11Positions[ index ].couleur_joueur;
		}
	} );

	// Écouteur consigne
	consigneInput.addEventListener( 'input', updateConfig );

	// Écouteurs selects de couleur
	couleurSelects.forEach( ( select ) => {
		select.addEventListener( 'change', function () {
			const index = parseInt( select.getAttribute( 'data-index' ), 10 );
			if ( ! isNaN( index ) && t11Positions[ index ] ) {
				t11Positions[ index ].couleur_joueur = select.value;
				updateConfig();
			}
		} );
	} );

	// Écouteurs boutons d'édition FEN
	const openEditorButtons = document.querySelectorAll(
		'.btn_open_fen_editor_t11'
	);
	openEditorButtons.forEach( ( btn ) => {
		btn.addEventListener( 'click', function () {
			const index = parseInt( btn.getAttribute( 'data-index' ), 10 );
			if ( isNaN( index ) || ! t11Positions[ index ] ) {
				return;
			}

			const currentPos = t11Positions[ index ];

			openFenEditor(
				{
					fen:
						currentPos.fen ||
						'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
					shapes: currentPos.shapes || [],
				},
				function ( result ) {
					if ( result && result.fen ) {
						t11Positions[ index ].fen = result.fen;
						if ( result.shapes ) {
							t11Positions[ index ].shapes = result.shapes;
						}
						if ( result.orientation ) {
							t11Positions[ index ].couleur_joueur =
								result.orientation;
						}

						// Mise à jour du DOM
						const matchingFenInput = document.querySelector(
							`.roi_t11_fen[data-index="${ index }"]`
						);
						if ( matchingFenInput ) {
							matchingFenInput.value = result.fen;
						}

						const matchingCouleurSelect = document.querySelector(
							`.roi_t11_couleur[data-index="${ index }"]`
						);
						if ( matchingCouleurSelect && result.orientation ) {
							matchingCouleurSelect.value = result.orientation;
						}

						updateConfig();
					}
				}
			);
		} );
	} );
}
