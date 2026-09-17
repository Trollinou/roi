/**
 * PgnPreviewViewer - Composant partagé de prévisualisation PGN interactive (lecture seule).
 *
 * Affiche :
 * - À gauche : l'échiquier synchronisé avec orientation automatique.
 * - À droite : bandeau des coups de la branche active avec repérage visuel des bifurcations (variantes),
 *              commentaires du coup courant, variantes alternatives cliquables et barre de navigation (<, >, etc.).
 */

import { extractFenOrientationAndShapes } from './controls';
import { toFrenchNotation } from '../../utils/chessUtils';

/**
 * Crée un PgnPreviewViewer sur un élément DOM cible.
 *
 * @param {HTMLElement|string} container               - Élément DOM ou ID où injecter le composant.
 * @param {Object}             [options]
 * @param {string}             [options.pgn='']        - PGN initial.
 * @param {number}             [options.boardSize=260] - Taille en px du plateau carré.
 * @return {Object|null} Instance contrôleur avec update(pgn), destroy().
 */
export function createPgnPreviewViewer(container, options = {}) {
	const rootEl =
		typeof container === 'string'
			? document.getElementById(container)
			: container;
	if (!rootEl) {
		return null;
	}

	const boardSize = options.boardSize || 260;
	let currentPgn = options.pgn || '';
	let boardApi = null;
	let currentPly = 0;
	let totalPlies = 0;
	let movesData = []; // [{ ply, num, san, isWhite, hasBranches }]
	let currentShapes = [];
	let currentComment = '';
	let currentVariations = [];

	// Structure HTML du composant
	rootEl.innerHTML = `
		<div class="roi-pgn-preview-viewer" style="display: flex; gap: 12px; align-items: stretch; width: 100%; max-width: 680px; box-sizing: border-box; background: #fff; border: 1px solid #ccd0d4; border-radius: 4px; padding: 10px; overflow: hidden;">
			<!-- Échiquier (gauche) -->
			<div class="roi-pgn-viewer-board-col" style="flex: 0 0 ${boardSize}px; width: ${boardSize}px; height: ${boardSize}px; position: relative;">
				<div class="main-wrap fit-container piece-set-cburnett board-theme-brown" style="width: 100%; height: 100%; position: relative;">
					<div class="main-board roi-pgn-board-mount" style="width: 100%; height: 100%;"></div>
				</div>
			</div>

			<!-- Volet de droite : Coups, commentaires, variantes, contrôles -->
			<div class="roi-pgn-viewer-side-col" style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; height: ${boardSize}px; box-sizing: border-box;">
				
				<!-- Zone supérieure : Liste des coups de la branche active -->
				<div class="roi-pgn-moves-container" style="flex: 1; min-height: 80px; max-height: 110px; overflow-y: auto; background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6;">
					<div class="roi-pgn-moves-list" style="word-break: break-word;"></div>
				</div>

				<!-- Zone des variantes alternatives au coup actif -->
				<div class="roi-pgn-variations-container" style="display: none; margin-top: 5px; padding: 5px 8px; background: #f0f6fc; border: 1px solid #c8d9ea; border-radius: 4px; font-size: 12px;">
					<div style="font-weight: 600; color: #0969da; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">🌿 Coups & Variantes disponibles :</div>
					<div class="roi-pgn-variations-list" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;"></div>
				</div>

				<!-- Zone médiane : Commentaire du coup actif -->
				<div class="roi-pgn-comment-container" style="margin-top: 5px; min-height: 38px; max-height: 55px; overflow-y: auto; background: #fff; border: 1px dashed #ccd0d4; border-radius: 4px; padding: 6px 8px; font-size: 12px; color: #444; line-height: 1.4;">
					<div class="roi-pgn-comment-text" style="font-style: italic; color: #646970;">(Position de départ)</div>
				</div>

				<!-- Zone inférieure : Barre de navigation Lichess-like -->
				<div class="roi-pgn-nav-bar" style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee;">
					<div style="display: flex; gap: 4px;">
						<button type="button" class="button button-small roi-nav-first" title="Début (Position initiale)" style="min-width: 30px; padding: 0 4px; font-weight: bold;">|◀</button>
						<button type="button" class="button button-small roi-nav-prev" title="Coup précédent" style="min-width: 30px; padding: 0 4px; font-weight: bold;">◀</button>
						<button type="button" class="button button-small roi-nav-next" title="Coup suivant" style="min-width: 30px; padding: 0 4px; font-weight: bold;">▶</button>
						<button type="button" class="button button-small roi-nav-last" title="Fin (Dernier coup)" style="min-width: 30px; padding: 0 4px; font-weight: bold;">▶|</button>
					</div>
					<div class="roi-pgn-ply-label" style="font-size: 11px; color: #50575e; font-weight: 600; white-space: nowrap;">
						Coup 0 / 0
					</div>
				</div>
			</div>
		</div>
	`;

	const boardMountEl = rootEl.querySelector('.roi-pgn-board-mount');
	const movesListEl = rootEl.querySelector('.roi-pgn-moves-list');
	const commentTextEl = rootEl.querySelector('.roi-pgn-comment-text');
	const variationsContainerEl = rootEl.querySelector(
		'.roi-pgn-variations-container'
	);
	const variationsListEl = rootEl.querySelector('.roi-pgn-variations-list');
	const plyLabelEl = rootEl.querySelector('.roi-pgn-ply-label');

	const btnFirst = rootEl.querySelector('.roi-nav-first');
	const btnPrev = rootEl.querySelector('.roi-nav-prev');
	const btnNext = rootEl.querySelector('.roi-nav-next');
	const btnLast = rootEl.querySelector('.roi-nav-last');

	/**
	 * Nettoie les balises techniques Lichess/ChessBase ([%evp ...], [%clk ...], [%emt ...], [%eval ...], [%csl ...], [%cal ...])
	 * d'un commentaire pour l'affichage utilisateur.
	 *
	 * @param {string} commentText Commentaire source.
	 * @return {string} Commentaire nettoyé.
	 */
	function cleanCommentText(commentText) {
		if (!commentText) {
			return '';
		}
		return commentText
			.replace(/\[%[a-zA-Z0-9_-]+\s+[^\]]+\]/gi, '')
			.replace(/\s{2,}/g, ' ')
			.trim();
	}

	/**
	 * Synchronise les données de la session de jeu active (BoardCore) :
	 * - Coups de la branche actuellement suivie
	 * - Détection des coups possédant des variantes alternatives
	 * - Commentaire du coup actif
	 * - Formes (shapes) sur l'échiquier
	 * - Variantes disponibles au coup actif
	 */
	function syncDataFromBoard() {
		if (!boardApi) {
			return;
		}

		// 1. Branche active des coups
		const history = boardApi.getHistory(false) || [];
		totalPlies = history.length;
		movesData = history.map((san, idx) => {
			const ply = idx + 1;
			let hasBranches = false;
			if (typeof boardApi.getVariationsAtPly === 'function') {
				const vars = boardApi.getVariationsAtPly(ply);
				if (Array.isArray(vars) && vars.length > 1) {
					hasBranches = true;
				}
			}
			return {
				ply,
				num: Math.ceil(ply / 2),
				san,
				isWhite: ply % 2 === 1,
				hasBranches,
			};
		});

		// 2. Ply actif dans l'historique
		const historyState =
			typeof boardApi.getHistoryViewerState === 'function'
				? boardApi.getHistoryViewerState()
				: {};
		if (
			historyState &&
			historyState.isEnabled &&
			historyState.plyViewing !== undefined
		) {
			currentPly = historyState.plyViewing;
		} else {
			currentPly = totalPlies;
		}

		// 3. Commentaire & Shapes
		const rawComment =
			typeof boardApi.getCurrentComment === 'function'
				? boardApi.getCurrentComment()
				: '';
		currentComment = cleanCommentText(rawComment);
		currentShapes =
			typeof boardApi.getShapes === 'function'
				? boardApi.getShapes()
				: [];

		// 4. Variantes au coup courant
		if (typeof boardApi.getVariationsAtPly === 'function') {
			currentVariations = boardApi.getVariationsAtPly(currentPly) || [];
		} else {
			currentVariations = [];
		}
	}

	/**
	 * Rendu de la liste HTML des coups de la branche active.
	 */
	function renderMovesHtml() {
		if (!movesListEl) {
			return;
		}

		if (movesData.length === 0) {
			movesListEl.innerHTML =
				'<span style="color: #646970; font-style: italic;">Aucun coup dans cette séquence.</span>';
			return;
		}

		let html = '';
		for (let i = 0; i < movesData.length; i++) {
			const m = movesData[i];
			if (m.isWhite) {
				html += `<span class="roi-pgn-move-num" style="color: #646970; font-weight: 600; margin-left: 4px;">${m.num}.</span> `;
			} else if (i === 0) {
				html += `<span class="roi-pgn-move-num" style="color: #646970; font-weight: 600;">${m.num}...</span> `;
			}

			// Mise en valeur des coups avec variantes : souligné pointillé avec icône ou balisage discret
			const branchStyle = m.hasBranches
				? 'text-decoration: underline dotted #0969da; text-underline-offset: 3px;'
				: '';
			const branchTitle = m.hasBranches
				? ' title="Variantes disponibles sur ce coup"'
				: '';
			const branchPrefix = m.hasBranches ? '›' : '';
			const branchSuffix = m.hasBranches ? '‹' : '';

			html += `<span class="roi-pgn-move-item" data-ply="${m.ply}"${branchTitle} style="cursor: pointer; padding: 1px 4px; border-radius: 3px; display: inline-block; transition: all 0.15s; margin-right: 2px; ${branchStyle}">${branchPrefix}${toFrenchNotation(m.san)}${branchSuffix}</span> `;
		}

		movesListEl.innerHTML = html;

		// Clics directs sur les coups
		movesListEl.querySelectorAll('.roi-pgn-move-item').forEach((el) => {
			el.addEventListener('click', function () {
				const ply = parseInt(this.getAttribute('data-ply'), 10);
				goToPly(ply);
			});
		});
	}

	/**
	 * Met à jour le rendu visuel de la colonne de droite (coups, boutons, etc.).
	 */
	function renderView() {
		renderMovesHtml();

		// 1. Mise en surbrillance du coup actif
		const moveElements = movesListEl.querySelectorAll('.roi-pgn-move-item');
		moveElements.forEach((el) => {
			const p = parseInt(el.getAttribute('data-ply'), 10);
			if (p === currentPly) {
				el.style.backgroundColor = '#2271b1';
				el.style.color = '#fff';
				el.style.fontWeight = 'bold';
				el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			} else {
				el.style.backgroundColor = 'transparent';
				el.style.color = '#2c3338';
				el.style.fontWeight = 'normal';
			}
		});

		// 2. Commentaire
		if (commentTextEl) {
			if (currentComment) {
				commentTextEl.textContent = currentComment;
				commentTextEl.style.fontStyle = 'normal';
				commentTextEl.style.color = '#1d2327';
			} else if (currentPly === 0) {
				commentTextEl.textContent = '(Position de départ)';
				commentTextEl.style.fontStyle = 'italic';
				commentTextEl.style.color = '#646970';
			} else {
				commentTextEl.textContent = '(Aucun commentaire sur ce coup)';
				commentTextEl.style.fontStyle = 'italic';
				commentTextEl.style.color = '#8c8f94';
			}
		}

		// 3. Formes sur l'échiquier
		if (boardApi && typeof boardApi.setShapes === 'function') {
			boardApi.setShapes(currentShapes);
		}

		// 4. Variantes alternatives
		if (variationsContainerEl && variationsListEl) {
			if (currentVariations.length > 1) {
				variationsContainerEl.style.display = 'block';
				variationsListEl.innerHTML = '';

				currentVariations.forEach((v) => {
					const btn = document.createElement('button');
					btn.type = 'button';
					btn.className = 'button button-small roi-var-btn';
					btn.style.height = '24px';
					btn.style.lineHeight = '22px';
					btn.style.fontSize = '12px';
					btn.style.padding = '0 8px';
					btn.style.cursor = 'pointer';
					btn.style.display = 'inline-flex';
					btn.style.alignItems = 'center';
					btn.style.gap = '4px';
					btn.style.borderRadius = '3px';

					const isMain = v.isMainline || v.index === 0;
					const isCurrent = v.isActive;

					let labelText =
						toFrenchNotation(v.san) ||
						(isMain ? 'Ligne principale' : `Var ${v.index}`);
					if (isMain) {
						labelText += ' ★';
					}

					btn.textContent = labelText;

					if (isCurrent) {
						btn.style.backgroundColor = '#2271b1';
						btn.style.color = '#fff';
						btn.style.borderColor = '#2271b1';
						btn.style.fontWeight = 'bold';
					} else {
						btn.style.backgroundColor = '#fff';
						btn.style.color = '#2271b1';
						btn.style.borderColor = '#c8d9ea';
						btn.style.fontWeight = 'normal';
					}

					btn.addEventListener('click', () => {
						if (typeof boardApi.selectVariation === 'function') {
							boardApi.selectVariation(v.index);
							syncDataFromBoard();
							renderView();
						}
					});

					variationsListEl.appendChild(btn);
				});
			} else {
				variationsContainerEl.style.display = 'none';
				variationsListEl.innerHTML = '';
			}
		}

		// 5. Compteur de coups
		if (plyLabelEl) {
			const moveNumText =
				currentPly === 0
					? 'Début'
					: `${Math.ceil(currentPly / 2)}${currentPly % 2 === 1 ? '.' : '...'}`;
			plyLabelEl.textContent = `${moveNumText} (${currentPly}/${totalPlies})`;
		}

		// 6. Navigation buttons
		if (btnFirst && btnPrev && btnNext && btnLast) {
			btnFirst.disabled = currentPly === 0;
			btnPrev.disabled = currentPly === 0;
			btnNext.disabled = currentPly >= totalPlies;
			btnLast.disabled = currentPly >= totalPlies;
		}
	}

	/**
	 * Navigue vers un ply spécifique.
	 *
	 * @param {number} targetPly Numéro du demi-coup cible.
	 * @return {void}
	 */
	function goToPly(targetPly) {
		if (!boardApi) {
			return;
		}
		const safePly = Math.max(0, Math.min(targetPly, totalPlies));

		if (safePly === 0) {
			if (typeof boardApi.viewStart === 'function') {
				boardApi.viewStart();
			} else if (typeof boardApi.viewHistory === 'function') {
				boardApi.viewHistory(0);
			}
		} else if (typeof boardApi.viewHistory === 'function') {
			boardApi.viewHistory(safePly);
		}

		syncDataFromBoard();
		renderView();
	}

	/**
	 * Événements des boutons de navigation
	 */
	if (btnFirst) {
		btnFirst.addEventListener('click', () => goToPly(0));
	}
	if (btnPrev) {
		btnPrev.addEventListener('click', () => goToPly(currentPly - 1));
	}
	if (btnNext) {
		btnNext.addEventListener('click', () => goToPly(currentPly + 1));
	}
	if (btnLast) {
		btnLast.addEventListener('click', () => goToPly(totalPlies));
	}

	/**
	 * Initialise ou recharge le plateau avec le PGN fourni.
	 *
	 * @param {string} pgnStr Texte PGN complet à charger.
	 * @return {void}
	 */
	function load(pgnStr) {
		currentPgn = pgnStr || '';
		const trimmed = currentPgn.trim();

		// Si vide
		if (!trimmed) {
			if (boardApi) {
				boardApi.destroy();
				boardApi = null;
			}
			boardMountEl.innerHTML = '';
			movesData = [];
			totalPlies = 0;
			currentPly = 0;
			currentComment = '';
			currentShapes = [];
			currentVariations = [];
			renderView();
			return;
		}

		const { fen, orientation, shapes } =
			extractFenOrientationAndShapes(trimmed);

		if (boardApi) {
			try {
				if (typeof boardApi.loadPgn === 'function') {
					boardApi.loadPgn(trimmed);
				} else {
					boardApi.setPosition(fen);
				}
				if (typeof boardApi.setConfig === 'function') {
					boardApi.setConfig({ orientation });
				}
				goToPly(0);
				if (typeof boardApi.redraw === 'function') {
					boardApi.redraw(true);
				}
				window.requestAnimationFrame(() => {
					if (boardApi && typeof boardApi.redraw === 'function') {
						boardApi.redraw(true);
					}
					syncDataFromBoard();
					renderView();
				});
			} catch (e) {
				console.warn('[PgnPreviewViewer] Erreur reload PGN:', e);
				boardApi.setPosition(fen);
			}
			return;
		}

		// Initialisation différée si EgBoardCore n'est pas encore prêt
		const checkInterval = setInterval(function () {
			if (window.EgBoardCore) {
				clearInterval(checkInterval);

				const boardConfig = {
					mode: 'game',
					fen,
					orientation,
					coordinates: true,
					viewOnly: true,
					movable: {
						free: false,
						color: 'none',
					},
					drawable: {
						enabled: false,
						visible: true,
						shapes: shapes || [],
					},
				};

				const boardState = {
					mode: 'game',
					pieceSet: 'cburnett',
					boardTheme: 'brown',
					showThreats: false,
					promotionDialogState: { isEnabled: false },
					historyViewerState: { isEnabled: false },
				};

				boardApi = new window.EgBoardCore(
					boardMountEl,
					boardState,
					function () {
						syncDataFromBoard();
						renderView();
					},
					function () {},
					boardConfig,
					{ workerUrl: '' }
				);

				try {
					if (typeof boardApi.loadPgn === 'function') {
						boardApi.loadPgn(trimmed);
					}
				} catch (err) {
					console.warn(
						'[PgnPreviewViewer] Erreur initial loadPgn:',
						err
					);
				}

				goToPly(0);

				window.requestAnimationFrame(() => {
					if (boardApi && typeof boardApi.redraw === 'function') {
						boardApi.redraw(true);
					}
					syncDataFromBoard();
					renderView();
				});
			}
		}, 50);
	}

	// Premier chargement
	load(currentPgn);

	return {
		update(newPgn) {
			load(newPgn);
		},
		destroy() {
			if (boardApi && typeof boardApi.destroy === 'function') {
				boardApi.destroy();
				boardApi = null;
			}
			rootEl.innerHTML = '';
		},
	};
}
