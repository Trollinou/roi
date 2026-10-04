import { store, getContext, getElement } from '@wordpress/interactivity';
import { BoardCore } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import type { PgnString, Color } from '../../types';

declare global {
	interface Window {
		pgnViewInitialized?: boolean;
	}
}

/**
 * Initializes a PGN viewer instance on a given container element.
 */
function initPgnInstance(block: HTMLElement, mountElement: HTMLElement, contextData?: Record<string, any>) {
	if ((block as any)._pgnInitialized) {
		return;
	}
	(block as any)._pgnInitialized = true;

	const pgn = (contextData?.pgn || block.getAttribute('data-pgn') || '') as PgnString;
	const orientation = (contextData?.orientation || block.getAttribute('data-orientation') || 'white') as Color;

	const config = {
		mode: 'study' as const,
		pgn,
		orientation,
		coordinates: true,
		viewOnly: true,
		movable: {
			free: false,
		},
		draggable: {
			enabled: false,
		},
		drawable: {
			enabled: false,
		},
	};

	const boardState = {
		mode: 'study' as const,
		showThreats: false,
		promotionDialogState: { isEnabled: false },
		historyViewerState: { isEnabled: false },
	};

	const boardAPI = new BoardCore(
		mountElement,
		boardState,
		() => {},
		() => {},
		config,
		{
			whiteMode: 'disabled',
			blackMode: 'disabled',
		}
	);

	(block as any)._boardAPI = boardAPI;

	if (pgn) {
		try {
			boardAPI.loadPgn(pgn);
		} catch (e) {
			console.warn('Error loading PGN:', e);
		}
	}
}

store('roi/pgn', {
	state: {
		defaultOrientation: 'white',
	},
	actions: {
		viewStart(event: Event) {
			const btn = event.target as HTMLElement;
			const block = btn.closest<HTMLElement>('.roi-bloc-pgn, .chessboard-block');
			const boardAPI = (block as any)?._boardAPI;
			if (boardAPI && typeof boardAPI.viewStart === 'function') {
				boardAPI.viewStart();
			}
		},
		viewPrev(event: Event) {
			const btn = event.target as HTMLElement;
			const block = btn.closest<HTMLElement>('.roi-bloc-pgn, .chessboard-block');
			const boardAPI = (block as any)?._boardAPI;
			if (boardAPI && typeof boardAPI.viewPrevious === 'function') {
				boardAPI.viewPrevious();
			}
		},
		viewNext(event: Event) {
			const btn = event.target as HTMLElement;
			const block = btn.closest<HTMLElement>('.roi-bloc-pgn, .chessboard-block');
			const boardAPI = (block as any)?._boardAPI;
			if (boardAPI && typeof boardAPI.viewNext === 'function') {
				boardAPI.viewNext();
			}
		},
		viewEnd(event: Event) {
			const btn = event.target as HTMLElement;
			const block = btn.closest<HTMLElement>('.roi-bloc-pgn, .chessboard-block');
			const boardAPI = (block as any)?._boardAPI;
			if (boardAPI) {
				if (typeof boardAPI.stopViewingHistory === 'function') {
					boardAPI.stopViewingHistory();
				} else if (typeof boardAPI.viewEnd === 'function') {
					boardAPI.viewEnd();
				}
			}
		},
		flipBoard(event: Event) {
			const btn = event.target as HTMLElement;
			const block = btn.closest<HTMLElement>('.roi-bloc-pgn, .chessboard-block');
			const boardAPI = (block as any)?._boardAPI;
			if (boardAPI && typeof boardAPI.flip === 'function') {
				boardAPI.flip();
			}
		},
	},
	callbacks: {
		mountPgn() {
			const { ref } = getElement();
			if (!ref) {
				return;
			}
			const block = ref.closest<HTMLElement>('.roi-bloc-pgn, .chessboard-block');
			if (!block) {
				return;
			}
			const context = getContext();
			initPgnInstance(block, ref, context);
		},
	},
});

// Fallback initialization for DOM without Interactivity API runtime
document.addEventListener('DOMContentLoaded', () => {
	if (window.pgnViewInitialized) {
		return;
	}
	window.pgnViewInitialized = true;

	const blocks = document.querySelectorAll<HTMLElement>('.roi-bloc-pgn');
	for (const block of blocks) {
		const mountElement = block.querySelector<HTMLElement>('.pgn-mount-element') || block;
		initPgnInstance(block, mountElement);
	}
});
