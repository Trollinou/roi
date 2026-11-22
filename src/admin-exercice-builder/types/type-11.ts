/**
 * Handler for Type 11: Class'échecs.
 */

import { setupFenControl, updateOrientationDisplay } from '../utils/controls';
import type { Shape } from '../../types';

interface PositionItem {
	fen: string;
	couleur_joueur: 'white' | 'black';
	shapes: Shape[];
	commentaire: string;
}

const textarea = document.getElementById('roi_config_json') as HTMLTextAreaElement | null;
const consigneInput = document.getElementById('roi_t11_consigne') as HTMLInputElement | HTMLTextAreaElement | null;

const t11Positions: PositionItem[] = [
	{ fen: '', couleur_joueur: 'white', shapes: [], commentaire: '' },
	{ fen: '', couleur_joueur: 'white', shapes: [], commentaire: '' },
	{ fen: '', couleur_joueur: 'white', shapes: [], commentaire: '' },
	{ fen: '', couleur_joueur: 'white', shapes: [], commentaire: '' },
	{ fen: '', couleur_joueur: 'white', shapes: [], commentaire: '' },
];

export function updateConfig(): void {
	if (!textarea) {
		return;
	}

	const consigneText = consigneInput
		? consigneInput.value.trim()
		: 'Classez ces positions de la plus faible (1) à la plus forte (5).';

	const configData = {
		consigne: consigneText,
		positions: t11Positions.map((pos) => ({
			fen: pos.fen,
			couleur_joueur: pos.couleur_joueur,
			shapes: pos.shapes,
			commentaire: pos.commentaire.trim(),
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

export function init(): void {
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
								commentaire:
									typeof parsed.positions[i].commentaire === 'string'
										? parsed.positions[i].commentaire
										: '',
							};
						}
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 11 initial :', e);
		}
	}

	// Mettre à jour les champs DOM (inputs FEN, orientation et commentaires) d'après l'état en mémoire
	const fenInputs = document.querySelectorAll<HTMLInputElement>('.roi_t11_fen');
	const couleurSelects = document.querySelectorAll<HTMLElement>('.roi_t11_couleur');
	const commentaireInputs = document.querySelectorAll<HTMLTextAreaElement>('.roi_t11_commentaire');

	fenInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index') || '', 10);
		if (!isNaN(index) && t11Positions[index]) {
			input.value = t11Positions[index].fen;
		}
	});

	couleurSelects.forEach((select) => {
		const index = parseInt(select.getAttribute('data-index') || '', 10);
		if (!isNaN(index) && t11Positions[index]) {
			updateOrientationDisplay(select, t11Positions[index].couleur_joueur);
		}
	});

	commentaireInputs.forEach((input) => {
		const index = parseInt(input.getAttribute('data-index') || '', 10);
		if (!isNaN(index) && t11Positions[index]) {
			input.value = t11Positions[index].commentaire;
		}
	});

	// Écouteur consigne
	consigneInput.addEventListener('input', updateConfig);

	// Configuration unifiée des 5 contrôles FEN et commentaires associés
	for (let i = 0; i < 5; i++) {
		const inputFen =
			document.querySelector<HTMLInputElement>(`.roi_t11_fen[data-index="${i}"]`) ||
			document.getElementById(`roi_t11_fen_${i}`) as HTMLInputElement | null;
		const selectColor =
			document.querySelector<HTMLElement>(`.roi_t11_couleur[data-index="${i}"]`) ||
			document.getElementById(`roi_t11_couleur_${i}`);
		const btnEditor =
			document.getElementById(`btn_open_fen_editor_t11_${i}`) ||
			document.querySelector<HTMLElement>(
				`.btn_open_fen_editor_t11[data-index="${i}"]`
			);
		const commentaireInput =
			document.querySelector<HTMLTextAreaElement>(`.roi_t11_commentaire[data-index="${i}"]`) ||
			document.getElementById(`roi_t11_commentaire_${i}`) as HTMLTextAreaElement | null;

		if (commentaireInput) {
			commentaireInput.addEventListener('input', () => {
				if (t11Positions[i]) {
					t11Positions[i].commentaire = commentaireInput.value;
					updateConfig();
				}
			});
		}

		setupFenControl({
			input: inputFen,
			button: btnEditor,
			colorSelect: selectColor,
			getShapes() {
				return t11Positions[i] ? t11Positions[i].shapes || [] : [];
			},
			onChange(fen, color, shapes, comment) {
				if (t11Positions[i]) {
					t11Positions[i].fen = fen;
					t11Positions[i].couleur_joueur = color as 'white' | 'black';
					if (shapes) {
						t11Positions[i].shapes = shapes;
					}
					if (typeof comment === 'string' && comment.trim() !== '') {
						t11Positions[i].commentaire = comment.trim();
						if (commentaireInput) {
							commentaireInput.value = t11Positions[i].commentaire;
						}
					}
					updateConfig();
				}
			},
		});
	}
}
