/**
 * Handler for Type 3: ABCDaire Tactique (Série de 4 Mini-PGN).
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';
import { createPgnPreviewViewer } from '../utils/pgn-viewer';

const textarea = document.getElementById('roi_config_json');
const t3ConsigneInput = document.getElementById('roi_t3_consigne');

const t3Exercices = [
	{ consigne: '', pgn: '' },
	{ consigne: '', pgn: '' },
	{ consigne: '', pgn: '' },
	{ consigne: '', pgn: '' },
];
const previewViewers = [null, null, null, null];

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneText = t3ConsigneInput
		? t3ConsigneInput.value.trim()
		: 'Trouve le meilleur coup.';

	const configData = {
		consigne: consigneText || 'Trouve le meilleur coup.',
		exercices: t3Exercices.map((exo) => ({
			consigne: exo.consigne ? exo.consigne.trim() : '',
			pgn: exo.pgn || '',
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard(index) {
	const container = document.getElementById(
		`roi_t3_preview_container_${index}`
	);
	if (!container) {
		return;
	}

	const currentExo = t3Exercices[index];
	const pgn = currentExo ? currentExo.pgn.trim() : '';

	if (!previewViewers[index]) {
		previewViewers[index] = createPgnPreviewViewer(container, {
			pgn,
			boardSize: 260,
		});
	} else {
		previewViewers[index].update(pgn);
	}
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
								consigne: parsed.exercices[i].consigne || '',
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
					t3Exercices[0] = { consigne: '', pgn: legacyPgn };
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
		const consigneItemInput =
			document.getElementById(`roi_t3_consigne_${i}`) ||
			document.querySelector(`.roi_t3_consigne_item[data-index="${i}"]`);

		if (consigneItemInput) {
			consigneItemInput.value = t3Exercices[i]
				? t3Exercices[i].consigne || ''
				: '';
			consigneItemInput.addEventListener('input', (e) => {
				if (t3Exercices[i]) {
					t3Exercices[i].consigne = e.target.value;
					updateConfig();
				}
			});
		}

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
