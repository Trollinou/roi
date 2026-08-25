/**
 * Handler for Type 14: Cap ou pas cap ?.
 */

import {
	setupFenControl,
	updateOrientationDisplay,
	getOrientationColor,
} from '../utils/controls';

const textarea = document.getElementById('roi_config_json');
const diagramShapes = [[], [], [], [], []];

/**
 * Updates visibility of QCM / Move blocks depending on type_reponse.
 */
function updateVisibility() {
	const typeReponseSelect = document.getElementById('roi_t14_type_reponse');
	const typeReponse = typeReponseSelect ? typeReponseSelect.value : 'qcm';

	const qcmBlocs = document.querySelectorAll('.roi_t14_bloc_qcm');
	const moveBlocs = document.querySelectorAll('.roi_t14_bloc_move');

	qcmBlocs.forEach((bloc) => {
		bloc.style.display = typeReponse === 'qcm' ? 'block' : 'none';
	});

	moveBlocs.forEach((bloc) => {
		bloc.style.display = typeReponse === 'move' ? 'block' : 'none';
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
	const typeReponseSelect = document.getElementById('roi_t14_type_reponse');

	const consigneText = consigneInput ? consigneInput.value.trim() : '';
	const typeReponse = typeReponseSelect ? typeReponseSelect.value : 'qcm';

	const diagrammes = [];

	for (let i = 0; i < 5; i++) {
		const fenInput = document.querySelector(
			`.roi_t14_fen[data-index="${i}"]`
		);
		const couleurSelect = document.querySelector(
			`.roi_t14_couleur[data-index="${i}"]`
		);

		const fen = fenInput
			? fenInput.value.trim()
			: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		const couleurJoueur = getOrientationColor(couleurSelect, fen);

		// QCM inputs
		const opt0TexteInput = document.querySelector(
			`.roi_t14_qcm_texte[data-index="${i}"][data-opt="0"]`
		);
		const opt0ExpInput = document.querySelector(
			`.roi_t14_qcm_explication[data-index="${i}"][data-opt="0"]`
		);
		const opt1TexteInput = document.querySelector(
			`.roi_t14_qcm_texte[data-index="${i}"][data-opt="1"]`
		);
		const opt1ExpInput = document.querySelector(
			`.roi_t14_qcm_explication[data-index="${i}"][data-opt="1"]`
		);

		const checkedRadio = document.querySelector(
			`input[name="roi_t14_qcm_bonne_reponse_${i}"]:checked`
		);
		const qcmBonneReponse = checkedRadio
			? parseInt(checkedRadio.value, 10)
			: 0;

		// Move inputs
		const moveSanInput = document.querySelector(
			`.roi_t14_move_san[data-index="${i}"]`
		);
		const moveExpInput = document.querySelector(
			`.roi_t14_move_explication[data-index="${i}"]`
		);

		diagrammes.push({
			fen,
			couleur_joueur: couleurJoueur,
			shapes: diagramShapes[i] || [],
			qcm_choix: [
				{
					texte: opt0TexteInput ? opt0TexteInput.value.trim() : '',
					explication: opt0ExpInput ? opt0ExpInput.value.trim() : '',
				},
				{
					texte: opt1TexteInput ? opt1TexteInput.value.trim() : '',
					explication: opt1ExpInput ? opt1ExpInput.value.trim() : '',
				},
			],
			qcm_bonne_reponse: qcmBonneReponse,
			move_san: moveSanInput ? moveSanInput.value.trim() : '',
			move_explication: moveExpInput ? moveExpInput.value.trim() : '',
		});
	}

	const configData = {
		consigne: consigneText,
		type_reponse: typeReponse,
		diagrammes,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

/**
 * Initializes Type 14 handlers.
 */
export function init() {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t14_consigne');
	const typeReponseSelect = document.getElementById('roi_t14_type_reponse');

	// Restoration from saved JSON
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string' && consigneInput) {
					consigneInput.value = parsed.consigne;
				}

				if (
					typeof parsed.type_reponse === 'string' &&
					typeReponseSelect
				) {
					typeReponseSelect.value = parsed.type_reponse;
				}

				if (Array.isArray(parsed.diagrammes)) {
					parsed.diagrammes.forEach((diag, i) => {
						if (i >= 5 || !diag) {
							return;
						}

						const fenInput = document.querySelector(
							`.roi_t14_fen[data-index="${i}"]`
						);
						const couleurSelect = document.querySelector(
							`.roi_t14_couleur[data-index="${i}"]`
						);

						if (diag.fen && fenInput) {
							fenInput.value = diag.fen;
						}
						if (couleurSelect) {
							updateOrientationDisplay(
								couleurSelect,
								diag.couleur_joueur || diag.fen || 'white'
							);
						}
						if (Array.isArray(diag.shapes)) {
							diagramShapes[i] = diag.shapes;
						}

						if (Array.isArray(diag.qcm_choix)) {
							if (diag.qcm_choix[0]) {
								const opt0TexteInput = document.querySelector(
									`.roi_t14_qcm_texte[data-index="${i}"][data-opt="0"]`
								);
								const opt0ExpInput = document.querySelector(
									`.roi_t14_qcm_explication[data-index="${i}"][data-opt="0"]`
								);
								if (
									opt0TexteInput &&
									typeof diag.qcm_choix[0].texte === 'string'
								) {
									opt0TexteInput.value =
										diag.qcm_choix[0].texte;
								}
								if (
									opt0ExpInput &&
									typeof diag.qcm_choix[0].explication ===
										'string'
								) {
									opt0ExpInput.value =
										diag.qcm_choix[0].explication;
								}
							}

							if (diag.qcm_choix[1]) {
								const opt1TexteInput = document.querySelector(
									`.roi_t14_qcm_texte[data-index="${i}"][data-opt="1"]`
								);
								const opt1ExpInput = document.querySelector(
									`.roi_t14_qcm_explication[data-index="${i}"][data-opt="1"]`
								);
								if (
									opt1TexteInput &&
									typeof diag.qcm_choix[1].texte === 'string'
								) {
									opt1TexteInput.value =
										diag.qcm_choix[1].texte;
								}
								if (
									opt1ExpInput &&
									typeof diag.qcm_choix[1].explication ===
										'string'
								) {
									opt1ExpInput.value =
										diag.qcm_choix[1].explication;
								}
							}
						}

						if (typeof diag.qcm_bonne_reponse === 'number') {
							const radio = document.querySelector(
								`input[name="roi_t14_qcm_bonne_reponse_${i}"][value="${diag.qcm_bonne_reponse}"]`
							);
							if (radio) {
								radio.checked = true;
							}
						}

						const moveSanInput = document.querySelector(
							`.roi_t14_move_san[data-index="${i}"]`
						);
						const moveExpInput = document.querySelector(
							`.roi_t14_move_explication[data-index="${i}"]`
						);

						if (moveSanInput && typeof diag.move_san === 'string') {
							moveSanInput.value = diag.move_san;
						}
						if (
							moveExpInput &&
							typeof diag.move_explication === 'string'
						) {
							moveExpInput.value = diag.move_explication;
						}
					});
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 14 initial :', e);
		}
	}

	// Update visibility of blocks initially
	updateVisibility();

	// Listener for type_reponse change
	if (typeReponseSelect) {
		typeReponseSelect.addEventListener('change', function () {
			updateVisibility();
			updateConfig();
		});
	}

	// FEN control setup for all 5 diagrams
	for (let i = 0; i < 5; i++) {
		const fenInput = document.querySelector(
			`.roi_t14_fen[data-index="${i}"]`
		);
		const couleurSelect = document.querySelector(
			`.roi_t14_couleur[data-index="${i}"]`
		);
		const btnFen =
			document.getElementById(`btn_open_fen_editor_t14_${i}`) ||
			document.querySelector(
				`.btn_open_fen_editor_t14[data-index="${i}"]`
			);

		setupFenControl({
			input: fenInput,
			button: btnFen,
			colorSelect: couleurSelect,
			getShapes() {
				return diagramShapes[i] || [];
			},
			onChange(fen, color, shapes) {
				if (shapes) {
					diagramShapes[i] = shapes;
				}
				updateConfig();
			},
		});
	}

	// Input listeners for real-time config updates
	const inputsToWatch = document.querySelectorAll(
		'#roi_builder_type_14 input, #roi_builder_type_14 select'
	);

	inputsToWatch.forEach((input) => {
		input.addEventListener('input', updateConfig);
		input.addEventListener('change', updateConfig);
	});

	// Initial update
	updateConfig();
}
