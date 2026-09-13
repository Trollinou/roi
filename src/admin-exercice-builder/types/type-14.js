/**
 * Handler for Type 14: Cap ou pas cap ? (Série de 5 Mini-PGN).
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';
import { createPgnPreviewViewer } from '../utils/pgn-viewer';

const textarea = document.getElementById('roi_config_json');

let t14Consigne = '';
let t14Variante = 'qcm_oui_non';
let t14Propositions = [];
let t14Question = '';
const t14Exercices = [
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
	},
];

const previewViewers = [null, null, null, null, null];

/**
 * Updates visibility of blocks depending on variante.
 */
function updateVisibility() {
	const varianteSelect = document.getElementById('roi_t14_variante');
	const variante = varianteSelect ? varianteSelect.value : 'qcm_oui_non';

	const blocPropositions = document.getElementById(
		'roi_t14_bloc_global_propositions'
	);
	const blocQuestion = document.getElementById(
		'roi_t14_bloc_global_question'
	);

	if (blocPropositions) {
		blocPropositions.style.display =
			variante === 'qcm_multiple' ? 'block' : 'none';
	}
	if (blocQuestion) {
		blocQuestion.style.display =
			variante === 'qcm_oui_non' ? 'block' : 'none';
	}

	const qcmMultipleBlocs = document.querySelectorAll(
		'.roi_t14_bloc_qcm_multiple'
	);
	const qcmOuiNonBlocs = document.querySelectorAll(
		'.roi_t14_bloc_qcm_oui_non'
	);
	const moveBlocs = document.querySelectorAll('.roi_t14_bloc_move');

	qcmMultipleBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'qcm_multiple' ? 'block' : 'none';
	});

	qcmOuiNonBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'qcm_oui_non' ? 'block' : 'none';
	});

	moveBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'move' ? 'block' : 'none';
	});
}

/**
 * Serializes configuration to JSON.
 */
export function updateConfig() {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t14_consigne');
	const varianteSelect = document.getElementById('roi_t14_variante');
	const questionInput = document.getElementById('roi_t14_question');

	t14Consigne = consigneInput ? consigneInput.value.trim() : '';
	t14Variante = varianteSelect ? varianteSelect.value : 'qcm_oui_non';
	t14Question = questionInput ? questionInput.value.trim() : '';

	const configData = {
		consigne: t14Consigne,
		variante: t14Variante,
		propositions: t14Propositions,
		question: t14Question,
		exercices: t14Exercices.map((exo) => ({
			pgn: exo.pgn || '',
			reponses_multiple: Array.isArray(exo.reponses_multiple)
				? exo.reponses_multiple
				: [],
			reponse_oui_non:
				typeof exo.reponse_oui_non === 'boolean'
					? exo.reponse_oui_non
					: true,
			move_san: exo.move_san || '',
			move_explication: exo.move_explication || '',
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

/**
 * Renders proposition answer choices across all 5 diagrams.
 */
function renderMultipleReponsesContainers() {
	for (let i = 0; i < 5; i++) {
		const container = document.querySelector(
			`.roi_t14_multiple_reponses_container[data-index="${i}"]`
		);
		if (!container) {
			continue;
		}

		container.innerHTML = '';

		if (t14Propositions.length === 0) {
			const emptyMsg = document.createElement('div');
			emptyMsg.style.color = '#787c82';
			emptyMsg.style.fontStyle = 'italic';
			emptyMsg.style.fontSize = '12px';
			emptyMsg.textContent =
				'Aucune proposition définie pour le moment. Ajoutez des propositions ci-dessus.';
			container.appendChild(emptyMsg);
			continue;
		}

		t14Propositions.forEach((propText, propIdx) => {
			const row = document.createElement('div');
			row.style.display = 'flex';
			row.style.alignItems = 'center';
			row.style.justifyContent = 'space-between';
			row.style.background = '#fff';
			row.style.border = '1px solid #ccd0d4';
			row.style.borderRadius = '4px';
			row.style.padding = '6px 12px';

			const label = document.createElement('span');
			label.style.fontSize = '13px';
			label.style.fontWeight = '500';
			label.textContent = propText || `Proposition ${propIdx + 1}`;

			const radiosDiv = document.createElement('div');
			radiosDiv.style.display = 'flex';
			radiosDiv.style.gap = '15px';
			radiosDiv.style.alignItems = 'center';

			const isOui = t14Exercices[i].reponses_multiple[propIdx] === true;

			const labelOui = document.createElement('label');
			labelOui.style.cursor = 'pointer';
			labelOui.style.fontWeight = '600';
			labelOui.style.color = '#198754';
			labelOui.innerHTML = `<input type="radio" name="roi_t14_prop_ans_${i}_${propIdx}" value="1" ${isOui ? 'checked' : ''}> ✓ OUI`;

			const labelNon = document.createElement('label');
			labelNon.style.cursor = 'pointer';
			labelNon.style.fontWeight = '600';
			labelNon.style.color = '#dc3545';
			labelNon.innerHTML = `<input type="radio" name="roi_t14_prop_ans_${i}_${propIdx}" value="0" ${!isOui ? 'checked' : ''}> ✗ NON`;

			const onRadioChange = (e) => {
				t14Exercices[i].reponses_multiple[propIdx] =
					e.target.value === '1';
				updateConfig();
			};

			labelOui
				.querySelector('input')
				.addEventListener('change', onRadioChange);
			labelNon
				.querySelector('input')
				.addEventListener('change', onRadioChange);

			radiosDiv.appendChild(labelOui);
			radiosDiv.appendChild(labelNon);

			row.appendChild(label);
			row.appendChild(radiosDiv);

			container.appendChild(row);
		});
	}
}

/**
 * Renders the global propositions list in the admin UI.
 */
function renderPropositionsList() {
	const listContainer = document.getElementById('roi_t14_propositions_list');
	if (!listContainer) {
		return;
	}

	listContainer.innerHTML = '';

	t14Propositions.forEach((propText, propIdx) => {
		const itemDiv = document.createElement('div');
		itemDiv.style.display = 'flex';
		itemDiv.style.gap = '8px';
		itemDiv.style.alignItems = 'center';

		const input = document.createElement('input');
		input.type = 'text';
		input.value = propText;
		input.placeholder = `ex: Petit roque blanc (0-0) ?`;
		input.style.flex = '1';
		input.style.height = '30px';

		input.addEventListener('input', () => {
			t14Propositions[propIdx] = input.value;
			updateConfig();
			renderMultipleReponsesContainers();
		});

		const btnDelete = document.createElement('button');
		btnDelete.type = 'button';
		btnDelete.className = 'button button-link-delete';
		btnDelete.innerHTML = '<span class="dashicons dashicons-trash"></span>';
		btnDelete.title = 'Supprimer cette proposition';

		btnDelete.addEventListener('click', () => {
			t14Propositions.splice(propIdx, 1);
			for (let i = 0; i < 5; i++) {
				if (Array.isArray(t14Exercices[i].reponses_multiple)) {
					t14Exercices[i].reponses_multiple.splice(propIdx, 1);
				}
			}
			renderPropositionsList();
			renderMultipleReponsesContainers();
			updateConfig();
		});

		itemDiv.appendChild(input);
		itemDiv.appendChild(btnDelete);
		listContainer.appendChild(itemDiv);
	});

	renderMultipleReponsesContainers();
}

/**
 * Renders interactive preview for a mini-PGN diagram.
 *
 * @param {number} index Diagram index (0..4).
 */
function renderPreviewBoard(index) {
	const container = document.getElementById(
		`roi_t14_preview_container_${index}`
	);
	if (!container) {
		return;
	}

	const currentExo = t14Exercices[index];
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

/**
 * Initializes Type 14 handlers.
 */
export function init() {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t14_consigne');
	const varianteSelect = document.getElementById('roi_t14_variante');
	const questionInput = document.getElementById('roi_t14_question');
	const btnAddProposition = document.getElementById(
		'roi_t14_add_proposition_btn'
	);

	// Restoration from saved JSON
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string' && consigneInput) {
					consigneInput.value = parsed.consigne;
					t14Consigne = parsed.consigne;
				}

				const detectedVariante =
					parsed.variante || parsed.type_reponse || 'qcm_oui_non';
				t14Variante =
					detectedVariante === 'qcm'
						? 'qcm_oui_non'
						: detectedVariante;
				if (varianteSelect) {
					varianteSelect.value = t14Variante;
				}

				if (Array.isArray(parsed.propositions)) {
					t14Propositions = [...parsed.propositions];
				}

				if (typeof parsed.question === 'string' && questionInput) {
					questionInput.value = parsed.question;
					t14Question = parsed.question;
				}

				const rawExercices =
					parsed.exercices || parsed.diagrammes || [];
				if (Array.isArray(rawExercices)) {
					for (let i = 0; i < 5; i++) {
						const raw = rawExercices[i];
						if (!raw) {
							continue;
						}

						let pgnStr = raw.pgn || '';
						if (!pgnStr && raw.fen) {
							// Rétrocompatibilité FEN
							pgnStr = `[SetUp "1"]\n[FEN "${raw.fen}"]\n\n`;
						}

						let reponseOuiNon = true;
						if (typeof raw.reponse_oui_non === 'boolean') {
							reponseOuiNon = raw.reponse_oui_non;
						} else if (typeof raw.qcm_bonne_reponse === 'number') {
							reponseOuiNon = raw.qcm_bonne_reponse === 0;
						}

						t14Exercices[i] = {
							pgn: pgnStr,
							reponses_multiple: Array.isArray(
								raw.reponses_multiple
							)
								? [...raw.reponses_multiple]
								: [],
							reponse_oui_non: reponseOuiNon,
							move_san: raw.move_san || '',
							move_explication: raw.move_explication || '',
						};
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 14 initial :', e);
		}
	}

	// Dynamic propositions list setup
	renderPropositionsList();

	if (btnAddProposition) {
		btnAddProposition.addEventListener('click', () => {
			t14Propositions.push('');
			for (let i = 0; i < 5; i++) {
				if (!Array.isArray(t14Exercices[i].reponses_multiple)) {
					t14Exercices[i].reponses_multiple = [];
				}
				t14Exercices[i].reponses_multiple.push(true);
			}
			renderPropositionsList();
			updateConfig();
		});
	}

	// Update visibility of blocks initially
	updateVisibility();

	if (varianteSelect) {
		varianteSelect.addEventListener('change', function () {
			t14Variante = varianteSelect.value;
			updateVisibility();
			updateConfig();
		});
	}

	if (consigneInput) {
		consigneInput.addEventListener('input', () => {
			t14Consigne = consigneInput.value;
			updateConfig();
		});
	}

	if (questionInput) {
		questionInput.addEventListener('input', () => {
			t14Question = questionInput.value;
			updateConfig();
		});
	}

	// PGN control setup for all 5 mini-PGNs
	for (let i = 0; i < 5; i++) {
		const pgnTextarea =
			document.getElementById(`roi_t14_pgn_${i}`) ||
			document.querySelector(`.roi_t14_pgn[data-index="${i}"]`);
		const btnPgnEditor =
			document.getElementById(`btn_open_pgn_editor_t14_${i}`) ||
			document.querySelector(
				`.btn_open_pgn_editor_t14[data-index="${i}"]`
			);

		if (pgnTextarea) {
			pgnTextarea.value = t14Exercices[i]
				? t14Exercices[i].pgn || ''
				: '';
		}

		setupPgnControl({
			textarea: pgnTextarea,
			button: btnPgnEditor,
			initialFen() {
				const currentPgn = t14Exercices[i] ? t14Exercices[i].pgn : '';
				const { fen } = extractFenOrientationAndShapes(currentPgn);
				return fen;
			},
			onChange(newPgn) {
				if (t14Exercices[i]) {
					t14Exercices[i].pgn = newPgn;
					updateConfig();
					renderPreviewBoard(i);
				}
			},
		});

		// QCM Oui/Non listener
		const ouiNonRadios = document.querySelectorAll(
			`input[name="roi_t14_reponse_oui_non_${i}"]`
		);
		ouiNonRadios.forEach((radio) => {
			if (t14Exercices[i].reponse_oui_non && radio.value === '1') {
				radio.checked = true;
			} else if (
				!t14Exercices[i].reponse_oui_non &&
				radio.value === '0'
			) {
				radio.checked = true;
			}
			radio.addEventListener('change', (e) => {
				t14Exercices[i].reponse_oui_non = e.target.value === '1';
				updateConfig();
			});
		});

		// Move inputs
		const moveSanInput = document.querySelector(
			`.roi_t14_move_san[data-index="${i}"]`
		);
		const moveExpInput = document.querySelector(
			`.roi_t14_move_explication[data-index="${i}"]`
		);

		if (moveSanInput) {
			moveSanInput.value = t14Exercices[i].move_san || '';
			moveSanInput.addEventListener('input', () => {
				t14Exercices[i].move_san = moveSanInput.value.trim();
				updateConfig();
			});
		}

		if (moveExpInput) {
			moveExpInput.value = t14Exercices[i].move_explication || '';
			moveExpInput.addEventListener('input', () => {
				t14Exercices[i].move_explication = moveExpInput.value.trim();
				updateConfig();
			});
		}

		// Initial preview render
		renderPreviewBoard(i);
	}

	// Initial update
	updateConfig();
}
