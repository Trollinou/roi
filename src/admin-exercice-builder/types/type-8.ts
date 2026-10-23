/**
 * Handler for Type 8: Vision'checs (4 Diagrammes avec aperçus).
 */

import { setupFenControl, getActiveColorFromFen } from '../utils/controls';
import { mountRoiBoard } from '../../utils/board-factory';
import type { Shape } from '../../types';

interface DiagrammeItem {
	fen: string;
	couleur_joueur: 'white' | 'black';
	shapes: Shape[];
}

const textarea = document.getElementById('roi_config_json') as HTMLTextAreaElement | null;
const consigneInput = document.getElementById('roi_t8_consigne') as HTMLInputElement | HTMLTextAreaElement | null;

const t8Diagrammes: DiagrammeItem[] = [
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
];

const previewAPIs: Array<{
	destroy: () => void;
	setPosition: (_fen: string) => void;
	setConfig?: (_config: Record<string, unknown>) => void;
	setShapes?: (_shapes: Shape[]) => void;
	redraw?: (_force?: boolean) => void;
} | null> = [null, null, null, null];

export function updateConfig(): void {
	if (!textarea) {
		return;
	}

	const consigneText = consigneInput
		? consigneInput.value.trim()
		: 'Observez les 4 diagrammes ci-dessous.';

	const configData = {
		consigne: consigneText,
		diagrammes: t8Diagrammes,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard(index: number): void {
	const boardEl = document.getElementById(`roi_t8_preview_board_${index}`);
	if (!boardEl) {
		return;
	}

	const currentDiagram = t8Diagrammes[index];
	const fen = currentDiagram ? currentDiagram.fen.trim() : '';

	if (!fen) {
		if (previewAPIs[index]) {
			previewAPIs[index]?.destroy();
			previewAPIs[index] = null;
		}
		boardEl.innerHTML = '';
		return;
	}

	// L'orientation est strictement calculée d'après le trait de la FEN ('w' -> 'white', 'b' -> 'black')
	const orientation = getActiveColorFromFen(fen);
	const shapes = currentDiagram ? currentDiagram.shapes || [] : [];

	if (previewAPIs[index]) {
		previewAPIs[index]?.setPosition(fen);
		if (typeof previewAPIs[index]?.setConfig === 'function') {
			previewAPIs[index]?.setConfig?.({ orientation });
		}
		if (typeof previewAPIs[index]?.setShapes === 'function') {
			previewAPIs[index]?.setShapes?.(shapes);
		}
		if (typeof previewAPIs[index]?.redraw === 'function') {
			previewAPIs[index]?.redraw?.(true);
		}
		return;
	}

	const api = mountRoiBoard(boardEl, {
		fen,
		orientation,
		viewOnly: true,
		coordinates: true,
		shapes,
		boardConfig: {
			movable: { free: false, color: 'none' },
			drawable: { enabled: false },
		},
	});

	previewAPIs[index] = api;
}

export function init(): void {
	if (!textarea) {
		return;
	}

	// Restaurer les données depuis le JSON si présent
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string' && consigneInput) {
					consigneInput.value = parsed.consigne;
				}
				if (Array.isArray(parsed.diagrammes)) {
					for (let i = 0; i < 4; i++) {
						if (parsed.diagrammes[i]) {
							t8Diagrammes[i] = {
								fen: parsed.diagrammes[i].fen || '',
								couleur_joueur:
									parsed.diagrammes[i].couleur_joueur ||
									'white',
								shapes: parsed.diagrammes[i].shapes || [],
							};
						}
					}
				} else if (parsed.fen_depart) {
					// Retro-compatibilité ancienne structure
					t8Diagrammes[0] = {
						fen: parsed.fen_depart,
						couleur_joueur: parsed.couleur_joueur || 'white',
						shapes: parsed.shapes || [],
					};
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 8 initial :', e);
		}
	}

	// Synchroniser les champs DOM (inputs FEN)
	const fenInputs = document.querySelectorAll<HTMLInputElement>('.roi_t8_fen');
	fenInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index') || '', 10);
		if (!isNaN(index) && t8Diagrammes[index]) {
			input.value = t8Diagrammes[index].fen;
		}
	});

	// Écouteur consigne
	if (consigneInput) {
		consigneInput.addEventListener('input', updateConfig);
	}

	// Configuration unifiée des 4 contrôles FEN et instanciation des aperçus
	for (let i = 0; i < 4; i++) {
		const inputFen =
			document.querySelector<HTMLInputElement>(`.roi_t8_fen[data-index="${i}"]`) ||
			document.getElementById(`roi_t8_fen_${i}`) as HTMLInputElement | null;
		const selectColor =
			document.querySelector<HTMLSelectElement>(`.roi_t8_couleur[data-index="${i}"]`) ||
			document.getElementById(`roi_t8_couleur_${i}`) as HTMLSelectElement | null;
		const btnEditor =
			document.getElementById(`btn_open_fen_editor_t8_${i}`) ||
			document.querySelector<HTMLElement>(
				`.btn_open_fen_editor_t8[data-index="${i}"]`
			);

		setupFenControl({
			input: inputFen,
			button: btnEditor,
			colorSelect: selectColor,
			getShapes() {
				return t8Diagrammes[i] ? t8Diagrammes[i].shapes || [] : [];
			},
			onChange(fen, color, shapes) {
				if (t8Diagrammes[i]) {
					t8Diagrammes[i].fen = fen;
					t8Diagrammes[i].couleur_joueur = color as 'white' | 'black';
					if (shapes) {
						t8Diagrammes[i].shapes = shapes;
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
