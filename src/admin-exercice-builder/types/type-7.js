/**
 * Handler pour le Type 7 : Marche du Héros.
 */

import {
	setupPgnControl,
	extractFenOrientationAndShapes,
} from '../utils/controls';
import { createPgnPreviewViewer } from '../utils/pgn-viewer';

const textarea = document.getElementById('roi_config_json');
const t7ModeSelect = document.getElementById('roi_t7_mode');
const t7SeriesContainer = document.getElementById('roi_t7_series_container');

let t7Series = [];
let t7Mode = '3x5';
let previewViewers = [];

/**
 * Met à jour la configuration globale au format JSON.
 */
export function updateConfig() {
	if (!textarea) {
		return;
	}

	const t7Config = {
		mode: t7Mode,
		series: t7Series.map((s) => {
			const { orientation, shapes } = extractFenOrientationAndShapes(
				s.pgn_data || ''
			);
			return {
				pgn_data: s.pgn_data || '',
				couleur_joueur: orientation || 'white',
				orientation: orientation || 'white',
				shapes: shapes || [],
			};
		}),
	};
	textarea.value = JSON.stringify(t7Config, null, 4);
}

/**
 * Ajuste la longueur du tableau des séries en fonction du mode sélectionné.
 */
function adjustSeriesLength() {
	const numSeries = t7Mode === '3x5' ? 3 : 5;
	while (t7Series.length < numSeries) {
		t7Series.push({
			pgn_data: '',
			couleur_joueur: 'white',
			shapes: [],
		});
	}
	if (t7Series.length > numSeries) {
		t7Series = t7Series.slice(0, numSeries);
	}
}

/**
 * Génère le rendu HTML des séries de Marche du Héros.
 */
export function renderT7Series() {
	if (!t7SeriesContainer) {
		return;
	}

	// Nettoyer les anciens viewers
	previewViewers.forEach((v) => {
		if (v && typeof v.destroy === 'function') {
			v.destroy();
		}
	});
	previewViewers = [];
	t7SeriesContainer.innerHTML = '';

	t7Series.forEach(function (serie, i) {
		const div = document.createElement('div');
		div.className = 'roi-t7-serie-card';
		div.setAttribute('data-index', i);
		div.style.border = '1px solid #ccd0d4';
		div.style.padding = '15px';
		div.style.marginBottom = '20px';
		div.style.background = '#fafafa';
		div.style.borderRadius = '6px';
		div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

		div.innerHTML = `
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
				<strong style="font-size: 15px; color: #1e1e1e;">Série ${i + 1}</strong>
				<span class="roi-t7-orientation-badge" style="font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 12px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
					Orientation : ${serie.couleur_joueur === 'black' ? 'Noirs' : 'Blancs'}
				</span>
			</div>

			<!-- Groupe de contrôle PGN standardisé -->
			<div class="roi-control-group roi-control-pgn" style="margin-bottom: 15px;">
				<label for="roi_t7_pgn_${i}" class="roi-control-label">
					<strong>Séquence PGN (Partie / Séquence tactique) :</strong>
				</label>
				<div class="roi-control-textarea-wrapper">
					<textarea id="roi_t7_pgn_${i}" 
						rows="4" 
						class="large-text code roi-control-textarea roi_t7_pgn" 
						placeholder="Collez un PGN ou utilisez 'Éditer le PGN'..." 
						data-index="${i}">${serie.pgn_data || ''}</textarea>

					<div class="roi-control-actions" style="margin-top: 6px; display: flex; gap: 8px;">
						<button type="button" 
							id="btn_open_pgn_editor_t7_${i}" 
							class="button btn_open_pgn_editor_t7" 
							title="Éditer le PGN dans l'éditeur interactif" 
							data-index="${i}">
							<span class="dashicons dashicons-edit"></span>
							<span class="roi-btn-text">Éditer le PGN</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Prévisualisation interactive avec coups et navigation -->
			<div style="margin-top: 10px;">
				<label style="display: block; margin-bottom: 6px; font-size: 12px; color: #50575e;">
					<strong>Aperçu interactif & navigation des coups (lecture seule) :</strong>
				</label>
				<div id="roi_t7_preview_container_${i}" class="roi-t7-preview-container"></div>
			</div>
		`;

		t7SeriesContainer.appendChild(div);

		const pgnTextarea = div.querySelector(`#roi_t7_pgn_${i}`);
		const btnEditPgn = div.querySelector(`#btn_open_pgn_editor_t7_${i}`);
		const previewContainer = div.querySelector(
			`#roi_t7_preview_container_${i}`
		);
		const orientationBadge = div.querySelector('.roi-t7-orientation-badge');

		// Créer le viewer interactif
		const viewer = createPgnPreviewViewer(previewContainer, {
			pgn: serie.pgn_data || '',
			boardSize: 260,
		});
		previewViewers[i] = viewer;

		const updateOrientationBadge = (pgn) => {
			if (!orientationBadge) {
				return;
			}
			const { orientation } = extractFenOrientationAndShapes(pgn);
			const isBlack = orientation === 'black';
			orientationBadge.textContent = `Orientation : ${isBlack ? 'Noirs' : 'Blancs'}`;
			orientationBadge.style.background = isBlack ? '#f1f5f9' : '#e0f2fe';
			orientationBadge.style.color = isBlack ? '#334155' : '#0369a1';
			orientationBadge.style.borderColor = isBlack
				? '#cbd5e1'
				: '#bae6fd';
		};

		// Configurer le contrôle PGN avec validation et modal
		setupPgnControl({
			textarea: pgnTextarea,
			button: btnEditPgn,
			initialFen() {
				const currentPgn = t7Series[i] ? t7Series[i].pgn_data : '';
				const { fen } = extractFenOrientationAndShapes(currentPgn);
				return fen;
			},
			onChange(newPgn) {
				if (t7Series[i]) {
					t7Series[i].pgn_data = newPgn;
					const { orientation } =
						extractFenOrientationAndShapes(newPgn);
					t7Series[i].couleur_joueur = orientation;
					updateOrientationBadge(newPgn);
					updateConfig();
					if (viewer && typeof viewer.update === 'function') {
						viewer.update(newPgn);
					}
				}
			},
		});

		updateOrientationBadge(serie.pgn_data || '');
	});
}

/**
 * Initialise le handler.
 */
export function init() {
	if (!t7SeriesContainer) {
		return;
	}

	// Restauration des données depuis le textarea
	if (textarea && textarea.value.trim() !== '') {
		try {
			const parsedT7 = JSON.parse(textarea.value);
			if (parsedT7 && typeof parsedT7 === 'object') {
				if (parsedT7.mode) {
					t7Mode = parsedT7.mode;
					if (t7ModeSelect) {
						t7ModeSelect.value = t7Mode;
					}
				}
				if (Array.isArray(parsedT7.series)) {
					t7Series = parsedT7.series.map(function (s) {
						const pgn = s.pgn_data || '';
						const { orientation, shapes } =
							extractFenOrientationAndShapes(pgn);
						return {
							pgn_data: pgn,
							couleur_joueur:
								s.couleur_joueur ||
								s.orientation ||
								orientation ||
								'white',
							shapes: s.shapes || shapes || [],
						};
					});
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 7 initial :', e);
		}
	}

	if (t7ModeSelect) {
		const newModeSelect = t7ModeSelect.cloneNode(true);
		t7ModeSelect.parentNode.replaceChild(newModeSelect, t7ModeSelect);
		newModeSelect.addEventListener('change', function (e) {
			t7Mode = e.target.value;
			adjustSeriesLength();
			renderT7Series();
			updateConfig();
		});
	}

	adjustSeriesLength();
	renderT7Series();
}
