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
export function useChessBoard( containerRef, initBoard, deps = [] ) {
	const [ boardApi, setBoardApi ] = useState( null );
	const boardApiRef = useRef( null );
	const initBoardRef = useRef( initBoard );

	useEffect( () => {
		initBoardRef.current = initBoard;
	}, [ initBoard ] );

	useEffect( () => {
		if (
			! containerRef.current ||
			typeof initBoardRef.current !== 'function'
		) {
			return;
		}

		const instance = initBoardRef.current();
		if ( ! instance ) {
			return;
		}

		boardApiRef.current = instance;
		setBoardApi( instance );

		let resizeObserver = null;
		let fallbackTimer = null;

		const triggerRedraw = () => {
			if ( boardApiRef.current ) {
				boardApiRef.current.redraw( true );
			}
		};

		// Immediate RAF + delayed timeouts to ensure styles & modal transitions are completed
		window.requestAnimationFrame( triggerRedraw );
		fallbackTimer = setTimeout( triggerRedraw, 50 );
		const secondaryTimer = setTimeout( triggerRedraw, 250 );

		if (
			typeof window.ResizeObserver !== 'undefined' &&
			containerRef.current
		) {
			resizeObserver = new window.ResizeObserver( ( entries ) => {
				for ( const entry of entries ) {
					if ( entry.contentRect.width > 0 && entry.contentRect.height > 0 ) {
						window.requestAnimationFrame( triggerRedraw );
					}
				}
			} );
			resizeObserver.observe( containerRef.current );
		}

		return () => {
			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}
			if ( fallbackTimer ) {
				clearTimeout( fallbackTimer );
			}
			if ( secondaryTimer ) {
				clearTimeout( secondaryTimer );
			}
			if ( instance && typeof instance.destroy === 'function' ) {
				instance.destroy();
			}
			boardApiRef.current = null;
			setBoardApi( null );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps );

	return { boardApi, boardApiRef };
}

export default useChessBoard;
