/**
 * Handler for Type 14: Cap ou pas cap ? (Série de 5 Mini-PGN).
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';
import { createPgnPreviewViewer } from '../utils/pgn-viewer';
import {
	renderOptionsReponseList,
	renderSingleReponseContainers,
	renderMultipleReponsesContainers,
	renderPropositionsList,
	type Type14ExerciceState,
} from './type-14-options';

interface ExerciceItem14 extends Type14ExerciceState {
	pgn: string;
	reponses_multiple: Array<boolean | string | number>;
	reponse_oui_non: boolean | string | number;
	move_san: string;
	move_explication: string;
	conseil: string;
}

const textarea = document.getElementById('roi_config_json') as HTMLTextAreaElement | null;

let t14Consigne = '';
let t14Variante = 'qcm_oui_non';
let t14ModeClic = 'cibles';
let t14ModeSetup = 'memoire';
let t14OptionsReponse = ['OUI', 'NON'];
let t14Propositions: string[] = [];
let t14Question = '';
const t14Exercices: ExerciceItem14[] = [
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

const previewViewers: Array<{ update: (pgn: string) => void } | null> = [
	null,
	null,
	null,
	null,
	null,
];

/**
 * Updates visibility of blocks depending on variante.
 */
function updateVisibility(): void {
	const varianteSelect = document.getElementById('roi_t14_variante') as HTMLSelectElement | null;
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

	const qcmMultipleBlocs = document.querySelectorAll<HTMLElement>(
		'.roi_t14_bloc_qcm_multiple'
	);
	const qcmOuiNonBlocs = document.querySelectorAll<HTMLElement>(
		'.roi_t14_bloc_qcm_oui_non'
	);
	const moveBlocs = document.querySelectorAll<HTMLElement>('.roi_t14_bloc_move');
	const notationBlocs = document.querySelectorAll<HTMLElement>('.roi_t14_bloc_notation');
	const clicBlocs = document.querySelectorAll<HTMLElement>('.roi_t14_bloc_clic');
	const setupBlocs = document.querySelectorAll<HTMLElement>('.roi_t14_bloc_setup');

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
export function updateConfig(): void {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t14_consigne') as HTMLInputElement | HTMLTextAreaElement | null;
	const varianteSelect = document.getElementById('roi_t14_variante') as HTMLSelectElement | null;
	const questionInput = document.getElementById('roi_t14_question') as HTMLInputElement | HTMLTextAreaElement | null;

	t14Consigne = consigneInput ? consigneInput.value.trim() : '';
	t14Variante = varianteSelect ? varianteSelect.value : 'qcm_oui_non';
	t14Question = questionInput ? questionInput.value.trim() : '';

	const checkedModeClic = document.querySelector<HTMLInputElement>(
		'input[name="roi_t14_mode_clic"]:checked'
	);
	if (checkedModeClic) {
		t14ModeClic = checkedModeClic.value;
	}

	const checkedModeSetup = document.querySelector<HTMLInputElement>(
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

function refreshAllOptionsAndPropositions(): void {
	renderOptionsReponseList(t14OptionsReponse, {
		onOptionChange: (optIdx, val) => {
			t14OptionsReponse[optIdx] = val;
			updateConfig();
			renderSingleReponseContainers(
				t14OptionsReponse,
				t14Exercices,
				(idx, finalVal) => {
					t14Exercices[idx].reponse_oui_non = finalVal;
					updateConfig();
				}
			);
			renderMultipleReponsesContainers(
				t14Propositions,
				t14OptionsReponse,
				t14Exercices,
				(exoIdx, propIdx, finalVal) => {
					if (
						!Array.isArray(t14Exercices[exoIdx].reponses_multiple)
					) {
						t14Exercices[exoIdx].reponses_multiple = [];
					}
					t14Exercices[exoIdx].reponses_multiple[propIdx] = finalVal;
					updateConfig();
				}
			);
		},
		onOptionDelete: (optIdx) => {
			t14OptionsReponse.splice(optIdx, 1);
			refreshAllOptionsAndPropositions();
			updateConfig();
		},
	});

	renderPropositionsList(t14Propositions, {
		onPropositionChange: (propIdx, val) => {
			t14Propositions[propIdx] = val;
			updateConfig();
			renderMultipleReponsesContainers(
				t14Propositions,
				t14OptionsReponse,
				t14Exercices,
				(exoIdx, propId, finalVal) => {
					if (
						!Array.isArray(t14Exercices[exoIdx].reponses_multiple)
					) {
						t14Exercices[exoIdx].reponses_multiple = [];
					}
					t14Exercices[exoIdx].reponses_multiple[propId] = finalVal;
					updateConfig();
				}
			);
		},
		onPropositionDelete: (propIdx) => {
			t14Propositions.splice(propIdx, 1);
			for (let i = 0; i < 5; i++) {
				if (Array.isArray(t14Exercices[i].reponses_multiple)) {
					t14Exercices[i].reponses_multiple.splice(propIdx, 1);
				}
			}
			refreshAllOptionsAndPropositions();
			updateConfig();
		},
	});

	renderSingleReponseContainers(
		t14OptionsReponse,
		t14Exercices,
		(idx, finalVal) => {
			t14Exercices[idx].reponse_oui_non = finalVal;
			updateConfig();
		}
	);

	renderMultipleReponsesContainers(
		t14Propositions,
		t14OptionsReponse,
		t14Exercices,
		(exoIdx, propIdx, finalVal) => {
			if (!Array.isArray(t14Exercices[exoIdx].reponses_multiple)) {
				t14Exercices[exoIdx].reponses_multiple = [];
			}
			t14Exercices[exoIdx].reponses_multiple[propIdx] = finalVal;
			updateConfig();
		}
	);
}

/**
 * Renders interactive preview for a mini-PGN diagram.
 */
function renderPreviewBoard(index: number): void {
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
		previewViewers[index]?.update(pgn);
	}
}

/**
 * Initializes Type 14 handlers.
 */
export function init(): void {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t14_consigne') as HTMLInputElement | HTMLTextAreaElement | null;
	const varianteSelect = document.getElementById('roi_t14_variante') as HTMLSelectElement | null;
	const questionInput = document.getElementById('roi_t14_question') as HTMLInputElement | HTMLTextAreaElement | null;
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
				const modeClicRadio = document.querySelector<HTMLInputElement>(
					`input[name="roi_t14_mode_clic"][value="${t14ModeClic}"]`
				);
				if (modeClicRadio) {
					modeClicRadio.checked = true;
				}

				if (typeof parsed.mode_setup === 'string') {
					t14ModeSetup = parsed.mode_setup;
				}
				const modeSetupRadio = document.querySelector<HTMLInputElement>(
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
							pgnStr = `[SetUp "1"]\n[FEN "${raw.fen}"]\n\n`;
						}

						let reponseOuiNon: boolean | string | number = true;
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
	refreshAllOptionsAndPropositions();

	if (btnAddOption) {
		btnAddOption.addEventListener('click', () => {
			t14OptionsReponse.push(`Option ${t14OptionsReponse.length + 1}`);
			refreshAllOptionsAndPropositions();
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
			refreshAllOptionsAndPropositions();
			updateConfig();
		});
	}

	// Mode clic & setup listeners
	const modeClicRadios = document.querySelectorAll<HTMLInputElement>(
		'input[name="roi_t14_mode_clic"]'
	);
	modeClicRadios.forEach((radio) => {
		radio.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement | null;
			if (target) {
				t14ModeClic = target.value;
				updateConfig();
			}
		});
	});

	const modeSetupRadios = document.querySelectorAll<HTMLInputElement>(
		'input[name="roi_t14_mode_setup"]'
	);
	modeSetupRadios.forEach((radio) => {
		radio.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement | null;
			if (target) {
				t14ModeSetup = target.value;
				updateConfig();
			}
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
			document.getElementById(`roi_t14_pgn_${i}`) as HTMLTextAreaElement | null ||
			document.querySelector<HTMLTextAreaElement>(`.roi_t14_pgn[data-index="${i}"]`);
		const btnPgnEditor =
			document.getElementById(`btn_open_pgn_editor_t14_${i}`) ||
			document.querySelector<HTMLElement>(
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
		const moveSanInput = document.querySelector<HTMLInputElement>(
			`.roi_t14_move_san[data-index="${i}"]`
		);
		const moveExpInput = document.querySelector<HTMLInputElement>(
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
		const conseilInput = document.querySelector<HTMLInputElement>(
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
