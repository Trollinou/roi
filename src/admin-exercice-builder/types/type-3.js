/**
 * Handler for Type 3: ABCDaire Tactique (Série de 4 Mini-PGN).
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const t3ConsigneInput = document.getElementById('roi_t3_consigne');

const t3Exercices = [{ pgn: '' }, { pgn: '' }, { pgn: '' }, { pgn: '' }];

const previewAPIs = [null, null, null, null];

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneText = t3ConsigneInput
		? t3ConsigneInput.value.trim()
		: 'Trouver le meilleur coup.';

	const configData = {
		consigne: consigneText || 'Trouver le meilleur coup.',
		exercices: t3Exercices.map((exo) => ({
			pgn: exo.pgn || '',
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard(index) {
	const boardEl = document.getElementById(`roi_t3_preview_board_${index}`);
	if (!boardEl) {
		return;
	}

	const currentExo = t3Exercices[index];
	const pgn = currentExo ? currentExo.pgn.trim() : '';

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
			if (parsed && typeof parsed === 'object') {
				if (
					typeof parsed.consigne === 'string' &&
					parsed.consigne.trim() !== '' &&
					t3ConsigneInput
				) {
					t3ConsigneInput.value = parsed.consigne;
				}

				if (Array.isArray(parsed.exercices)) {
					for (let i = 0; i < 4; i++) {
						if (parsed.exercices[i]) {
							t3Exercices[i] = {
								pgn: parsed.exercices[i].pgn || '',
							};
						}
					}
				} else if (parsed.fen) {
					// Retro-compatibilité avec l'ancien format
					const legacyPgn =
						'[SetUp "1"]\n[FEN "' +
						parsed.fen +
						'"]\n\n' +
						(Array.isArray(parsed.solution)
							? parsed.solution.join(' ')
							: '');
					t3Exercices[0] = { pgn: legacyPgn };
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 3 initial :', e);
		}
	}

	// Écouteur sur la consigne globale
	if (t3ConsigneInput) {
		t3ConsigneInput.addEventListener('input', updateConfig);
	}

	// Synchroniser les champs DOM et configurer les 4 PGN controls
	for (let i = 0; i < 4; i++) {
		const pgnTextarea =
			document.getElementById(`roi_t3_pgn_${i}`) ||
			document.querySelector(`.roi_t3_pgn[data-index="${i}"]`);
		const btnPgnEditor =
			document.getElementById(`btn_open_pgn_editor_t3_${i}`) ||
			document.querySelector(
				`.btn_open_pgn_editor_t3[data-index="${i}"]`
			);

		if (pgnTextarea) {
			pgnTextarea.value = t3Exercices[i] ? t3Exercices[i].pgn || '' : '';
		}

		setupPgnControl({
			textarea: pgnTextarea,
			button: btnPgnEditor,
			initialFen() {
				const currentPgn = t3Exercices[i] ? t3Exercices[i].pgn : '';
				const { fen } = extractFenOrientationAndShapes(currentPgn);
				return fen;
			},
			onChange(newPgn) {
				if (t3Exercices[i]) {
					t3Exercices[i].pgn = newPgn;
					updateConfig();
					renderPreviewBoard(i);
				}
			},
		});

		// Initialiser l'aperçu du diagramme
		renderPreviewBoard(i);
	}
}
