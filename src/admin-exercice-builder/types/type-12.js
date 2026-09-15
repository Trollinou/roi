/**
 * Handler for Type 12: Qui-suis-je ? (Série de 6 cartes).
 */

import { setupFenControl } from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const t12ConsigneInput = document.getElementById('roi_t12_consigne');
const t12VarianteSelect = document.getElementById('roi_t12_variante');

/**
 * Normalizes piece string or SAN-like notation to French piece code (R, D, T, F, C, P).
 * E.g. 'Da1' -> 'D', 'TF4' -> 'T', 'wQ' -> 'D', 'wK' -> 'R'.
 *
 * @param {string} val Value to normalize.
 * @return {string} Normalized French piece code (R, D, T, F, C, P).
 */
export function normalizeFrPiece(val) {
	if (!val) {
		return 'R';
	}
	let v = String(val).trim().toUpperCase();
	if (v.startsWith('W') && v.length === 2) {
		v = v.substring(1);
	}
	const first = v.charAt(0);
	switch (first) {
		case 'D':
		case 'Q':
			return 'D';
		case 'T':
			return 'T';
		case 'F':
		case 'B':
			return 'F';
		case 'C':
		case 'N':
			return 'C';
		case 'P':
			return 'P';
		case 'K':
		case 'R':
		default:
			return 'R';
	}
}

const t12Series = [
	{
		indices: '',
		piece: 'R',
		fen: '8/8/8/8/8/8/8/8 w - - 0 1',
		shapes: [],
		case_attendue: '',
	},
	{
		indices: '',
		piece: 'D',
		fen: '8/8/8/8/8/8/8/8 w - - 0 1',
		shapes: [],
		case_attendue: '',
	},
	{
		indices: '',
		piece: 'T',
		fen: '8/8/8/8/8/8/8/8 w - - 0 1',
		shapes: [],
		case_attendue: '',
	},
	{
		indices: '',
		piece: 'F',
		fen: '8/8/8/8/8/8/8/8 w - - 0 1',
		shapes: [],
		case_attendue: '',
	},
	{
		indices: '',
		piece: 'C',
		fen: '8/8/8/8/8/8/8/8 w - - 0 1',
		shapes: [],
		case_attendue: '',
	},
	{
		indices: '',
		piece: 'P',
		fen: '8/8/8/8/8/8/8/8 w - - 0 1',
		shapes: [],
		case_attendue: '',
	},
];

const previewAPIs = [null, null, null, null, null, null];

/**
 * Extracts target square from green circle shapes.
 *
 * @param {Array} shapes
 * @return {string} Target square (e.g. 'e4') or empty string.
 */
function extractTargetSquare(shapes) {
	if (!Array.isArray(shapes)) {
		return '';
	}
	for (let i = 0; i < shapes.length; i++) {
		const s = shapes[i];
		if (
			s &&
			s.orig &&
			(s.brush === 'green' || s.brush === 'g' || !s.brush)
		) {
			return s.orig.toLowerCase();
		}
	}
	return '';
}

/**
 * Updates deduced target square for a card.
 *
 * @param {number} index
 */
function updateSquareDeductions(index) {
	const current = t12Series[index];
	if (!current) {
		return;
	}

	const targetSquare = extractTargetSquare(current.shapes);
	current.case_attendue = targetSquare;

	const caseInput = document.querySelector(
		`.roi_t12_case_attendue[data-index="${index}"]`
	);
	if (caseInput) {
		caseInput.value = targetSquare;
	}
}

/**
 * Updates UI visibility according to selected variant.
 */
function updateVisibility() {
	const variante = t12VarianteSelect ? t12VarianteSelect.value : 'pieces';

	const piecesBlocs = document.querySelectorAll('.roi_t12_bloc_pieces');
	const casesBlocs = document.querySelectorAll('.roi_t12_bloc_cases');

	piecesBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'pieces' ? 'block' : 'none';
	});

	casesBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'cases' ? 'block' : 'none';
	});

	if (variante === 'cases') {
		for (let i = 0; i < 6; i++) {
			renderPreviewBoard(i);
		}
	}
}

/**
 * Renders static preview chessboard for cases variant.
 *
 * @param {number} index
 */
function renderPreviewBoard(index) {
	const boardEl = document.getElementById(`roi_t12_preview_board_${index}`);
	if (!boardEl) {
		return;
	}

	const currentCard = t12Series[index];
	const fen = currentCard ? currentCard.fen.trim() : '';

	if (!fen) {
		if (previewAPIs[index]) {
			previewAPIs[index].destroy();
			previewAPIs[index] = null;
		}
		boardEl.innerHTML = '';
		return;
	}

	const shapes = currentCard ? currentCard.shapes || [] : [];

	if (previewAPIs[index]) {
		previewAPIs[index].setPosition(fen);
		if (typeof previewAPIs[index].setShapes === 'function') {
			previewAPIs[index].setShapes(shapes);
		}
		if (typeof previewAPIs[index].redraw === 'function') {
			previewAPIs[index].redraw(true);
		}
		return;
	}

	const checkInterval = setInterval(function () {
		if (window.EgBoardCore) {
			clearInterval(checkInterval);

			if (boardEl.parentElement) {
				boardEl.parentElement.classList.add(
					'main-wrap',
					'fit-container',
					'piece-set-cburnett',
					'board-theme-brown'
				);
			}
			boardEl.classList.add('main-board');

			const boardConfig = {
				mode: 'game',
				fen,
				orientation: 'white',
				coordinates: true,
				viewOnly: true,
				movable: {
					free: false,
					color: 'none',
				},
				drawable: {
					enabled: false,
				},
			};

			const boardState = {
				mode: 'game',
				pieceSet: 'cburnett',
				boardTheme: 'brown',
				showThreats: false,
				promotionDialogState: { isEnabled: false },
				historyViewerState: { isEnabled: false },
			};

			const api = new window.EgBoardCore(
				boardEl,
				boardState,
				function () {},
				function () {},
				boardConfig,
				{ workerUrl: '' }
			);

			previewAPIs[index] = api;

			setTimeout(function () {
				if (typeof api.setShapes === 'function') {
					api.setShapes(shapes);
				}
				if (typeof api.redraw === 'function') {
					api.redraw(true);
				}
			}, 100);
		}
	}, 50);
}

/**
 * Updates JSON textarea config.
 */
export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigne = t12ConsigneInput ? t12ConsigneInput.value.trim() : '';
	const variante = t12VarianteSelect ? t12VarianteSelect.value : 'pieces';

	const configData = {
		consigne,
		variante,
		series: t12Series.map((item) => ({
			indices: item.indices || '',
			piece: normalizeFrPiece(item.piece || 'R'),
			fen: item.fen || '8/8/8/8/8/8/8/8 w - - 0 1',
			shapes: Array.isArray(item.shapes) ? item.shapes : [],
			case_attendue: item.case_attendue || '',
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

/**
 * Initializes Type 12 builder.
 */
export function init() {
	if (!textarea) {
		return;
	}

	// Parse JSON existant
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string' && t12ConsigneInput) {
					t12ConsigneInput.value = parsed.consigne;
				}

				if (parsed.variante && t12VarianteSelect) {
					let varVal = parsed.variante;
					if (varVal === 'piece') {
						varVal = 'pieces';
					} else if (varVal === 'case' || varVal === 'square') {
						varVal = 'cases';
					}
					t12VarianteSelect.value = varVal;
				}

				if (Array.isArray(parsed.series)) {
					for (let i = 0; i < 6; i++) {
						if (parsed.series[i]) {
							t12Series[i] = {
								indices: parsed.series[i].indices || '',
								piece: normalizeFrPiece(
									parsed.series[i].piece ||
										parsed.series[i].piece_attendue ||
										'R'
								),
								fen:
									parsed.series[i].fen ||
									'8/8/8/8/8/8/8/8 w - - 0 1',
								shapes: Array.isArray(parsed.series[i].shapes)
									? parsed.series[i].shapes
									: [],
								case_attendue:
									parsed.series[i].case_attendue ||
									parsed.series[i].reponse_case ||
									'',
							};
						}
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 12 initial :', e);
		}
	}

	// Écouteur consigne globale
	if (t12ConsigneInput) {
		t12ConsigneInput.addEventListener('input', updateConfig);
	}

	// Écouteur sélecteur de variante
	if (t12VarianteSelect) {
		t12VarianteSelect.addEventListener('change', () => {
			updateVisibility();
			updateConfig();
		});
	}

	// Synchroniser les textareas d'indices
	const indicesInputs = document.querySelectorAll('.roi_t12_indices_input');
	indicesInputs.forEach((textareaEl) => {
		const index = parseInt(textareaEl.getAttribute('data-index'), 10);
		if (!isNaN(index) && t12Series[index]) {
			textareaEl.value = t12Series[index].indices || '';
			textareaEl.addEventListener('input', function () {
				t12Series[index].indices = textareaEl.value;
				updateConfig();
			});
		}
	});

	// Synchroniser les boutons de sélection de pièces
	const pieceBtns = document.querySelectorAll('.roi_t12_piece_btn');
	pieceBtns.forEach((btn) => {
		const index = parseInt(btn.getAttribute('data-index'), 10);
		const pieceCode = btn.getAttribute('data-piece');

		if (!isNaN(index) && pieceCode && t12Series[index]) {
			// Mettre à jour l'état actif initial
			if (t12Series[index].piece === pieceCode) {
				btn.classList.add('button-primary', 'is-active');
				btn.classList.remove('button-secondary');
			} else {
				btn.classList.remove('button-primary', 'is-active');
				btn.classList.add('button-secondary');
			}

			btn.addEventListener('click', function () {
				t12Series[index].piece = pieceCode;

				// Mettre à jour l'état visuel des boutons de cette carte
				const cardBtns = document.querySelectorAll(
					`.roi_t12_piece_btn[data-index="${index}"]`
				);
				cardBtns.forEach((b) => {
					if (b.getAttribute('data-piece') === pieceCode) {
						b.classList.add('button-primary', 'is-active');
						b.classList.remove('button-secondary');
					} else {
						b.classList.remove('button-primary', 'is-active');
						b.classList.add('button-secondary');
					}
				});

				const hiddenInput = document.querySelector(
					`.roi_t12_piece_input[data-index="${index}"]`
				);
				if (hiddenInput) {
					hiddenInput.value = pieceCode;
				}

				updateConfig();
			});
		}
	});

	// Synchroniser les inputs FEN et les FenControls
	const fenInputs = document.querySelectorAll('.roi_t12_fen');
	fenInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index'), 10);
		if (!isNaN(index) && t12Series[index]) {
			input.value = t12Series[index].fen || '';
		}
	});

	for (let i = 0; i < 6; i++) {
		const inputFen =
			document.querySelector(`.roi_t12_fen[data-index="${i}"]`) ||
			document.getElementById(`roi_t12_fen_${i}`);
		const btnEditor =
			document.getElementById(`btn_open_fen_editor_t12_${i}`) ||
			document.querySelector(
				`.btn_open_fen_editor_t12[data-index="${i}"]`
			);

		updateSquareDeductions(i);

		if (inputFen && btnEditor) {
			setupFenControl({
				input: inputFen,
				button: btnEditor,
				colorSelect: null,
				getShapes() {
					return t12Series[i] ? t12Series[i].shapes || [] : [];
				},
				onChange(fen, color, shapes) {
					if (t12Series[i]) {
						t12Series[i].fen = fen;
						t12Series[i].shapes = shapes || [];

						updateSquareDeductions(i);
						updateConfig();
						renderPreviewBoard(i);
					}
				},
			});
		}

		renderPreviewBoard(i);
	}

	updateVisibility();
	updateConfig();
}
