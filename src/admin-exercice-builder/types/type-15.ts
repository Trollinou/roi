/**
 * Handler for Type 15: Jugement final.
 */

import {
	setupPgnControl,
	updateOrientationDisplay,
	getOrientationColor,
	extractFenOrientationAndShapes,
} from '../utils/controls';
import type { Color } from '../../types/chess';

interface ScenarioItem {
	pgn: string;
	is_correct: boolean;
}

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const textarea = document.getElementById('roi_config_json') as HTMLTextAreaElement | null;

let legacyFenDepart = '';
let legacyCouleurJoueur: Color | '' = '';
let legacyPgnExplication = '';
let orientationManuallyChanged = false;

/**
 * Checks whether a PGN string explicitly specifies a FEN header or initial FEN line.
 */
function hasExplicitFen(pgn: string): boolean {
	const trimmed = pgn.trim();
	if (!trimmed) {
		return false;
	}
	if (/\[FEN\s+"[^"]+"\s*\]/i.test(trimmed)) {
		return true;
	}
	if (trimmed.includes('/') && !trimmed.startsWith('[')) {
		const firstLine = trimmed.split('\n')[0].split('{')[0].trim();
		return firstLine.includes('/') && firstLine.split('/').length >= 4;
	}
	return false;
}

/**
 * Normalizes a FEN to its first 4 fields (board, turn, castling, en passant) for comparison.
 */
function normalizeFenForComparison(fen: string): string {
	return fen.trim().split(/\s+/).slice(0, 4).join(' ');
}

interface DeducedResult {
	fenDepart: string;
	couleurJoueur: Color;
	pgnExplication: string;
	correctIndex: number;
	scenarios: ScenarioItem[];
	consistencyStatus: 'ok' | 'partial' | 'mismatch' | 'missing';
	explicitCount: number;
	nonEmptyCount: number;
}

/**
 * Deduces starting FEN, orientation, and explanation PGN from the 3 commented scenarios.
 */
function deduceFromScenarios(): DeducedResult {
	const correctRadio = document.querySelector<HTMLInputElement>(
		'input[name="roi_t15_correct"]:checked'
	);
	const correctIndex = correctRadio ? parseInt(correctRadio.value, 10) : 0;
	const couleurSelect = document.getElementById('roi_t15_couleur') as HTMLSelectElement | null;

	const scenarios: ScenarioItem[] = [];
	const explicitFens: { index: number; fen: string; orientation: Color }[] = [];
	let nonEmptyCount = 0;

	for (let i = 0; i < 3; i++) {
		const scenarioPgnArea = document.querySelector<HTMLTextAreaElement>(
			`.roi_t15_scenario_pgn[data-index="${i}"]`
		);
		const pgn = scenarioPgnArea ? scenarioPgnArea.value.trim() : '';
		if (pgn) {
			nonEmptyCount++;
			if (hasExplicitFen(pgn)) {
				const extracted = extractFenOrientationAndShapes(pgn);
				if (extracted.fen) {
					explicitFens.push({
						index: i,
						fen: extracted.fen,
						orientation: extracted.orientation,
					});
				}
			}
		}

		scenarios.push({
			pgn,
			is_correct: i === correctIndex,
		});
	}

	// Prefer the FEN from the correct scenario if present, otherwise the first available explicit FEN.
	const correctExplicit = explicitFens.find((item) => item.index === correctIndex);
	const primaryExplicit = correctExplicit || explicitFens[0];

	const fenDepart = primaryExplicit
		? primaryExplicit.fen
		: legacyFenDepart || DEFAULT_FEN;

	let couleurJoueur: Color;
	if (orientationManuallyChanged && couleurSelect) {
		couleurJoueur = getOrientationColor(couleurSelect, fenDepart);
	} else if (primaryExplicit) {
		couleurJoueur = primaryExplicit.orientation;
	} else if (legacyCouleurJoueur) {
		couleurJoueur = legacyCouleurJoueur;
	} else {
		couleurJoueur = getOrientationColor(couleurSelect, fenDepart);
	}

	const correctPgn = scenarios[correctIndex]?.pgn || '';
	const pgnExplication = correctPgn || legacyPgnExplication || '';

	let consistencyStatus: DeducedResult['consistencyStatus'] = 'missing';
	if (explicitFens.length > 0) {
		const uniqueNormalized = new Set(
			explicitFens.map((item) => normalizeFenForComparison(item.fen))
		);
		if (uniqueNormalized.size > 1) {
			consistencyStatus = 'mismatch';
		} else if (explicitFens.length < nonEmptyCount) {
			consistencyStatus = 'partial';
		} else {
			consistencyStatus = 'ok';
		}
	}

	return {
		fenDepart,
		couleurJoueur,
		pgnExplication,
		correctIndex,
		scenarios,
		consistencyStatus,
		explicitCount: explicitFens.length,
		nonEmptyCount,
	};
}

/**
 * Updates the read-only deduced summary UI and scenario card highlights.
 */
function renderDeducedSummary(deduced: DeducedResult): void {
	const fenDisplay = document.getElementById('roi_t15_deduced_fen_display');
	const badge = document.getElementById('roi_t15_fen_consistency_badge');
	const couleurSelect = document.getElementById('roi_t15_couleur') as HTMLSelectElement | null;
	const explicationStatus = document.getElementById('roi_t15_deduced_explication_status');

	if (fenDisplay) {
		fenDisplay.textContent = deduced.fenDepart;
	}

	if (couleurSelect && !orientationManuallyChanged) {
		updateOrientationDisplay(couleurSelect, deduced.couleurJoueur);
	}

	if (badge) {
		badge.className = 'roi-t15-badge';
		if (deduced.consistencyStatus === 'ok') {
			badge.classList.add('is-ok');
			badge.textContent =
				deduced.explicitCount === 3
					? '✓ FEN identique sur les 3 scénarios'
					: `✓ FEN détectée (${deduced.explicitCount}/3)`;
		} else if (deduced.consistencyStatus === 'partial') {
			badge.classList.add('is-warning');
			badge.textContent = `⚠ Balise [FEN] manquante sur ${deduced.nonEmptyCount - deduced.explicitCount} scénario(s)`;
		} else if (deduced.consistencyStatus === 'mismatch') {
			badge.classList.add('is-error');
			badge.textContent = '⚠ Les scénarios n’ont pas la même FEN de départ';
		} else {
			badge.classList.add('is-warning');
			badge.textContent = 'Aucune balise [FEN] détectée';
		}
	}

	if (explicationStatus) {
		const correctPgn = deduced.scenarios[deduced.correctIndex]?.pgn || '';
		if (correctPgn) {
			const hasComments = /\{[^}]+\}/.test(correctPgn);
			const hasShapes = /\[%(?:cal|csl|cpl)/i.test(correctPgn);
			const details: string[] = [];
			if (hasComments) {
				details.push('commentaires');
			}
			if (hasShapes) {
				details.push('shapes');
			}
			const suffix = details.length > 0 ? ` (${details.join(' + ')} inclus)` : '';
			explicationStatus.textContent = `✓ Repris automatiquement depuis le Scénario ${deduced.correctIndex + 1}${suffix}.`;
		} else if (legacyPgnExplication) {
			explicationStatus.textContent = 'Explication héritée conservée (collez le PGN du scénario gagnant pour la remplacer).';
		} else {
			explicationStatus.textContent = 'En attente du PGN de la bonne réponse...';
		}
	}

	document.querySelectorAll<HTMLElement>('.roi-t15-scenario-card').forEach((card) => {
		const idx = Number(card.dataset.index);
		card.classList.toggle('is-correct', idx === deduced.correctIndex);
	});
}

/**
 * Serializes configuration to JSON.
 */
export function updateConfig(): void {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t15_consigne') as
		| HTMLInputElement
		| HTMLTextAreaElement
		| null;
	const consigneText = consigneInput ? consigneInput.value.trim() : '';

	const deduced = deduceFromScenarios();
	renderDeducedSummary(deduced);

	const configData = {
		consigne: consigneText,
		fen_depart: deduced.fenDepart,
		couleur_joueur: deduced.couleurJoueur,
		scenarios: deduced.scenarios,
		pgn_explication: deduced.pgnExplication,
	};

	textarea.value = JSON.stringify(configData, null, 4);
}

/**
 * Initializes Type 15 handlers.
 */
export function init(): void {
	if (!textarea) {
		return;
	}

	const consigneInput = document.getElementById('roi_t15_consigne') as
		| HTMLInputElement
		| HTMLTextAreaElement
		| null;
	const couleurSelect = document.getElementById('roi_t15_couleur') as HTMLSelectElement | null;

	// Restoration from saved JSON
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (typeof parsed.consigne === 'string' && consigneInput) {
					consigneInput.value = parsed.consigne;
				}
				if (typeof parsed.fen_depart === 'string' && parsed.fen_depart.trim() !== '') {
					legacyFenDepart = parsed.fen_depart.trim();
				}
				if (parsed.couleur_joueur === 'white' || parsed.couleur_joueur === 'black') {
					legacyCouleurJoueur = parsed.couleur_joueur;
				}
				if (typeof parsed.pgn_explication === 'string' && parsed.pgn_explication.trim() !== '') {
					legacyPgnExplication = parsed.pgn_explication.trim();
				}

				if (Array.isArray(parsed.scenarios)) {
					for (let i = 0; i < 3; i++) {
						const scenarioData = parsed.scenarios[i];
						if (scenarioData) {
							const scenarioPgnArea = document.querySelector<HTMLTextAreaElement>(
								`.roi_t15_scenario_pgn[data-index="${i}"]`
							);

							if (scenarioPgnArea && typeof scenarioData.pgn === 'string') {
								scenarioPgnArea.value = scenarioData.pgn;
							}

							if (scenarioData.is_correct === true) {
								const radioToSelect = document.querySelector<HTMLInputElement>(
									`input[name="roi_t15_correct"][value="${i}"]`
								);
								if (radioToSelect) {
									radioToSelect.checked = true;
								}
							}
						}
					}
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 15 initial :', e);
		}
	}

	if (couleurSelect) {
		couleurSelect.addEventListener('change', () => {
			orientationManuallyChanged = true;
			couleurSelect.dataset.color = couleurSelect.value;
			updateConfig();
		});
	}

	// PGN Control Setup for 3 Scenarios
	for (let i = 0; i < 3; i++) {
		const scenarioPgnArea = document.querySelector<HTMLTextAreaElement>(
			`.roi_t15_scenario_pgn[data-index="${i}"]`
		);
		const btnScenario = document.getElementById(
			`btn_open_pgn_editor_t15_scenario_${i}`
		);
		setupPgnControl({
			textarea: scenarioPgnArea,
			button: btnScenario,
			initialFen() {
				const ownPgn = scenarioPgnArea ? scenarioPgnArea.value.trim() : '';
				if (ownPgn && hasExplicitFen(ownPgn)) {
					return extractFenOrientationAndShapes(ownPgn).fen;
				}
				return deduceFromScenarios().fenDepart;
			},
			onChange() {
				updateConfig();
			},
		});
	}

	// Real-time update event listeners
	const inputsToWatch = document.querySelectorAll(
		'#roi_builder_type_15 input, #roi_builder_type_15 textarea'
	);

	inputsToWatch.forEach((input) => {
		input.addEventListener('input', updateConfig);
		input.addEventListener('change', updateConfig);
	});

	// Initial update
	updateConfig();
}
