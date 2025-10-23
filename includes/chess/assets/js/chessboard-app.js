// Fonction pour charger dynamiquement cm-chessboard
async function loadChessboard() {
    const module = await import(chessEngineData.chessboardSrc);
    return module;
}

// Fonction pour charger l'extension Markers
async function loadMarkersExtension() {
    const module = await import(chessEngineData.chessboardSrc.replace('Chessboard.js', 'extensions/markers/Markers.js'));
    return module;
}

// Fonction pour charger l'extension Arrows
async function loadArrowsExtension() {
    const module = await import(chessEngineData.chessboardSrc.replace('Chessboard.js', 'extensions/arrows/Arrows.js'));
    return module;
}

// Fonction pour charger l'extension PromotionDialog
async function loadPromotionDialogExtension() {
    const module = await import(chessEngineData.chessboardSrc.replace('Chessboard.js', 'extensions/promotion-dialog/PromotionDialog.js'));
    return module;
}

// Fonction pour charger l'extension RightClickAnnotator
async function loadRightClickAnnotatorExtension() {
    const module = await import(chessEngineData.chessboardSrc.replace('Chessboard.js', 'extensions/right-click-annotator/RightClickAnnotator.js'));
    return module;
}

// Fonction pour charger dynamiquement chess.js
async function loadChessJs() {
    const module = await import(chessEngineData.chessJsSrc);
    return module;
}

class ChessEngineApp {
    constructor(containerElement) {
        this.container = containerElement;
        this.boardId = containerElement.id;
        this.initialFen = containerElement.dataset.fen;
        this.orientation = containerElement.dataset.orientation;
        this.engineElo = parseInt(containerElement.dataset.engineElo) || 1200;
        this.enableEngine = containerElement.dataset.enableEngine === 'true';
        this.enableMoves = containerElement.dataset.enableMoves !== 'false';
        this.borderType = containerElement.dataset.borderType || 'frame';
        this.showCoordinates = containerElement.dataset.showCoordinates !== 'false';
        this.pieces = containerElement.dataset.pieces || 'standard';
        this.cssClass = containerElement.dataset.cssClass || 'chessboard-js';

        this.Chess = null;
        this.chess = null;
        this.board = null;
        this.stockfish = null;
        this.engineThinking = false;
        this.stockfishReady = false;
        this.COLOR = null;
        this.INPUT_EVENT_TYPE = null;
        this.ARROW_TYPE = null;
        this.lastMoveArrow = null;

        // Éléments du dialogue
        this.configDialog = null;
        this.selectedColor = this.orientation;
        this.selectedLevel = this.engineLevel;

        this.init();
    }

    async init() {
        try {
            // Charger chess.js
            const chessJsModule = await loadChessJs();
            this.Chess = chessJsModule.Chess;

            // Charger cm-chessboard
            const chessboardModule = await loadChessboard();
            this.COLOR = chessboardModule.COLOR;
            this.INPUT_EVENT_TYPE = chessboardModule.INPUT_EVENT_TYPE;
            const Chessboard = chessboardModule.Chessboard;
            const BORDER_TYPE = chessboardModule.BORDER_TYPE;

            // Charger les extensions
            const markersModule = await loadMarkersExtension();
            const Markers = markersModule.Markers;

            const arrowsModule = await loadArrowsExtension();
            const Arrows = arrowsModule.Arrows;
            this.ARROW_TYPE = arrowsModule.ARROW_TYPE;

            const promotionModule = await loadPromotionDialogExtension();
            const PromotionDialog = promotionModule.PromotionDialog;

            const rightClickModule = await loadRightClickAnnotatorExtension();
            const RightClickAnnotator = rightClickModule.RightClickAnnotator;

            // Initialiser chess.js
            if (this.enableEngine) {
                // Mode avec moteur : validation stricte
                this.chess = new this.Chess(this.initialFen);
            } else if (this.enableMoves) {
                // Mode exercice libre : désactiver la validation pour permettre des positions incomplètes
                this.chess = new this.Chess(this.initialFen, { skipValidation: true });
            } else {
                // Mode démonstration : pas de validation nécessaire
                this.chess = new this.Chess(this.initialFen, { skipValidation: true });
            }

            // Déterminer la couleur du joueur
            const orientation = this.orientation === 'black' ? this.COLOR.black : this.COLOR.white;

            // Initialiser Stockfish seulement si activé
            if (this.enableEngine) {
                await this.initStockfish();
            }

            // Créer l'échiquier avec toutes les extensions
            this.board = new Chessboard(this.container, {
                position: this.initialFen,
                responsive: true,
                assetsUrl: chessEngineData.assetsUrl,
                style: {
                    borderType: BORDER_TYPE[this.borderType] || BORDER_TYPE.none,
                    pieces: {
                        file: `pieces/${this.pieces}.svg`
                    },
                    cssClass: this.cssClass,
                    showCoordinates: this.showCoordinates
                },
                orientation: orientation,
                extensions: [
                    {
                        class: Markers,
                        props: {
                            autoMarkers: false
                        }
                    },
                    {
                        class: Arrows,
                        props: {
                            autoArrows: false
                        }
                    },
                    {
                        class: PromotionDialog,
                        props: {}
                    },
                    {
                        class: RightClickAnnotator,
                        props: {}
                    }
                ]
            });

            // Initialiser le dialogue de configuration (seulement si moteur activé)
            if (this.enableEngine) {
                this.initConfigDialog();
            }

            // Initialiser les contrôles
            this.initControls();

            // Afficher le dialogue au démarrage si moteur activé
            if (this.enableEngine) {
                setTimeout(() => {
                    this.showConfigDialog();
                }, 100);
            } else {
                // Mode démonstration/leçon : activer les mouvements si autorisé
                if (this.enableMoves) {
                    // Ne pas spécifier de couleur pour permettre de bouger les deux camps
                    this.board.enableMoveInput(this.inputHandlerFreeMode.bind(this));
                    this.updateStatus('Vous pouvez déplacer les pièces librement');
                }
                // Sinon, l'échiquier reste en mode lecture seule
            }

        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            if (this.enableEngine || this.enableMoves) {
                this.updateStatus('Erreur de chargement: ' + error.message, 'error');
            }
        }
    }

    initConfigDialog() {
        this.configDialog = this.container.parentElement.querySelector('.chess-config-dialog');

        if (!this.configDialog) return;

        // Gestion des boutons de couleur
        const colorButtons = this.configDialog.querySelectorAll('.color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                colorButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedColor = btn.dataset.color;
            });
        });

        // Sélectionner la couleur par défaut
        const defaultColorBtn = this.configDialog.querySelector(`[data-color="${this.orientation}"]`);
        if (defaultColorBtn) {
            defaultColorBtn.classList.add('selected');
        }

        // Gestion du slider de niveau
        const levelSlider = this.configDialog.querySelector('.chess-level-slider');
        const levelValue = this.configDialog.querySelector('.level-value');

        if (levelSlider && levelValue) {
            const initialElo = parseInt(levelSlider.value);
            levelValue.textContent = initialElo;
            this.selectedElo = initialElo;

            levelSlider.addEventListener('input', (e) => {
                this.selectedElo = parseInt(e.target.value);
                levelValue.textContent = this.selectedElo;
            });
        }

        // Bouton démarrer
        const startBtn = this.configDialog.querySelector('.chess-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startNewGame();
            });
        }
    }

    showConfigDialog() {
        if (this.configDialog) {
            this.configDialog.classList.remove('hidden');
        }
    }

    hideConfigDialog() {
        if (this.configDialog) {
            this.configDialog.classList.add('hidden');
        }
    }

    startNewGame() {
        // Déterminer la couleur finale
        let finalColor = this.selectedColor;
        if (finalColor === 'random') {
            finalColor = Math.random() < 0.5 ? 'white' : 'black';
        }

        this.orientation = finalColor;
        this.engineElo = this.selectedElo;

        // Mettre à jour le niveau de Stockfish
        if (this.stockfish) {
            this.stockfish.postMessage('setoption name UCI_LimitStrength value true');
            this.stockfish.postMessage(`setoption name UCI_Elo value ${this.engineElo}`);
            this.stockfish.postMessage('ucinewgame');
            this.stockfish.postMessage('isready');
        }

        // Réinitialiser la partie
        this.chess.reset();
        if (this.initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            this.chess.load(this.initialFen);
        }

        // Mettre à jour l'orientation de l'échiquier
        const orientation = this.orientation === 'black' ? this.COLOR.black : this.COLOR.white;

        if (this.board) {
            // IMPORTANT: Désactiver d'abord l'input avant de le réactiver
            this.board.disableMoveInput();

            this.board.setOrientation(orientation);
            this.board.setPosition(this.chess.fen(), true);
            this.board.removeLegalMovesMarkers();
            this.board.removeArrows();
            this.board.removeMarkers();
            this.lastMoveArrow = null;

            // Réactiver l'input avec la bonne orientation
            this.board.enableMoveInput(this.inputHandler.bind(this), orientation);
        }

        this.engineThinking = false;

        // Cacher le dialogue
        this.hideConfigDialog();

        // Afficher le statut et démarrer
        if (this.orientation === 'black') {
            this.updateStatus(chessEngineData.translations.engineThinking, 'thinking');
            setTimeout(() => {
                if (!this.engineThinking) {
                    this.makeEngineMove();
                }
            }, 500);
        } else {
            this.updateStatus(chessEngineData.translations.yourTurn);
        }
    }

    async initStockfish() {
        return new Promise((resolve, reject) => {
            try {
                this.stockfish = new Worker(chessEngineData.stockfishPath);

                this.stockfish.onmessage = (event) => {
                    const message = event.data;

                    if (message === 'readyok' && !this.stockfishReady) {
                        this.stockfishReady = true;
                        resolve();
                    }

                    if (message.startsWith('bestmove')) {
                        const match = message.match(/bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
                        if (match) {
                            const from = match[1];
                            const to = match[2];
                            const promotion = match[3];

                            setTimeout(() => {
                                this.makeMove(from, to, promotion);
                                this.engineThinking = false;

                                if (!this.chess.isGameOver()) {
                                    this.updateStatus(chessEngineData.translations.yourTurn);
                                }
                            }, 300);
                        } else {
                            this.engineThinking = false;
                            this.updateStatus(chessEngineData.translations.yourTurn);
                        }
                    }
                };

                this.stockfish.onerror = (error) => {
                    console.error('Erreur Stockfish:', error);
                    this.engineThinking = false;
                    reject(error);
                };

                this.stockfish.postMessage('uci');
                this.stockfish.postMessage('setoption name UCI_LimitStrength value true');
                this.stockfish.postMessage(`setoption name UCI_Elo value ${this.engineElo}`);
                this.stockfish.postMessage('setoption name Move Overhead value 100');
                this.stockfish.postMessage('ucinewgame');
                this.stockfish.postMessage('isready');

                setTimeout(() => {
                    if (!this.stockfishReady) {
                        reject(new Error('Timeout: Stockfish ne répond pas'));
                    }
                }, 5000);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Input handler pour le mode libre (exercice)
    inputHandlerFreeMode(event) {
        if (event.type === this.INPUT_EVENT_TYPE.moveInputStarted) {
            return true;
        } else if (event.type === this.INPUT_EVENT_TYPE.validateMoveInput) {
            const piece = this.chess.get(event.squareFrom);
            if (!piece) return false;

            // Handle promotion
            const isPromotion = piece.type === 'p' &&
                ((piece.color === 'w' && event.squareTo[1] === '8') ||
                    (piece.color === 'b' && event.squareTo[1] === '1'));

            if (isPromotion) {
                this.board.showPromotionDialog(event.squareTo, piece.color, (result) => {
                    if (result) {
                        this.chess.remove(event.squareFrom);
                        this.chess.put({ type: result.piece.charAt(1), color: piece.color }, event.squareTo);
                        this.board.setPosition(this.chess.fen());
                    } else {
                        // Promotion cancelled
                        this.board.setPosition(this.chess.fen());
                    }
                });
            } else {
                this.chess.remove(event.squareFrom);
                this.chess.put(piece, event.squareTo);
            }
            return true;
        } else if (event.type === this.INPUT_EVENT_TYPE.moveInputFinished) {
            // Synchronize the board with the final state from chess.js
            this.board.setPosition(this.chess.fen());
        }
    }

    // Input handler pour le mode avec moteur
    inputHandler(event) {
        if (this.engineThinking) {
            return false;
        }

        if (event.type === this.INPUT_EVENT_TYPE.movingOverSquare) {
            return;
        }

        if (event.type === this.INPUT_EVENT_TYPE.moveInputStarted) {
            const moves = this.chess.moves({ square: event.squareFrom, verbose: true });
            this.board.addLegalMovesMarkers(moves);
            this.removeLastMoveArrow();
            return moves.length > 0;
        }

        if (event.type === this.INPUT_EVENT_TYPE.validateMoveInput) {
            const piece = this.chess.get(event.squareFrom);
            const isPromotion = piece && piece.type === 'p' &&
                               ((piece.color === 'w' && event.squareTo[1] === '8') ||
                                (piece.color === 'b' && event.squareTo[1] === '1'));

            if (isPromotion) {
                return new Promise((resolve) => {
                    this.board.showPromotionDialog(event.squareTo, piece.color, (result) => {
                        if (result) {
                            const move = this.chess.move({
                                from: event.squareFrom,
                                to: event.squareTo,
                                promotion: result.piece.charAt(1)
                            });
                            resolve(!!move);
                        } else {
                            resolve(false);
                        }
                    });
                });
            } else {
                const move = this.chess.move({
                    from: event.squareFrom,
                    to: event.squareTo
                });
                return !!move;
            }
        }

        if (event.type === this.INPUT_EVENT_TYPE.moveInputFinished) {
            this.board.removeLegalMovesMarkers();

            if (event.legalMove) {
                this.checkGameStatus();

                if (!this.chess.isGameOver()) {
                    setTimeout(() => this.makeEngineMove(), 200);
                }
            }
        }

        if (event.type === this.INPUT_EVENT_TYPE.moveInputCanceled) {
            this.board.removeLegalMovesMarkers();
        }
    }

    removeLastMoveArrow() {
        if (this.lastMoveArrow) {
            this.board.removeArrows(this.ARROW_TYPE.default, this.lastMoveArrow.from, this.lastMoveArrow.to);
            this.lastMoveArrow = null;
        }
    }

    syncStockfishPosition() {
        if (!this.stockfish) {
            return;
        }

        this.stockfish.postMessage('ucinewgame');

        const moves = this.chess.history({ verbose: true });

        if (moves.length > 0) {
            const movesList = moves.map(move => {
                return move.from + move.to + (move.promotion || '');
            });

            if (this.initialFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
                this.stockfish.postMessage(`position startpos moves ${movesList.join(' ')}`);
            } else {
                this.stockfish.postMessage(`position fen ${this.initialFen} moves ${movesList.join(' ')}`);
            }
        } else {
            if (this.initialFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
                this.stockfish.postMessage('position startpos');
            } else {
                this.stockfish.postMessage(`position fen ${this.initialFen}`);
            }
        }

        this.stockfish.postMessage('isready');
    }

    makeEngineMove() {
        if (!this.stockfish || this.engineThinking) {
            return;
        }

        this.engineThinking = true;
        this.updateStatus(chessEngineData.translations.engineThinking, 'thinking');

        this.syncStockfishPosition();
        this.stockfish.postMessage('go depth 12');
    }

    makeMove(from, to, promotion) {
        const move = this.chess.move({
            from: from,
            to: to,
            promotion: promotion || 'q'
        });

        if (move) {
            this.removeLastMoveArrow();
            this.board.setPosition(this.chess.fen(), true);
            this.board.addArrow(this.ARROW_TYPE.default, from, to);
            this.lastMoveArrow = { from: from, to: to };

            setTimeout(() => {
                this.removeLastMoveArrow();
            }, 2000);

            this.checkGameStatus();
        } else {
            console.error('Coup invalide du moteur:', from, to, promotion);
            this.engineThinking = false;
            this.updateStatus('Erreur: coup invalide du moteur');
        }
    }

    checkGameStatus() {
        // En mode libre, ne pas désactiver l'échiquier
        if (!this.enableEngine) {
            return;
        }

        if (this.chess.isCheckmate()) {
            const winner = this.chess.turn() === 'w' ? 'Noirs' : 'Blancs';
            this.updateStatus(`${chessEngineData.translations.checkmate} ${winner} gagnent!`, 'checkmate');
            this.board.disableMoveInput();
        } else if (this.chess.isDraw() || this.chess.isStalemate()) {
            const message = this.chess.isStalemate() ?
                chessEngineData.translations.stalemate :
                chessEngineData.translations.draw;
            this.updateStatus(message, 'draw');
            this.board.disableMoveInput();
        } else if (this.chess.isCheck()) {
            const currentPlayer = this.chess.turn() === 'w' ? 'Blancs' : 'Noirs';
            this.updateStatus(`Échec aux ${currentPlayer}!`, 'check');
        }
    }

    updateStatus(message, className = '') {
        const statusElement = this.container.parentElement.querySelector('.chess-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'chess-status ' + className;
        }
    }

    initControls() {
        const container = this.container.parentElement;

        const resetBtn = container.querySelector('[data-action="reset"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.enableEngine) {
                    this.showConfigDialog();
                }
            });
        }

        const flipBtn = container.querySelector('[data-action="flip"]');
        if (flipBtn) {
            flipBtn.addEventListener('click', () => {
                this.board.setOrientation(
                    this.board.getOrientation() === this.COLOR.white ? this.COLOR.black : this.COLOR.white
                );
            });
        }

        const undoBtn = container.querySelector('[data-action="undo"]');
        if (undoBtn && this.enableMoves) {
            undoBtn.addEventListener('click', () => {
                if (this.engineThinking) {
                    return;
                }

                const historyLength = this.chess.history().length;

                if (this.enableEngine && historyLength >= 2) {
                    // Mode avec moteur : annuler 2 coups
                    this.chess.undo();
                    this.chess.undo();
                } else if (historyLength >= 1) {
                    // Mode sans moteur : annuler 1 coup
                    this.chess.undo();
                } else {
                    return;
                }

                this.removeLastMoveArrow();

                const currentFen = this.chess.fen();
                this.board.setPosition(currentFen, true);
                this.board.removeLegalMovesMarkers();

                if (this.enableEngine) {
                    this.syncStockfishPosition();
                }

                if (this.enableMoves) {
                    this.board.disableMoveInput();
                    if (this.enableEngine) {
                        const orientation = this.orientation === 'black' ? this.COLOR.black : this.COLOR.white;
                        this.board.enableMoveInput(this.inputHandler.bind(this), orientation);
                    } else {
                        this.board.enableMoveInput(this.inputHandlerFreeMode.bind(this));
                    }
                }

                if (this.chess.isGameOver()) {
                    this.updateStatus('Partie terminée');
                } else if (this.enableEngine) {
                    this.updateStatus(chessEngineData.translations.yourTurn);
                } else {
                    this.updateStatus('Vous pouvez déplacer les pièces librement');
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chessboards = document.querySelectorAll('[id^="chessboard-"]');
    chessboards.forEach(board => {
        new ChessEngineApp(board);
    });
});
