import { BoardCore } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import { ChessClock } from './classes/ChessClock';
import { StockfishManager } from './classes/stockfishManager';
import type { Color } from '../../types';

declare global {
  interface Window {
    chessboardViewInitialized?: boolean;
    roiChessConfig?: {
      stockfishWorkerUrl?: string;
    };
  }
}

window.EgBoardCore = BoardCore;

document.addEventListener('DOMContentLoaded', async () => {
  if (window.chessboardViewInitialized) {
    return;
  }
  window.chessboardViewInitialized = true;

  const blocks = document.querySelectorAll<HTMLElement>('.chessboard-block');

  for (const block of blocks) {
    const mountElement = block.querySelector<HTMLElement>('.chessboard-mount-element');
    if (!mountElement) continue;

    // Read attributes from data-* attributes
    const fen = block.getAttribute('data-fen') || undefined;
    const orientation = (block.getAttribute('data-orientation') as Color) || 'white';
    const coordinates = block.getAttribute('data-coordinates') !== 'false';
    const viewOnly = block.getAttribute('data-view-only') === 'true';
    const playerColor = (block.getAttribute('data-player-color') as 'white' | 'black' | 'both') || 'both';
    const showThreats = block.getAttribute('data-show-threats') === 'true';
    const useStockfish = block.getAttribute('data-use-stockfish') === 'true';
    const stockfishElo = parseInt(
      block.getAttribute('data-stockfish-elo') || '1500',
      10
    );

    const freeMode = block.getAttribute('data-free-mode') === 'true';
    const showMaterialIndicator = block.getAttribute('data-show-material-indicator') !== 'false';
    const showEvaluationBar = block.getAttribute('data-show-evaluation-bar') === 'true';
    const initialClockPreset = block.getAttribute('data-clock-preset') || 'none';

    // Ensure captured bars exist in the DOM (for backwards compatibility with old posts)
    let topBar = block.querySelector<HTMLElement>('.captured-clock-top');
    let bottomBar = block.querySelector<HTMLElement>('.captured-clock-bottom');
    const mainWrap = block.querySelector<HTMLElement>('.main-wrap');
    const mainBoard = block.querySelector<HTMLElement>('.main-board');

    if (mainWrap && mainBoard) {
      if (!topBar) {
        topBar = document.createElement('div');
        topBar.className = 'captured-clock-top captured-bar';
        topBar.innerHTML = `
          <div class="material-wrapper opponent-material" style="display: ${showMaterialIndicator ? 'block' : 'none'};"></div>
          <div class="player-info">Adversaire</div>
          <span class="captured-pieces-clock-opp captured-pieces"></span>
          <div class="game-clock opponent-clock" style="display: ${initialClockPreset !== 'none' ? 'block' : 'none'};">--:--</div>
        `;
        mainWrap.insertBefore(topBar, mainBoard);
      }
      if (!bottomBar) {
        bottomBar = document.createElement('div');
        bottomBar.className = 'captured-clock-bottom captured-bar';
        bottomBar.innerHTML = `
          <div class="material-wrapper player-material" style="display: ${showMaterialIndicator ? 'block' : 'none'};"></div>
          <div class="player-info">Toi</div>
          <span class="captured-pieces-clock-player captured-pieces"></span>
          <div class="game-clock player-clock" style="display: ${initialClockPreset !== 'none' ? 'block' : 'none'};">--:--</div>
        `;
        mainWrap.insertBefore(bottomBar, mainBoard.nextSibling);
      }

      // Initialize display of top/bottom bars based on settings using hidden-bar class
      const barsActive = showMaterialIndicator || initialClockPreset !== 'none';
      topBar.classList.toggle('hidden-bar', !barsActive);
      bottomBar.classList.toggle('hidden-bar', !barsActive);
    }

    // Ensure correct display of clocks based on preset on load
    const opponentClockEl = block.querySelector<HTMLElement>('.opponent-clock');
    const playerClockEl = block.querySelector<HTMLElement>('.player-clock');
    if (opponentClockEl && playerClockEl) {
      if (initialClockPreset !== 'none') {
        opponentClockEl.style.display = 'block';
        playerClockEl.style.display = 'block';
      } else {
        opponentClockEl.style.display = 'none';
        playerClockEl.style.display = 'none';
      }
    }

    // Ensure the cadence select exists in the config dialog content (for backwards compatibility)
    const activeConfigDialog = block.querySelector<HTMLElement>('.chess-config-dialog');
    if (useStockfish && activeConfigDialog) {
      const dialogContent = activeConfigDialog.querySelector<HTMLElement>('.config-dialog-content');
      let cadenceSelector = activeConfigDialog.querySelector<HTMLElement>('.cadence-selector');
      if (dialogContent && !cadenceSelector) {
        cadenceSelector = document.createElement('div');
        cadenceSelector.className = 'cadence-selector';
        cadenceSelector.innerHTML = `
          <label>Cadence :</label>
          <select class="cadence-select">
            <option value="none" ${initialClockPreset === 'none' ? 'selected' : ''}>Sans pendule</option>
            <option value="1+0" ${initialClockPreset === '1+0' ? 'selected' : ''}>1 min (Bullet)</option>
            <option value="3+2" ${initialClockPreset === '3+2' ? 'selected' : ''}>3 min + 2 s (Blitz)</option>
            <option value="5+0" ${initialClockPreset === '5+0' ? 'selected' : ''}>5 min KO (Blitz)</option>
            <option value="10+5" ${initialClockPreset === '10+5' ? 'selected' : ''}>10 min + 5 s (Rapide)</option>
            <option value="15+10" ${initialClockPreset === '15+10' ? 'selected' : ''}>15 min + 10 s (Rapide)</option>
          </select>
        `;
        const difficultySelector = dialogContent.querySelector('.difficulty-selector');
        if (difficultySelector) {
          dialogContent.insertBefore(cadenceSelector, difficultySelector);
        } else {
          const startBtnEl = dialogContent.querySelector('.start-btn');
          if (startBtnEl) {
            dialogContent.insertBefore(cadenceSelector, startBtnEl);
          }
        }
      }
    }

    const cadenceSelect = block.querySelector<HTMLSelectElement>('.cadence-select');
    if (cadenceSelect) {
      cadenceSelect.value = initialClockPreset;
    }

    // If using Stockfish, the board starts in viewOnly until "Commencer" is clicked
    const initialViewOnly = useStockfish ? true : viewOnly;

    const boardConfig = {
      mode: 'game' as const,
      fen,
      orientation,
      coordinates,
      viewOnly: initialViewOnly,
    };

    const mockProps = {
      boardConfig,
      playerColor,
      reactiveConfig: false,
      freeMode,
    };

    const promotionPieces = [
      { name: 'Queen', data: 'q' },
      { name: 'Knight', data: 'n' },
      { name: 'Rook', data: 'r' },
      { name: 'Bishop', data: 'b' },
    ];

    // Minimal state for frontend interaction
    const state: any = {
      mode: 'game' as const,
      showThreats,
      _promotionDialogState: { isEnabled: false },
      get promotionDialogState() {
        return this._promotionDialogState;
      },
      set promotionDialogState(val: any) {
        this._promotionDialogState = val;
        if (val && val.isEnabled) {
          const mainBoard = block.querySelector('.main-board');
          if (!mainBoard) return;

          const existingDialog = mainBoard.querySelector('.promotion-dialog');
          if (existingDialog) existingDialog.remove();

          const dialog = document.createElement('dialog');
          dialog.className = 'promotion-dialog';
          dialog.setAttribute('open', '');

          promotionPieces.forEach((piece) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `${piece.name.toLowerCase()} ${val.color}`;
            btn.setAttribute('aria-label', piece.name);

            const selectPiece = (e: Event) => {
              e.preventDefault();
              val.callback(piece.data);
              dialog.remove();
              state._promotionDialogState = { isEnabled: false };
            };

            btn.addEventListener('click', selectPiece);
            btn.addEventListener('touchstart', selectPiece);
            dialog.appendChild(btn);
          });

          mainBoard.appendChild(dialog);
        }
      },
      historyViewerState: { isEnabled: false },
    };

    let makeStockfishMove = () => {
      if (boardAPI.getIsGameOver()) return;
      const turnColor = boardAPI.getTurnColor();
      const positionCmd = getEnginePositionCommand();

      if (turnColor === currentStockfishColor) {
        if (stockfishManager) {
          if (clockSettings.preset !== 'none') {
            const timeParams = `wtime ${clockSettings.wtime} winc ${clockSettings.winc} btime ${clockSettings.btime} binc ${clockSettings.binc}`;
            stockfishManager.startOpponentMove(positionCmd, timeParams);
          } else {
            stockfishManager.startOpponentMove(positionCmd, 5000);
          }
        }
      } else {
        if (stockfishManager) {
          stockfishManager.startEvaluation(positionCmd);
        }
      }
    };
    let updateEvaluationBar: (scoreType?: string, scoreValue?: number) => void = () => {};
    let currentStockfishColor: Color | null = null;
    let currentStockfishElo = stockfishElo;
    let stockfishManager: StockfishManager | null = null;
    let lastScoreType = 'cp';
    let lastScoreValue = 0;
    let lastSuggestedMove = '';
    let isHintEnabled = false;

    // DOM Elements for Visitor Interface
    const configDialog = block.querySelector<HTMLElement>('.chess-config-dialog');
    const colorBtns = block.querySelectorAll<HTMLElement>('.color-btn');
    const eloSlider = block.querySelector<HTMLInputElement>('.elo-slider');
    const eloValueDisplay = block.querySelector<HTMLElement>('.elo-value');
    const startBtn = block.querySelector<HTMLButtonElement>('.start-btn');
    const statusElement = block.querySelector<HTMLElement>('.chess-status');
    const newGameBtn = block.querySelector<HTMLButtonElement>('.control-btn.new-game');
    const flipBoardBtn = block.querySelector<HTMLButtonElement>('.control-btn.flip-board');
    const undoMoveBtn = block.querySelector<HTMLButtonElement>('.control-btn.undo-move');

    // Status updater
    const updateStatus = () => {
      if (!statusElement) return;

      if (
        useStockfish &&
        configDialog &&
        configDialog.style.display !== 'none'
      ) {
        statusElement.textContent =
          'Choisissez vos options et commencez la partie.';
        return;
      }

      const boardState: any = typeof boardAPI.getState === 'function' ? boardAPI.getState() : {};
      const isGameOver = boardState.isGameOver ?? boardAPI.getIsGameOver();
      const isCheck = boardState.isCheck ?? boardAPI.getIsCheck();
      const turnColor = boardState.turnColor ?? boardAPI.getTurnColor();

      if (isGameOver) {
        statusElement.textContent = boardAPI.getGameOverReason();
        return;
      }

      if (isCheck) {
        const inCheckColor = turnColor === 'white' ? 'Blancs' : 'Noirs';
        statusElement.textContent = `Échec ! Au tour des ${inCheckColor}.`;
      } else {
        if (useStockfish) {
          if (turnColor === currentStockfishColor) {
            statusElement.textContent = 'Le moteur réfléchit...';
          } else {
            statusElement.textContent = 'À vous de jouer.';
          }
        } else {
          statusElement.textContent = `Au tour des ${
            turnColor === 'white' ? 'Blancs' : 'Noirs'
          }.`;
        }
      }
    };

    const emit = (event: string, _val: any) => {
      if (event === 'move') {
        updateStatus();
        setTimeout(() => {
          makeStockfishMove();
        }, 100);
      } else if (['check', 'checkmate', 'draw', 'stalemate'].includes(event)) {
        updateStatus();
      }
    };

    // Resolve Stockfish worker URL from DAME-PWA configuration
    const workerUrl =
      (typeof window !== 'undefined' && window.roiChessConfig?.stockfishWorkerUrl) ||
      block.getAttribute('data-stockfish-worker-url') ||
      '/wp-content/plugins/dame-pwa/pwa/dist/stockfish/stockfish.js';

    const boardAPI = new BoardCore(
      mountElement,
      state,
      () => {
        // Handle state changes if any
      },
      emit,
      boardConfig,
      {
        workerUrl: workerUrl
      }
    );
    (block as any).boardAPI = boardAPI;

    const clock = new ChessClock();

    // Clock Settings & State Variables
    const clockSettings = {
      preset: initialClockPreset,
      wtime: 0,
      btime: 0,
      winc: 0,
      binc: 0,
    };
    let activeClockColor: Color | null = null;
    let timerTenths = 0;

    clock.onTick = (wtime, btime) => {
      clockSettings.wtime = wtime;
      clockSettings.btime = btime;
      timerTenths = clock.timerTenths;
      updateClockDisplays();
    };

    clock.onTimeOut = (flaggedColor) => {
      handleTimeOut(flaggedColor);
    };

    const initClockSettings = (preset: string) => {
      clock.setPreset(preset as any);
      clockSettings.preset = clock.preset;
      clockSettings.wtime = clock.wtime;
      clockSettings.btime = clock.btime;
      clockSettings.winc = clock.winc;
      clockSettings.binc = clock.binc;
    };
    initClockSettings(initialClockPreset);

    const formatClockTime = (timeMs: number) => {
      return ChessClock.formatTime(timeMs);
    };

    const updateClockDisplays = () => {
      const currentOrientation = boardAPI.getOrientation();
      const oppColor: Color = currentOrientation === 'white' ? 'black' : 'white';
      const playerClock = block.querySelector<HTMLElement>('.player-clock');
      const opponentClock = block.querySelector<HTMLElement>('.opponent-clock');

      if (playerClock) {
        const playerTime = currentOrientation === 'white' ? clockSettings.wtime : clockSettings.btime;
        playerClock.textContent = formatClockTime(playerTime);
        playerClock.classList.toggle('active', activeClockColor === currentOrientation);
      }
      if (opponentClock) {
        const opponentTime = oppColor === 'white' ? clockSettings.wtime : clockSettings.btime;
        opponentClock.textContent = formatClockTime(opponentTime);
        opponentClock.classList.toggle('active', activeClockColor === oppColor);
      }
    };

    const updateCapturedAndMaterial = () => {
      // Intentionally left minimal
    };

    const handleTimeOut = (flaggedColor: Color) => {
      stopTimer();
      boardAPI.setConfig({ viewOnly: true });
      activeClockColor = null;
      clock.setActiveColor(null);

      const winner = flaggedColor === 'white' ? 'Noirs' : 'Blancs';
      if (statusElement) {
        statusElement.textContent = `🏁 Perdu au temps ! Les ${winner} ont gagné.`;
      }
      updateClockDisplays();
    };

    const startTimer = () => {
      clock.start();
    };

    const stopTimer = () => {
      clock.stop();
    };

    // Initialize clock display at load
    updateClockDisplays();

    const initialFen =
      fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    // Helper to build position command
    const getEnginePositionCommand = () => {
      const history = boardAPI.getHistory(true) || [];
      const movesStr = history
        .map((m: any) => m.from + m.to + (m.promotion ? m.promotion : ''))
        .join(' ');
      return movesStr
        ? `position startpos moves ${movesStr}`
        : `position fen ${initialFen}`;
    };

    if (useStockfish || showEvaluationBar) {
      try {
        stockfishManager = new StockfishManager(workerUrl);

        if (showEvaluationBar) {
          stockfishManager.initEvaluationWorker();
        }
        if (useStockfish) {
          stockfishManager.initOpponentWorker(stockfishElo);
        }

        stockfishManager.setCallbacks({
          onBestMove: (bestMove: string) => {
            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);
            const promotion =
              bestMove.length > 4 ? bestMove.charAt(4) : undefined;
            boardAPI.move({ from, to, promotion });
          },
          onEvaluation: (scoreType: string, scoreValue: number) => {
            updateEvaluationBar(scoreType, scoreValue);
          },
          onHint: (bestMove: string) => {
            lastSuggestedMove = bestMove;
            if (isHintEnabled) {
              const from = bestMove.slice(0, 2);
              const to = bestMove.slice(2, 4);
              boardAPI.drawMove(from, to, 'green');
            }
          }
        });

        updateEvaluationBar = (scoreType?: string, scoreValue?: number) => {
          if (scoreType !== undefined && scoreValue !== undefined) {
            lastScoreType = scoreType;
            lastScoreValue = scoreValue;
          }

          const barFill = block.querySelector<HTMLElement>('.evaluation-bar-fill');
          if (!barFill) return;
          const barContainer = block.querySelector<HTMLElement>('.evaluation-bar');

          let scoreFromWhite = 0;
          if (lastScoreType === 'cp') {
            scoreFromWhite =
              currentStockfishColor === 'white' ? lastScoreValue : -lastScoreValue;
          } else if (lastScoreType === 'mate') {
            const isWhiteAdvantage =
              (currentStockfishColor === 'white' && lastScoreValue > 0) ||
              (currentStockfishColor === 'black' && lastScoreValue < 0);
            scoreFromWhite = isWhiteAdvantage ? 1000 : -1000;
          }

          if (barContainer) {
            let tooltipText = '';
            if (lastScoreType === 'cp') {
              const evalFromWhite = scoreFromWhite / 100;
              const sign = evalFromWhite > 0 ? '+' : '';
              tooltipText = `${sign}${evalFromWhite.toFixed(2)}`;
            } else if (lastScoreType === 'mate') {
              const isWhiteAdvantage =
                (currentStockfishColor === 'white' && lastScoreValue > 0) ||
                (currentStockfishColor === 'black' && lastScoreValue < 0);
              const absMoves = Math.abs(lastScoreValue);
              const sideChar = isWhiteAdvantage ? 'B' : 'N';
              tooltipText = `Mat #${absMoves}${sideChar}`;
            }
            barContainer.setAttribute('title', tooltipText);
          }

          const clampedScore = Math.max(-1000, Math.min(1000, scoreFromWhite));
          const percentageWhite = 50 + (clampedScore / 1000) * 50;
          const currentOrientation = boardAPI.getOrientation();

          if (currentOrientation === 'white') {
            barFill.style.height = `${percentageWhite}%`;
            barFill.style.marginTop = 'auto';
            barFill.style.marginBottom = '0';
          } else {
            barFill.style.height = `${percentageWhite}%`;
            barFill.style.marginTop = '0';
            barFill.style.marginBottom = 'auto';
          }
        };
      } catch (err) {
        console.error('Stockfish Worker failed to load:', err);
      }
    }

    // Set up Visitor interface event listeners
    if (useStockfish && configDialog) {
      colorBtns.forEach((btn) => {
        const btnColor = btn.getAttribute('data-color');
        const targetColor = playerColor === 'both' ? 'random' : playerColor;
        if (btnColor === targetColor) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      colorBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          colorBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      if (eloSlider && eloValueDisplay) {
        eloSlider.addEventListener('input', (e: Event) => {
          eloValueDisplay.textContent = (e.target as HTMLInputElement).value;
        });
      }

      if (startBtn) {
        startBtn.addEventListener('click', () => {
          const activeColorBtn = block.querySelector('.color-btn.active');
          const chosenColor = activeColorBtn
            ? activeColorBtn.getAttribute('data-color')
            : 'white';
          const playerChosenColor =
            chosenColor === 'random'
              ? Math.random() < 0.5
                ? 'white'
                : 'black'
              : (chosenColor as Color);

          currentStockfishColor =
            playerChosenColor === 'white' ? 'black' : 'white';

          if (eloSlider) {
            currentStockfishElo = parseInt(eloSlider.value, 10);
          }

          const cadenceSelectEl = configDialog.querySelector<HTMLSelectElement>('.cadence-select');
          const chosenPreset = cadenceSelectEl ? cadenceSelectEl.value : 'none';
          initClockSettings(chosenPreset);

          const opponentClock = block.querySelector<HTMLElement>('.opponent-clock');
          const playerClock = block.querySelector<HTMLElement>('.player-clock');
          const topBarEl = block.querySelector<HTMLElement>('.captured-clock-top');
          const bottomBarEl = block.querySelector<HTMLElement>('.captured-clock-bottom');
          if (opponentClock && playerClock) {
            if (chosenPreset !== 'none') {
              opponentClock.style.display = 'block';
              playerClock.style.display = 'block';
            } else {
              opponentClock.style.display = 'none';
              playerClock.style.display = 'none';
            }
          }
          if (topBarEl && bottomBarEl) {
            const barsActive = showMaterialIndicator || chosenPreset !== 'none';
            topBarEl.classList.toggle('hidden-bar', !barsActive);
            bottomBarEl.classList.toggle('hidden-bar', !barsActive);
          }

          configDialog.style.display = 'none';
          mockProps.playerColor = playerChosenColor;

          boardAPI.resetBoard();
          boardAPI.setConfig({
            viewOnly: false,
            orientation: playerChosenColor,
            fen: boardAPI.getFen(),
          });

          if (stockfishManager) {
            stockfishManager.initOpponentWorker(currentStockfishElo);
            stockfishManager.setOpponentElo(currentStockfishElo);
          }

          updateStatus();
          updateEvaluationBar('cp', 0);

          stopTimer();
          timerTenths = 0;
          activeClockColor = 'white';
          clock.setActiveColor('white');
          startTimer();
          updateClockDisplays();

          if (playerChosenColor === 'black') {
            makeStockfishMove();
          } else {
            if (stockfishManager && (showEvaluationBar || isHintEnabled)) {
              stockfishManager.startEvaluation(getEnginePositionCommand());
            }
          }
          updateCapturedAndMaterial();
        });
      }
    }

    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        clock.reset();
        boardAPI.resetBoard();
        if (useStockfish && configDialog) {
          boardAPI.setConfig({ viewOnly: true });
          configDialog.style.display = 'flex';
        }
        updateStatus();
      });
    }

    if (flipBoardBtn) {
      flipBoardBtn.addEventListener('click', () => {
        boardAPI.toggleOrientation();
        updateEvaluationBar();
        updateClockDisplays();
        updateCapturedAndMaterial();
      });
    }

    if (undoMoveBtn) {
      undoMoveBtn.addEventListener('click', () => {
        (boardAPI as any).undoMove(useStockfish);
        clock.setActiveColor(boardAPI.getTurnColor());
        activeClockColor = clock.activeColor;
        updateClockDisplays();
        updateCapturedAndMaterial();
        updateStatus();
      });
    }

    const newEmit = (event: string, val: any) => {
      if (event === 'turn-change' || event === 'move') {
        const turnColor = val?.turnColor || (typeof boardAPI.getState === 'function' ? boardAPI.getState().turnColor : null) || boardAPI.getTurnColor();
        const plyCount = val?.ply !== undefined ? val.ply : (typeof boardAPI.getState === 'function' ? boardAPI.getState().ply : boardAPI.getCurrentPlyNumber());

        updateStatus();

        if (event === 'move' || event === 'turn-change') {
          const justFinishedColor = turnColor === 'white' ? 'black' : 'white';
          clock.applyIncrement(justFinishedColor, plyCount);
          clockSettings.wtime = clock.wtime;
          clockSettings.btime = clock.btime;

          if (plyCount === 1) {
            startTimer();
          }

          activeClockColor = turnColor;
          clock.setActiveColor(turnColor);
          updateClockDisplays();
          updateCapturedAndMaterial();

          setTimeout(() => {
            if (turnColor === currentStockfishColor) {
              const positionCmd = getEnginePositionCommand();
              if (clockSettings.preset !== 'none') {
                const timeParams = `wtime ${clockSettings.wtime} winc ${clockSettings.winc} btime ${clockSettings.btime} binc ${clockSettings.binc}`;
                stockfishManager?.startOpponentMove(positionCmd, timeParams);
              } else {
                stockfishManager?.startOpponentMove(positionCmd, 5000);
              }
            } else if (stockfishManager) {
              stockfishManager.startEvaluation(getEnginePositionCommand());
            }
          }, 100);
        }
      } else if (['checkmate', 'draw', 'stalemate'].includes(event)) {
        stopTimer();
        updateStatus();
      }
    };

    (boardAPI as any).emit = newEmit;
    updateStatus();
    updateCapturedAndMaterial();

    if (showThreats) {
      boardAPI.drawThreats();
    }
  }
});
