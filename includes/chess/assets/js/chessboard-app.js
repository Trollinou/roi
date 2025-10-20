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
        this.playerColor = containerElement.dataset.playerColor;
        this.engineLevel = parseInt(containerElement.dataset.engineLevel) || 10;
        this.enableEngine = containerElement.dataset.enableEngine === 'true';
        this.enableMoves = containerElement.dataset.enableMoves === 'true';
        this.borderType = containerElement.dataset.borderType || 'none';
        this.pieces = containerElement.dataset.pieces || 'standard';
        this.cssClass = containerElement.dataset.cssClass || 'green';

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
        this.selectedColor = this.playerColor;
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
            const orientation = this.playerColor === 'black' ? this.COLOR.black : this.COLOR.white;

            // Initialiser Stockfish seulement si activé
            if (this.enableEngine) {
                await this.initStockfish();
            }

            // Créer l'échiquier avec toutes les extensions
            this.board = new Chessboard(this.container, {
                position: this.initialFen,
                assetsUrl: chessEngineData.assetsUrl,
                style: {
                    borderType: BORDER_TYPE[this.borderType.toUpperCase()],
                    pieces: {
                        file: `pieces/${this.pieces}.svg`
                    },
                    cssClass: this.cssClass
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
        const defaultColorBtn = this.configDialog.querySelector(`[data-color="${this.playerColor}"]`);
        if (defaultColorBtn) {
            defaultColorBtn.classList.add('selected');
        }

        // Gestion du slider de niveau
        const levelSlider = this.configDialog.querySelector('.chess-level-slider');
        const levelValue = this.configDialog.querySelector('.level-value');

        if (levelSlider && levelValue) {
            levelSlider.value = this.engineLevel;
            levelValue.textContent = this.engineLevel;

            levelSlider.addEventListener('input', (e) => {
                this.selectedLevel = parseInt(e.target.value);
                levelValue.textContent = this.selectedLevel;
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

        this.playerColor = finalColor;
        this.engineLevel = this.selectedLevel;

        // Mettre à jour le niveau de Stockfish
        if (this.stockfish) {
            this.stockfish.postMessage(`setoption name Skill Level value ${this.engineLevel}`);
            this.stockfish.postMessage('ucinewgame');
            this.stockfish.postMessage('isready');
        }

        // Réinitialiser la partie
        this.chess.reset();
        if (this.initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            this.chess.load(this.initialFen);
        }

        // Mettre à jour l'orientation de l'échiquier
        const orientation = this.playerColor === 'black' ? this.COLOR.black : this.COLOR.white;

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
        if (this.playerColor === 'black') {
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
                this.stockfish.postMessage(`setoption name Skill Level value ${this.engineLevel}`);
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
        if (event.type === this.INPUT_EVENT_TYPE.movingOverSquare) {
            return;
        }

        if (event.type === this.INPUT_EVENT_TYPE.moveInputStarted) {
            // En mode libre, afficher tous les mouvements possibles sans vérifier le tour
            const piece = this.chess.get(event.squareFrom);

            if (!piece) {
                return false; // Pas de pièce sur cette case
            }

            // Calculer les mouvements possibles pour cette pièce en forçant son tour
            const currentTurn = this.chess.turn();

            // Forcer temporairement le tour pour cette couleur si nécessaire
            if (piece.color !== currentTurn) {
                // Modifier temporairement le FEN pour changer le tour
                const fen = this.chess.fen();
                const fenParts = fen.split(' ');
                fenParts[1] = piece.color; // Changer le tour actif
                const modifiedFen = fenParts.join(' ');

                try {
                    this.chess.load(modifiedFen, { skipValidation: true });
                } catch (e) {
                    console.error('Erreur chargement FEN:', e);
                    return false;
                }
            }

            const moves = this.chess.moves({ square: event.squareFrom, verbose: true });
            this.board.addLegalMovesMarkers(moves);

            // Restaurer le FEN original si on l'avait modifié
            if (piece.color !== currentTurn) {
                const fen = this.chess.fen();
                const fenParts = fen.split(' ');
                fenParts[1] = currentTurn; // Restaurer le tour original
                const restoredFen = fenParts.join(' ');
                this.chess.load(restoredFen, { skipValidation: true });
            }

            return moves.length > 0;
        }

        if (event.type === this.INPUT_EVENT_TYPE.validateMoveInput) {
            const piece = this.chess.get(event.squareFrom);

            if (!piece) {
                return false;
            }

            // Vérifier si c'est une promotion
            const isPromotion = piece.type === 'p' &&
                               ((piece.color === 'w' && event.squareTo[1] === '8') ||
                                (piece.color === 'b' && event.squareTo[1] === '1'));

            if (isPromotion) {
                // Gestion spéciale de la promotion en mode libre
                const pieceColor = piece.color;
                const boardColor = pieceColor === 'w' ? this.COLOR.white : this.COLOR.black;

                // Sauvegarder la position actuelle
                const currentPosition = this.chess.fen();

                return new Promise((resolve) => {
                    this.board.showPromotionDialog(event.squareTo, boardColor, (result) => {
                        if (result && result.piece) {
                            // Forcer le tour si nécessaire
                            const currentTurn = this.chess.turn();

                            if (pieceColor !== currentTurn) {
                                const fen = this.chess.fen();
                                const fenParts = fen.split(' ');
                                fenParts[1] = pieceColor;
                                const modifiedFen = fenParts.join(' ');
                                this.chess.load(modifiedFen, { skipValidation: true });
                            }

                            // Extraire le type de pièce (enlever la couleur)
                            // result.piece est au format "wq", "bq", etc.
                            const promotionPieceType = result.piece.type || result.piece.charAt(1);

                            // Effectuer le mouvement avec promotion
                            const move = this.chess.move({
                                from: event.squareFrom,
                                to: event.squareTo,
                                promotion: promotionPieceType
                            });

                            if (move) {
                                // Mettre à jour l'affichage avec la nouvelle position
                                this.board.setPosition(this.chess.fen(), true);
                                resolve(true);
                            } else {
                                // Si le mouvement échoue, utiliser la méthode directe
                                console.warn('Mouvement échoué, utilisation de setPiece');
                                this.board.setPiece(event.squareTo, result.piece, true);

                                // Mettre à jour chess.js manuellement
                                try {
                                    // Retirer le pion de la case de départ
                                    const newFen = this.chess.fen().replace(event.squareFrom, '');
                                    this.chess.load(newFen, { skipValidation: true });
                                } catch (e) {
                                    console.error('Erreur mise à jour FEN:', e);
                                }

                                resolve(true);
                            }
                        } else {
                            // Annulation de la promotion
                            this.chess.load(currentPosition, { skipValidation: true });
                            this.board.setPosition(currentPosition);
                            resolve(false);
                        }
                    });
                });
            } else {
                // Mouvement normal (pas de promotion)
                const currentTurn = this.chess.turn();

                // Forcer temporairement le tour pour permettre le mouvement
                if (piece.color !== currentTurn) {
                    const fen = this.chess.fen();
                    const fenParts = fen.split(' ');
                    fenParts[1] = piece.color;
                    const modifiedFen = fenParts.join(' ');

                    try {
                        this.chess.load(modifiedFen, { skipValidation: true });
                    } catch (e) {
                        console.error('Erreur chargement FEN:', e);
                        return false;
                    }
                }

                const move = this.chess.move({
                    from: event.squareFrom,
                    to: event.squareTo
                });

                if (move) {
                    // Mettre à jour l'affichage avec la nouvelle position
                    this.board.setPosition(this.chess.fen(), true);
                    return true;
                }

                return false;
            }
        }

        if (event.type === this.INPUT_EVENT_TYPE.moveInputFinished) {
            this.board.removeLegalMovesMarkers();

            if (event.legalMove) {
                // Réactiver l'input pour continuer à jouer
                setTimeout(() => {
                    try {
                        this.board.disableMoveInput();
                        this.board.enableMoveInput(this.inputHandlerFreeMode.bind(this));
                    } catch (e) {
                        console.error('Erreur réactivation input:', e);
                    }
                }, 100);
            }
        }

        if (event.type === this.INPUT_EVENT_TYPE.moveInputCanceled) {
            this.board.removeLegalMovesMarkers();
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
                                promotion: result.piece.type
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
                        const orientation = this.playerColor === 'black' ? this.COLOR.black : this.COLOR.white;
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
