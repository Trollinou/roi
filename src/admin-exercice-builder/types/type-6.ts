/**
 * Handler for Type 6: Associ'Plan (Série de 4 PGNs complets).
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';
import { mountRoiBoard } from '../../utils/board-factory';
import type { Shape } from '../../types';

interface PaireItem {
	pgn: string;
}

const textarea = document.getElementById('roi_config_json') as HTMLTextAreaElement | null;

const t6Paires: PaireItem[] = [{ pgn: '' }, { pgn: '' }, { pgn: '' }, { pgn: '' }];

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

	const configData = {
		paires: t6Paires.map((paire) => ({
			pgn: paire && paire.pgn ? paire.pgn.trim() : '',
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard(index: number): void {
	const boardEl = document.getElementById(`roi_t6_preview_board_${index}`);
	if (!boardEl) {
		return;
	}

	const currentPaire = t6Paires[index];
	const pgn = currentPaire ? currentPaire.pgn.trim() : '';

	if (!pgn) {
		if (previewAPIs[index]) {
			previewAPIs[index]?.destroy();
			previewAPIs[index] = null;
		}
		boardEl.innerHTML = '';
		return;
	}

	const { fen, orientation, shapes } = extractFenOrientationAndShapes(pgn);

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
		shapes: shapes || [],
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
			document.getElementById(`roi_t6_pgn_${i}`) as HTMLTextAreaElement | null ||
			document.querySelector<HTMLTextAreaElement>(`.roi_t6_pgn[data-index="${i}"]`);
		const btnPgnEditor =
			document.getElementById(`btn_open_pgn_editor_t6_${i}`) ||
			document.querySelector<HTMLElement>(
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
