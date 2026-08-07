/**
 * Handler for Type 6: Associ'Plan.
 */

import { setupFenControl, setupPgnControl } from '../utils/controls';

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

	// Setup 4 pairs of FEN and PGN controls
	for ( let i = 0; i < 4; i++ ) {
		const fenInp =
			document.getElementById( `roi_t6_fen_${ i }` ) || fenInputs[ i ];
		const colorSel =
			document.getElementById( `roi_t6_couleur_${ i }` ) ||
			colorSelects[ i ];
		const btnFen =
			document.getElementById( `btn_open_fen_editor_t6_${ i }` ) ||
			builderType6.querySelector(
				`.btn_open_fen_editor[data-index="${ i }"]`
			);

		setupFenControl( {
			input: fenInp,
			button: btnFen,
			colorSelect: colorSel,
			getShapes() {
				return t6Paires[ i ] ? t6Paires[ i ].shapes || [] : [];
			},
			onChange( fen, color, shapes ) {
				if ( t6Paires[ i ] ) {
					t6Paires[ i ].fen = fen;
					t6Paires[ i ].couleur = color;
					if ( shapes ) {
						t6Paires[ i ].shapes = shapes;
					}
					updateConfig();
				}
			},
		} );

		const pgnTxt =
			document.getElementById( `roi_t6_pgn_${ i }` ) || pgnTextareas[ i ];
		const btnPgn =
			document.getElementById( `btn_open_pgn_editor_t6_${ i }` ) ||
			builderType6.querySelector(
				`.btn_open_pgn_editor[data-index="${ i }"]`
			);

		setupPgnControl( {
			textarea: pgnTxt,
			button: btnPgn,
			initialFen() {
				return fenInp ? fenInp.value : '';
			},
			onChange( pgn ) {
				if ( t6Paires[ i ] ) {
					t6Paires[ i ].pgn_data = pgn;
					updateConfig();
				}
			},
		} );
	}
}
