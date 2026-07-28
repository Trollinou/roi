/**
 * Handler for Type 6: Associ'Plan.
 */

import { openFenEditor, openPgnEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );
const builderType6 = document.getElementById( 'roi_builder_type_6' );

let t6Paires = [
	{
		fen: '',
		couleur_joueur: 'white',
		description: '',
		pgn_data: '',
		shapes: [],
	},
	{
		fen: '',
		couleur_joueur: 'white',
		description: '',
		pgn_data: '',
		shapes: [],
	},
	{
		fen: '',
		couleur_joueur: 'white',
		description: '',
		pgn_data: '',
		shapes: [],
	},
	{
		fen: '',
		couleur_joueur: 'white',
		description: '',
		pgn_data: '',
		shapes: [],
	},
];

export function updateConfig() {
	if ( ! builderType6 || ! textarea ) {
		return;
	}
	const fenInputs = builderType6.querySelectorAll( '.roi_t6_fen' );
	const colorSelects = builderType6.querySelectorAll( '.roi_t6_couleur' );
	const descTextareas = builderType6.querySelectorAll( '.roi_t6_desc' );
	const pgnTextareas = builderType6.querySelectorAll( '.roi_t6_pgn' );

	const config = {
		paires: t6Paires.map( function ( paire, idx ) {
			return {
				fen: fenInputs[ idx ]
					? fenInputs[ idx ].value.trim()
					: paire.fen,
				couleur_joueur: colorSelects[ idx ]
					? colorSelects[ idx ].value
					: paire.couleur_joueur,
				description: descTextareas[ idx ]
					? descTextareas[ idx ].value
					: paire.description,
				pgn_data: pgnTextareas[ idx ]
					? pgnTextareas[ idx ].value
					: paire.pgn_data,
				shapes: paire.shapes || [],
			};
		} ),
	};
	t6Paires = config.paires;
	textarea.value = JSON.stringify( config, null, 4 );
}

function fillT6HTML() {
	if ( ! builderType6 ) {
		return;
	}
	const fenInputs = builderType6.querySelectorAll( '.roi_t6_fen' );
	const colorSelects = builderType6.querySelectorAll( '.roi_t6_couleur' );
	const descTextareas = builderType6.querySelectorAll( '.roi_t6_desc' );
	const pgnTextareas = builderType6.querySelectorAll( '.roi_t6_pgn' );

	for ( let idx = 0; idx < 4; idx++ ) {
		if ( fenInputs[ idx ] ) {
			fenInputs[ idx ].value = t6Paires[ idx ].fen || '';
		}
		if ( colorSelects[ idx ] ) {
			colorSelects[ idx ].value =
				t6Paires[ idx ].couleur_joueur || 'white';
		}
		if ( descTextareas[ idx ] ) {
			descTextareas[ idx ].value = t6Paires[ idx ].description || '';
		}
		if ( pgnTextareas[ idx ] ) {
			pgnTextareas[ idx ].value = t6Paires[ idx ].pgn_data || '';
		}
	}
}

export function init() {
	if ( ! builderType6 ) {
		return;
	}

	// Initialisation des données
	if ( textarea && textarea.value.trim() !== '' ) {
		try {
			const parsedT6 = JSON.parse( textarea.value );
			if (
				parsedT6 &&
				typeof parsedT6 === 'object' &&
				Array.isArray( parsedT6.paires )
			) {
				for ( let idx = 0; idx < 4; idx++ ) {
					if ( parsedT6.paires[ idx ] ) {
						t6Paires[ idx ] = {
							fen: parsedT6.paires[ idx ].fen || '',
							couleur_joueur:
								parsedT6.paires[ idx ].couleur_joueur ||
								'white',
							description:
								parsedT6.paires[ idx ].description || '',
							pgn_data: parsedT6.paires[ idx ].pgn_data || '',
							shapes: parsedT6.paires[ idx ].shapes || [],
						};
					}
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 6 initial :', e );
		}
	}

	fillT6HTML();

	const fenInputs = builderType6.querySelectorAll( '.roi_t6_fen' );
	const colorSelects = builderType6.querySelectorAll( '.roi_t6_couleur' );
	const descTextareas = builderType6.querySelectorAll( '.roi_t6_desc' );
	const pgnTextareas = builderType6.querySelectorAll( '.roi_t6_pgn' );

	fenInputs.forEach( function ( input, idx ) {
		input.addEventListener( 'input', function () {
			t6Paires[ idx ].fen = input.value.trim();
			updateConfig();
		} );
	} );

	colorSelects.forEach( function ( select, idx ) {
		select.addEventListener( 'change', function () {
			t6Paires[ idx ].couleur_joueur = select.value;
			updateConfig();
		} );
	} );

	descTextareas.forEach( function ( textareaEl, idx ) {
		textareaEl.addEventListener( 'input', function () {
			t6Paires[ idx ].description = textareaEl.value;
			updateConfig();
		} );
	} );

	const fenButtons = builderType6.querySelectorAll( '.btn_open_fen_editor' );
	fenButtons.forEach( function ( btn ) {
		btn.addEventListener( 'click', function () {
			const idx = parseInt( btn.getAttribute( 'data-index' ), 10 );
			if ( isNaN( idx ) ) {
				return;
			}

			const currentFenInput = fenInputs[ idx ];
			const initialFen =
				( currentFenInput ? currentFenInput.value.trim() : '' ) ||
				'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

			openFenEditor(
				{ fen: initialFen, shapes: t6Paires[ idx ].shapes || [] },
				function ( result ) {
					if ( currentFenInput ) {
						currentFenInput.value = result.fen;
					}
					t6Paires[ idx ].fen = result.fen;
					t6Paires[ idx ].shapes = result.shapes;
					updateConfig();
				}
			);
		} );
	} );

	const pgnButtons = builderType6.querySelectorAll( '.btn_open_pgn_editor' );
	pgnButtons.forEach( function ( btn ) {
		btn.addEventListener( 'click', function () {
			const idx = parseInt( btn.getAttribute( 'data-index' ), 10 );
			if ( isNaN( idx ) ) {
				return;
			}

			const currentPgnTextarea = pgnTextareas[ idx ];
			const initialPgn = currentPgnTextarea
				? currentPgnTextarea.value.trim()
				: '';
			const currentFen = fenInputs[ idx ]
				? fenInputs[ idx ].value.trim()
				: '';

			openPgnEditor(
				initialPgn,
				function ( nouveauPgn ) {
					if ( currentPgnTextarea ) {
						currentPgnTextarea.value = nouveauPgn;
					}
					t6Paires[ idx ].pgn_data = nouveauPgn;
					updateConfig();
				},
				currentFen
			);
		} );
	} );
}
