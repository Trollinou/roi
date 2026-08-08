/**
 * Handler for Type 3: ABCDaire Tactique and other visual exercises.
 */

import {
	setupFenControl,
	updateOrientationDisplay,
	getOrientationColor,
} from '../utils/controls';

const textarea = document.getElementById( 'roi_config_json' );
const fenInput = document.getElementById( 'roi_fen_input' );
const colorInput = document.getElementById( 'roi_color_input' );
const generateBtn = document.getElementById( 'roi_generate_board_btn' );
const undoBtn = document.getElementById( 'roi_undo_move_btn' );
const solutionList = document.getElementById( 'roi_solution_list' );
const block = document.getElementById( 'roi-exercice-builder-chessboard' );
const openEditorBtn = document.getElementById( 'btn_open_fen_editor' );

let boardAPI = null;
const configData = {
	fen: '',
	couleur_joueur: 'white',
	solution: [],
	shapes: [],
};

export function updateConfig() {
	if ( ! textarea ) {
		return;
	}
	textarea.value = JSON.stringify( configData, null, 4 );
}

function renderSolutionList() {
	if ( ! solutionList ) {
		return;
	}
	solutionList.innerHTML = '';
	if ( ! configData.solution || configData.solution.length === 0 ) {
		solutionList.innerHTML =
			'<li style="color: #646970; font-style: italic; list-style-type: none;">Aucun coup enregistré</li>';
		return;
	}

	for ( let i = 0; i < configData.solution.length; i++ ) {
		const li = document.createElement( 'li' );
		li.style.padding = '2px 0';

		const moveNum = Math.ceil( ( i + 1 ) / 2 );
		const isWhite = i % 2 === 0;
		const prefix = moveNum + ( isWhite ? '. ' : '... ' );

		li.textContent = prefix + configData.solution[ i ];
		solutionList.appendChild( li );
	}
}

function updateConfigAndUI() {
	updateConfig();
	renderSolutionList();
}

function updateBoardConfig() {
	if ( ! boardAPI ) {
		return;
	}

	boardAPI.updateStockfishConfig( {
		whiteMode: 'disabled',
		blackMode: 'disabled',
	} );

	boardAPI.setConfig( {
		orientation: configData.couleur_joueur,
		viewOnly: false,
		lastMove: undefined,
		movable: {
			color: 'both',
			events: {
				after() {
					const history = boardAPI.getHistory( true ) || [];
					configData.solution = history.map( function ( m ) {
						return m.san;
					} );
					updateConfigAndUI();
				},
			},
		},
	} );
}

export function init() {
	if ( ! block || ! textarea ) {
		return;
	}

	// Charger les données depuis le JSON
	try {
		const parsed = JSON.parse( textarea.value );
		if ( parsed && typeof parsed === 'object' ) {
			configData.fen = parsed.fen || '';
			configData.couleur_joueur =
				parsed.couleur_joueur || parsed.color || 'white';
			configData.solution = parsed.solution || [];
			configData.shapes = parsed.shapes || [];
		}
	} catch ( e ) {
		console.warn( 'Erreur parsing JSON Type 3 initial :', e );
		configData.fen = fenInput ? fenInput.value.trim() : '';
		configData.couleur_joueur = getOrientationColor(
			colorInput,
			configData.fen
		);
		configData.solution = [];
		configData.shapes = [];
	}

	if ( fenInput && configData.fen ) {
		fenInput.value = configData.fen;
	}
	if ( colorInput && configData.couleur_joueur ) {
		updateOrientationDisplay( colorInput, configData.couleur_joueur );
	}

	renderSolutionList();

	if ( boardAPI ) {
		// Réinitialiser la position et configuration si l'API existe déjà
		boardAPI.setPosition(
			configData.fen ||
				'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
		);
		updateBoardConfig();
		return;
	}

	const checkInterval = setInterval( function () {
		if ( window.EgBoardCore ) {
			clearInterval( checkInterval );

			const boardConfig = {
				mode: 'game',
				fen:
					configData.fen ||
					( fenInput ? fenInput.value.trim() : '' ) ||
					'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				orientation:
					configData.couleur_joueur ||
					( colorInput ? colorInput.value : 'white' ),
				coordinates: true,
				viewOnly: false,
				drawable: { shapes: configData.shapes },
			};

			const boardState = {
				mode: 'game',
				preserveShapesOnPositionChange: true,
				showThreats: false,
				promotionDialogState: { isEnabled: false },
				historyViewerState: { isEnabled: false },
			};

			boardAPI = new window.EgBoardCore(
				block,
				boardState,
				function () {},
				function () {},
				boardConfig,
				{ workerUrl: '' }
			);

			updateBoardConfig();
		}
	}, 50 );

	// Écouteurs d'événements
	if ( generateBtn ) {
		generateBtn.addEventListener( 'click', function () {
			if ( ! boardAPI ) {
				return;
			}
			configData.fen = fenInput ? fenInput.value.trim() : '';
			configData.couleur_joueur = colorInput ? colorInput.value : 'white';
			configData.solution = [];

			boardAPI.setPosition( configData.fen );
			updateBoardConfig();
			updateConfigAndUI();
		} );
	}

	if ( undoBtn ) {
		undoBtn.addEventListener( 'click', function () {
			if ( ! boardAPI ) {
				return;
			}
			boardAPI.undoLastMove();
			const history = boardAPI.getHistory( true ) || [];
			configData.solution = history.map( function ( m ) {
				return m.san;
			} );
			updateConfigAndUI();
		} );
	}

	setupFenControl( {
		input: fenInput,
		button: openEditorBtn,
		colorSelect: colorInput,
		getShapes() {
			return configData.shapes || [];
		},
		onChange( fen, color, shapes ) {
			configData.fen = fen;
			configData.couleur_joueur = color;
			if ( shapes ) {
				configData.shapes = shapes;
			}
			if ( boardAPI && typeof boardAPI.setShapes === 'function' ) {
				boardAPI.setShapes( configData.shapes );
			}
			updateConfig();
		},
	} );
}
