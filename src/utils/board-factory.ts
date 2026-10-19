import { BoardCore } from 'eg-chessboard';
import type {
  BoardMode,
  PieceSet,
  BoardTheme,
  DrawShape,
  StockfishConfig,
  StockfishEvaluation,
  EngineStatus,
  Move,
  PromotionDetail,
} from 'eg-chessboard';
import type { Color, Shape } from '../types/chess';

export interface RoiBoardEvents {
  onMove?: (_move: Move) => void;
  onTurnChange?: (_color: Color, _ply: number) => void;
  onSquareClick?: (_square: string) => void;
  onShapesChange?: (_shapes: DrawShape[]) => void;
  onPromotion?: (_detail: PromotionDetail) => void;
  onEvaluation?: (_evalData: StockfishEvaluation) => void;
  onStockfishHint?: (_hint: string) => void;
  onEngineStatus?: (_status: EngineStatus) => void;
  onStateChange?: () => void;
}

export interface MountRoiBoardOptions extends RoiBoardEvents {
  fen?: string;
  pgn?: string;
  orientation?: Color;
  coordinates?: boolean;
  viewOnly?: boolean;
  mode?: BoardMode;
  playerColor?: 'white' | 'black' | 'both';
  freeMode?: boolean;
  shapes?: (DrawShape | Shape)[];
  showThreats?: boolean;
  pieceSet?: PieceSet;
  boardTheme?: BoardTheme;
  boardConfig?: Record<string, any>;
  useStockfish?: boolean;
  stockfishElo?: number;
  stockfishConfig?: StockfishConfig;
}

export interface RoiBoardInstance extends BoardCore {
  on: (_event: string, _callback: (..._args: any[]) => void) => () => void;
  off: (_event: string, _callback: (..._args: any[]) => void) => void;
  destroy: () => void;
}

/**
 * Factory Vanilla unifiée pour monter un échiquier ROI (Piste 3).
 *
 * Automatise :
 * 1. La préparation du conteneur avec isolation des calques (.roi-board-frame)
 * 2. L'Event Bus intégré avec on() et off()
 * 3. Le recalcul dynamique des bounds via ResizeObserver et clearDomBounds
 * 4. Le cycle de vie complet sans polling setInterval
 */
export function mountRoiBoard(
  container: HTMLElement,
  options: MountRoiBoardOptions = {}
): RoiBoardInstance {
  const {
    fen,
    pgn,
    orientation = 'white',
    coordinates = true,
    viewOnly = false,
    mode = 'game',
    playerColor = 'both',
    freeMode = false,
    shapes,
    showThreats = false,
    pieceSet = 'cburnett',
    boardTheme = 'brown',
    boardConfig = {},
    useStockfish = false,
    stockfishElo = 1500,
    stockfishConfig: explicitStockfishConfig,
    onStateChange,
  } = options;

  // 1. Détection ou injection de la structure DOM standardisée
  let mountEl: HTMLElement;
  let frameWrapper: HTMLElement;

  const existingFrame = container.classList.contains('roi-board-frame')
    ? container
    : (container.closest('.roi-board-frame') as HTMLElement | null);

  if (container.classList.contains('chessboard-mount-element')) {
    mountEl = container;
    frameWrapper = existingFrame || (container.closest('.main-wrap') as HTMLElement) || container.parentElement || container;
  } else if (container.querySelector('.chessboard-mount-element')) {
    mountEl = container.querySelector<HTMLElement>('.chessboard-mount-element')!;
    frameWrapper = existingFrame || container;
  } else if (container.classList.contains('main-board')) {
    mountEl = container;
    frameWrapper = existingFrame || container.parentElement || container;
  } else if (existingFrame) {
    frameWrapper = existingFrame;
    let mainBoard = frameWrapper.querySelector<HTMLElement>('.main-board');
    if (!mainBoard) {
      mainBoard = document.createElement('div');
      mainBoard.className = 'main-board';
      container.appendChild(mainBoard);
    }
    mountEl = document.createElement('div');
    mountEl.className = 'chessboard-mount-element';
    mainBoard.appendChild(mountEl);
  } else {
    frameWrapper = container;
    frameWrapper.classList.add('main-wrap', 'fit-container', 'roi-board-frame');

    let mainBoard = frameWrapper.querySelector<HTMLElement>('.main-board');
    if (!mainBoard) {
      mainBoard = document.createElement('div');
      mainBoard.className = 'main-board';
      frameWrapper.appendChild(mainBoard);
    }

    mountEl = document.createElement('div');
    mountEl.className = 'chessboard-mount-element';
    mainBoard.appendChild(mountEl);
  }

  // Appliquer les classes de thème, de pièces et d'isolation
  frameWrapper.classList.add(
    'roi-board-frame',
    `piece-set-${pieceSet}`,
    `board-theme-${boardTheme}`
  );

  // 2. Configuration Stockfish
  const globalConfig = typeof window !== 'undefined' ? (window as any).roiChessConfig : undefined;
  const workerUrl = explicitStockfishConfig?.workerUrl || globalConfig?.stockfishWorkerUrl || '';
  const wasmUrl = explicitStockfishConfig?.wasmUrl || globalConfig?.stockfishWasmUrl || '';

  const initialStockfishConfig: StockfishConfig = explicitStockfishConfig || {
    workerUrl,
    wasmUrl,
    whiteMode: useStockfish ? 'bot' : 'disabled',
    blackMode: useStockfish ? 'bot' : 'disabled',
    whiteElo: stockfishElo,
    blackElo: stockfishElo,
  };

  // 3. Event Bus & Dispatcher
  const customListeners: Record<string, Array<(..._args: any[]) => void>> = {};

  const emit = (event: string, ...args: unknown[]) => {
    switch (event) {
      case 'move':
        options.onMove?.(args[0] as Move);
        break;
      case 'turn-change':
        options.onTurnChange?.(args[0] as Color, args[1] as number);
        break;
      case 'square-click':
        options.onSquareClick?.(args[0] as string);
        break;
      case 'shapes-change':
        options.onShapesChange?.(args[0] as DrawShape[]);
        break;
      case 'promotion':
        options.onPromotion?.(args[0] as PromotionDetail);
        break;
      case 'evaluation':
        options.onEvaluation?.(args[0] as StockfishEvaluation);
        break;
      case 'stockfish-hint':
        options.onStockfishHint?.(args[0] as string);
        break;
      case 'engine-status':
        options.onEngineStatus?.(args[0] as EngineStatus);
        break;
    }

    if (customListeners[event]) {
      customListeners[event].forEach((cb) => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`[mountRoiBoard] Erreur listener ${event}:`, err);
        }
      });
    }

    frameWrapper.dispatchEvent(
      new CustomEvent(event, {
        detail: args.length > 1 ? args : args[0],
        bubbles: true,
      })
    );
  };

  const initialBoardConfig = {
    coordinates,
    orientation,
    viewOnly,
    fen,
    ...boardConfig,
    movable: {
      free: freeMode,
      color: playerColor === 'both' ? undefined : playerColor,
      ...boardConfig.movable,
    },
  };

  const initialBoardState = {
    mode,
    pieceSet,
    boardTheme,
    showThreats,
    promotionDialogState: { isEnabled: false },
    historyViewerState: { isEnabled: false },
  };

  const handleStateChange = () => {
    onStateChange?.();
  };

  const core = new BoardCore(
    mountEl,
    initialBoardState,
    handleStateChange,
    emit,
    initialBoardConfig,
    initialStockfishConfig
  );

  const instance = core as RoiBoardInstance;

  instance.on = (evt: string, callback: (..._args: any[]) => void) => {
    if (!customListeners[evt]) {
      customListeners[evt] = [];
    }
    customListeners[evt].push(callback);
    return () => {
      customListeners[evt] = customListeners[evt].filter((cb) => cb !== callback);
    };
  };

  instance.off = (evt: string, callback: (..._args: any[]) => void) => {
    if (customListeners[evt]) {
      customListeners[evt] = customListeners[evt].filter((cb) => cb !== callback);
    }
  };

  if (pgn) {
    try {
      instance.loadPgn(pgn);
    } catch (e) {
      console.warn('[mountRoiBoard] Erreur chargement PGN:', e);
    }
  }

  if (shapes && shapes.length > 0) {
    instance.setShapes(shapes as any);
  }

  if (showThreats) {
    instance.drawThreats();
  }

  // 4. Gestion automatique du ResizeObserver et des bounds
  let resizeObserver: ResizeObserver | null = null;
  const triggerRedraw = () => {
    if (typeof instance.redraw === 'function') {
      instance.redraw(true);
    }
  };

  window.requestAnimationFrame(triggerRedraw);

  if (typeof window.ResizeObserver !== 'undefined') {
    let lastWidth = 0;
    let lastHeight = 0;

    resizeObserver = new window.ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.round(entry.contentRect.width);
        const height = Math.round(entry.contentRect.height);

        if (width > 0 && height > 0) {
          if (lastWidth === 0 && lastHeight === 0) {
            lastWidth = width;
            lastHeight = height;
          } else if (
            Math.abs(width - lastWidth) > 1 ||
            Math.abs(height - lastHeight) > 1
          ) {
            lastWidth = width;
            lastHeight = height;
            window.requestAnimationFrame(triggerRedraw);
          }
        }
      }
    });
    resizeObserver.observe(frameWrapper);
  }

  const clearBounds = () => {
    if (typeof instance.clearDomBounds === 'function') {
      instance.clearDomBounds();
    }
  };

  frameWrapper.addEventListener('pointerdown', clearBounds, true);
  frameWrapper.addEventListener('mousedown', clearBounds, true);
  frameWrapper.addEventListener('touchstart', clearBounds, true);
  window.addEventListener('scroll', clearBounds, { capture: true, passive: true });
  window.addEventListener('resize', clearBounds, { passive: true });

  const originalDestroy = core.destroy.bind(core);
  instance.destroy = () => {
    frameWrapper.removeEventListener('pointerdown', clearBounds, true);
    frameWrapper.removeEventListener('mousedown', clearBounds, true);
    frameWrapper.removeEventListener('touchstart', clearBounds, true);
    window.removeEventListener('scroll', clearBounds, { capture: true });
    window.removeEventListener('resize', clearBounds);

    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    originalDestroy();
  };

  // Exposer sur l'élément conteneur
  (frameWrapper as any).boardAPI = instance;

  return instance;
}

export default mountRoiBoard;
