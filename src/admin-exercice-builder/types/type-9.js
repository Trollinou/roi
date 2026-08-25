/**
 * Handler for Type 9: Parcours.
 */

import {
	setupFenControl,
	updateOrientationDisplay,
	getOrientationColor,
} from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const varianteInput = document.getElementById('roi_t9_variante');
const fenInput = document.getElementById('roi_t9_fen_depart');
const colorInput = document.getElementById('roi_t9_couleur');
const caseDepartInput = document.getElementById('roi_t9_case_depart');
const caseArriveeInput = document.getElementById('roi_t9_case_arrivee');
const openEditorBtn = document.getElementById('btn_open_fen_editor_t9');

let t9Shapes = [];

export function updateConfig() {
	if (!textarea) {
		return;
	}
	const fenVal = fenInput ? fenInput.value.trim() : '';
	const configData = {
		fen_depart: fenVal,
		couleur_joueur: getOrientationColor(colorInput, fenVal),
		variante: varianteInput ? varianteInput.value : 'standard',
		case_depart: caseDepartInput ? caseDepartInput.value.trim() : '',
		case_arrivee: caseArriveeInput ? caseArriveeInput.value.trim() : '',
		shapes: t9Shapes,
	};
	textarea.value = JSON.stringify(configData, null, 4);
}

export function init() {
	if (!fenInput || !colorInput || !varianteInput || !textarea) {
		return;
	}

	// Charger les données depuis le JSON existant
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (parsed.fen_depart && fenInput) {
					fenInput.value = parsed.fen_depart;
				}
				if (colorInput) {
					updateOrientationDisplay(
						colorInput,
						parsed.couleur_joueur || parsed.fen_depart || 'white'
					);
				}
				if (parsed.variante && varianteInput) {
					varianteInput.value = parsed.variante;
				}
				if (parsed.case_depart && caseDepartInput) {
					caseDepartInput.value = parsed.case_depart;
				}
				if (parsed.case_arrivee && caseArriveeInput) {
					caseArriveeInput.value = parsed.case_arrivee;
				}
				if (Array.isArray(parsed.shapes)) {
					t9Shapes = parsed.shapes;
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 9 initial :', e);
		}
	}

	// Écouteurs d'événements
	if (varianteInput) {
		varianteInput.addEventListener('change', updateConfig);
	}
	setupFenControl({
		input: fenInput,
		button: openEditorBtn,
		colorSelect: colorInput,
		getShapes() {
			return t9Shapes || [];
		},
		onChange(fen, color, shapes) {
			t9Shapes = shapes || [];

			if (caseDepartInput) {
				caseDepartInput.value = '';
			}
			if (caseArriveeInput) {
				caseArriveeInput.value = '';
			}

			t9Shapes.forEach(function (shape) {
				if (shape.brush === 'blue' && caseDepartInput) {
					caseDepartInput.value = shape.orig;
				} else if (shape.brush === 'green' && caseArriveeInput) {
					caseArriveeInput.value = shape.orig;
				}
			});

			updateConfig();
		},
	});
}
