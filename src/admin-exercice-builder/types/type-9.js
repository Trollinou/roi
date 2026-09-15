/**
 * Handler for Type 9: Parcours (Série de 3 parcours).
 */

import { setupFenControl, getActiveColorFromFen } from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const t9ConsigneGlobale = document.getElementById('roi_t9_consigne');

const t9Series = [
	{
		variante: 'standard',
		description: '',
		fen_depart: '',
		couleur_joueur: 'white',
		case_depart: '',
		case_arrivee: '',
		piece_attendue: '',
		is_loop: false,
		shapes: [],
	},
	{
		variante: 'standard',
		description: '',
		fen_depart: '',
		couleur_joueur: 'white',
		case_depart: '',
		case_arrivee: '',
		piece_attendue: '',
		is_loop: false,
		shapes: [],
	},
	{
		variante: 'standard',
		description: '',
		fen_depart: '',
		couleur_joueur: 'white',
		case_depart: '',
		case_arrivee: '',
		piece_attendue: '',
		is_loop: false,
		shapes: [],
	},
];

const previewAPIs = [null, null, null];

function extractPieceRoleFromFen(fen) {
	if (!fen || typeof fen !== 'string') {
		return '';
	}
	const placement = fen.trim().split(' ')[0];
	for (let i = 0; i < placement.length; i++) {
		const char = placement[i];
		if (
			[
				'k',
				'q',
				'r',
				'b',
				'n',
				'p',
				'K',
				'Q',
				'R',
				'B',
				'N',
				'P',
			].includes(char)
		) {
			return char.toLowerCase();
		}
	}
	return '';
}

function getPieceLabel(role) {
	const labels = {
		k: 'Roi',
		q: 'Dame',
		r: 'Tour',
		b: 'Fou',
		n: 'Cavalier',
		p: 'Pion',
	};
	return labels[role.toLowerCase()] || role;
}

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneGlobaleText = t9ConsigneGlobale
		? t9ConsigneGlobale.value.trim()
		: '';

	const configData = {
		consigne: consigneGlobaleText,
		series: t9Series.map((s) => ({
			variante: s.variante || 'standard',
			description: s.description || '',
			fen_depart: s.fen_depart ? s.fen_depart.trim() : '',
			couleur_joueur: s.couleur_joueur || 'white',
			case_depart: s.case_depart || '',
			case_arrivee: s.case_arrivee || '',
			piece_attendue: s.piece_attendue || '',
			is_loop: !!s.is_loop,
			shapes: s.shapes || [],
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function updateSquareDeductions(index) {
	const current = t9Series[index];
	if (!current) {
		return;
	}

	let caseDep = '';
	let caseArr = '';

	if (Array.isArray(current.shapes)) {
		current.shapes.forEach(function (shape) {
			if (shape.brush === 'blue' || shape.brush === 'b') {
				caseDep = shape.orig;
			} else if (shape.brush === 'green' || shape.brush === 'g') {
				caseArr = shape.orig;
			}
		});
	}

	const isLoop =
		!!caseDep &&
		(!caseArr || caseDep.toLowerCase() === caseArr.toLowerCase());

	current.case_depart = caseDep;
	current.case_arrivee = isLoop ? caseDep : caseArr;
	current.is_loop = isLoop;

	const pieceRole = extractPieceRoleFromFen(current.fen_depart);
	current.piece_attendue = pieceRole;

	const depInput = document.querySelector(
		`.roi_t9_case_depart[data-index="${index}"]`
	);
	const arrInput = document.querySelector(
		`.roi_t9_case_arrivee[data-index="${index}"]`
	);
	const pieceInput = document.querySelector(
		`.roi_t9_piece_attendue[data-index="${index}"]`
	);

	if (depInput) {
		depInput.value = caseDep;
	}
	if (arrInput) {
		if (isLoop && caseDep) {
			arrInput.value = `${caseDep} (Boucle / Tour complet)`;
		} else {
			arrInput.value = caseArr;
		}
	}
	if (pieceInput) {
		pieceInput.value = pieceRole
			? `${getPieceLabel(pieceRole)} (${pieceRole.toUpperCase()})`
			: '';
	}
}

function renderPreviewBoard(index) {
	const boardEl = document.getElementById(`roi_t9_preview_board_${index}`);
	if (!boardEl) {
		return;
	}

	const current = t9Series[index];
	const fen = current ? current.fen_depart.trim() : '';

	if (!fen) {
		if (previewAPIs[index]) {
			previewAPIs[index].destroy();
			previewAPIs[index] = null;
		}
		boardEl.innerHTML = '';
		return;
	}

	const orientation = getActiveColorFromFen(fen);
	const shapes = current ? current.shapes || [] : [];

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

	// Charger les données depuis le JSON existant
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string' && t9ConsigneGlobale) {
					t9ConsigneGlobale.value = parsed.consigne;
				}

				if (Array.isArray(parsed.series)) {
					for (let i = 0; i < 3; i++) {
						if (parsed.series[i]) {
							t9Series[i] = {
								variante:
									parsed.series[i].variante || 'standard',
								description: parsed.series[i].description || '',
								fen_depart: parsed.series[i].fen_depart || '',
								couleur_joueur:
									parsed.series[i].couleur_joueur || 'white',
								case_depart: parsed.series[i].case_depart || '',
								case_arrivee:
									parsed.series[i].case_arrivee || '',
								piece_attendue:
									parsed.series[i].piece_attendue || '',
								is_loop: !!parsed.series[i].is_loop,
								shapes: Array.isArray(parsed.series[i].shapes)
									? parsed.series[i].shapes
									: [],
							};
						}
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 9 initial :', e);
		}
	}

	// Synchroniser les champs de description / consigne spécifique
	const descInputs = document.querySelectorAll('.roi_t9_description_item');
	descInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index'), 10);
		if (!isNaN(index) && t9Series[index]) {
			input.value = t9Series[index].description || '';
			input.addEventListener('input', function () {
				t9Series[index].description = input.value;
				updateConfig();
			});
		}
	});

	// Synchroniser les sélecteurs de variante
	const varSelects = document.querySelectorAll('.roi_t9_variante_item');
	varSelects.forEach((select) => {
		const index = parseInt(select.getAttribute('data-index'), 10);
		if (!isNaN(index) && t9Series[index]) {
			select.value = t9Series[index].variante || 'standard';
			select.addEventListener('change', function () {
				t9Series[index].variante = select.value;
				updateConfig();
			});
		}
	});

	// Synchroniser les champs FEN
	const fenInputs = document.querySelectorAll('.roi_t9_fen');
	fenInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index'), 10);
		if (!isNaN(index) && t9Series[index]) {
			input.value = t9Series[index].fen_depart || '';
		}
	});

	// Écouteur consigne globale
	if (t9ConsigneGlobale) {
		t9ConsigneGlobale.addEventListener('input', updateConfig);
	}

	// Initialiser les 3 contrôles FEN et déductions
	for (let i = 0; i < 3; i++) {
		const inputFen =
			document.querySelector(`.roi_t9_fen[data-index="${i}"]`) ||
			document.getElementById(`roi_t9_fen_${i}`);
		const selectColor =
			document.querySelector(`.roi_t9_couleur[data-index="${i}"]`) ||
			document.getElementById(`roi_t9_couleur_${i}`);
		const btnEditor =
			document.getElementById(`btn_open_fen_editor_t9_${i}`) ||
			document.querySelector(
				`.btn_open_fen_editor_t9[data-index="${i}"]`
			);

		updateSquareDeductions(i);

		setupFenControl({
			input: inputFen,
			button: btnEditor,
			colorSelect: selectColor,
			getShapes() {
				return t9Series[i] ? t9Series[i].shapes || [] : [];
			},
			onChange(fen, color, shapes) {
				if (t9Series[i]) {
					t9Series[i].fen_depart = fen;
					t9Series[i].couleur_joueur = color;
					t9Series[i].shapes = shapes || [];

					updateSquareDeductions(i);
					updateConfig();
					renderPreviewBoard(i);
				}
			},
		});

		renderPreviewBoard(i);
	}
}
