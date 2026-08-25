(function () {
	document.addEventListener('DOMContentLoaded', function () {
		const block = document.getElementById('roi-partie-viewer-chessboard');
		const pgnTextarea = document.getElementById('roi_pgn');

		if (!block || !pgnTextarea) {
			return;
		}

		let boardAPI;
		// Poll for boardAPI initialization on the block element
		const checkInterval = setInterval(function () {
			if (block.boardAPI) {
				clearInterval(checkInterval);
				boardAPI = block.boardAPI;
				initViewer();
			}
		}, 50);

		function decodeHTMLEntities(text) {
			const textArea = document.createElement('textarea');
			textArea.innerHTML = text;
			return textArea.value;
		}

		function initViewer() {
			// Load the PGN initially
			let pgn = pgnTextarea.value.trim();
			console.warn('ROI PGN Viewer - Raw PGN from textarea:', pgn);
			if (pgn) {
				pgn = decodeHTMLEntities(pgn);
				// Replace all types of whitespaces (newlines, tabs, non-breaking spaces) with a single space
				pgn = pgn.replace(/[\s\u00a0]+/g, ' ');
				console.warn('ROI PGN Viewer - Normalized PGN:', pgn);
				try {
					boardAPI.loadPgn(pgn);
					console.warn('ROI PGN Viewer - PGN loaded successfully.');
				} catch (e) {
					console.error('ROI PGN Viewer - Error loading PGN:', e);
				}
			} else {
				console.warn('ROI PGN Viewer - PGN is empty.');
			}

			renderMovesList();
			setupControls();

			// Listen for direct textarea changes to reload PGN
			pgnTextarea.addEventListener('input', function () {
				let newPgn = pgnTextarea.value.trim();
				newPgn = decodeHTMLEntities(newPgn);
				newPgn = newPgn.replace(/[\s\u00a0]+/g, ' ');
				try {
					boardAPI.loadPgn(newPgn);
					renderMovesList();
					updateActiveMove();
				} catch (e) {
					console.error('Error reloading PGN:', e);
				}
			});
		}

		function renderMovesList() {
			const movesList = document.getElementById('roi-moves-list');
			if (!movesList) {
				return;
			}

			const history = boardAPI.getHistory(true);
			if (!history || history.length === 0) {
				movesList.innerHTML =
					'<span style="color: #646970; font-style: italic;">Aucun coup disponible</span>';
				return;
			}

			let html = '';
			let moveNum = 1;
			for (let i = 0; i < history.length; i++) {
				const move = history[i];
				if (i % 2 === 0) {
					html +=
						'<span class="roi-move-num" style="font-weight: bold; color: #50575e; margin-left: 4px;">' +
						moveNum +
						'.</span> ';
					moveNum++;
				}

				html +=
					'<span class="roi-move-item" data-ply="' +
					(i + 1) +
					'" style="cursor: pointer; padding: 2px 6px; border-radius: 3px; user-select: none; transition: background 0.2s;">' +
					move.san +
					'</span> ';
			}

			movesList.innerHTML = html;

			// Bind click events on moves
			const moveItems = movesList.querySelectorAll('.roi-move-item');
			moveItems.forEach(function (item) {
				item.addEventListener('click', function () {
					const ply = parseInt(this.getAttribute('data-ply'), 10);
					boardAPI.viewHistory(ply);
					updateActiveMove();
				});
			});

			updateActiveMove();
		}

		function updateActiveMove() {
			const movesList = document.getElementById('roi-moves-list');
			const moveInfo = document.getElementById('roi-move-info');
			if (!movesList || !moveInfo) {
				return;
			}

			let historyState = null;
			if (typeof boardAPI.getHistoryViewerState === 'function') {
				historyState = boardAPI.getHistoryViewerState();
			} else if (typeof boardAPI.getState === 'function') {
				historyState = boardAPI.getState().historyViewerState;
			}

			let currentPly = 0;
			if (
				historyState &&
				historyState.isEnabled &&
				historyState.plyViewing !== undefined
			) {
				currentPly = historyState.plyViewing;
			} else {
				currentPly = boardAPI.getCurrentPlyNumber();
			}

			// Highlight the active move
			const moveItems = movesList.querySelectorAll('.roi-move-item');
			moveItems.forEach(function (item) {
				const ply = parseInt(item.getAttribute('data-ply'), 10);
				if (ply === currentPly) {
					item.style.backgroundColor = '#2271b1';
					item.style.color = '#fff';
					item.style.fontWeight = 'bold';
				} else {
					item.style.backgroundColor = 'transparent';
					item.style.color = 'inherit';
					item.style.fontWeight = 'normal';
				}
			});

			// Update move info banner
			const history = boardAPI.getHistory(true);
			if (currentPly === 0) {
				moveInfo.textContent = 'Position de départ';
			} else if (history && history[currentPly - 1]) {
				const lastMove = history[currentPly - 1];
				const moveIndex = Math.ceil(currentPly / 2);
				const dotStr = currentPly % 2 === 1 ? '.' : '...';
				moveInfo.textContent =
					'Coup : ' + moveIndex + dotStr + lastMove.san;
			}
		}

		function setupControls() {
			const prevStartBtn = document.getElementById('roi-prev-start-btn');
			const prevBtn = document.getElementById('roi-prev-btn');
			const nextBtn = document.getElementById('roi-next-btn');
			const nextEndBtn = document.getElementById('roi-next-end-btn');

			if (prevStartBtn) {
				prevStartBtn.addEventListener('click', function () {
					boardAPI.viewStart();
					updateActiveMove();
				});
			}

			if (prevBtn) {
				prevBtn.addEventListener('click', function () {
					boardAPI.viewPrevious();
					updateActiveMove();
				});
			}

			if (nextBtn) {
				nextBtn.addEventListener('click', function () {
					boardAPI.viewNext();
					updateActiveMove();
				});
			}

			if (nextEndBtn) {
				nextEndBtn.addEventListener('click', function () {
					boardAPI.stopViewingHistory();
					updateActiveMove();
				});
			}
		}
	});
})();
