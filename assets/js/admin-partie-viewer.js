(function() {
    document.addEventListener("DOMContentLoaded", function() {
        var block = document.getElementById("roi-partie-viewer-chessboard");
        var pgnTextarea = document.getElementById("roi_pgn");

        if (!block || !pgnTextarea) return;

        var boardAPI;
        // Poll for boardAPI initialization on the block element
        var checkInterval = setInterval(function() {
            if (block.boardAPI) {
                clearInterval(checkInterval);
                boardAPI = block.boardAPI;
                initViewer();
            }
        }, 50);

        function decodeHTMLEntities(text) {
            var textArea = document.createElement("textarea");
            textArea.innerHTML = text;
            return textArea.value;
        }

        function initViewer() {
            // Load the PGN initially
            var pgn = pgnTextarea.value.trim();
            console.log("ROI PGN Viewer - Raw PGN from textarea:", pgn);
            if (pgn) {
                pgn = decodeHTMLEntities(pgn);
                // Replace all types of whitespaces (newlines, tabs, non-breaking spaces) with a single space
                pgn = pgn.replace(/[\s\u00a0]+/g, " ");
                console.log("ROI PGN Viewer - Normalized PGN:", pgn);
                try {
                    boardAPI.loadPgn(pgn);
                    console.log("ROI PGN Viewer - PGN loaded successfully.");
                } catch (e) {
                    console.error("ROI PGN Viewer - Error loading PGN:", e);
                }
            } else {
                console.log("ROI PGN Viewer - PGN is empty.");
            }

            renderMovesList();
            setupControls();

            // Listen for direct textarea changes to reload PGN
            pgnTextarea.addEventListener("input", function() {
                var newPgn = pgnTextarea.value.trim();
                newPgn = decodeHTMLEntities(newPgn);
                newPgn = newPgn.replace(/[\s\u00a0]+/g, " ");
                try {
                    boardAPI.loadPgn(newPgn);
                    renderMovesList();
                    updateActiveMove();
                } catch (e) {
                    console.error("Error reloading PGN:", e);
                }
            });
        }

        function renderMovesList() {
            var movesList = document.getElementById("roi-moves-list");
            if (!movesList) return;

            var history = boardAPI.getHistory(true);
            if (!history || history.length === 0) {
                movesList.innerHTML = '<span style="color: #646970; font-style: italic;">Aucun coup disponible</span>';
                return;
            }

            var html = "";
            var moveNum = 1;
            for (var i = 0; i < history.length; i++) {
                var move = history[i];
                if (i % 2 === 0) {
                    html += '<span class="roi-move-num" style="font-weight: bold; color: #50575e; margin-left: 4px;">' + moveNum + '.</span> ';
                    moveNum++;
                }
                
                html += '<span class="roi-move-item" data-ply="' + (i + 1) + '" style="cursor: pointer; padding: 2px 6px; border-radius: 3px; user-select: none; transition: background 0.2s;">' + move.san + '</span> ';
            }

            movesList.innerHTML = html;

            // Bind click events on moves
            var moveItems = movesList.querySelectorAll(".roi-move-item");
            moveItems.forEach(function(item) {
                item.addEventListener("click", function() {
                    var ply = parseInt(this.getAttribute("data-ply"), 10);
                    boardAPI.viewHistory(ply);
                    updateActiveMove();
                });
            });

            updateActiveMove();
        }

        function updateActiveMove() {
            var movesList = document.getElementById("roi-moves-list");
            var moveInfo = document.getElementById("roi-move-info");
            if (!movesList || !moveInfo) return;

            var currentPly = 0;
            // Check if we are currently viewing history
            if (boardAPI.boardState && boardAPI.boardState.historyViewerState && boardAPI.boardState.historyViewerState.isEnabled) {
                currentPly = boardAPI.boardState.historyViewerState.plyViewing;
            } else {
                currentPly = boardAPI.getCurrentPlyNumber();
            }

            // Highlight the active move
            var moveItems = movesList.querySelectorAll(".roi-move-item");
            moveItems.forEach(function(item) {
                var ply = parseInt(item.getAttribute("data-ply"), 10);
                if (ply === currentPly) {
                    item.style.backgroundColor = "#2271b1";
                    item.style.color = "#fff";
                    item.style.fontWeight = "bold";
                } else {
                    item.style.backgroundColor = "transparent";
                    item.style.color = "inherit";
                    item.style.fontWeight = "normal";
                }
            });

            // Update move info banner
            var history = boardAPI.getHistory(true);
            if (currentPly === 0) {
                moveInfo.textContent = "Position de départ";
            } else if (history && history[currentPly - 1]) {
                var lastMove = history[currentPly - 1];
                var moveIndex = Math.ceil(currentPly / 2);
                var dotStr = (currentPly % 2 === 1) ? "." : "...";
                moveInfo.textContent = "Coup : " + moveIndex + dotStr + lastMove.san;
            }
        }

        function setupControls() {
            var prevStartBtn = document.getElementById("roi-prev-start-btn");
            var prevBtn = document.getElementById("roi-prev-btn");
            var nextBtn = document.getElementById("roi-next-btn");
            var nextEndBtn = document.getElementById("roi-next-end-btn");

            if (prevStartBtn) {
                prevStartBtn.addEventListener("click", function() {
                    boardAPI.viewStart();
                    updateActiveMove();
                });
            }

            if (prevBtn) {
                prevBtn.addEventListener("click", function() {
                    boardAPI.viewPrevious();
                    updateActiveMove();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener("click", function() {
                    var currentPly = 0;
                    if (boardAPI.boardState && boardAPI.boardState.historyViewerState && boardAPI.boardState.historyViewerState.isEnabled) {
                        currentPly = boardAPI.boardState.historyViewerState.plyViewing;
                    } else {
                        currentPly = boardAPI.getCurrentPlyNumber();
                    }
                    var history = boardAPI.getHistory(true);
                    if (currentPly < history.length) {
                        boardAPI.viewHistory(currentPly + 1);
                    }
                    updateActiveMove();
                });
            }

            if (nextEndBtn) {
                nextEndBtn.addEventListener("click", function() {
                    boardAPI.stopViewingHistory();
                    updateActiveMove();
                });
            }
        }
    });
})();
