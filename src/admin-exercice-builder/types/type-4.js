/**
 * Handler for Type 4: La Partie dont tu es le Héros.
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const t4ConsigneInput = document.getElementById('roi_t4_consigne');
const t4PgnTextarea = document.getElementById('roi_t4_pgn');
const btnPgnEditor = document.getElementById('btn_open_pgn_editor_t4');

let previewAPI = null;

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneText = t4ConsigneInput
		? t4ConsigneInput.value.trim()
		: 'Revivez la partie du héros et trouvez le bon coup.';
	const pgnText = t4PgnTextarea ? t4PgnTextarea.value.trim() : '';

	const configData = {
		consigne:
			consigneText ||
			'Revivez la partie du héros et trouvez le bon coup.',
		pgn: pgnText,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard() {
	const boardEl = document.getElementById('roi_t4_preview_board');
	if (!boardEl) {
		return;
	}

	const pgn = t4PgnTextarea ? t4PgnTextarea.value.trim() : '';

	if (!pgn) {
		if (previewAPI) {
			previewAPI.destroy();
			previewAPI = null;
		}
		boardEl.innerHTML = '';
		return;
	}

	const { fen, orientation, shapes } = extractFenOrientationAndShapes(pgn);

	if (previewAPI) {
		previewAPI.setPosition(fen);
		if (typeof previewAPI.setConfig === 'function') {
			previewAPI.setConfig({ orientation });
		}
		if (typeof previewAPI.setShapes === 'function') {
			previewAPI.setShapes(shapes);
		}
		if (typeof previewAPI.redraw === 'function') {
			previewAPI.redraw(true);
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

			previewAPI = api;
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
					t4ConsigneInput
				) {
					t4ConsigneInput.value = parsed.consigne;
				}

				if (typeof parsed.pgn === 'string' && t4PgnTextarea) {
					t4PgnTextarea.value = parsed.pgn;
				} else if (Array.isArray(parsed.etapes) && t4PgnTextarea) {
					// Rétrocompatibilité avec ancien format multi-étapes
					const pgnParts = [];
					for (const etape of parsed.etapes) {
						if (etape && typeof etape.pgn_data === 'string') {
							pgnParts.push(etape.pgn_data);
						}
					}
					t4PgnTextarea.value = pgnParts.join('\n\n');
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 4 initial :', e);
		}
	}

	// Écouteur sur la consigne générale
	if (t4ConsigneInput) {
		t4ConsigneInput.addEventListener('input', updateConfig);
	}

	// Initialisation du contrôle PGN interactif
	setupPgnControl({
		textarea: t4PgnTextarea,
		button: btnPgnEditor,
		initialFen() {
			const currentPgn = t4PgnTextarea ? t4PgnTextarea.value : '';
			const { fen } = extractFenOrientationAndShapes(currentPgn);
			return fen;
		},
		onChange(newPgn) {
			if (t4PgnTextarea) {
				t4PgnTextarea.value = newPgn;
			}
			updateConfig();
			renderPreviewBoard();
		},
	});

	// Rendu initial de l'aperçu du plateau
	renderPreviewBoard();
}
