/**
 * Handler for Type 2: Pop'Echecs.
 */

import { openFenEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );
const t2Consigne = document.getElementById( 'roi_t2_consigne' );
const t2FenFinale = document.getElementById( 'roi_t2_fen_finale' );
const t2GenerateBtn = document.getElementById( 'roi_t2_generate_btn' );
const t2ChessboardContainer = document.getElementById(
	'roi_t2_chessboard_container'
);
const t2Feedback = document.getElementById( 'roi_t2_feedback' );
const t2CancelBtn = document.getElementById( 'roi_t2_cancel_btn' );
const t2EditorBtn = document.getElementById( 'btn_open_fen_editor_t2' );

const pieceNames = {
	p: { white: 'Pion Blanc', black: 'Pion Noir' },
	r: { white: 'Tour Blanche', black: 'Tour Noire' },
	n: { white: 'Cavalier Blanc', black: 'Cavalier Noir' },
	b: { white: 'Fou Blanc', black: 'Fou Noir' },
	q: { white: 'Dame Blanche', black: 'Dame Noire' },
	k: { white: 'Roi Blanc', black: 'Roi Noir' },
};

let t2BoardAPI = null;
let t2BoardEl = null;
let t2SelectedData = null;

function getPieceName( pieceType, pieceColor ) {
	const entry = pieceNames[ pieceType ];
	if ( entry && entry[ pieceColor ] ) {
		return entry[ pieceColor ];
	}
	return pieceType.toUpperCase() + ' (' + pieceColor + ')';
}

function updateT2Feedback( message, color, showCancel ) {
	if ( t2Feedback ) {
		t2Feedback.textContent = message;
		t2Feedback.style.borderLeftColor = color;
	}
	if ( t2CancelBtn ) {
		t2CancelBtn.style.display = showCancel ? '' : 'none';
	}
}

function findPieceOnSquare( fen, square ) {
	const files = 'abcdefgh';

	const fileIndex = files.indexOf( square[ 0 ] );
	if ( fileIndex < 0 ) {
		return null;
	}

	const rankIndex = 8 - parseInt( square[ 1 ], 10 );
	if ( rankIndex < 0 || rankIndex > 7 ) {
		return null;
	}

	const placement = fen.split( ' ' )[ 0 ];
	const rows = placement.split( '/' );

	const row = rows[ rankIndex ];
	if ( ! row ) {
		return null;
	}

	let currentFile = 0;
	for ( let c = 0; c < row.length; c++ ) {
		const ch = row[ c ];
		if ( ch >= '1' && ch <= '8' ) {
			currentFile += parseInt( ch, 10 );
		} else {
			if ( currentFile === fileIndex ) {
				const isWhite = ch === ch.toUpperCase();
				return {
					type: ch.toLowerCase(),
					color: isWhite ? 'white' : 'black',
				};
			}
			currentFile++;
		}
	}

	return null;
}

export function updateConfig() {
	if ( ! t2Consigne || ! t2FenFinale || ! textarea ) {
		return;
	}

	const t2Config = {
		consigne: t2Consigne.value,
		fen_finale: t2FenFinale.value.trim(),
	};

	if ( t2SelectedData ) {
		let pieceColorMapped = t2SelectedData.piece_color;
		if ( t2SelectedData.piece_color === 'white' ) {
			pieceColorMapped = 'w';
		} else if ( t2SelectedData.piece_color === 'black' ) {
			pieceColorMapped = 'b';
		}

		t2Config.fen_depart = t2SelectedData.fen_depart;
		t2Config.piece_type = t2SelectedData.piece_type;
		t2Config.piece_color = pieceColorMapped;
		t2Config.case_cible = t2SelectedData.case_cible;
	}

	textarea.value = JSON.stringify( t2Config, null, 4 );
}

function handleT2SquareClick( square ) {
	if ( ! t2BoardAPI ) {
		return;
	}

	const fenFinale = t2FenFinale.value.trim();

	// Réinitialiser la position finale complète
	t2BoardAPI.setPosition( fenFinale );

	if ( typeof t2BoardAPI.hideMoves === 'function' ) {
		t2BoardAPI.hideMoves();
	} else if ( typeof t2BoardAPI.setShapes === 'function' ) {
		t2BoardAPI.setShapes( [] );
	}

	const pieceOnSquare = findPieceOnSquare( fenFinale, square );

	if ( ! pieceOnSquare ) {
		if ( t2CancelBtn ) {
			t2CancelBtn.click();
		}
		return;
	}

	t2BoardAPI.removePiece( square );
	const fenDepart = t2BoardAPI.getFen();

	if ( typeof t2BoardAPI.drawCircle === 'function' ) {
		t2BoardAPI.drawCircle( square, 'green' );
	} else if ( typeof t2BoardAPI.setShapes === 'function' ) {
		t2BoardAPI.setShapes( [ { orig: square, brush: 'green' } ] );
	}

	t2SelectedData = {
		piece_type: pieceOnSquare.type,
		piece_color: pieceOnSquare.color,
		case_cible: square,
		fen_depart: fenDepart,
	};

	const nomPiece = getPieceName( pieceOnSquare.type, pieceOnSquare.color );
	updateT2Feedback(
		'Pièce retirée : ' +
			nomPiece +
			' sur ' +
			square +
			' (Position de départ générée)',
		'#00a32a',
		true
	);

	updateConfig();
}

export function init() {
	if ( ! t2GenerateBtn || ! t2ChessboardContainer ) {
		return;
	}

	// Initialisation des données depuis le JSON existant
	if ( textarea && textarea.value.trim() !== '' ) {
		try {
			const parsedT2 = JSON.parse( textarea.value );
			if ( parsedT2 && typeof parsedT2 === 'object' ) {
				if ( t2Consigne && typeof parsedT2.consigne === 'string' ) {
					t2Consigne.value = parsedT2.consigne;
				}
				if ( t2FenFinale && typeof parsedT2.fen_finale === 'string' ) {
					t2FenFinale.value = parsedT2.fen_finale;
				}
				if (
					parsedT2.piece_type &&
					parsedT2.piece_color &&
					parsedT2.case_cible &&
					parsedT2.fen_depart
				) {
					let normalizedColor = parsedT2.piece_color;
					if ( parsedT2.piece_color === 'w' ) {
						normalizedColor = 'white';
					} else if ( parsedT2.piece_color === 'b' ) {
						normalizedColor = 'black';
					}

					t2SelectedData = {
						piece_type: parsedT2.piece_type,
						piece_color: normalizedColor,
						case_cible: parsedT2.case_cible,
						fen_depart: parsedT2.fen_depart,
					};
					const nomPiece = getPieceName(
						parsedT2.piece_type,
						normalizedColor
					);
					updateT2Feedback(
						'Pièce retirée : ' +
							nomPiece +
							' sur ' +
							parsedT2.case_cible +
							' (Position de départ générée)',
						'#00a32a',
						true
					);
				}
				if ( parsedT2.fen_finale ) {
					setTimeout( function () {
						t2GenerateBtn.setAttribute( 'data-autoload', 'true' );
						t2GenerateBtn.click();
					}, 200 );
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 2 initial :', e );
		}
	}

	// Écouteurs d'événements
	if ( t2Consigne ) {
		t2Consigne.addEventListener( 'input', updateConfig );
	}

	t2GenerateBtn.addEventListener( 'click', function () {
		const fen = t2FenFinale ? t2FenFinale.value.trim() : '';
		if ( ! fen ) {
			updateT2Feedback(
				'Erreur : veuillez saisir une FEN valide.',
				'#d63638',
				false
			);
			return;
		}

		const isAutoLoad =
			t2GenerateBtn.getAttribute( 'data-autoload' ) === 'true';
		t2GenerateBtn.removeAttribute( 'data-autoload' );

		if ( ! isAutoLoad ) {
			t2SelectedData = null;
			updateT2Feedback(
				"Cliquez sur une pièce de l'échiquier pour la retirer.",
				'#72aee6',
				false
			);
		}

		if ( t2BoardAPI ) {
			t2BoardAPI.destroy();
			t2BoardAPI = null;
		}

		t2ChessboardContainer.innerHTML = '';
		t2BoardEl = document.createElement( 'div' );
		t2BoardEl.id = 'roi-t2-chessboard';
		t2BoardEl.className = 'roi-clean-admin-board';
		t2BoardEl.style.width = '100%';
		t2BoardEl.style.aspectRatio = '1';
		t2BoardEl.style.position = 'relative';
		t2ChessboardContainer.appendChild( t2BoardEl );

		const t2CheckInterval = setInterval( function () {
			if ( window.EgBoardCore ) {
				clearInterval( t2CheckInterval );

				const boardConfig = {
					mode: 'game',
					fen,
					orientation: 'white',
					coordinates: true,
					viewOnly: false,
					movable: {
						free: false,
						color: 'both',
					},
					events: {
						select( square ) {
							handleT2SquareClick( square );
						},
					},
				};

				const boardState = {
					mode: 'game',
					showThreats: false,
					promotionDialogState: { isEnabled: false },
					historyViewerState: { isEnabled: false },
				};

				t2BoardAPI = new window.EgBoardCore(
					t2BoardEl,
					boardState,
					function () {},
					function () {},
					boardConfig,
					{ workerUrl: '' }
				);

				if (
					isAutoLoad &&
					t2SelectedData &&
					t2SelectedData.fen_depart
				) {
					t2BoardAPI.setPosition( t2SelectedData.fen_depart );
					if ( typeof t2BoardAPI.drawCircle === 'function' ) {
						t2BoardAPI.drawCircle(
							t2SelectedData.case_cible,
							'green'
						);
					} else if ( typeof t2BoardAPI.setShapes === 'function' ) {
						t2BoardAPI.setShapes( [
							{ orig: t2SelectedData.case_cible, brush: 'green' },
						] );
					}
				}

				if ( typeof t2BoardAPI.updateStockfishConfig === 'function' ) {
					t2BoardAPI.updateStockfishConfig( {
						whiteMode: 'disabled',
						blackMode: 'disabled',
					} );
				}

				updateConfig();
			}
		}, 50 );
	} );

	if ( t2CancelBtn ) {
		t2CancelBtn.addEventListener( 'click', function () {
			t2SelectedData = null;
			if ( t2BoardAPI && t2FenFinale ) {
				t2BoardAPI.setPosition( t2FenFinale.value.trim() );
				if ( typeof t2BoardAPI.hideMoves === 'function' ) {
					t2BoardAPI.hideMoves();
				} else if ( typeof t2BoardAPI.setShapes === 'function' ) {
					t2BoardAPI.setShapes( [] );
				}
			}
			updateT2Feedback(
				'Sélection annulée. Cliquez sur une pièce pour la retirer.',
				'#72aee6',
				false
			);
			updateConfig();
		} );
	}

	if ( t2EditorBtn ) {
		t2EditorBtn.addEventListener( 'click', function () {
			const initialFen =
				( t2FenFinale ? t2FenFinale.value.trim() : '' ) ||
				'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

			openFenEditor( { fen: initialFen }, function ( result ) {
				if ( t2FenFinale ) {
					t2FenFinale.value = result.fen;
				}
				if ( t2GenerateBtn ) {
					t2GenerateBtn.click();
				}
			} );
		} );
	}
}
