/**
 * Handler for Type 5: Posi'Plan.
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';
import { createPgnPreviewViewer } from '../utils/pgn-viewer';

const textarea = document.getElementById('roi_config_json');
const t5ConsigneInput = document.getElementById('roi_t5_consigne');
const t5PgnTextarea = document.getElementById('roi_t5_pgn');
const btnPgnEditor = document.getElementById('btn_open_pgn_editor_t5');

let previewViewer = null;

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneText = t5ConsigneInput
		? t5ConsigneInput.value.trim()
		: 'Évaluez la position et choisissez le meilleur plan.';
	const pgnText = t5PgnTextarea ? t5PgnTextarea.value.trim() : '';

	const configData = {
		consigne:
			consigneText ||
			'Évaluez la position et choisissez le meilleur plan.',
		pgn: pgnText,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

function renderPreviewBoard() {
	const container = document.getElementById('roi_t5_preview_container');
	if (!container) {
		return;
	}

	const pgn = t5PgnTextarea ? t5PgnTextarea.value.trim() : '';

	if (!previewViewer) {
		previewViewer = createPgnPreviewViewer(container, {
			pgn,
			boardSize: 260,
		});
	} else {
		previewViewer.update(pgn);
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
					t5ConsigneInput
				) {
					t5ConsigneInput.value = parsed.consigne;
				}

				if (typeof parsed.pgn === 'string' && t5PgnTextarea) {
					t5PgnTextarea.value = parsed.pgn;
				} else if (Array.isArray(parsed.etapes) && t5PgnTextarea) {
					// Rétrocompatibilité avec ancien format multi-étapes
					const pgnParts = [];
					for (const etape of parsed.etapes) {
						if (etape && typeof etape.pgn_data === 'string') {
							pgnParts.push(etape.pgn_data);
						}
					}
					t5PgnTextarea.value = pgnParts.join('\n\n');
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 5 initial :', e);
		}
	}

	// Écouteur sur la consigne générale
	if (t5ConsigneInput) {
		t5ConsigneInput.addEventListener('input', updateConfig);
	}

	// Initialisation du contrôle PGN interactif
	setupPgnControl({
		textarea: t5PgnTextarea,
		button: btnPgnEditor,
		initialFen() {
			const currentPgn = t5PgnTextarea ? t5PgnTextarea.value : '';
			const { fen } = extractFenOrientationAndShapes(currentPgn);
			return fen;
		},
		onChange(newPgn) {
			if (t5PgnTextarea) {
				t5PgnTextarea.value = newPgn;
			}
			updateConfig();
			renderPreviewBoard();
		},
	});

	// Rendu initial de l'aperçu du plateau
	renderPreviewBoard();
}
