import { useEffect, useRef, useState, type DependencyList, type MutableRefObject, type RefObject } from 'react';

export interface BoardApi {
  redraw?: (now?: boolean) => void;
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

    let resizeObserver: ResizeObserver | null = null;

    const triggerRedraw = () => {
      if (boardApiRef.current && typeof boardApiRef.current.redraw === 'function') {
        boardApiRef.current.redraw(true);
      }
    };

    // Synchronisation initiale après montage dans le frame d'animation suivant
    window.requestAnimationFrame(triggerRedraw);

    if (typeof window.ResizeObserver !== 'undefined' && containerRef.current) {
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
      resizeObserver.observe(containerRef.current);
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

    const containerEl = containerRef.current;
    containerEl.addEventListener('pointerdown', clearBounds, true);
    containerEl.addEventListener('mousedown', clearBounds, true);
    containerEl.addEventListener('touchstart', clearBounds, true);

    window.addEventListener('scroll', clearBounds, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', clearBounds, { passive: true });
    document.addEventListener('scroll', clearBounds, {
      capture: true,
      passive: true,
    });

    // Relai d'événements et synchronisation des coordonnées lorsque le plateau est dans une iFrame (ex: Gutenberg canvas)
    const doc = containerRef.current.ownerDocument;
    let forwardEvent: ((e: MouseEvent | TouchEvent) => void) | null = null;
    let win: Window | null = null;

    if (doc && doc !== document) {
      forwardEvent = (e: MouseEvent | TouchEvent) => {
        if ((e as unknown as { __isForwarded?: boolean }).__isForwarded) {
          return;
        }
        if (e.type.startsWith('touch')) {
          try {
            const touchEvent = e as TouchEvent;
            const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
            const eventCopy = new window.MouseEvent(
              e.type === 'touchmove' ? 'mousemove' : 'mouseup',
              {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: touch ? touch.clientX : 0,
                clientY: touch ? touch.clientY : 0,
                button: 0,
                buttons: 1,
              }
            );
            (eventCopy as unknown as { __isForwarded?: boolean }).__isForwarded = true;
            document.dispatchEvent(eventCopy);
          } catch {}
          return;
        }

        const mouseEvent = e as MouseEvent;
        const eventCopy = new window.MouseEvent(mouseEvent.type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: mouseEvent.clientX,
          clientY: mouseEvent.clientY,
          screenX: mouseEvent.screenX,
          screenY: mouseEvent.screenY,
          button: mouseEvent.button,
          buttons: mouseEvent.buttons,
          ctrlKey: mouseEvent.ctrlKey,
          shiftKey: mouseEvent.shiftKey,
          altKey: mouseEvent.altKey,
          metaKey: mouseEvent.metaKey,
        });
        (eventCopy as unknown as { __isForwarded?: boolean }).__isForwarded = true;
        document.dispatchEvent(eventCopy);
      };

      doc.addEventListener('mousemove', forwardEvent as EventListener, true);
      doc.addEventListener('mouseup', forwardEvent as EventListener, true);
      doc.addEventListener('touchmove', forwardEvent as EventListener, true);
      doc.addEventListener('touchend', forwardEvent as EventListener, true);
      doc.addEventListener('scroll', clearBounds, {
        capture: true,
        passive: true,
      });

      win = doc.defaultView;
      if (win && win !== window) {
        win.addEventListener('resize', clearBounds);
      }
    }

    return () => {
      if (containerEl) {
        containerEl.removeEventListener(
          'pointerdown',
          clearBounds,
          true
        );
        containerEl.removeEventListener('mousedown', clearBounds, true);
        containerEl.removeEventListener(
          'touchstart',
          clearBounds,
          true
        );
      }
      window.removeEventListener('scroll', clearBounds, { capture: true });
      window.removeEventListener('resize', clearBounds);
      document.removeEventListener('scroll', clearBounds, { capture: true });

      if (doc && forwardEvent) {
        doc.removeEventListener('mousemove', forwardEvent as EventListener, true);
        doc.removeEventListener('mouseup', forwardEvent as EventListener, true);
        doc.removeEventListener('touchmove', forwardEvent as EventListener, true);
        doc.removeEventListener('touchend', forwardEvent as EventListener, true);
        doc.removeEventListener('scroll', clearBounds, { capture: true });
      }
      if (win && win !== window) {
        win.removeEventListener('resize', clearBounds);
      }
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
