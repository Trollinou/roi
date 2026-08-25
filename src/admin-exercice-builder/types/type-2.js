/**
 * Handler for Type 2: Pop'Echecs (Série de 4 Diagrammes).
 */

import { setupFenControl, getActiveColorFromFen } from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const t2ConsigneGlobale = document.getElementById('roi_t2_consigne');

const t2Diagrammes = [
	{ consigne: '', fen: '', couleur_joueur: 'white', shapes: [] },
	{ consigne: '', fen: '', couleur_joueur: 'white', shapes: [] },
	{ consigne: '', fen: '', couleur_joueur: 'white', shapes: [] },
	{ consigne: '', fen: '', couleur_joueur: 'white', shapes: [] },
];

const previewAPIs = [null, null, null, null];

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneGlobaleText = t2ConsigneGlobale
		? t2ConsigneGlobale.value.trim()
		: '';

	const configData = {
		consigne: consigneGlobaleText,
		diagrammes: t2Diagrammes,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard(index) {
	const boardEl = document.getElementById(`roi_t2_preview_board_${index}`);
	if (!boardEl) {
		return;
	}

	const currentDiagram = t2Diagrammes[index];
	const fen = currentDiagram ? currentDiagram.fen.trim() : '';

	if (!fen) {
		if (previewAPIs[index]) {
			previewAPIs[index].destroy();
			previewAPIs[index] = null;
		}
		boardEl.innerHTML = '';
		return;
	}

	// L'orientation est strictement calculée d'après le trait de la FEN ('w' -> 'white', 'b' -> 'black')
	const orientation = getActiveColorFromFen(fen);
	const shapes = currentDiagram ? currentDiagram.shapes || [] : [];

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

			if (shapes && typeof api.setShapes === 'function') {
				api.setShapes(shapes);
			}

			previewAPIs[index] = api;
		}
	}, 50);
}

export function init() {
	if (!textarea) {
		return;
	}

	// Initialisation des données depuis le JSON existant
	if (textarea.value.trim() !== '') {
		try {
			const parsedT2 = JSON.parse(textarea.value);
			if (parsedT2 && typeof parsedT2 === 'object') {
				if (
					typeof parsedT2.consigne === 'string' &&
					t2ConsigneGlobale
				) {
					t2ConsigneGlobale.value = parsedT2.consigne;
				}

				if (Array.isArray(parsedT2.diagrammes)) {
					for (let i = 0; i < 4; i++) {
						if (parsedT2.diagrammes[i]) {
							t2Diagrammes[i] = {
								consigne:
									parsedT2.diagrammes[i].consigne || '',
								fen: parsedT2.diagrammes[i].fen || '',
								couleur_joueur:
									parsedT2.diagrammes[i].couleur_joueur ||
									'white',
								shapes: parsedT2.diagrammes[i].shapes || [],
							};
						}
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 2 initial :', e);
		}
	}

	// Synchroniser les champs DOM (inputs consigne et FEN)
	const consigneInputs = document.querySelectorAll('.roi_t2_consigne_item');
	consigneInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index'), 10);
		if (!isNaN(index) && t2Diagrammes[index]) {
			input.value = t2Diagrammes[index].consigne || '';
			input.addEventListener('input', function () {
				t2Diagrammes[index].consigne = input.value;
				updateConfig();
			});
		}
	});

	const fenInputs = document.querySelectorAll('.roi_t2_fen');
	fenInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index'), 10);
		if (!isNaN(index) && t2Diagrammes[index]) {
			input.value = t2Diagrammes[index].fen || '';
		}
	});

	// Écouteur consigne globale
	if (t2ConsigneGlobale) {
		t2ConsigneGlobale.addEventListener('input', updateConfig);
	}

	// Configuration unifiée des 4 contrôles FEN et instanciation des aperçus
	for (let i = 0; i < 4; i++) {
		const inputFen =
			document.querySelector(`.roi_t2_fen[data-index="${i}"]`) ||
			document.getElementById(`roi_t2_fen_${i}`);
		const selectColor =
			document.querySelector(`.roi_t2_couleur[data-index="${i}"]`) ||
			document.getElementById(`roi_t2_couleur_${i}`);
		const btnEditor =
			document.getElementById(`btn_open_fen_editor_t2_${i}`) ||
			document.querySelector(
				`.btn_open_fen_editor_t2[data-index="${i}"]`
			);

		setupFenControl({
			input: inputFen,
			button: btnEditor,
			colorSelect: selectColor,
			getShapes() {
				return t2Diagrammes[i] ? t2Diagrammes[i].shapes || [] : [];
			},
			onChange(fen, color, shapes) {
				if (t2Diagrammes[i]) {
					t2Diagrammes[i].fen = fen;
					t2Diagrammes[i].couleur_joueur = color;
					if (shapes) {
						t2Diagrammes[i].shapes = shapes;
					}
					updateConfig();
					renderPreviewBoard(i);
				}
			},
		});

		// Initialiser l'aperçu du diagramme
		renderPreviewBoard(i);
	}
}
