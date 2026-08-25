/**
 * Handler for Type 11: Class'échecs.
 */

import { setupFenControl } from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const consigneInput = document.getElementById('roi_t11_consigne');

const t11Positions = [
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
	{ fen: '', couleur_joueur: 'white', shapes: [] },
];

export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneText = consigneInput
		? consigneInput.value.trim()
		: 'Classez ces positions de la plus forte (1) à la moins forte (5).';

	const configData = {
		consigne: consigneText,
		positions: t11Positions,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

export function init() {
	if (!consigneInput || !textarea) {
		return;
	}

	// Restaurer les données depuis le JSON si présent
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string') {
					consigneInput.value = parsed.consigne;
				}
				if (Array.isArray(parsed.positions)) {
					for (let i = 0; i < 5; i++) {
						if (parsed.positions[i]) {
							t11Positions[i] = {
								fen: parsed.positions[i].fen || '',
								couleur_joueur:
									parsed.positions[i].couleur_joueur ||
									'white',
								shapes: parsed.positions[i].shapes || [],
							};
						}
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 11 initial :', e);
		}
	}

	// Mettre à jour les champs DOM (inputs FEN et selects couleur) d'après l'état en mémoire
	const fenInputs = document.querySelectorAll('.roi_t11_fen');
	const couleurSelects = document.querySelectorAll('.roi_t11_couleur');

	fenInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index'), 10);
		if (!isNaN(index) && t11Positions[index]) {
			input.value = t11Positions[index].fen;
		}
	});

	couleurSelects.forEach((select) => {
		const index = parseInt(select.getAttribute('data-index'), 10);
		if (!isNaN(index) && t11Positions[index]) {
			select.value = t11Positions[index].couleur_joueur;
		}
	});

	// Écouteur consigne
	consigneInput.addEventListener('input', updateConfig);

	// Configuration unifiée des 5 contrôles FEN
	for (let i = 0; i < 5; i++) {
		const inputFen =
			document.querySelector(`.roi_t11_fen[data-index="${i}"]`) ||
			document.getElementById(`roi_t11_fen_${i}`);
		const selectColor =
			document.querySelector(`.roi_t11_couleur[data-index="${i}"]`) ||
			document.getElementById(`roi_t11_couleur_${i}`);
		const btnEditor =
			document.getElementById(`btn_open_fen_editor_t11_${i}`) ||
			document.querySelector(
				`.btn_open_fen_editor_t11[data-index="${i}"]`
			);

		setupFenControl({
			input: inputFen,
			button: btnEditor,
			colorSelect: selectColor,
			getShapes() {
				return t11Positions[i] ? t11Positions[i].shapes || [] : [];
			},
			onChange(fen, color, shapes) {
				if (t11Positions[i]) {
					t11Positions[i].fen = fen;
					t11Positions[i].couleur_joueur = color;
					if (shapes) {
						t11Positions[i].shapes = shapes;
					}
					updateConfig();
				}
			},
		});
	}
}
