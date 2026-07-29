/**
 * Handler for Type 12: Qui-suis-je ?.
 */

const textarea = document.getElementById( 'roi_config_json' );
const typeReponseSelect = document.getElementById( 'roi_t12_type_reponse' );
const blocPiece = document.getElementById( 'roi_t12_bloc_piece' );
const blocSquare = document.getElementById( 'roi_t12_bloc_square' );
const blocQcm = document.getElementById( 'roi_t12_bloc_qcm' );
const reponsePieceSelect = document.getElementById( 'roi_t12_reponse_piece' );
const reponseCaseInput = document.getElementById( 'roi_t12_reponse_case' );
const boardCaseContainer = document.getElementById( 'roi_t12_board_case' );
const indicesContainer = document.getElementById( 'roi_t12_indices_container' );
const addIndiceBtn = document.getElementById( 'roi_t12_add_indice' );

let boardApi = null;
let isBoardInitialized = false;

function updateIndiceLabels() {
	if ( ! indicesContainer ) {
		return;
	}
	const items = indicesContainer.querySelectorAll( '.roi-t12-indice-item' );
	items.forEach( ( item, idx ) => {
		const label = item.querySelector( 'span' );
		if ( label ) {
			label.textContent = `Indice ${ idx + 1 } :`;
		}
	} );
}

function bindIndiceEvents( itemDiv ) {
	const input = itemDiv.querySelector( '.roi_t12_indice_input' );
	const removeBtn = itemDiv.querySelector( '.roi_t12_remove_indice' );

	if ( input ) {
		input.addEventListener( 'input', updateConfig );
	}
	if ( removeBtn ) {
		removeBtn.addEventListener( 'click', () => {
			itemDiv.remove();
			updateIndiceLabels();
			updateConfig();
		} );
	}
}

function addIndiceInput( value = '' ) {
	if ( ! indicesContainer ) {
		return;
	}
	const count = indicesContainer.querySelectorAll(
		'.roi-t12-indice-item'
	).length;
	const itemDiv = document.createElement( 'div' );
	itemDiv.className = 'roi-t12-indice-item';
	itemDiv.style.cssText = 'display: flex; gap: 10px; align-items: center;';

	itemDiv.innerHTML = `
		<span style="font-weight: 600; width: 80px; color: #50575e;">Indice ${
			count + 1
		} :</span>
		<input type="text" class="roi_t12_indice_input" value="${ value }" placeholder="Saisir un indice..." style="flex: 1; height: 30px;">
		<button type="button" class="button button-link-delete roi_t12_remove_indice" style="color: #b32d2e; text-decoration: none;" title="Supprimer l'indice">&times;</button>
	`;

	indicesContainer.appendChild( itemDiv );
	bindIndiceEvents( itemDiv );
}

function handleSquareClick( square ) {
	if ( reponseCaseInput ) {
		reponseCaseInput.value = square;
	}
	if ( boardApi && typeof boardApi.setShapes === 'function' ) {
		boardApi.setShapes( [ { orig: square, brush: 'green' } ] );
	}
	updateConfig();
}

function initSquareBoard() {
	if ( isBoardInitialized || ! boardCaseContainer ) {
		return;
	}
	isBoardInitialized = true;

	boardCaseContainer.innerHTML = '';
	const boardEl = document.createElement( 'div' );
	boardEl.id = 'roi-t12-chessboard';
	boardEl.style.width = '100%';
	boardEl.style.height = '100%';
	boardCaseContainer.appendChild( boardEl );

	const checkInterval = setInterval( () => {
		if ( window.EgBoardCore ) {
			clearInterval( checkInterval );

			const boardConfig = {
				fen: '8/8/8/8/8/8/8/8 w - - 0 1',
				orientation: 'white',
				coordinates: true,
				viewOnly: false,
				movable: {
					color: 'both',
				},
				events: {
					select( square ) {
						handleSquareClick( square );
					},
				},
				onSquareClick( square ) {
					handleSquareClick( square );
				},
			};

			const boardState = {
				showThreats: false,
				freeMode: false,
				promotionDialogState: { isEnabled: false },
				historyViewerState: { isEnabled: false },
			};

			boardApi = new window.EgBoardCore(
				boardEl,
				boardState,
				function () {},
				function () {},
				boardConfig,
				{ workerUrl: '' }
			);

			const currentSquare = reponseCaseInput
				? reponseCaseInput.value.trim()
				: '';
			if ( currentSquare ) {
				setTimeout( () => {
					if (
						boardApi &&
						typeof boardApi.setShapes === 'function'
					) {
						boardApi.setShapes( [
							{ orig: currentSquare, brush: 'green' },
						] );
					}
				}, 100 );
			}
		}
	}, 50 );
}

function updateConditionalBlocks() {
	const typeVal = typeReponseSelect ? typeReponseSelect.value : 'piece';

	if ( blocPiece ) {
		blocPiece.style.display = typeVal === 'piece' ? 'block' : 'none';
	}
	if ( blocSquare ) {
		blocSquare.style.display = typeVal === 'square' ? 'block' : 'none';
	}
	if ( blocQcm ) {
		blocQcm.style.display = typeVal === 'qcm' ? 'block' : 'none';
	}

	if ( typeVal === 'square' ) {
		initSquareBoard();
	}
}

export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const indices = Array.from(
		document.querySelectorAll( '.roi_t12_indice_input' )
	)
		.map( ( input ) => input.value.trim() )
		.filter( ( val ) => val !== '' );

	const typeReponse = typeReponseSelect ? typeReponseSelect.value : 'piece';
	const reponsePiece = reponsePieceSelect ? reponsePieceSelect.value : 'wN';
	const reponseCase = reponseCaseInput ? reponseCaseInput.value.trim() : '';

	const bonneReponseRadio = document.querySelector(
		'input[name="roi_t12_qcm_good"]:checked'
	);
	const bonneReponse = bonneReponseRadio
		? parseInt( bonneReponseRadio.value, 10 )
		: 0;

	const choix = [];
	for ( let i = 0; i < 3; i++ ) {
		const txtEl = document.querySelector(
			`.roi_t12_qcm_texte[data-index="${ i }"]`
		);
		const explEl = document.querySelector(
			`.roi_t12_qcm_explication[data-index="${ i }"]`
		);
		choix.push( {
			texte: txtEl ? txtEl.value.trim() : '',
			explication: explEl ? explEl.value.trim() : '',
		} );
	}

	const configData = {
		indices,
		type_reponse: typeReponse,
		reponse_piece: reponsePiece,
		reponse_case: reponseCase,
		reponse_qcm: {
			choix,
			bonne_reponse: bonneReponse,
		},
	};

	textarea.value = JSON.stringify( configData, null, 4 );
}

export function init() {
	if ( ! textarea || ! typeReponseSelect ) {
		return;
	}

	// Attacher les événements sur les indices existants rendus par PHP
	if ( indicesContainer ) {
		const initialItems = indicesContainer.querySelectorAll(
			'.roi-t12-indice-item'
		);
		initialItems.forEach( ( itemDiv ) => {
			bindIndiceEvents( itemDiv );
		} );
	}

	// Charger les données depuis le JSON existant
	if ( textarea.value.trim() !== '' ) {
		try {
			const parsed = JSON.parse( textarea.value );
			if ( parsed && typeof parsed === 'object' ) {
				// Indices
				if ( Array.isArray( parsed.indices ) && indicesContainer ) {
					indicesContainer.innerHTML = '';
					parsed.indices.forEach( ( val ) => {
						addIndiceInput( val );
					} );
				}

				// Type de réponse
				if ( parsed.type_reponse && typeReponseSelect ) {
					typeReponseSelect.value = parsed.type_reponse;
				}

				// Pièce
				if ( parsed.reponse_piece && reponsePieceSelect ) {
					reponsePieceSelect.value = parsed.reponse_piece;
				}

				// Case
				if ( parsed.reponse_case && reponseCaseInput ) {
					reponseCaseInput.value = parsed.reponse_case;
				}

				// QCM
				if (
					parsed.reponse_qcm &&
					typeof parsed.reponse_qcm === 'object'
				) {
					if (
						typeof parsed.reponse_qcm.bonne_reponse === 'number'
					) {
						const radio = document.querySelector(
							`input[name="roi_t12_qcm_good"][value="${ parsed.reponse_qcm.bonne_reponse }"]`
						);
						if ( radio ) {
							radio.checked = true;
						}
					}

					if ( Array.isArray( parsed.reponse_qcm.choix ) ) {
						parsed.reponse_qcm.choix.forEach( ( item, idx ) => {
							const txtEl = document.querySelector(
								`.roi_t12_qcm_texte[data-index="${ idx }"]`
							);
							const explEl = document.querySelector(
								`.roi_t12_qcm_explication[data-index="${ idx }"]`
							);
							if ( txtEl && item.texte ) {
								txtEl.value = item.texte;
							}
							if ( explEl && item.explication ) {
								explEl.value = item.explication;
							}
						} );
					}
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 12 initial :', e );
		}
	}

	// Écouteurs d'événements principaux
	typeReponseSelect.addEventListener( 'change', () => {
		updateConditionalBlocks();
		updateConfig();
	} );

	if ( reponsePieceSelect ) {
		reponsePieceSelect.addEventListener( 'change', updateConfig );
	}

	if ( addIndiceBtn ) {
		addIndiceBtn.addEventListener( 'click', () => {
			addIndiceInput( '' );
			updateConfig();
		} );
	}

	// Écouteurs QCM
	const qcmRadios = document.querySelectorAll(
		'input[name="roi_t12_qcm_good"]'
	);
	qcmRadios.forEach( ( radio ) => {
		radio.addEventListener( 'change', updateConfig );
	} );

	const qcmTexts = document.querySelectorAll(
		'.roi_t12_qcm_texte, .roi_t12_qcm_explication'
	);
	qcmTexts.forEach( ( input ) => {
		input.addEventListener( 'input', updateConfig );
	} );

	updateConditionalBlocks();
	updateConfig();
}
