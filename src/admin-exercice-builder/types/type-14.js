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
let t14ModeClic = 'cibles';
let t14ModeSetup = 'memoire';
let t14OptionsReponse = ['OUI', 'NON'];
let t14Propositions = [];
let t14Question = '';
const t14Exercices = [
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
		conseil: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
		conseil: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
		conseil: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
		conseil: '',
	},
	{
		pgn: '',
		reponses_multiple: [],
		reponse_oui_non: true,
		move_san: '',
		move_explication: '',
		conseil: '',
	},
];

const previewViewers = [null, null, null, null, null];

/**
 * Updates visibility of blocks depending on variante.
 */
function updateVisibility() {
	const varianteSelect = document.getElementById('roi_t14_variante');
	const variante = varianteSelect ? varianteSelect.value : 'qcm_oui_non';

	const blocOptionsReponse = document.getElementById(
		'roi_t14_bloc_global_options_reponse'
	);
	const blocPropositions = document.getElementById(
		'roi_t14_bloc_global_propositions'
	);
	const blocQuestion = document.getElementById(
		'roi_t14_bloc_global_question'
	);
	const blocClic = document.getElementById('roi_t14_bloc_global_clic');
	const blocSetup = document.getElementById('roi_t14_bloc_global_setup');

	if (blocOptionsReponse) {
		blocOptionsReponse.style.display =
			variante === 'qcm_multiple' || variante === 'qcm_oui_non'
				? 'block'
				: 'none';
	}
	if (blocPropositions) {
		blocPropositions.style.display =
			variante === 'qcm_multiple' ? 'block' : 'none';
	}
	if (blocQuestion) {
		blocQuestion.style.display =
			variante === 'qcm_oui_non' ? 'block' : 'none';
	}
	if (blocClic) {
		blocClic.style.display = variante === 'clic' ? 'block' : 'none';
	}
	if (blocSetup) {
		blocSetup.style.display = variante === 'setup' ? 'block' : 'none';
	}

	const qcmMultipleBlocs = document.querySelectorAll(
		'.roi_t14_bloc_qcm_multiple'
	);
	const qcmOuiNonBlocs = document.querySelectorAll(
		'.roi_t14_bloc_qcm_oui_non'
	);
	const moveBlocs = document.querySelectorAll('.roi_t14_bloc_move');
	const notationBlocs = document.querySelectorAll('.roi_t14_bloc_notation');
	const clicBlocs = document.querySelectorAll('.roi_t14_bloc_clic');
	const setupBlocs = document.querySelectorAll('.roi_t14_bloc_setup');

	qcmMultipleBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'qcm_multiple' ? 'block' : 'none';
	});

	qcmOuiNonBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'qcm_oui_non' ? 'block' : 'none';
	});

	moveBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'move' ? 'block' : 'none';
	});

	notationBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'notation' ? 'block' : 'none';
	});

	clicBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'clic' ? 'block' : 'none';
	});

	setupBlocs.forEach((bloc) => {
		bloc.style.display = variante === 'setup' ? 'block' : 'none';
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

	const checkedModeClic = document.querySelector(
		'input[name="roi_t14_mode_clic"]:checked'
	);
	if (checkedModeClic) {
		t14ModeClic = checkedModeClic.value;
	}

	const checkedModeSetup = document.querySelector(
		'input[name="roi_t14_mode_setup"]:checked'
	);
	if (checkedModeSetup) {
		t14ModeSetup = checkedModeSetup.value;
	}

	const configData = {
		consigne: t14Consigne,
		variante: t14Variante,
		mode_clic: t14ModeClic,
		mode_setup: t14ModeSetup,
		options_reponse: t14OptionsReponse,
		propositions: t14Propositions,
		question: t14Question,
		exercices: t14Exercices.map((exo) => ({
			pgn: exo.pgn || '',
			reponses_multiple: Array.isArray(exo.reponses_multiple)
				? exo.reponses_multiple
				: [],
			reponse_oui_non:
				typeof exo.reponse_oui_non !== 'undefined'
					? exo.reponse_oui_non
					: true,
			move_san: exo.move_san || '',
			move_explication: exo.move_explication || '',
			conseil: exo.conseil || '',
		})),
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

/**
 * Renders the global response options list (e.g. OUI, NON, or 0, 1, 2, 3).
 */
function renderOptionsReponseList() {
	const listContainer = document.getElementById(
		'roi_t14_options_reponse_list'
	);
	if (!listContainer) {
		return;
	}

	listContainer.innerHTML = '';

	t14OptionsReponse.forEach((optText, optIdx) => {
		const itemDiv = document.createElement('div');
		itemDiv.style.display = 'inline-flex';
		itemDiv.style.gap = '4px';
		itemDiv.style.alignItems = 'center';
		itemDiv.style.background = '#fff';
		itemDiv.style.border = '1px solid #ccd0d4';
		itemDiv.style.borderRadius = '4px';
		itemDiv.style.padding = '3px 6px';

		const input = document.createElement('input');
		input.type = 'text';
		input.value = optText;
		input.placeholder = `Option ${optIdx + 1}`;
		input.style.width = '100px';
		input.style.height = '28px';
		input.style.fontSize = '12px';

		input.addEventListener('input', () => {
			t14OptionsReponse[optIdx] = input.value;
			updateConfig();
			renderSingleReponseContainers();
			renderMultipleReponsesContainers();
		});

		const btnDelete = document.createElement('button');
		btnDelete.type = 'button';
		btnDelete.className = 'button button-link-delete';
		btnDelete.style.padding = '0 4px';
		btnDelete.innerHTML =
			'<span class="dashicons dashicons-trash" style="font-size:16px; width:16px; height:16px;"></span>';
		btnDelete.title = 'Supprimer cette option';

		btnDelete.addEventListener('click', () => {
			if (t14OptionsReponse.length <= 1) {
				return;
			}
			t14OptionsReponse.splice(optIdx, 1);
			renderOptionsReponseList();
			renderSingleReponseContainers();
			renderMultipleReponsesContainers();
			updateConfig();
		});

		itemDiv.appendChild(input);
		itemDiv.appendChild(btnDelete);
		listContainer.appendChild(itemDiv);
	});
}

/**
 * Renders single question response choice across all 5 diagrams.
 */
function renderSingleReponseContainers() {
	for (let i = 0; i < 5; i++) {
		const container = document.querySelector(
			`.roi_t14_single_reponse_container[data-index="${i}"]`
		);
		if (!container) {
			continue;
		}

		container.innerHTML = '';

		const currentVal = t14Exercices[i].reponse_oui_non;

		t14OptionsReponse.forEach((optText, optIdx) => {
			const label = document.createElement('label');
			label.style.display = 'flex';
			label.style.alignItems = 'center';
			label.style.gap = '6px';
			label.style.cursor = 'pointer';
			label.style.fontWeight = '600';
			label.style.fontSize = '13px';

			const isFirst = optIdx === 0;
			const isSecond = optIdx === 1;
			if (
				optText === 'OUI' ||
				(isFirst && (optText === '' || optText === 'OUI'))
			) {
				label.style.color = '#198754';
			} else if (
				optText === 'NON' ||
				(isSecond && (optText === '' || optText === 'NON'))
			) {
				label.style.color = '#dc3545';
			} else {
				label.style.color = '#1d2327';
			}

			let isChecked = false;
			if (typeof currentVal === 'boolean') {
				isChecked =
					(currentVal && optIdx === 0) ||
					(!currentVal && optIdx === 1);
			} else if (typeof currentVal === 'string') {
				isChecked =
					currentVal === optText ||
					(optIdx === 0 && currentVal === '1') ||
					(optIdx === 1 && currentVal === '0');
			} else if (typeof currentVal === 'number') {
				isChecked = currentVal === optIdx;
			}

			const radio = document.createElement('input');
			radio.type = 'radio';
			radio.name = `roi_t14_reponse_oui_non_${i}`;
			radio.value = optText || `option_${optIdx}`;
			radio.checked = isChecked;

			radio.addEventListener('change', () => {
				if (
					t14OptionsReponse.length === 2 &&
					t14OptionsReponse[0] === 'OUI' &&
					t14OptionsReponse[1] === 'NON'
				) {
					t14Exercices[i].reponse_oui_non = optIdx === 0;
				} else {
					t14Exercices[i].reponse_oui_non = optText;
				}
				updateConfig();
			});

			const span = document.createElement('span');
			span.textContent = optText || `Option ${optIdx + 1}`;

			label.appendChild(radio);
			label.appendChild(span);
			container.appendChild(label);
		});
	}
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
			radiosDiv.style.gap = '12px';
			radiosDiv.style.alignItems = 'center';

			const currentAns = Array.isArray(t14Exercices[i].reponses_multiple)
				? t14Exercices[i].reponses_multiple[propIdx]
				: undefined;

			t14OptionsReponse.forEach((optText, optIdx) => {
				const optLabel = document.createElement('label');
				optLabel.style.cursor = 'pointer';
				optLabel.style.fontWeight = '600';
				optLabel.style.fontSize = '12px';

				if (
					optText === 'OUI' ||
					(optIdx === 0 && (optText === '' || optText === 'OUI'))
				) {
					optLabel.style.color = '#198754';
				} else if (
					optText === 'NON' ||
					(optIdx === 1 && (optText === '' || optText === 'NON'))
				) {
					optLabel.style.color = '#dc3545';
				} else {
					optLabel.style.color = '#1d2327';
				}

				let isChecked = false;
				if (typeof currentAns === 'boolean') {
					isChecked =
						(currentAns && optIdx === 0) ||
						(!currentAns && optIdx === 1);
				} else if (typeof currentAns === 'string') {
					isChecked =
						currentAns === optText ||
						(optIdx === 0 && currentAns === '1') ||
						(optIdx === 1 && currentAns === '0');
				} else if (typeof currentAns === 'number') {
					isChecked = currentAns === optIdx;
				} else if (typeof currentAns === 'undefined' && optIdx === 0) {
					isChecked = true;
				}

				const radio = document.createElement('input');
				radio.type = 'radio';
				radio.name = `roi_t14_prop_ans_${i}_${propIdx}`;
				radio.value = optText || `option_${optIdx}`;
				radio.checked = isChecked;

				radio.addEventListener('change', () => {
					if (!Array.isArray(t14Exercices[i].reponses_multiple)) {
						t14Exercices[i].reponses_multiple = [];
					}
					if (
						t14OptionsReponse.length === 2 &&
						t14OptionsReponse[0] === 'OUI' &&
						t14OptionsReponse[1] === 'NON'
					) {
						t14Exercices[i].reponses_multiple[propIdx] =
							optIdx === 0;
					} else {
						t14Exercices[i].reponses_multiple[propIdx] = optText;
					}
					updateConfig();
				});

				const span = document.createElement('span');
				span.textContent = optText || `Option ${optIdx + 1}`;

				optLabel.appendChild(radio);
				optLabel.appendChild(document.createTextNode(' '));
				optLabel.appendChild(span);
				radiosDiv.appendChild(optLabel);
			});

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
	const btnAddOption = document.getElementById('roi_t14_add_option_btn');

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

				if (typeof parsed.mode_clic === 'string') {
					t14ModeClic = parsed.mode_clic;
				}
				const modeClicRadio = document.querySelector(
					`input[name="roi_t14_mode_clic"][value="${t14ModeClic}"]`
				);
				if (modeClicRadio) {
					modeClicRadio.checked = true;
				}

				if (typeof parsed.mode_setup === 'string') {
					t14ModeSetup = parsed.mode_setup;
				}
				const modeSetupRadio = document.querySelector(
					`input[name="roi_t14_mode_setup"][value="${t14ModeSetup}"]`
				);
				if (modeSetupRadio) {
					modeSetupRadio.checked = true;
				}

				if (
					Array.isArray(parsed.options_reponse) &&
					parsed.options_reponse.length > 0
				) {
					t14OptionsReponse = [...parsed.options_reponse];
				} else {
					t14OptionsReponse = ['OUI', 'NON'];
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
						if (typeof raw.reponse_oui_non !== 'undefined') {
							reponseOuiNon = raw.reponse_oui_non;
						} else if (
							typeof raw.reponse_attendue !== 'undefined'
						) {
							reponseOuiNon = raw.reponse_attendue;
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
							conseil: raw.conseil || '',
						};
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 14 initial :', e);
		}
	}

	// Dynamic lists setup
	renderOptionsReponseList();
	renderPropositionsList();
	renderSingleReponseContainers();

	if (btnAddOption) {
		btnAddOption.addEventListener('click', () => {
			t14OptionsReponse.push(`Option ${t14OptionsReponse.length + 1}`);
			renderOptionsReponseList();
			renderSingleReponseContainers();
			renderMultipleReponsesContainers();
			updateConfig();
		});
	}

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

	// Mode clic & setup listeners
	const modeClicRadios = document.querySelectorAll(
		'input[name="roi_t14_mode_clic"]'
	);
	modeClicRadios.forEach((radio) => {
		radio.addEventListener('change', (e) => {
			t14ModeClic = e.target.value;
			updateConfig();
		});
	});

	const modeSetupRadios = document.querySelectorAll(
		'input[name="roi_t14_mode_setup"]'
	);
	modeSetupRadios.forEach((radio) => {
		radio.addEventListener('change', (e) => {
			t14ModeSetup = e.target.value;
			updateConfig();
		});
	});

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

		// Setup conseil input
		const conseilInput = document.querySelector(
			`.roi_t14_conseil[data-index="${i}"]`
		);
		if (conseilInput) {
			conseilInput.value = t14Exercices[i].conseil || '';
			conseilInput.addEventListener('input', () => {
				t14Exercices[i].conseil = conseilInput.value.trim();
				updateConfig();
			});
		}

		// Initial preview render
		renderPreviewBoard(i);
	}

	// Initial update
	updateConfig();
}
