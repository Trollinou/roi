/**
 * Modals management for FEN and PGN editors.
 */

import type { BoardShape, FenString, PgnString } from '../../types/chess';
import type { DiagramData, FenEditorSavePayload } from '../../components/FenEditor';

export function openFenEditor(
  initialData: DiagramData | FenString,
  onSaveCallback: (payload: FenEditorSavePayload) => void
): void {
  const modalOverlay = document.getElementById('roi_fen_modal_overlay');
  const reactRoot = document.getElementById('roi_fen_react_root');

  if (!modalOverlay || !reactRoot) {
    return;
  }

  const modalCloseBtn = document.getElementById('roi_fen_modal_close');
  const cleanedFen: string =
    typeof initialData === 'string'
      ? initialData.trim()
      : initialData?.fen ||
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const initialShapes: BoardShape[] =
    typeof initialData === 'object' && Array.isArray(initialData.shapes)
      ? initialData.shapes
      : [];

  modalOverlay.style.display = 'flex';

  const cleanClose = () => {
    if (window.wp && window.wp.element) {
      window.wp.element.unmountComponentAtNode(reactRoot);
    }
    modalOverlay.style.display = 'none';
    if (modalCloseBtn) {
      modalCloseBtn.removeEventListener('click', cleanClose);
    }
    modalOverlay.removeEventListener('click', handleOverlayClick);
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === modalOverlay) {
      cleanClose();
    }
  };

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', cleanClose);
  }
  modalOverlay.addEventListener('click', handleOverlayClick);

  if (window.RoiFenEditor && window.wp && window.wp.element) {
    const editorComponent =
      window.RoiFenEditor.default || window.RoiFenEditor;
    const element = window.wp.element.createElement(editorComponent, {
      initialFen: cleanedFen,
      initialShapes,
      diagram: { fen: cleanedFen, shapes: initialShapes },
      onSave(result: FenEditorSavePayload) {
        onSaveCallback(result);
        cleanClose();
      },
    });
    window.wp.element.render(element, reactRoot);
  }
}

export function openPgnEditor(
  initialPgn: PgnString,
  onSaveCallback: (newPgn: PgnString, finalFen: FenString) => void,
  initialFen: FenString = ''
): void {
  const pgnModalOverlay = document.getElementById('roi_pgn_modal_overlay');
  const pgnReactRoot = document.getElementById('roi_pgn_react_root');

  if (!pgnModalOverlay || !pgnReactRoot) {
    return;
  }

  const pgnModalCloseBtn = document.getElementById('roi_pgn_modal_close');
  const cleanedPgn = typeof initialPgn === 'string' ? initialPgn.trim() : '';
  const cleanedFen = typeof initialFen === 'string' ? initialFen.trim() : '';

  pgnModalOverlay.style.display = 'flex';

  const cleanClose = () => {
    if (window.wp && window.wp.element) {
      window.wp.element.unmountComponentAtNode(pgnReactRoot);
    }
    pgnModalOverlay.style.display = 'none';
    if (pgnModalCloseBtn) {
      pgnModalCloseBtn.removeEventListener('click', cleanClose);
    }
    pgnModalOverlay.removeEventListener('click', handleOverlayClick);
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === pgnModalOverlay) {
      cleanClose();
    }
  };

  if (pgnModalCloseBtn) {
    pgnModalCloseBtn.addEventListener('click', cleanClose);
  }
  pgnModalOverlay.addEventListener('click', handleOverlayClick);

  if (window.RoiPgnEditor && window.wp && window.wp.element) {
    const editorComponent =
      window.RoiPgnEditor.default || window.RoiPgnEditor;
    const elementProps: Record<string, unknown> = {
      initialPgn: cleanedPgn,
      onSave(nouveauPgn: PgnString, finalFen: FenString) {
        onSaveCallback(nouveauPgn, finalFen);
        cleanClose();
      },
    };
    if (cleanedFen) {
      elementProps.initialFen = cleanedFen;
    }
    const element = window.wp.element.createElement(
      editorComponent,
      elementProps
    );
    window.wp.element.render(element, pgnReactRoot);
  }
}
