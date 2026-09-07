import { useEffect, useRef, useState } from 'react';

/**
 * Custom Hook pour l'initialisation et l'orchestration de BoardCore.
 *
 * Gère l'instanciation de BoardCore dans le conteneur HTML, le suivi du redimensionnement
 * via ResizeObserver pour forcer le recalcul des bounds et le nettoyage au démontage.
 *
 * @param {React.RefObject<HTMLElement>} containerRef - Référence HTML du conteneur
 * @param {Function}                     initBoard    - Fonction factory créant et retournant l'instance BoardCore
 * @param {Array}                        [deps=[]]    - Tableau de dépendances de réinitialisation
 * @return {{ boardApi: Object|null, boardApiRef: React.MutableRefObject<Object|null> }} Objet contenant l'instance et sa référence.
 */
export function useChessBoard(containerRef, initBoard, deps = []) {
	const [boardApi, setBoardApi] = useState(null);
	const boardApiRef = useRef(null);
	const initBoardRef = useRef(initBoard);

	useEffect(() => {
		initBoardRef.current = initBoard;
	}, [initBoard]);

	useEffect(() => {
		if (
			!containerRef.current ||
			typeof initBoardRef.current !== 'function'
		) {
			return;
		}

		const instance = initBoardRef.current();
		if (!instance) {
			return;
		}

		boardApiRef.current = instance;
		setBoardApi(instance);

		let resizeObserver = null;

		const triggerRedraw = () => {
			if (boardApiRef.current) {
				boardApiRef.current.redraw(true);
			}
		};

		// Synchronisation initiale après montage dans le frame d'animation suivant
		window.requestAnimationFrame(triggerRedraw);

		if (
			typeof window.ResizeObserver !== 'undefined' &&
			containerRef.current
		) {
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
		let forwardEvent = null;
		let win = null;

		if (doc && doc !== document) {
			forwardEvent = (e) => {
				if (e.__isForwarded) {
					return;
				}
				if (e.type.startsWith('touch')) {
					try {
						const touch = e.touches[0] || e.changedTouches[0];
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
						eventCopy.__isForwarded = true;
						document.dispatchEvent(eventCopy);
					} catch {}
					return;
				}
				const eventCopy = new window.MouseEvent(e.type, {
					bubbles: true,
					cancelable: true,
					view: window,
					clientX: e.clientX,
					clientY: e.clientY,
					screenX: e.screenX,
					screenY: e.screenY,
					button: e.button,
					buttons: e.buttons,
					ctrlKey: e.ctrlKey,
					shiftKey: e.shiftKey,
					altKey: e.altKey,
					metaKey: e.metaKey,
				});
				eventCopy.__isForwarded = true;
				document.dispatchEvent(eventCopy);
			};

			doc.addEventListener('mousemove', forwardEvent, true);
			doc.addEventListener('mouseup', forwardEvent, true);
			doc.addEventListener('touchmove', forwardEvent, true);
			doc.addEventListener('touchend', forwardEvent, true);
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
			window.removeEventListener('scroll', clearBounds, {
				capture: true,
				passive: true,
			});
			window.removeEventListener('resize', clearBounds, {
				passive: true,
			});
			document.removeEventListener('scroll', clearBounds, {
				capture: true,
				passive: true,
			});

			if (doc && forwardEvent) {
				doc.removeEventListener('mousemove', forwardEvent, true);
				doc.removeEventListener('mouseup', forwardEvent, true);
				doc.removeEventListener('touchmove', forwardEvent, true);
				doc.removeEventListener('touchend', forwardEvent, true);
				doc.removeEventListener('scroll', clearBounds, {
					capture: true,
					passive: true,
				});
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
