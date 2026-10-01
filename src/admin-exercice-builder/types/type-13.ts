/**
 * Handler for Type 13: Ouvre'boîte (Série de 6 Mini-PGN).
 */

import { setupPgnControl } from '../utils/controls';
import { createPgnPreviewViewer } from '../utils/pgn-viewer';

interface ExercicePgnItem {
	pgn: string;
}

const textarea = document.getElementById('roi_config_json') as HTMLTextAreaElement | null;

let t13Consigne = '';
const t13Exercices: ExercicePgnItem[] = [
	{ pgn: '' },
	{ pgn: '' },
	{ pgn: '' },
	{ pgn: '' },
	{ pgn: '' },
	{ pgn: '' },
];

const previewViewers: Array<{ update: (pgn: string) => void } | null> = [
	null,
	null,
	null,
	null,
	null,
	null,
];

/**
 * Updates the JSON textarea config.
 */
export function updateConfig(): void {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t13_consigne') as HTMLInputElement | HTMLTextAreaElement | null;
	t13Consigne = consigneInput ? consigneInput.value.trim() : '';

	for (let i = 0; i < 6; i++) {
		const pgnInput = document.getElementById(`roi_t13_pgn_${i}`) as HTMLInputElement | HTMLTextAreaElement | null;
		if (pgnInput) {
			t13Exercices[i].pgn = pgnInput.value.trim();
		}
	}

	const configData = {
		consigne: t13Consigne,
		exercices: t13Exercices,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

/**
 * Renders interactive preview for a mini-PGN diagram.
 */
function renderPreviewBoard(index: number): void {
	const container = document.getElementById(
		`roi_t13_preview_container_${index}`
	);
	if (!container) {
		return;
	}

	const currentExo = t13Exercices[index];
	const pgn = currentExo ? currentExo.pgn.trim() : '';

	if (!previewViewers[index]) {
		previewViewers[index] = createPgnPreviewViewer(container, {
			pgn,
			boardSize: 260,
		});
	} else {
		previewViewers[index]?.update(pgn);
	}
}

/**
 * Initializes Type 13 handlers.
 */
export function init(): void {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t13_consigne') as HTMLInputElement | HTMLTextAreaElement | null;

	// Restauration des données JSON si présentes
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string' && consigneInput) {
					consigneInput.value = parsed.consigne;
					t13Consigne = parsed.consigne;
				}

				if (Array.isArray(parsed.exercices)) {
					for (let i = 0; i < 6; i++) {
						if (parsed.exercices[i]) {
							const exo = parsed.exercices[i];
							const pgn =
								typeof exo === 'string' ? exo : exo.pgn || '';
							t13Exercices[i].pgn = pgn;

							const pgnInput = document.getElementById(
								`roi_t13_pgn_${i}`
							) as HTMLInputElement | HTMLTextAreaElement | null;
							if (pgnInput) {
								pgnInput.value = pgn;
							}
						}
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 13 initial :', e);
		}
	}

	if (consigneInput) {
		consigneInput.addEventListener('input', updateConfig);
		consigneInput.addEventListener('change', updateConfig);
	}

	for (let i = 0; i < 6; i++) {
		const pgnInput = document.getElementById(`roi_t13_pgn_${i}`) as HTMLInputElement | HTMLTextAreaElement | null;
		const btnPgnEditor = document.getElementById(
			`btn_open_pgn_editor_t13_${i}`
		);

		if (pgnInput && btnPgnEditor) {
			setupPgnControl({
				textarea: pgnInput instanceof HTMLTextAreaElement ? pgnInput : null,
				input: pgnInput instanceof HTMLInputElement ? pgnInput : null,
				button: btnPgnEditor,
				onChange(pgn) {
					t13Exercices[i].pgn = pgn;
					renderPreviewBoard(i);
					updateConfig();
				},
			});

			pgnInput.addEventListener('input', () => {
				t13Exercices[i].pgn = pgnInput.value.trim();
				renderPreviewBoard(i);
				updateConfig();
			});
		}

		renderPreviewBoard(i);
	}

	updateConfig();
}
