import { computeEvalBarPercentage, getNodesForElo } from 'eg-chessboard';
import type { StockfishConfig, StockfishEvaluation, EngineStatus } from 'eg-chessboard';
import type { Color } from '../../../types';

const PROMOTION_PIECES = [
  { name: 'Queen', data: 'q' },
  { name: 'Knight', data: 'n' },
  { name: 'Rook', data: 'r' },
  { name: 'Bishop', data: 'b' },
] as const;

export function ensureCapturedBarsAndClocks(
  block: HTMLElement,
  showMaterialIndicator: boolean,
  initialClockPreset: string
): void {
  let topBar = block.querySelector<HTMLElement>('.captured-clock-top');
  let bottomBar = block.querySelector<HTMLElement>('.captured-clock-bottom');
  const mainWrap = block.querySelector<HTMLElement>('.main-wrap');
  const mainBoard = block.querySelector<HTMLElement>('.main-board');
  const hasClock = initialClockPreset !== 'none';

  if (mainWrap && mainBoard) {
    if (!topBar) {
      topBar = document.createElement('div');
      topBar.className = 'captured-clock-top captured-bar';
      topBar.innerHTML = `
        <div class="material-wrapper opponent-material ${showMaterialIndicator ? '' : 'is-hidden'}"></div>
        <div class="player-info">Adversaire</div>
        <span class="captured-pieces-clock-opp captured-pieces"></span>
        <div class="game-clock opponent-clock ${hasClock ? '' : 'is-hidden'}">--:--</div>
      `;
      mainWrap.insertBefore(topBar, mainBoard);
    }
    if (!bottomBar) {
      bottomBar = document.createElement('div');
      bottomBar.className = 'captured-clock-bottom captured-bar';
      bottomBar.innerHTML = `
        <div class="material-wrapper player-material ${showMaterialIndicator ? '' : 'is-hidden'}"></div>
        <div class="player-info">Toi</div>
        <span class="captured-pieces-clock-player captured-pieces"></span>
        <div class="game-clock player-clock ${hasClock ? '' : 'is-hidden'}">--:--</div>
      `;
      mainWrap.insertBefore(bottomBar, mainBoard.nextSibling);
    }

    const barsActive = showMaterialIndicator || hasClock;
    topBar.classList.toggle('hidden-bar', !barsActive);
    bottomBar.classList.toggle('hidden-bar', !barsActive);
  }

  const opponentClockEl = block.querySelector<HTMLElement>('.opponent-clock');
  const playerClockEl = block.querySelector<HTMLElement>('.player-clock');
  if (opponentClockEl && playerClockEl) {
    opponentClockEl.classList.toggle('is-hidden', !hasClock);
    playerClockEl.classList.toggle('is-hidden', !hasClock);
  }
}

export function ensureCadenceSelector(
  block: HTMLElement,
  useStockfish: boolean,
  initialClockPreset: string
): void {
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
}

export function renderPromotionDialogDom(
  block: HTMLElement,
  val: { isEnabled?: boolean; color?: Color; callback?: (_piece: string) => void },
  onComplete: () => void
): void {
  if (!val || !val.isEnabled) {
    return;
  }
  const mainBoardEl = block.querySelector('.main-board');
  if (!mainBoardEl) {
    return;
  }

  const existingDialog = mainBoardEl.querySelector('.promotion-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'promotion-dialog';
  dialog.setAttribute('open', '');

  PROMOTION_PIECES.forEach((piece) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `${piece.name.toLowerCase()} ${val.color || 'white'}`;
    btn.setAttribute('aria-label', piece.name);

    const selectPiece = (e: Event) => {
      e.preventDefault();
      val.callback?.(piece.data);
      dialog.remove();
      onComplete();
    };

    btn.addEventListener('click', selectPiece);
    btn.addEventListener('touchstart', selectPiece);
    dialog.appendChild(btn);
  });

  mainBoardEl.appendChild(dialog);
}

export function updateStatusDisplay(params: {
  statusElement: HTMLElement | null;
  useStockfish: boolean;
  configDialog: HTMLElement | null;
  boardAPI: any;
  currentEngineStatus: EngineStatus;
  currentStockfishColor: Color | null;
}): void {
  const {
    statusElement,
    useStockfish,
    configDialog,
    boardAPI,
    currentEngineStatus,
    currentStockfishColor,
  } = params;
  if (!statusElement) {
    return;
  }

  if (useStockfish && configDialog && configDialog.style.display !== 'none') {
    statusElement.textContent = 'Choisissez vos options et commencez la partie.';
    return;
  }

  const boardState: any = typeof boardAPI?.getState === 'function' ? boardAPI.getState() : {};
  const isGameOver = boardState.isGameOver ?? boardAPI?.getIsGameOver();
  const isCheck = boardState.isCheck ?? boardAPI?.getIsCheck();
  const turnColor = boardState.turnColor ?? boardAPI?.getTurnColor();

  if (isGameOver) {
    statusElement.textContent = boardAPI.getGameOverReason();
    return;
  }

  if (isCheck) {
    const inCheckColor = turnColor === 'white' ? 'Blancs' : 'Noirs';
    statusElement.textContent = `Échec ! Au tour des ${inCheckColor}.`;
  } else if (useStockfish) {
    if (currentEngineStatus === 'loading') {
      statusElement.textContent = 'Chargement de Stockfish 19...';
    } else if (turnColor === currentStockfishColor) {
      statusElement.textContent = 'Le moteur réfléchit...';
    } else {
      statusElement.textContent = 'À vous de jouer.';
    }
  } else {
    statusElement.textContent = `Au tour des ${turnColor === 'white' ? 'Blancs' : 'Noirs'}.`;
  }
}

export function updateEvalBarDom(
  block: HTMLElement,
  boardAPI: any,
  lastEvaluation: StockfishEvaluation | null
): void {
  const barFill = block.querySelector<HTMLElement>('.evaluation-bar-fill');
  if (!barFill) {
    return;
  }
  const barContainer = block.querySelector<HTMLElement>('.evaluation-bar');

  if (!lastEvaluation) {
    barFill.style.height = '50%';
    if (barContainer) {
      barContainer.removeAttribute('title');
    }
    return;
  }

  const currentTurn = boardAPI.getTurnColor();
  const percentageWhite = computeEvalBarPercentage(
    currentTurn,
    lastEvaluation.scoreType,
    lastEvaluation.scoreValue,
    lastEvaluation.wdl
  );

  if (barContainer) {
    let tooltipText = '';
    if (lastEvaluation.scoreType === 'cp') {
      const evalScore = (lastEvaluation.whiteScoreValue ?? 0) / 100;
      const sign = evalScore > 0 ? '+' : '';
      tooltipText = `${sign}${evalScore.toFixed(2)}`;
    } else if (lastEvaluation.scoreType === 'mate') {
      const mateVal = lastEvaluation.scoreValue;
      const absMoves = Math.abs(mateVal);
      const sideChar = (lastEvaluation.whiteScoreValue ?? 0) > 0 ? 'B' : 'N';
      tooltipText = `Mat #${absMoves} (${sideChar})`;
    }
    if (lastEvaluation.winChancePercentage !== undefined) {
      tooltipText += ` (${Math.round(lastEvaluation.winChancePercentage)}% Blancs)`;
    }
    barContainer.setAttribute('title', tooltipText);
  }

  const currentOrientation = boardAPI.getOrientation();
  if (currentOrientation === 'white') {
    barFill.style.height = `${percentageWhite}%`;
    barFill.classList.remove('evaluation-bar-fill--flipped');
  } else {
    barFill.style.height = `${100 - percentageWhite}%`;
    barFill.classList.add('evaluation-bar-fill--flipped');
  }
}

export function buildStockfishEngineConfig(
  workerUrl: string,
  wasmUrl: string,
  whiteMode: 'disabled' | 'hint' | 'bot' | 'elo',
  blackMode: 'disabled' | 'hint' | 'bot' | 'elo',
  elo: number
): StockfishConfig {
  return {
    workerUrl,
    wasmUrl,
    whiteMode,
    whiteElo: whiteMode === 'elo' ? elo : undefined,
    blackMode,
    blackElo: blackMode === 'elo' ? elo : undefined,
    stockfishMoveTime: 1000,
    searchLimit: {
      nodes: getNodesForElo(elo),
    },
    showWdl: true,
    multiPv: 1,
  };
}

