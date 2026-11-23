import { useEffect, useRef, useState, type DependencyList, type MutableRefObject, type RefObject } from 'react';

export interface BoardApi {
  redraw?: (_now?: boolean) => void;
  clearDomBounds?: () => void;
  destroy?: () => void;
  [key: string]: unknown;
}

export interface UseChessBoardReturn<T extends BoardApi = BoardApi> {
  boardApi: T | null;
  boardApiRef: MutableRefObject<T | null>;
}

/**
 * Custom Hook pour l'initialisation et l'orchestration de BoardCore.
 *
 * Gère l'instanciation de BoardCore dans le conteneur HTML, le suivi du redimensionnement
 * via ResizeObserver pour forcer le recalcul des bounds et le nettoyage au démontage.
 */
export function useChessBoard<T extends BoardApi = BoardApi>(
  containerRef: RefObject<HTMLElement | null>,
  initBoard: () => T | null | undefined,
  deps: DependencyList = []
): UseChessBoardReturn<T> {
  const [boardApi, setBoardApi] = useState<T | null>(null);
  const boardApiRef = useRef<T | null>(null);
  const initBoardRef = useRef(initBoard);

  useEffect(() => {
    initBoardRef.current = initBoard;
  }, [initBoard]);

  useEffect(() => {
    if (!containerRef.current || typeof initBoardRef.current !== 'function') {
      return;
    }

    const instance = initBoardRef.current();
    if (!instance) {
      return;
    }

    boardApiRef.current = instance;
    setBoardApi(instance);

    const containerEl = containerRef.current;
    const ownerDoc = containerEl.ownerDocument ?? document;
    const ownerWin = ownerDoc.defaultView ?? window;
    let resizeObserver: ResizeObserver | null = null;

    const triggerRedraw = () => {
      if (boardApiRef.current && typeof boardApiRef.current.redraw === 'function') {
        boardApiRef.current.redraw(true);
      }
    };

    // Synchronisation initiale après montage dans le frame d'animation suivant
    ownerWin.requestAnimationFrame(triggerRedraw);

    const ResizeObserverCtor = ownerWin.ResizeObserver ?? window.ResizeObserver;
    if (typeof ResizeObserverCtor !== 'undefined') {
      let lastWidth = 0;
      let lastHeight = 0;

      resizeObserver = new ResizeObserverCtor((entries) => {
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
              ownerWin.requestAnimationFrame(triggerRedraw);
            }
          }
        }
      });
      resizeObserver.observe(containerEl);
    }

    // Synchronisation immédiate des coordonnées DOM lors de toute interaction ou redimensionnement
    const clearBounds = () => {
      if (
        boardApiRef.current &&
        typeof boardApiRef.current.clearDomBounds === 'function'
      ) {
        boardApiRef.current.clearDomBounds();
      }
    };

    containerEl.addEventListener('pointerdown', clearBounds, true);
    containerEl.addEventListener('mousedown', clearBounds, true);
    containerEl.addEventListener('touchstart', clearBounds, true);

    ownerWin.addEventListener('scroll', clearBounds, {
      capture: true,
      passive: true,
    });
    ownerWin.addEventListener('resize', clearBounds, { passive: true });
    ownerDoc.addEventListener('scroll', clearBounds, {
      capture: true,
      passive: true,
    });

    return () => {
      containerEl.removeEventListener('pointerdown', clearBounds, true);
      containerEl.removeEventListener('mousedown', clearBounds, true);
      containerEl.removeEventListener('touchstart', clearBounds, true);

      ownerWin.removeEventListener('scroll', clearBounds, { capture: true });
      ownerWin.removeEventListener('resize', clearBounds);
      ownerDoc.removeEventListener('scroll', clearBounds, { capture: true });

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
      boardApiRef.current = null;
      setBoardApi(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { boardApi, boardApiRef };
}

export default useChessBoard;
