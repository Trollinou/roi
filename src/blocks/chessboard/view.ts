const wpInteractivity = typeof window !== 'undefined' ? (window as any).wp?.interactivity : null;
const store = wpInteractivity?.store || ((_namespace: string, config: any) => config || { state: {} });
const getElement: () => { ref: HTMLElement | null } = wpInteractivity?.getElement || (() => ({ ref: null }));
const getContext = wpInteractivity?.getContext || (() => ({}));
import { BoardCore } from 'eg-chessboard';
import type { StockfishConfig, StockfishEvaluation, EngineStatus } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import { ChessClock } from './classes/ChessClock';
import {
  ensureCapturedBarsAndClocks,
  ensureCadenceSelector,
  renderPromotionDialogDom,
  updateStatusDisplay,
  updateEvalBarDom,
  buildStockfishEngineConfig,
} from './classes/ChessboardUiHelper';
import type { Color } from '../../types';

declare global {
  interface Window {
    chessboardViewInitialized?: boolean;
    roiChessConfig?: {
      stockfishWorkerUrl?: string;
      stockfishWasmUrl?: string;
    };
  }
}

window.EgBoardCore = BoardCore;

/**
 * Initializes a chessboard instance on a given block/container element.
 */
function initChessboardInstance(block: HTMLElement, mountElement: HTMLElement, contextData?: Record<string, any>) {
  if ((block as any)._chessboardInitialized) {
    return;
  }
  (block as any)._chessboardInitialized = true;

  // Read attributes from contextData or data-* attributes
  const fen = contextData?.fen || block.getAttribute('data-fen') || undefined;
  const orientation = (contextData?.orientation || block.getAttribute('data-orientation') as Color) || 'white';
  const coordinates = contextData?.coordinates !== undefined ? contextData.coordinates : block.getAttribute('data-coordinates') !== 'false';
  const viewOnly = contextData?.viewOnly !== undefined ? contextData.viewOnly : block.getAttribute('data-view-only') === 'true';
  const playerColor = (contextData?.playerColor || block.getAttribute('data-player-color') as 'white' | 'black' | 'both') || 'both';
  const showThreats = contextData?.showThreats !== undefined ? contextData.showThreats : block.getAttribute('data-show-threats') === 'true';
  const useStockfish = contextData?.useStockfish !== undefined ? contextData.useStockfish : block.getAttribute('data-use-stockfish') === 'true';
  const stockfishElo = parseInt(
    String(contextData?.stockfishElo || block.getAttribute('data-stockfish-elo') || '1500'),
    10
  );

  const freeMode = contextData?.freeMode !== undefined ? contextData.freeMode : block.getAttribute('data-free-mode') === 'true';
  const showMaterialIndicator = contextData?.showMaterialIndicator !== undefined ? contextData.showMaterialIndicator : block.getAttribute('data-show-material-indicator') !== 'false';
  const showEvaluationBar = contextData?.showEvaluationBar !== undefined ? contextData.showEvaluationBar : block.getAttribute('data-show-evaluation-bar') === 'true';
  const initialClockPreset = contextData?.clockPreset || block.getAttribute('data-clock-preset') || 'none';

  ensureCapturedBarsAndClocks(block, showMaterialIndicator, initialClockPreset);
  ensureCadenceSelector(block, useStockfish, initialClockPreset);

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

  const state: any = {
    mode: 'game' as const,
    showThreats,
    _promotionDialogState: { isEnabled: false },
    get promotionDialogState() {
      return this._promotionDialogState;
    },
    set promotionDialogState(val: any) {
      this._promotionDialogState = val;
      renderPromotionDialogDom(block, val, () => {
        state._promotionDialogState = { isEnabled: false };
      });
    },
    historyViewerState: { isEnabled: false },
  };

  let currentStockfishColor: Color | null = null;
  let currentStockfishElo = stockfishElo;
  let currentEngineStatus: EngineStatus = 'uninitialized';
  let lastEvaluation: StockfishEvaluation | null = null;

  const configDialog = block.querySelector<HTMLElement>('.chess-config-dialog');
  const colorBtns = block.querySelectorAll<HTMLElement>('.color-btn');
  const eloSlider = block.querySelector<HTMLInputElement>('.elo-slider');
  const eloValueDisplay = block.querySelector<HTMLElement>('.elo-value');
  const startBtn = block.querySelector<HTMLButtonElement>('.start-btn');
  const statusElement = block.querySelector<HTMLElement>('.chess-status');
  const newGameBtn = block.querySelector<HTMLButtonElement>('.control-btn.new-game');
  const flipBoardBtn = block.querySelector<HTMLButtonElement>('.control-btn.flip-board');
  const undoMoveBtn = block.querySelector<HTMLButtonElement>('.control-btn.undo-move');

  const updateStatus = () => {
    updateStatusDisplay({
      statusElement,
      useStockfish,
      configDialog,
      boardAPI,
      currentEngineStatus,
      currentStockfishColor,
    });
  };

  const updateEvaluationBar = (evalData?: StockfishEvaluation | null) => {
    if (evalData !== undefined) {
      lastEvaluation = evalData;
    }
    updateEvalBarDom(block, boardAPI, lastEvaluation);
  };

  const workerUrl =
    globalStoreState.stockfishWorkerUrl ||
    (typeof window !== 'undefined' && window.roiChessConfig?.stockfishWorkerUrl) ||
    block.getAttribute('data-stockfish-worker-url') ||
    '/wp-content/plugins/dame-pwa/pwa/dist/stockfish/stockfish.js';

  const wasmUrl =
    globalStoreState.stockfishWasmUrl ||
    (typeof window !== 'undefined' && window.roiChessConfig?.stockfishWasmUrl) ||
    block.getAttribute('data-stockfish-wasm-url') ||
    '/wp-content/plugins/dame-pwa/pwa/dist/stockfish/stockfish.wasm';

  const buildStockfishConfig = (
    whiteMode: 'disabled' | 'hint' | 'bot' | 'elo',
    blackMode: 'disabled' | 'hint' | 'bot' | 'elo',
    elo: number
  ): StockfishConfig => buildStockfishEngineConfig(workerUrl, wasmUrl, whiteMode, blackMode, elo);

  const clock = new ChessClock();
  const clockSettings = {
    preset: initialClockPreset,
    wtime: 0,
    btime: 0,
    winc: 0,
    binc: 0,
  };
  let activeClockColor: Color | null = null;

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

  const startTimer = () => clock.start();
  const stopTimer = () => clock.stop();

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

  clock.onTick = (wtime, btime) => {
    clockSettings.wtime = wtime;
    clockSettings.btime = btime;
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

  const emit = (event: string, ...args: unknown[]) => {
    if (event === 'move' || event === 'turn-change') {
      const val = args[0] as any;
      const turnColor =
        val?.turnColor ||
        (typeof boardAPI?.getState === 'function' ? boardAPI.getState().turnColor : null) ||
        boardAPI?.getTurnColor();
      let plyCount = 0;
      if (val?.ply !== undefined) {
        plyCount = val.ply;
      } else if (typeof boardAPI?.getState === 'function') {
        plyCount = boardAPI.getState().ply ?? 0;
      } else {
        plyCount = boardAPI?.getCurrentPlyNumber() ?? 0;
      }

      updateStatus();

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
    } else if (['check', 'checkmate', 'draw', 'stalemate'].includes(event)) {
      if (['checkmate', 'draw', 'stalemate'].includes(event)) {
        stopTimer();
      }
      updateStatus();
    } else if (event === 'evaluation') {
      const evaluation = args[0] as StockfishEvaluation;
      updateEvaluationBar(evaluation);
    } else if (event === 'engine-status') {
      currentEngineStatus = args[0] as EngineStatus;
      updateStatus();
    } else if (event === 'stockfish-hint') {
      const bestMove = args[0] as string;
      if (bestMove && bestMove.length >= 4) {
        const from = bestMove.slice(0, 2);
        const to = bestMove.slice(2, 4);
        boardAPI.drawMove(from, to, 'green');
      }
    }

    if (customEventListeners[event]) {
      customEventListeners[event].forEach((cb) => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`Error in ${event} listener:`, err);
        }
      });
    }

    block.dispatchEvent(
      new CustomEvent(event, {
        detail: args.length > 1 ? args : args[0],
        bubbles: true,
      })
    );
  };

  const customEventListeners: Record<string, Array<(..._args: unknown[]) => void>> = {};

  const initialStockfishConfig: StockfishConfig =
    useStockfish || showEvaluationBar
      ? buildStockfishConfig('disabled', 'disabled', stockfishElo)
      : { workerUrl, wasmUrl };

  const boardAPI = new BoardCore(
    mountElement,
    state,
    () => {},
    emit,
    boardConfig,
    initialStockfishConfig
  );

  (boardAPI as any).on = (evt: string, callback: (..._args: unknown[]) => void) => {
    if (!customEventListeners[evt]) {
      customEventListeners[evt] = [];
    }
    customEventListeners[evt].push(callback);
    return () => {
      customEventListeners[evt] = customEventListeners[evt].filter((cb) => cb !== callback);
    };
  };

  (boardAPI as any).off = (evt: string, callback: (..._args: unknown[]) => void) => {
    if (customEventListeners[evt]) {
      customEventListeners[evt] = customEventListeners[evt].filter((cb) => cb !== callback);
    }
  };

  (block as any).boardAPI = boardAPI;

  updateClockDisplays();

  // Bind interactive actions
  const handleStartGame = () => {
    const activeColorBtn = block.querySelector('.color-btn.active');
    const chosenColor = activeColorBtn ? activeColorBtn.getAttribute('data-color') : 'white';
    let playerChosenColor: Color = chosenColor as Color;
    if (chosenColor === 'random') {
      playerChosenColor = Math.random() < 0.5 ? 'white' : 'black';
    }

    currentStockfishColor = playerChosenColor === 'white' ? 'black' : 'white';

    if (eloSlider) {
      currentStockfishElo = parseInt(eloSlider.value, 10);
    }

    const cadenceSelectEl = configDialog?.querySelector<HTMLSelectElement>('.cadence-select');
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

    if (configDialog) {configDialog.style.display = 'none';}
    mockProps.playerColor = playerChosenColor;

    boardAPI.cancelReview();
    boardAPI.newGame();
    boardAPI.setConfig({
      viewOnly: false,
      orientation: playerChosenColor,
      fen: boardAPI.getFen(),
    });

    if (useStockfish) {
      const isWhiteBot = currentStockfishColor === 'white';
      const isBlackBot = currentStockfishColor === 'black';

      boardAPI.updateStockfishConfig(
        buildStockfishConfig(
          isWhiteBot ? 'elo' : 'disabled',
          isBlackBot ? 'elo' : 'disabled',
          currentStockfishElo
        )
      );

      if (showEvaluationBar) {
        boardAPI.startLiveAnalysis();
      }
    } else if (showEvaluationBar) {
      boardAPI.updateStockfishConfig(
        buildStockfishConfig('disabled', 'disabled', currentStockfishElo)
      );
      boardAPI.startLiveAnalysis();
    }

    updateStatus();
    updateEvaluationBar(null);

    stopTimer();
    activeClockColor = 'white';
    clock.setActiveColor('white');
    startTimer();
    updateClockDisplays();
  };

  const handleNewGame = () => {
    clock.reset();
    if (useStockfish || showEvaluationBar) {
      boardAPI.cancelReview();
      boardAPI.stopLiveAnalysis();
      boardAPI.updateStockfishConfig(
        buildStockfishConfig('disabled', 'disabled', currentStockfishElo)
      );
    }
    boardAPI.newGame();
    if (useStockfish && configDialog) {
      boardAPI.setConfig({ viewOnly: true });
      configDialog.style.display = 'flex';
    }
    updateStatus();
    updateEvaluationBar(null);
  };

  const handleFlipBoard = () => {
    boardAPI.toggleOrientation();
    updateEvaluationBar();
    updateClockDisplays();
  };

  const handleUndoMove = () => {
    const activeColorBtn = block.querySelector('.color-btn.active');
    const chosenColor = activeColorBtn ? activeColorBtn.getAttribute('data-color') : 'white';
    const playerChosenColor = (chosenColor === 'random' ? mockProps.playerColor : chosenColor) as Color;

    if (useStockfish && currentStockfishColor) {
      boardAPI.undoLastMove();
      if (boardAPI.getTurnColor() !== playerChosenColor && boardAPI.getCurrentPlyNumber() > 0) {
        boardAPI.undoLastMove();
      }
    } else {
      boardAPI.undoLastMove();
    }
    clock.setActiveColor(boardAPI.getTurnColor());
    activeClockColor = clock.activeColor;
    updateClockDisplays();
    updateStatus();
  };

  if (startBtn) {startBtn.addEventListener('click', handleStartGame);}
  if (newGameBtn) {newGameBtn.addEventListener('click', handleNewGame);}
  if (flipBoardBtn) {flipBoardBtn.addEventListener('click', handleFlipBoard);}
  if (undoMoveBtn) {undoMoveBtn.addEventListener('click', handleUndoMove);}

  if (eloSlider && eloValueDisplay) {
    eloSlider.addEventListener('input', (e: Event) => {
      eloValueDisplay.textContent = (e.target as HTMLInputElement).value;
    });
  }

  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  updateStatus();

  if (showThreats) {
    boardAPI.drawThreats();
  }
}

// Register WordPress Interactivity API store for roi/chessboard
const { state: globalStoreState } = store('roi/chessboard', {
  state: {
    stockfishWorkerUrl: '',
    stockfishWasmUrl: '',
    defaultFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    supportedCadences: ['none', '1+0', '3+2', '5+0', '10+5', '15+10'],
    minElo: 1320,
    maxElo: 3190,
    defaultElo: 1500,
  },
  actions: {
    selectColor(event: Event) {
      const btn = event.currentTarget as HTMLElement;
      const block = btn.closest<HTMLElement>('.chessboard-block');
      if (!block) {return;}
      block.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    },
    changeCadence(event: Event) {
      const select = event.target as HTMLSelectElement;
      const block = select.closest<HTMLElement>('.chessboard-block');
      if (!block) {return;}
      const opponentClock = block.querySelector<HTMLElement>('.opponent-clock');
      const playerClock = block.querySelector<HTMLElement>('.player-clock');
      if (opponentClock && playerClock) {
        const isNone = select.value === 'none';
        opponentClock.style.display = isNone ? 'none' : 'block';
        playerClock.style.display = isNone ? 'none' : 'block';
      }
    },
    changeElo(event: Event) {
      const slider = event.target as HTMLInputElement;
      const block = slider.closest<HTMLElement>('.chessboard-block');
      const eloDisplay = block?.querySelector<HTMLElement>('.elo-value');
      if (eloDisplay) {
        eloDisplay.textContent = slider.value;
      }
    },
    startGame(event: Event) {
      const btn = event.target as HTMLElement;
      const block = btn.closest<HTMLElement>('.chessboard-block');
      const startBtn = block?.querySelector<HTMLButtonElement>('.start-btn');
      startBtn?.click();
    },
    flipBoard(event: Event) {
      const btn = event.target as HTMLElement;
      const block = btn.closest<HTMLElement>('.chessboard-block');
      const flipBtn = block?.querySelector<HTMLButtonElement>('.control-btn.flip-board');
      flipBtn?.click();
    },
    newGame(event: Event) {
      const btn = event.target as HTMLElement;
      const block = btn.closest<HTMLElement>('.chessboard-block');
      const newBtn = block?.querySelector<HTMLButtonElement>('.control-btn.new-game');
      newBtn?.click();
    },
    undoMove(event: Event) {
      const btn = event.target as HTMLElement;
      const block = btn.closest<HTMLElement>('.chessboard-block');
      const undoBtn = block?.querySelector<HTMLButtonElement>('.control-btn.undo-move');
      undoBtn?.click();
    },
    requestHint(event: Event) {
      const btn = event.target as HTMLElement;
      const block = btn.closest<HTMLElement>('.chessboard-block');
      const boardAPI = (block as any)?.boardAPI;
      if (boardAPI && typeof boardAPI.requestHint === 'function') {
        boardAPI.requestHint({ multiPv: 1, movetime: 1200 });
      }
    },
  },
  callbacks: {
    mountBoard() {
      const { ref } = getElement();
      if (!ref) {return;}
      const block = ref.closest<HTMLElement>('.chessboard-block');
      if (!block) {return;}
      const context = getContext();
      initChessboardInstance(block, ref, context);
    },
  },
});

function onDomReady(fn: () => void) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// Fallback initialization for DOM without Interactivity API runtime
onDomReady(() => {
  if (window.chessboardViewInitialized) {
    return;
  }
  window.chessboardViewInitialized = true;

  const blocks = document.querySelectorAll<HTMLElement>('.chessboard-block');
  for (const block of blocks) {
    const mountElement = block.querySelector<HTMLElement>('.chessboard-mount-element');
    if (!mountElement) {continue;}
    initChessboardInstance(block, mountElement);
  }
});
