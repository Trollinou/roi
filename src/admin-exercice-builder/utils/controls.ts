/**
 * Controls utility for unified FEN & PGN inputs management.
 */

import { openFenEditor, openPgnEditor } from './modals';
import {
  getActiveColorFromFen,
  checkPgnStatus,
  hasPgnMoves,
  updatePgnStatus,
  extractFenOrientationAndShapes,
  type PgnStatusCode,
} from './pgn-status';
import type { BoardShape, Color, PgnString } from '../../types/chess';
import type { FenEditorSavePayload } from '../../components/FenEditor';

export {
  getActiveColorFromFen,
  checkPgnStatus,
  hasPgnMoves,
  updatePgnStatus,
  extractFenOrientationAndShapes,
  type PgnStatusCode,
};

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
  onChange?: (_fen: string, _color: Color, _shapes: BoardShape[]) => void;
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

export interface SetupPgnControlOptions {
  textarea?: string | HTMLTextAreaElement | HTMLInputElement | null;
  input?: string | HTMLInputElement | null;
  button?: string | HTMLElement | null;
  status?: string | HTMLElement | null;
  initialFen?: string | (() => string);
  onChange?: (_pgn: string) => void;
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
