import { computeEvalBarPercentage } from 'eg-chessboard';
import type {
	BoardCore,
	StockfishEvaluation,
	GameReviewReport,
	MoveJudgement,
	DrawShape,
	EngineStatus,
} from 'eg-chessboard';

interface ExtendedBoardCore extends BoardCore {
	on?: (_event: string, _callback: (..._args: any[]) => void) => () => void;
	off?: (_event: string, _callback: (..._args: any[]) => void) => void;
}

interface ChessboardBlockElement extends HTMLElement {
	boardAPI?: ExtendedBoardCore;
}

interface JudgementInfo {
	symbol: string;
	class: string;
	label: string;
	brush: string;
}

const judgementConfig: Record<MoveJudgement, JudgementInfo> = {
	brilliant: { symbol: '!!', class: 'judgement-brilliant', label: 'Brillant', brush: 'blue' },
	best: { symbol: '★', class: 'judgement-best', label: 'Meilleur coup', brush: 'green' },
	excellent: { symbol: '✓', class: 'judgement-excellent', label: 'Excellent', brush: 'green' },
	good: { symbol: '•', class: 'judgement-good', label: 'Bon coup', brush: 'blue' },
	inaccuracy: { symbol: '?!', class: 'judgement-inaccuracy', label: 'Imprécision', brush: 'yellow' },
	mistake: { symbol: '?', class: 'judgement-mistake', label: 'Erreur', brush: 'yellow' },
	blunder: { symbol: '??', class: 'judgement-blunder', label: 'Gaffe', brush: 'red' },
	missed_win: { symbol: '✗', class: 'judgement-missed-win', label: 'Gain manqué', brush: 'red' },
};

function formatEvaluationScore(evaluation: StockfishEvaluation | null): string {
	if (!evaluation) {
		return '0.0';
	}
	if (evaluation.scoreType === 'mate') {
		const prefix = evaluation.scoreValue > 0 ? '+M' : '-M';
		return `${prefix}${Math.abs(evaluation.scoreValue)}`;
	}
	const cpValue = evaluation.whiteScoreValue / 100;
	if (cpValue > 0) {
		return `+${cpValue.toFixed(1)}`;
	}
	return cpValue.toFixed(1);
}

function formatSan(san: string): string {
	const symbols: Record<string, string> = {
		K: '♚',
		Q: '♛',
		R: '♜',
		B: '♝',
		N: '♞',
	};
	return san.replace(/([KQRBN])/g, (match) => symbols[match] || match);
}

function escapeHtml(text: string): string {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

function normalizeCastlingMoves(api: unknown): void {
	if (!api || typeof (api as { getHistory?: unknown }).getHistory !== 'function') {
		return;
	}
	try {
		const history = (api as { getHistory: (_verbose?: boolean) => unknown[] }).getHistory(true);
		if (Array.isArray(history)) {
			for (const item of history) {
				if (!item || typeof item !== 'object') {
					continue;
				}
				const move = item as { san?: string; color?: string; from?: string; to?: string };
				if (!move.san) {
					continue;
				}
				const san = move.san.trim();
				const isWhite = move.color === 'w' || move.color === 'white' || move.from === 'e1';
				if (san.startsWith('O-O-O') || san.startsWith('0-0-0')) {
					move.to = isWhite ? 'c1' : 'c8';
				} else if (san.startsWith('O-O') || san.startsWith('0-0')) {
					move.to = isWhite ? 'g1' : 'g8';
				}
			}
		}
	} catch (err) {
		console.warn('Erreur lors de la normalisation des roques UCI:', err);
	}
}

function onDomReady(fn: () => void) {
	if (document.readyState !== 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

onDomReady(() => {
	const block = document.getElementById('roi-partie-viewer-chessboard') as ChessboardBlockElement | null;
	const pgnTextarea = document.getElementById('roi_pgn') as HTMLTextAreaElement | null;

	if (!block || !pgnTextarea) {
		return;
	}

	let boardAPI: ExtendedBoardCore;

	// State
	let isLiveAnalysis = false;
	let isReviewing = false;
	let reviewAbortController: AbortController | null = null;
	let gameReviewReport: GameReviewReport | null = null;
	let selectedReviewPly: number | null = null;
	let isViewingBeforeMove = true;
	let currentEvaluation: StockfishEvaluation | null = null;
	let engineStatus: EngineStatus = 'uninitialized';
	let hintFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

	// DOM Elements
	const evalDirectBtn = document.getElementById('roi-eval-direct-btn') as HTMLButtonElement | null;
	const hintBtn = document.getElementById('roi-hint-btn') as HTMLButtonElement | null;
	const bilanBtn = document.getElementById('roi-bilan-btn') as HTMLButtonElement | null;
	const feedbackEl = document.getElementById('roi-analysis-feedback');
	const reviewProgressEl = document.getElementById('roi-review-progress');
	const reviewProgressBarFill = document.getElementById('roi-review-progress-bar-fill');
	const reviewProgressPercent = document.getElementById('roi-review-progress-percent');
	const reviewDashboardEl = document.getElementById('roi-review-dashboard');
	const evalBarContainer = document.getElementById('roi-eval-bar-container');
	const evalBarFill = document.getElementById('roi-eval-bar-fill');
	const evalScoreBadge = document.getElementById('roi-eval-score-badge');
	const pvContainer = document.getElementById('roi-pv-container');
	const movesList = document.getElementById('roi-moves-list');
	const moveInfo = document.getElementById('roi-move-info');

	function decodeHTMLEntities(text: string): string {
		const textArea = document.createElement('textarea');
		textArea.innerHTML = text;
		return textArea.value;
	}

	function showFeedbackMessage(
		message: string,
		type: 'info' | 'warning' | 'error' = 'info',
		autoHideDurationMs = 5000
	): void {
		if (!feedbackEl) {
			return;
		}
		if (hintFeedbackTimer) {
			clearTimeout(hintFeedbackTimer);
			hintFeedbackTimer = null;
		}

		feedbackEl.className = 'roi-analysis-feedback';
		if (type === 'warning') {
			feedbackEl.classList.add('feedback-warning');
		} else if (type === 'error') {
			feedbackEl.classList.add('feedback-error');
		}

		let iconClass = 'dashicons-info';
		if (type === 'warning') {
			iconClass = 'dashicons-warning';
		} else if (type === 'error') {
			iconClass = 'dashicons-dismiss';
		}

		feedbackEl.innerHTML = `<span class="dashicons ${iconClass}" aria-hidden="true"></span><span>${escapeHtml(message)}</span>`;
		feedbackEl.classList.remove('is-hidden');

		if (autoHideDurationMs > 0) {
			hintFeedbackTimer = setTimeout(() => {
				feedbackEl.classList.add('is-hidden');
				hintFeedbackTimer = null;
			}, autoHideDurationMs);
		}
	}

	function hideFeedbackMessage(): void {
		if (hintFeedbackTimer) {
			clearTimeout(hintFeedbackTimer);
			hintFeedbackTimer = null;
		}
		if (feedbackEl) {
			feedbackEl.classList.add('is-hidden');
		}
	}

	function getCurrentViewingPly(): number {
		if (selectedReviewPly !== null) {
			return selectedReviewPly;
		}
		if (typeof (boardAPI as any).getCurrentViewingPly === 'function') {
			const ply = (boardAPI as any).getCurrentViewingPly();
			if (typeof ply === 'number') {
				return ply;
			}
		}
		let historyState = null;
		if (typeof boardAPI.getHistoryViewerState === 'function') {
			historyState = boardAPI.getHistoryViewerState();
		} else if (typeof boardAPI.getState === 'function') {
			historyState = boardAPI.getState()?.historyViewerState;
		}
		if (historyState && historyState.isEnabled && historyState.plyViewing !== undefined) {
			return historyState.plyViewing;
		}
		return boardAPI.getCurrentPlyNumber();
	}

	function updateActiveMove(): void {
		if (!movesList || !moveInfo) {
			return;
		}

		const currentPly = getCurrentViewingPly();

		// Highlight active move in move list
		const moveItems = movesList.querySelectorAll<HTMLElement>('.roi-move-item');
		moveItems.forEach((item) => {
			const ply = parseInt(item.getAttribute('data-ply') || '0', 10);
			if (ply === currentPly) {
				item.classList.add('is-active');
				item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			} else {
				item.classList.remove('is-active');
			}
		});

		// Update move info banner
		const history = boardAPI.getHistory(true);
		if (currentPly === 0) {
			moveInfo.textContent = 'Position de départ';
		} else if (history && history[currentPly - 1]) {
			const lastMove = history[currentPly - 1] as { san: string };
			const moveIndex = Math.ceil(currentPly / 2);
			const dotStr = currentPly % 2 === 1 ? '.' : '...';
			moveInfo.textContent = `Coup : ${moveIndex}${dotStr}${lastMove.san}`;
		}

		if (isLiveAnalysis && currentEvaluation && evalScoreBadge) {
			evalScoreBadge.textContent = formatEvaluationScore(currentEvaluation);
		}
	}

	function renderMovesList(): void {
		if (!movesList) {
			return;
		}

		const history = boardAPI.getHistory(true);
		if (!history || history.length === 0) {
			movesList.innerHTML = '<span class="roi-no-moves-message">Aucun coup disponible</span>';
			return;
		}

		// Structure moves into full-turn pairs (White & Black)
		const fullMoves: Array<{
			number: number;
			white: { ply: number; san: string };
			black: { ply: number; san: string } | null;
		}> = [];

		for (let i = 0; i < history.length; i += 2) {
			const moveNumber = Math.floor(i / 2) + 1;
			const whiteMove = history[i] as { san: string };
			const blackMove = (history[i + 1] as { san: string } | undefined) ?? null;
			fullMoves.push({
				number: moveNumber,
				white: { ply: i + 1, san: whiteMove.san },
				black: blackMove ? { ply: i + 2, san: blackMove.san } : null,
			});
		}

		let html = '<div class="roi-moves-grid">';
		for (const move of fullMoves) {
			let whiteBadge = '';
			let blackBadge = '';

			if (gameReviewReport) {
				const whiteAnalysis = gameReviewReport.moves.find((m) => m.ply === move.white.ply);
				if (whiteAnalysis) {
					const cfg = judgementConfig[whiteAnalysis.judgement];
					if (cfg) {
						whiteBadge = `<span class="judgement-badge ${cfg.class}">${cfg.symbol}</span>`;
					}
				}
				const black = move.black;
				if (black) {
					const blackAnalysis = gameReviewReport.moves.find((m) => m.ply === black.ply);
					if (blackAnalysis) {
						const cfg = judgementConfig[blackAnalysis.judgement];
						if (cfg) {
							blackBadge = `<span class="judgement-badge ${cfg.class}">${cfg.symbol}</span>`;
						}
					}
				}
			}

			html += '<div class="roi-move-group">';
			html += `<span class="roi-move-num">${move.number}.</span>`;
			html += `<span class="roi-move-item roi-move-white" data-ply="${move.white.ply}">`;
			html += `<span class="roi-move-san-text">${formatSan(move.white.san)}</span>`;
			html += `${whiteBadge}</span>`;

			if (move.black) {
				html += `<span class="roi-move-item roi-move-black" data-ply="${move.black.ply}">`;
				html += `<span class="roi-move-san-text">${formatSan(move.black.san)}</span>`;
				html += `${blackBadge}</span>`;
			} else {
				html += '<span class="roi-move-item roi-move-empty"></span>';
			}

			html += '</div>';
		}
		html += '</div>';

		movesList.innerHTML = html;

		// Bind click events on moves
		const moveItems = movesList.querySelectorAll<HTMLElement>('.roi-move-item:not(.roi-move-empty)');
		moveItems.forEach((item) => {
			item.addEventListener('click', () => {
				const ply = parseInt(item.getAttribute('data-ply') || '0', 10);
				if (gameReviewReport && !isReviewing) {
					selectPlyForReview(ply);
				} else {
					selectedReviewPly = null;
					boardAPI.hideMoves();
					boardAPI.viewHistory(ply);
					updateActiveMove();
				}
			});
		});

		updateActiveMove();
	}

	function updateReviewBoardDisplay(): void {
		if (!boardAPI || selectedReviewPly === null || !gameReviewReport) {
			return;
		}

		const ply = selectedReviewPly;
		if (ply === 0) {
			boardAPI.hideMoves();
			boardAPI.viewStart();
			updateActiveMove();
			renderReviewDashboard();
			return;
		}

		const analysis = gameReviewReport.moves.find((m) => m.ply === ply);

		if (isViewingBeforeMove) {
			if (ply === 1) {
				boardAPI.viewStart();
			} else {
				boardAPI.viewHistory(ply - 1);
			}

			if (analysis && analysis.uci && analysis.uci.length >= 4) {
				const playedBrush = judgementConfig[analysis.judgement]?.brush || 'yellow';
				const playedFrom = analysis.uci.substring(0, 2);
				const playedTo = analysis.uci.substring(2, 4);
				const shapes: DrawShape[] = [];

				const bestUci = analysis.bestMoveUci;
				if (bestUci && bestUci.length >= 4 && bestUci !== analysis.uci) {
					shapes.push({
						orig: playedFrom as any,
						dest: playedTo as any,
						brush: playedBrush,
					});
					shapes.push({
						orig: bestUci.substring(0, 2) as any,
						dest: bestUci.substring(2, 4) as any,
						brush: 'green',
					});
				} else {
					shapes.push({
						orig: playedFrom as any,
						dest: playedTo as any,
						brush: 'green',
					});
				}
				boardAPI.setShapes(shapes);
			} else {
				boardAPI.hideMoves();
			}
		} else {
			boardAPI.hideMoves();
			boardAPI.viewHistory(ply);
		}

		updateActiveMove();
		renderReviewDashboard();
	}

	function selectPlyForReview(ply: number): void {
		selectedReviewPly = ply;
		isViewingBeforeMove = true;
		hideFeedbackMessage();
		updateReviewBoardDisplay();
	}

	function renderReviewDashboard(): void {
		if (!reviewDashboardEl || !gameReviewReport) {
			return;
		}

		const report = gameReviewReport;
		const history = boardAPI.getHistory(true);
		const totalPlyCount = history ? history.length : 0;
		const currentPly = selectedReviewPly ?? 0;
		const analysis = currentPly > 0 ? report.moves.find((m) => m.ply === currentPly) : null;

		// Count judgements across both colors
		const counts: Record<MoveJudgement, number> = {
			brilliant: 0,
			best: 0,
			excellent: 0,
			good: 0,
			inaccuracy: 0,
			mistake: 0,
			blunder: 0,
			missed_win: 0,
		};
		if (report.summary) {
			const { white, black } = report.summary;
			for (const key of Object.keys(counts) as MoveJudgement[]) {
				counts[key] = (white[key] || 0) + (black[key] || 0);
			}
		}

		let pillsHtml = '';
		for (const key of Object.keys(counts) as MoveJudgement[]) {
			if (counts[key] > 0) {
				const cfg = judgementConfig[key];
				pillsHtml += `<span class="judgement-pill ${cfg.class}">${cfg.symbol} ${counts[key]}</span> `;
			}
		}

		let moveCardHtml = '';
		if (analysis) {
			const moveNumber = Math.ceil(analysis.ply / 2);
			const isWhite = analysis.ply % 2 === 1;
			const moveLabel = isWhite ? `${moveNumber}. ${analysis.san}` : `${moveNumber}... ${analysis.san}`;
			const jCfg = judgementConfig[analysis.judgement] || judgementConfig.good;

			const hasDifferentBest = analysis.bestMoveSan && analysis.bestMoveUci !== analysis.uci;
			const commentHtml = analysis.comment ? `<div class="roi-move-comment">${escapeHtml(analysis.comment)}</div>` : '';

			moveCardHtml = `
				<div class="roi-review-move-card">
					<div class="roi-move-card-header">
						<div class="roi-move-title-group">
							<span class="roi-move-label">${escapeHtml(moveLabel)}</span>
							<span class="judgement-pill ${jCfg.class}">${jCfg.symbol} ${jCfg.label}</span>
						</div>
						<div class="roi-move-nav-mini">
							<button type="button" class="button" id="roi-review-prev-btn" ${currentPly <= 1 ? 'disabled' : ''} title="Coup précédent">‹</button>
							<button type="button" class="button" id="roi-review-next-btn" ${currentPly >= totalPlyCount ? 'disabled' : ''} title="Coup suivant">›</button>
						</div>
					</div>

					<div class="roi-move-details-grid">
						<div class="roi-move-detail-row">
							<span class="roi-detail-label">Coup joué :</span>
							<span class="roi-detail-move">
								<span class="arrow-indicator arrow-${jCfg.brush}">➔</span>
								<span>${formatSan(analysis.san)}</span>
							</span>
						</div>
						${
							hasDifferentBest
								? `
						<div class="roi-move-detail-row">
							<span class="roi-detail-label">Meilleur coup :</span>
							<span class="roi-detail-move">
								<span class="arrow-indicator arrow-green">➔</span>
								<span>${formatSan(analysis.bestMoveSan)}</span>
							</span>
						</div>
						`
								: ''
						}
					</div>

					${commentHtml}

					<div class="roi-move-toggle-actions">
						<button type="button" class="step-toggle-btn ${isViewingBeforeMove ? 'is-active' : ''}" id="roi-toggle-before-btn">
							Avant le coup
						</button>
						<button type="button" class="step-toggle-btn ${!isViewingBeforeMove ? 'is-active' : ''}" id="roi-toggle-after-btn">
							Après le coup
						</button>
					</div>
				</div>
			`;
		}

		reviewDashboardEl.innerHTML = `
			<div class="roi-review-header">
				<h4>Bilan de la partie</h4>
				<button type="button" class="roi-review-close-btn" id="roi-review-close-btn" title="Fermer le bilan">
					<span class="dashicons dashicons-no-alt" aria-hidden="true"></span>
				</button>
			</div>
			<div class="roi-accuracy-grid">
				<div class="roi-accuracy-box white-box">
					<span class="roi-acc-title">Précision Blancs</span>
					<span class="roi-acc-value">${report.accuracy.white}%</span>
				</div>
				<div class="roi-accuracy-box black-box">
					<span class="roi-acc-title">Précision Noirs</span>
					<span class="roi-acc-value">${report.accuracy.black}%</span>
				</div>
			</div>
			<div class="roi-judgement-summary-grid">
				${pillsHtml}
			</div>
			${moveCardHtml}
		`;

		reviewDashboardEl.classList.remove('is-hidden');

		// Bind inner controls
		document.getElementById('roi-review-close-btn')?.addEventListener('click', closeReviewReport);
		document.getElementById('roi-review-prev-btn')?.addEventListener('click', () => {
			if (selectedReviewPly !== null && selectedReviewPly > 1) {
				selectPlyForReview(selectedReviewPly - 1);
			}
		});
		document.getElementById('roi-review-next-btn')?.addEventListener('click', () => {
			if (selectedReviewPly !== null && selectedReviewPly < totalPlyCount) {
				selectPlyForReview(selectedReviewPly + 1);
			}
		});
		document.getElementById('roi-toggle-before-btn')?.addEventListener('click', () => {
			if (!isViewingBeforeMove) {
				isViewingBeforeMove = true;
				updateReviewBoardDisplay();
			}
		});
		document.getElementById('roi-toggle-after-btn')?.addEventListener('click', () => {
			if (isViewingBeforeMove) {
				isViewingBeforeMove = false;
				updateReviewBoardDisplay();
			}
		});
	}

	function closeReviewReport(): void {
		gameReviewReport = null;
		selectedReviewPly = null;
		boardAPI.hideMoves();
		reviewDashboardEl?.classList.add('is-hidden');
		renderMovesList();
		updateActiveMove();
	}

	function toggleLiveAnalysis(): void {
		if (!boardAPI) {
			return;
		}
		normalizeCastlingMoves(boardAPI);

		isLiveAnalysis = !isLiveAnalysis;
		if (isLiveAnalysis) {
			if (isReviewing) {
				cancelReview();
			}
			evalDirectBtn?.classList.add('is-active');
			if (evalDirectBtn) {
				const textEl = evalDirectBtn.querySelector('.btn-text');
				if (textEl) {
					textEl.textContent = 'Stop éval';
				}
			}
			evalBarContainer?.classList.remove('is-hidden');
			pvContainer?.classList.remove('is-hidden');
			boardAPI.startLiveAnalysis();
		} else {
			evalDirectBtn?.classList.remove('is-active');
			if (evalDirectBtn) {
				const textEl = evalDirectBtn.querySelector('.btn-text');
				if (textEl) {
					textEl.textContent = 'Éval direct';
				}
			}
			evalBarContainer?.classList.add('is-hidden');
			pvContainer?.classList.add('is-hidden');
			boardAPI.stopLiveAnalysis();
			boardAPI.hideMoves();
			currentEvaluation = null;
		}
	}

	function handleEvaluation(evaluation: StockfishEvaluation): void {
		currentEvaluation = evaluation;
		if (!isLiveAnalysis || !boardAPI) {
			return;
		}

		const percent =
			typeof evaluation.winChancePercentage === 'number'
				? evaluation.winChancePercentage
				: computeEvalBarPercentage(
						boardAPI.getTurnColor(),
						evaluation.scoreType,
						evaluation.scoreValue,
						evaluation.wdl
					);

		if (evalBarFill) {
			evalBarFill.style.setProperty('--roi-eval-percent', `${percent}%`);
		}

		if (evalScoreBadge) {
			evalScoreBadge.textContent = formatEvaluationScore(evaluation);
			const isWhite = (evaluation.whiteScoreValue ?? 0) >= 0;
			evalScoreBadge.classList.toggle('is-white', isWhite);
			evalScoreBadge.classList.toggle('is-black', !isWhite);
		}

		if (pvContainer) {
			if (evaluation.pv && evaluation.pv.length > 0) {
				const pvSlice = evaluation.pv.slice(0, 5).join(' ');
				pvContainer.innerHTML = `<strong>Meilleure suite :</strong> ${escapeHtml(pvSlice)}`;
				pvContainer.classList.remove('is-hidden');
			} else {
				pvContainer.classList.add('is-hidden');
			}
		}

		if (evaluation.bestMove && evaluation.bestMove.length >= 4) {
			if (selectedReviewPly !== null && isViewingBeforeMove) {
				updateReviewBoardDisplay();
			} else {
				const from = evaluation.bestMove.substring(0, 2);
				const to = evaluation.bestMove.substring(2, 4);
				boardAPI.drawMove(from, to, 'green');
			}
		}
	}

	function requestHint(): void {
		if (!boardAPI) {
			return;
		}
		if (engineStatus === 'error') {
			showFeedbackMessage("Le moteur d'analyse Stockfish n'est pas disponible.", 'warning', 4000);
			return;
		}
		normalizeCastlingMoves(boardAPI);

		// Si un Bilan est actif sur un coup, fournir immédiatement le meilleur coup identifié par le bilan
		if (gameReviewReport && !isReviewing && selectedReviewPly !== null && selectedReviewPly > 0) {
			const analysis = gameReviewReport.moves.find((m) => m.ply === selectedReviewPly);
			if (analysis && analysis.bestMoveSan && analysis.bestMoveUci) {
				const from = analysis.bestMoveUci.substring(0, 2);
				const to = analysis.bestMoveUci.substring(2, 4);
				showFeedbackMessage(
					`Conseil Bilan : le meilleur coup était ${analysis.bestMoveSan} (${from.toUpperCase()} ➔ ${to.toUpperCase()})`,
					'info',
					5000
				);
				if (!isViewingBeforeMove) {
					isViewingBeforeMove = true;
				}
				updateReviewBoardDisplay();
				return;
			}
		}

		const history = boardAPI.getHistory(true);
		const totalPlyCount = history ? history.length : 0;
		const currentPly = getCurrentViewingPly();

		if (currentPly === totalPlyCount && totalPlyCount > 0 && boardAPI.getIsGameOver()) {
			showFeedbackMessage(
				'Partie terminée sur cette position. Revenez en arrière pour demander un conseil.',
				'warning',
				4000
			);
			return;
		}

		showFeedbackMessage('Recherche du meilleur coup en cours...', 'info', 0);

		if (hintFeedbackTimer) {
			clearTimeout(hintFeedbackTimer);
		}
		hintFeedbackTimer = setTimeout(() => {
			showFeedbackMessage(
				"Le moteur n'a pas retourné de coup dans le délai imparti. Réessayez ou naviguez vers un autre coup.",
				'warning',
				4000
			);
		}, 6000);

		boardAPI.requestHint({ multiPv: 2, movetime: 1500 });
	}

	function handleStockfishHint(bestMove: string): void {
		if (hintFeedbackTimer) {
			clearTimeout(hintFeedbackTimer);
			hintFeedbackTimer = null;
		}

		if (boardAPI && bestMove && bestMove.length >= 4) {
			const from = bestMove.substring(0, 2);
			const to = bestMove.substring(2, 4);
			boardAPI.drawMove(from, to, 'green');
			showFeedbackMessage(
				`Conseil Stockfish : ${from.toUpperCase()} ➔ ${to.toUpperCase()}`,
				'info',
				5000
			);
		} else {
			showFeedbackMessage('Aucun coup évident trouvé sur cette position.', 'warning', 3000);
		}
	}

	function handleEngineStatus(status: EngineStatus): void {
		engineStatus = status;
		if (status === 'error') {
			if (isReviewing) {
				cancelReview();
			}
			showFeedbackMessage(
				"Le moteur d'analyse Stockfish n'est pas disponible ou a rencontré une erreur. La consultation de la partie reste accessible.",
				'warning',
				8000
			);
		}
	}

	function cancelReview(): void {
		if (reviewAbortController) {
			reviewAbortController.abort();
			reviewAbortController = null;
		}
		boardAPI?.cancelReview();
		isReviewing = false;
		bilanBtn?.classList.remove('is-reviewing');
		if (bilanBtn) {
			const textEl = bilanBtn.querySelector('.btn-text');
			if (textEl) {
				textEl.textContent = 'Bilan';
			}
		}
		reviewProgressEl?.classList.add('is-hidden');
		showFeedbackMessage('Calcul du bilan annulé.', 'info', 3000);
	}

	async function startReview(): Promise<void> {
		if (!boardAPI || isReviewing) {
			return;
		}

		const history = boardAPI.getHistory(true);
		if (!history || history.length === 0) {
			showFeedbackMessage('Aucun coup à analyser dans cette partie.', 'warning', 3000);
			return;
		}

		if (isLiveAnalysis) {
			toggleLiveAnalysis();
		}

		normalizeCastlingMoves(boardAPI);
		isReviewing = true;
		bilanBtn?.classList.add('is-reviewing');
		if (bilanBtn) {
			const textEl = bilanBtn.querySelector('.btn-text');
			if (textEl) {
				textEl.textContent = 'Annuler';
			}
		}

		if (reviewProgressPercent) {
			reviewProgressPercent.textContent = '0%';
		}
		if (reviewProgressBarFill) {
			reviewProgressBarFill.style.width = '0%';
		}
		reviewProgressEl?.classList.remove('is-hidden');
		reviewDashboardEl?.classList.add('is-hidden');
		hideFeedbackMessage();

		reviewAbortController = new AbortController();

		try {
			const report = await boardAPI.reviewGame({
				depth: 12,
				signal: reviewAbortController.signal,
				onProgress: (percent) => {
					if (reviewProgressPercent) {
						reviewProgressPercent.textContent = `${percent}%`;
					}
					if (reviewProgressBarFill) {
						reviewProgressBarFill.style.width = `${percent}%`;
					}
				},
			});

			if (isReviewing) {
				gameReviewReport = report;
				renderMovesList();
				const firstMistake = report.moves.find((m) =>
					['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(m.judgement)
				);
				let targetPly = 0;
				if (firstMistake) {
					targetPly = firstMistake.ply;
				} else if (report.moves.length > 0) {
					targetPly = 1;
				}
				selectPlyForReview(targetPly);
			}
		} catch (err: unknown) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				return;
			}
			console.error('Erreur lors de la revue de partie:', err);
			showFeedbackMessage("Erreur lors de l'analyse de la partie par Stockfish.", 'error', 5000);
		} finally {
			isReviewing = false;
			reviewAbortController = null;
			bilanBtn?.classList.remove('is-reviewing');
			if (bilanBtn) {
				const textEl = bilanBtn.querySelector('.btn-text');
				if (textEl) {
					textEl.textContent = 'Bilan';
				}
			}
			reviewProgressEl?.classList.add('is-hidden');
		}
	}

	async function toggleReview(): Promise<void> {
		if (isReviewing) {
			cancelReview();
			return;
		}
		await startReview();
	}

	function setupControls(): void {
		const prevStartBtn = document.getElementById('roi-prev-start-btn');
		const prevBtn = document.getElementById('roi-prev-btn');
		const nextBtn = document.getElementById('roi-next-btn');
		const nextEndBtn = document.getElementById('roi-next-end-btn');

		prevStartBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			hideFeedbackMessage();
			if (gameReviewReport && !isReviewing) {
				selectPlyForReview(0);
			} else {
				selectedReviewPly = null;
				boardAPI.hideMoves();
				boardAPI.viewStart();
				updateActiveMove();
			}
		});

		prevBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			hideFeedbackMessage();
			if (gameReviewReport && !isReviewing) {
				const current = selectedReviewPly ?? boardAPI.getHistory(true).length;
				if (current > 0) {
					selectPlyForReview(current - 1);
				}
			} else {
				selectedReviewPly = null;
				boardAPI.hideMoves();
				boardAPI.viewPrevious();
				updateActiveMove();
			}
		});

		nextBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			hideFeedbackMessage();
			const total = boardAPI.getHistory(true).length;
			if (gameReviewReport && !isReviewing) {
				const current = selectedReviewPly ?? 0;
				if (current < total) {
					selectPlyForReview(current + 1);
				}
			} else {
				selectedReviewPly = null;
				boardAPI.hideMoves();
				boardAPI.viewNext();
				updateActiveMove();
			}
		});

		nextEndBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			hideFeedbackMessage();
			const total = boardAPI.getHistory(true).length;
			if (gameReviewReport && !isReviewing) {
				selectPlyForReview(total);
			} else {
				selectedReviewPly = null;
				boardAPI.hideMoves();
				boardAPI.stopViewingHistory();
				updateActiveMove();
			}
		});

		evalDirectBtn?.addEventListener('click', toggleLiveAnalysis);
		hintBtn?.addEventListener('click', requestHint);
		bilanBtn?.addEventListener('click', () => {
			toggleReview().catch((err) => console.error(err));
		});

		// Keyboard navigation
		document.addEventListener('keydown', (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
				return;
			}
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				prevBtn?.click();
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				nextBtn?.click();
			} else if (e.key === 'ArrowUp' || e.key === 'Home') {
				e.preventDefault();
				prevStartBtn?.click();
			} else if (e.key === 'ArrowDown' || e.key === 'End') {
				e.preventDefault();
				nextEndBtn?.click();
			}
		});
	}

	function initViewer(): void {
		// Load the PGN initially
		let pgn = pgnTextarea ? pgnTextarea.value.trim() : '';
		if (pgn) {
			pgn = decodeHTMLEntities(pgn);
			pgn = pgn.replace(/[\s\u00a0]+/g, ' ');
			try {
				boardAPI.loadPgn(pgn);
				normalizeCastlingMoves(boardAPI);
			} catch (e) {
				console.error('ROI PGN Viewer - Error loading PGN:', e);
			}
		}

		renderMovesList();
		setupControls();
		updateActiveMove();

		// Trigger board geometry redraw and window resize event
		if (typeof boardAPI.redraw === 'function') {
			boardAPI.redraw(true);
		}
		window.dispatchEvent(new Event('resize'));
		requestAnimationFrame(() => {
			if (typeof boardAPI.redraw === 'function') {
				boardAPI.redraw(true);
			}
		});

		// Listen to events on boardAPI
		if (typeof boardAPI.on === 'function') {
			boardAPI.on('evaluation', handleEvaluation);
			boardAPI.on('stockfish-hint', handleStockfishHint);
			boardAPI.on('engine-status', handleEngineStatus);
		}

		// Also listen on DOM element as fallback
		block?.addEventListener('evaluation', (e: Event) => {
			const detail = (e as CustomEvent).detail as StockfishEvaluation;
			if (detail) {
				handleEvaluation(detail);
			}
		});
		block?.addEventListener('stockfish-hint', (e: Event) => {
			const detail = (e as CustomEvent).detail as string;
			if (detail) {
				handleStockfishHint(detail);
			}
		});
		block?.addEventListener('engine-status', (e: Event) => {
			const detail = (e as CustomEvent).detail as EngineStatus;
			if (detail) {
				handleEngineStatus(detail);
			}
		});

		// Listen for direct textarea changes to reload PGN
		pgnTextarea?.addEventListener('input', () => {
			let newPgn = pgnTextarea.value.trim();
			newPgn = decodeHTMLEntities(newPgn);
			newPgn = newPgn.replace(/[\s\u00a0]+/g, ' ');
			try {
				if (isReviewing) {
					cancelReview();
				}
				gameReviewReport = null;
				selectedReviewPly = null;
				reviewDashboardEl?.classList.add('is-hidden');

				boardAPI.loadPgn(newPgn);
				normalizeCastlingMoves(boardAPI);
				renderMovesList();
				updateActiveMove();
			} catch (e) {
				console.error('Error reloading PGN:', e);
			}
		});

		window.addEventListener('beforeunload', () => {
			if (hintFeedbackTimer) {
				clearTimeout(hintFeedbackTimer);
			}
			if (isReviewing) {
				cancelReview();
			}
			if (isLiveAnalysis) {
				boardAPI.stopLiveAnalysis();
			}
		});
	}

	// Poll for boardAPI initialization on the block element
	let attempts = 0;
	const checkInterval = setInterval(() => {
		attempts++;
		if (block.boardAPI) {
			clearInterval(checkInterval);
			boardAPI = block.boardAPI;
			initViewer();
		} else if (attempts > 200) {
			clearInterval(checkInterval);
		}
	}, 50);
});

