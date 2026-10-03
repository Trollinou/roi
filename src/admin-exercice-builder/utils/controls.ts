/**
 * Controls utility for unified FEN & PGN inputs management.
 */

import { openFenEditor, openPgnEditor } from './modals';
import { parsePgn } from 'chessops/pgn';
import { extractShapesFromComments } from '../../utils/chessUtils';
import type { BoardShape, Color, PgnString } from '../../types/chess';
import type { FenEditorSavePayload } from '../../components/FenEditor';

export function getActiveColorFromFen(fen: string | undefined): Color {
  if (typeof fen !== 'string') {
    return 'white';
  }
  const parts = fen.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[1].toLowerCase() === 'b' ? 'black' : 'white';
  }
  return 'white';
}

export function formatShapesSummary(shapes: BoardShape[] | undefined): string {
  if (!Array.isArray(shapes) || shapes.length === 0) {
    return '0 ◯ - 0 ➔';
  }
  let circles = 0;
  let arrows = 0;
  shapes.forEach((shape) => {
    if (shape && shape.orig) {
      if (shape.dest && shape.dest !== shape.orig) {
        arrows++;
      } else {
        circles++;
      }
    }
  });
  return `${circles} ◯ - ${arrows} ➔`;
}

export function updateOrientationDisplay(element: HTMLElement | null, color: string): void {
  if (!element) {
    return;
  }
  const colorNormalized: Color =
    color === 'b' || color === 'black' || color === 'Noir'
      ? 'black'
      : 'white';
  const displayText = colorNormalized === 'black' ? 'Noir' : 'Blanc';

  if (element instanceof HTMLInputElement) {
    element.value = displayText;
    element.dataset.color = colorNormalized;
  } else if (element instanceof HTMLSelectElement) {
    element.value = colorNormalized;
    element.dataset.color = colorNormalized;
  } else {
    element.textContent = displayText;
    element.dataset.color = colorNormalized;
  }
}

export function getOrientationColor(element: HTMLElement | null, fallbackFen = ''): Color {
  if (element && element.dataset && element.dataset.color) {
    return element.dataset.color as Color;
  }
  if (element && 'value' in element) {
    const val = String((element as HTMLInputElement).value).toLowerCase().trim();
    if (
      val === 'black' ||
      val === 'noir' ||
      val === 'noirs' ||
      val === 'b'
    ) {
      return 'black';
    }
    if (
      val === 'white' ||
      val === 'blanc' ||
      val === 'blancs' ||
      val === 'w'
    ) {
      return 'white';
    }
  }
  return getActiveColorFromFen(fallbackFen);
}

export interface SetupFenControlOptions {
  input: string | HTMLInputElement | null;
  button?: string | HTMLElement | null;
  colorSelect?: string | HTMLElement | null;
  shapesInput?: string | HTMLInputElement | null;
  shapesSummary?: string | HTMLElement | null;
  onChange?: (fen: string, color: Color, shapes: BoardShape[]) => void;
  getShapes?: () => BoardShape[];
}

export function setupFenControl({
  input,
  button,
  colorSelect,
  shapesInput,
  shapesSummary,
  onChange,
  getShapes,
}: SetupFenControlOptions): void {
  const inputEl =
    typeof input === 'string' ? (document.getElementById(input) as HTMLInputElement | null) : input;
  const buttonEl =
    typeof button === 'string' ? document.getElementById(button) : button;

  let colorSelectEl =
    typeof colorSelect === 'string'
      ? document.getElementById(colorSelect)
      : colorSelect;
  if (!colorSelectEl && buttonEl && buttonEl.dataset.targetColor) {
    colorSelectEl = document.getElementById(buttonEl.dataset.targetColor);
  }

  let shapesInputEl =
    typeof shapesInput === 'string'
      ? (document.getElementById(shapesInput) as HTMLInputElement | null)
      : shapesInput;
  if (!shapesInputEl && buttonEl && buttonEl.dataset.targetShapes) {
    shapesInputEl = document.getElementById(buttonEl.dataset.targetShapes) as HTMLInputElement | null;
  } else if (!shapesInputEl && inputEl) {
    shapesInputEl = document.getElementById(inputEl.id + '_shapes') as HTMLInputElement | null;
  }

  let shapesSummaryEl =
    typeof shapesSummary === 'string'
      ? document.getElementById(shapesSummary)
      : shapesSummary;
  if (!shapesSummaryEl && buttonEl && buttonEl.dataset.targetShapesSummary) {
    shapesSummaryEl = document.getElementById(
      buttonEl.dataset.targetShapesSummary
    );
  } else if (!shapesSummaryEl && inputEl) {
    shapesSummaryEl = document.getElementById(
      inputEl.id + '_shapes_summary'
    );
  }

  function syncFields(fenVal: string, shapesArray: BoardShape[], triggerCallback = true) {
    const detectedColor = getActiveColorFromFen(fenVal);
    updateOrientationDisplay(colorSelectEl || null, detectedColor);

    const shapes = Array.isArray(shapesArray) ? shapesArray : [];
    const summaryText = formatShapesSummary(shapes);

    if (shapesSummaryEl) {
      if (shapesSummaryEl instanceof HTMLInputElement) {
        shapesSummaryEl.value = summaryText;
      } else {
        shapesSummaryEl.textContent = summaryText;
      }
    }

    if (shapesInputEl) {
      shapesInputEl.value = JSON.stringify(shapes);
    }

    if (triggerCallback && typeof onChange === 'function') {
      onChange(fenVal, detectedColor, shapes);
    }
  }

  function flashFeedback(inputElement: HTMLElement | null, summaryElement: HTMLElement | null) {
    if (!inputElement) {
      return;
    }
    inputElement.style.transition =
      'background-color 0.3s, border-color 0.3s';
    inputElement.style.backgroundColor = '#e7f7ed';
    inputElement.style.borderColor = '#00a32a';
    if (summaryElement) {
      summaryElement.style.transition =
        'background-color 0.3s, color 0.3s';
      summaryElement.style.backgroundColor = '#e7f7ed';
      summaryElement.style.color = '#00a32a';
      summaryElement.style.fontWeight = 'bold';
    }
    setTimeout(() => {
      inputElement.style.backgroundColor = '';
      inputElement.style.borderColor = '';
      if (summaryElement) {
        summaryElement.style.backgroundColor = '';
        summaryElement.style.color = '';
        summaryElement.style.fontWeight = '';
      }
    }, 1200);
  }

  if (inputEl) {
    const initialFen = inputEl.value.trim();
    let initialShapes: BoardShape[] = [];
    if (typeof getShapes === 'function') {
      initialShapes = getShapes() || [];
    } else if (shapesInputEl && shapesInputEl.value) {
      try {
        initialShapes = JSON.parse(shapesInputEl.value);
      } catch {}
    }
    syncFields(initialFen, initialShapes, false);

    inputEl.addEventListener('paste', function (e: ClipboardEvent) {
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && typeof pastedText === 'string') {
        const trimmed = pastedText.trim();
        const isPgnOrComplex =
          trimmed.includes('[') ||
          trimmed.includes('{') ||
          trimmed.includes('\n') ||
          /\[%(?:csl|cpl|cal)/i.test(trimmed) ||
          /\b\d+\s*\./.test(trimmed);

        if (isPgnOrComplex) {
          e.preventDefault();
          const extracted = extractFenOrientationAndShapes(trimmed);
          if (extracted && extracted.fen) {
            inputEl.value = extracted.fen;
            syncFields(extracted.fen, extracted.shapes || [], true);
            flashFeedback(inputEl, shapesSummaryEl || null);
          }
        }
      }
    });

    inputEl.addEventListener('input', function () {
      const currentVal = inputEl.value.trim();
      const isPgnOrComplex =
        currentVal.includes('[') ||
        currentVal.includes('{') ||
        currentVal.includes('\n') ||
        /\[%(?:csl|cpl|cal)/i.test(currentVal) ||
        /\b\d+\s*\./.test(currentVal);

      if (isPgnOrComplex) {
        const extracted = extractFenOrientationAndShapes(currentVal);
        if (extracted && extracted.fen) {
          inputEl.value = extracted.fen;
          syncFields(extracted.fen, extracted.shapes || [], true);
          flashFeedback(inputEl, shapesSummaryEl || null);
          return;
        }
      }

      syncFields(currentVal, [], true);
    });
  }

  if (buttonEl) {
    buttonEl.addEventListener('click', function (event: MouseEvent) {
      event.preventDefault();
      const currentFen = inputEl
        ? inputEl.value.trim()
        : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      let currentShapes: BoardShape[] = [];
      if (typeof getShapes === 'function') {
        currentShapes = getShapes();
      } else if (shapesInputEl && shapesInputEl.value) {
        try {
          currentShapes = JSON.parse(shapesInputEl.value);
        } catch {}
      }

      openFenEditor(
        { fen: currentFen, shapes: currentShapes },
        function ({ fen, shapes: newShapes }: FenEditorSavePayload) {
          const newFen = fen || currentFen;
          if (inputEl) {
            inputEl.value = newFen;
          }
          syncFields(newFen, newShapes || [], true);
        }
      );
    });
  }
}

export type PgnStatusCode = 'empty' | 'valid_with_moves' | 'valid_no_moves' | 'invalid';

export function checkPgnStatus(pgnString: string | undefined): PgnStatusCode {
  if (!pgnString || typeof pgnString !== 'string') {
    return 'empty';
  }
  const trimmed = pgnString.trim();
  if (!trimmed) {
    return 'empty';
  }

  try {
    const games = parsePgn(trimmed);
    if (!games || games.length === 0) {
      return 'invalid';
    }
    const game = games[0];
    const hasMoves = !!(
      game.moves &&
      game.moves.children &&
      game.moves.children.length > 0
    );

    if (hasMoves) {
      return 'valid_with_moves';
    }

    const hasExplicitHeader = /\[\s*[A-Za-z0-9_]+\s+"[^"]*"\s*\]/.test(trimmed);
    const hasExplicitComment = /\{[^}]*\}/.test(trimmed);

    if (hasExplicitHeader || hasExplicitComment) {
      return 'valid_no_moves';
    }

    return 'invalid';
  } catch {
    return 'invalid';
  }
}

export function hasPgnMoves(pgnString: string | undefined): boolean {
  return checkPgnStatus(pgnString) === 'valid_with_moves';
}

export function updatePgnStatus(
  textareaEl: HTMLTextAreaElement | HTMLInputElement | null,
  statusEl?: HTMLElement | null
): void {
  if (!textareaEl) {
    return;
  }
  let targetStatusEl: HTMLElement | null = statusEl || null;
  if (!targetStatusEl && textareaEl.id) {
    targetStatusEl = document.getElementById(`${textareaEl.id}_status`);
  }
  if (!targetStatusEl) {
    const wrapper =
      textareaEl.closest('.roi-control-textarea-wrapper') ||
      textareaEl.parentElement;
    if (wrapper) {
      targetStatusEl = wrapper.querySelector('.roi-pgn-status') as HTMLElement | null;
      if (!targetStatusEl) {
        targetStatusEl = document.createElement('div');
        targetStatusEl.className = 'roi-pgn-status';
        wrapper.appendChild(targetStatusEl);
      }
    }
  }

  if (!targetStatusEl) {
    return;
  }

  const status = checkPgnStatus(textareaEl.value);

  if (status === 'empty') {
    targetStatusEl.style.display = 'none';
    targetStatusEl.innerHTML = '';
    return;
  }

  if (status === 'invalid') {
    targetStatusEl.style.display = 'block';
    targetStatusEl.className = 'roi-pgn-status roi-pgn-status-error';
    targetStatusEl.style.marginTop = '6px';
    targetStatusEl.style.padding = '6px 10px';
    targetStatusEl.style.backgroundColor = '#fcf0f1';
    targetStatusEl.style.border = '1px solid #d63638';
    targetStatusEl.style.borderLeft = '4px solid #d63638';
    targetStatusEl.style.borderRadius = '3px';
    targetStatusEl.style.color = '#8a1f11';
    targetStatusEl.style.fontSize = '12px';
    targetStatusEl.style.lineHeight = '1.4';
    targetStatusEl.innerHTML =
      '❌ <strong>Format PGN non reconnu</strong> ou invalide. Veuillez coller un PGN valide ou utiliser <em>« Éditer le PGN »</em>.';
    return;
  }

  if (status === 'valid_no_moves') {
    targetStatusEl.style.display = 'block';
    targetStatusEl.className = 'roi-pgn-status roi-pgn-status-warning';
    targetStatusEl.style.marginTop = '6px';
    targetStatusEl.style.padding = '6px 10px';
    targetStatusEl.style.backgroundColor = '#fff8e5';
    targetStatusEl.style.border = '1px solid #dba617';
    targetStatusEl.style.borderLeft = '4px solid #dba617';
    targetStatusEl.style.borderRadius = '3px';
    targetStatusEl.style.color = '#614700';
    targetStatusEl.style.fontSize = '12px';
    targetStatusEl.style.lineHeight = '1.4';
    targetStatusEl.innerHTML =
      '⚠️ <strong>Aucun coup solution détecté</strong> dans ce PGN (uniquement position / commentaires). Cliquez sur <em>« Éditer le PGN »</em> pour jouer le coup attendu.';
    return;
  }

  if (status === 'valid_with_moves') {
    targetStatusEl.style.display = 'block';
    targetStatusEl.className = 'roi-pgn-status roi-pgn-status-success';
    targetStatusEl.style.marginTop = '6px';
    targetStatusEl.style.padding = '4px 8px';
    targetStatusEl.style.backgroundColor = '#edfaef';
    targetStatusEl.style.border = '1px solid #68de7c';
    targetStatusEl.style.borderLeft = '4px solid #00a32a';
    targetStatusEl.style.borderRadius = '3px';
    targetStatusEl.style.color = '#135e26';
    targetStatusEl.style.fontSize = '12px';
    targetStatusEl.style.lineHeight = '1.4';
    targetStatusEl.innerHTML =
      '✓ <strong>Coup(s) solution présent(s)</strong> dans la séquence PGN.';
  }
}

export interface SetupPgnControlOptions {
  textarea?: string | HTMLTextAreaElement | HTMLInputElement | null;
  input?: string | HTMLInputElement | null;
  button?: string | HTMLElement | null;
  status?: string | HTMLElement | null;
  initialFen?: string | (() => string);
  onChange?: (pgn: string) => void;
}

export function setupPgnControl({
  textarea,
  input,
  button,
  status,
  initialFen,
  onChange,
}: SetupPgnControlOptions): void {
  const textareaEl =
    typeof textarea === 'string'
      ? (document.getElementById(textarea) as HTMLTextAreaElement | HTMLInputElement | null)
      : (textarea || (typeof input === 'string' ? (document.getElementById(input) as HTMLInputElement | null) : input));
  const buttonEl =
    typeof button === 'string' ? document.getElementById(button) : button;
  const statusEl =
    typeof status === 'string' ? document.getElementById(status) : status;

  if (textareaEl) {
    updatePgnStatus(textareaEl, statusEl || null);

    textareaEl.addEventListener('input', function () {
      updatePgnStatus(textareaEl, statusEl || null);
      if (typeof onChange === 'function') {
        onChange(textareaEl.value);
      }
    });
  }

  if (buttonEl) {
    buttonEl.addEventListener('click', function (e: MouseEvent) {
      e.preventDefault();
      const currentPgn = textareaEl ? textareaEl.value : '';
      const fen =
        typeof initialFen === 'function'
          ? initialFen()
          : initialFen || '';

      openPgnEditor(
        currentPgn,
        function (newPgn: PgnString) {
          if (textareaEl) {
            textareaEl.value = newPgn;
            updatePgnStatus(textareaEl, statusEl || null);
          }
          if (typeof onChange === 'function') {
            onChange(newPgn);
          }
        },
        fen
      );
    });
  }
}

export function extractFenOrientationAndShapes(pgnString: string | undefined): {
  fen: string;
  orientation: Color;
  shapes: BoardShape[];
} {
  if (!pgnString || typeof pgnString !== 'string') {
    const defaultFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    return { fen: defaultFen, orientation: 'white', shapes: [] };
  }

  const trimmed = pgnString.trim();

  // 1. Balise [FEN "..."]
  const fenMatch = trimmed.match(/\[FEN\s+"([^"]+)"\]/i);
  let fen = fenMatch
    ? fenMatch[1].trim()
    : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  if (!fenMatch && trimmed.includes('/') && !trimmed.startsWith('[')) {
    let firstLine = trimmed.split('\n')[0].trim();
    if (firstLine.includes('{')) {
      firstLine = firstLine.split('{')[0].trim();
    }
    if (firstLine.includes('/') && firstLine.split('/').length >= 4) {
      fen = firstLine;
    }
  }

  const fenParts = fen.split(/\s+/);
  if (fenParts.length === 1 && fenParts[0].includes('/')) {
    fen = `${fenParts[0]} w - - 0 1`;
  }

  const orientation = getActiveColorFromFen(fen);
  const shapes: BoardShape[] = [];

  let rootComments: string[] = [];
  try {
    const games = parsePgn(trimmed);
    if (games && games.length > 0) {
      const game = games[0];
      if (game.headers && typeof (game.headers as any).get === 'function') {
        const fenHeader = (game.headers as any).get('FEN');
        if (fenHeader) {
          fen = fenHeader.trim();
        }
      }
      if (Array.isArray(game.comments) && game.comments.length > 0) {
        rootComments = game.comments;
      }
    }
  } catch {
    const firstMoveIndex = trimmed.search(/\b\d+\s*\./);
    const initialSection =
      firstMoveIndex !== -1 ? trimmed.slice(0, firstMoveIndex) : trimmed;
    const fallbackMatches = initialSection.match(/\{([^}]*)\}/g);
    if (fallbackMatches) {
      rootComments = fallbackMatches.map((c) => c.slice(1, -1));
    }
  }

  if (rootComments.length > 0) {
    const parsed = extractShapesFromComments(rootComments.join(' '));
    shapes.push(...parsed.shapes);
  }

  return { fen, orientation, shapes };
}
