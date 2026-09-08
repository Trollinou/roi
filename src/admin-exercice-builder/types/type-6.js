/**
 * Handler for Type 6: Associ'Plan (Série de 4 PGNs complets).
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';

const textarea = document.getElementById('roi_config_json');

const t6Paires = [{ pgn: '' }, { pgn: '' }, { pgn: '' }, { pgn: '' }];

const previewAPIs = [null, null, null, null];

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const configData = {
		paires: t6Paires.map((paire) => ({
			pgn: paire && paire.pgn ? paire.pgn.trim() : '',
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard(index) {
	const boardEl = document.getElementById(`roi_t6_preview_board_${index}`);
	if (!boardEl) {
		return;
	}

	const currentPaire = t6Paires[index];
	const pgn = currentPaire ? currentPaire.pgn.trim() : '';

	if (!pgn) {
		if (previewAPIs[index]) {
			previewAPIs[index].destroy();
			previewAPIs[index] = null;
		}
		boardEl.innerHTML = '';
		return;
	}

	const { fen, orientation, shapes } = extractFenOrientationAndShapes(pgn);

	if (previewAPIs[index]) {
		previewAPIs[index].setPosition(fen);
		if (typeof previewAPIs[index].setConfig === 'function') {
			previewAPIs[index].setConfig({ orientation });
		}
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
				orientation,
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

			if (typeof api.setShapes === 'function') {
				api.setShapes(shapes || []);
			}

			previewAPIs[index] = api;
		}
	}, 50);
}

export function init() {
	if (!textarea) {
		return;
	}

	// Chargement des données existantes
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (
				parsed &&
				typeof parsed === 'object' &&
				Array.isArray(parsed.paires)
			) {
				for (let i = 0; i < 4; i++) {
					if (parsed.paires[i]) {
						t6Paires[i] = {
							pgn:
								parsed.paires[i].pgn ||
								parsed.paires[i].pgn_data ||
								'',
						};
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 6 initial :', e);
		}
	}

	// Synchroniser les champs DOM et configurer les 4 PGN controls
	for (let i = 0; i < 4; i++) {
		const pgnTextarea =
			document.getElementById(`roi_t6_pgn_${i}`) ||
			document.querySelector(`.roi_t6_pgn[data-index="${i}"]`);
		const btnPgnEditor =
			document.getElementById(`btn_open_pgn_editor_t6_${i}`) ||
			document.querySelector(
				`.btn_open_pgn_editor_t6[data-index="${i}"]`
			);

		if (pgnTextarea) {
			pgnTextarea.value = t6Paires[i] ? t6Paires[i].pgn || '' : '';
		}

		setupPgnControl({
			textarea: pgnTextarea,
			button: btnPgnEditor,
			initialFen() {
				const currentPgn = t6Paires[i] ? t6Paires[i].pgn : '';
				const { fen } = extractFenOrientationAndShapes(currentPgn);
				return fen;
			},
			onChange(newPgn) {
				if (t6Paires[i]) {
					t6Paires[i].pgn = newPgn;
					updateConfig();
					renderPreviewBoard(i);
				}
			},
		});

		// Initialiser l'aperçu du diagramme
		renderPreviewBoard(i);
	}
}
