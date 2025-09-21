document.addEventListener('DOMContentLoaded', function () {
    if (typeof Chess === 'undefined' || typeof Chessboard === 'undefined') {
        console.error("Les bibliothèques Chess.js ou Chessboard.js ne sont pas chargées.");
        return;
    }

    var board = null;
    var game = new Chess();
    var stockfish = new Worker(wpsStockfishData.plugin_url + 'js/stockfish.js');
    
    var statusEl = document.getElementById('status');
    
    function onDragStart(source, piece, position, orientation) {
        if (game.game_over()) return false;
        if (game.turn() !== 'w' || piece.search(/^b/) !== -1) {
            return false;
        }
    }

    function getBestMove() {
        if (!game.game_over()) {
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 2');
        }
    }

    stockfish.onmessage = function (event) {
        var message = event.data;
        if (message && message.includes('bestmove')) {
            var bestMove = message.split(' ')[1];
            game.move(bestMove, { sloppy: true });
            board.position(game.fen());
            updateStatus();
        }
    };

    function onDrop(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        updateStatus();

        window.setTimeout(function () {
            getBestMove();
        }, 500);
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateStatus() {
        var status = '';
        var moveColor = game.turn() === 'w' ? 'Blancs' : 'Noirs';

        if (game.in_checkmate()) {
            status = 'Échec et mat ! Les ' + (moveColor === 'Blancs' ? 'Noirs' : 'Blancs') + ' ont gagné.';
        } else if (game.in_draw()) {
            status = 'Partie nulle.';
        } else {
            status = 'Au tour des ' + moveColor;
            if (game.in_check()) {
                status += ', les ' + moveColor + ' sont en échec.';
            }
        }
        statusEl.innerHTML = status;
    }

    var config = {
        draggable: true,
        position: 'start',
        // --- LIGNE MODIFIÉE ---
        // On utilise l'URL de notre plugin pour construire le chemin vers les images locales.
        pieceTheme: wpsStockfishData.plugin_url + 'img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    board = Chessboard('board', config);

    document.getElementById('new-game-button').addEventListener('click', function () {
        game.reset();
        board.start();
        stockfish.postMessage('ucinewgame');
        updateStatus();
    });

    function initStockfish() {
        stockfish.postMessage('uci');
        stockfish.postMessage('isready');
        stockfish.postMessage('setoption name Skill Level value 0');
    }
    
    initStockfish();
    updateStatus();
});