/**
 * Handler for Type 4: La Partie dont tu es le Héros.
 */

import { setupPgnControl, getActiveColorFromFen } from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const t4ConsigneInput = document.getElementById('roi_t4_consigne');
const t4PgnTextarea = document.getElementById('roi_t4_pgn');
const btnPgnEditor = document.getElementById('btn_open_pgn_editor_t4');

let previewAPI = null;

const brushMap = {
	g: 'green',
	r: 'red',
	b: 'blue',
	y: 'yellow',
	c: 'green',
	o: 'yellow',
};

/**
 * Extrait la FEN initiale, l'orientation et les formes/annotations depuis une chaîne PGN.
 *
 * @param {string} pgnString Chaîne PGN source.
 * @return {{ fen: string, orientation: 'white' | 'black', shapes: Array<{ orig: string, dest?: string, brush: string }> }} FEN, orientation et formes extraites.
 */
function extractFenOrientationAndShapes(pgnString) {
	if (!pgnString || typeof pgnString !== 'string') {
		const defaultFen =
			'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		return { fen: defaultFen, orientation: 'white', shapes: [] };
	}

	const trimmed = pgnString.trim();

	// 1. Recherche de la balise [FEN "..."]
	const fenMatch = trimmed.match(/\[FEN\s+"([^"]+)"\]/i);
	let fen = fenMatch
		? fenMatch[1].trim()
		: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

	// Si FEN non trouvée dans les balises mais passée directement en 1ère ligne
	if (!fenMatch && trimmed.includes('/') && !trimmed.startsWith('[')) {
		const firstLine = trimmed.split('\n')[0].trim();
		if (firstLine.includes('/') && firstLine.split('/').length >= 4) {
			fen = firstLine;
		}
	}

	const orientation = getActiveColorFromFen(fen);
	const shapes = [];

	// Ne rechercher les formes QUE dans le commentaire initial (avant le premier coup)
	const bodyWithoutHeaders = trimmed.replace(/\[[^\]]*\]/g, '').trim();
	const firstMoveMatch = bodyWithoutHeaders.search(/\b\d+\s*\./);
	const startingCommentText =
		firstMoveMatch !== -1
			? bodyWithoutHeaders.substring(0, firstMoveMatch)
			: bodyWithoutHeaders;

	// 2. Extraire les cercles/cases [%csl ...] ou [%cpl ...] du commentaire initial
	const cslRegex = /\[%(?:csl|cpl)\s+([^\]]+)\]/gi;
	let cslMatch;
	while ((cslMatch = cslRegex.exec(startingCommentText)) !== null) {
		const items = cslMatch[1].split(',');
		for (const item of items) {
			const cleanItem = item.trim();
			if (cleanItem.length >= 3) {
				const brushChar = cleanItem[0].toLowerCase();
				const brush = brushMap[brushChar] || 'green';
				const orig = cleanItem.substring(1, 3).toLowerCase();
				shapes.push({ orig, brush });
			}
		}
	}

	// 3. Extraire les flèches [%cal ...] du commentaire initial
	const calRegex = /\[%cal\s+([^\]]+)\]/gi;
	let calMatch;
	while ((calMatch = calRegex.exec(startingCommentText)) !== null) {
		const items = calMatch[1].split(',');
		for (const item of items) {
			const cleanItem = item.trim();
			if (cleanItem.length >= 5) {
				const brushChar = cleanItem[0].toLowerCase();
				const brush = brushMap[brushChar] || 'green';
				const orig = cleanItem.substring(1, 3).toLowerCase();
				const dest = cleanItem.substring(3, 5).toLowerCase();
				shapes.push({ orig, dest, brush });
			}
		}
	}

	return { fen, orientation, shapes };
}

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
			consigneText || 'Revivez la partie du héros et trouvez le bon coup.',
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
