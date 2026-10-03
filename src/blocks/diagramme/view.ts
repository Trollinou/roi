import { store, getContext, getElement } from '@wordpress/interactivity';
import { BoardCore } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import type { Shape, Color } from '../../types';

declare global {
	interface Window {
		diagrammeViewInitialized?: boolean;
	}
}

/**
 * Initializes a diagramme chessboard instance on a given container element.
 */
function initDiagrammeInstance(block: HTMLElement, mountElement: HTMLElement, contextData?: Record<string, any>) {
	if ((block as any)._diagrammeInitialized) {
		return;
	}
	(block as any)._diagrammeInitialized = true;

	const fen = contextData?.fen || block.getAttribute('data-fen') || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	const orientation = (contextData?.orientation || block.getAttribute('data-orientation') || 'white') as Color;
	let shapes: Shape[] = [];

	if (contextData?.shapes && Array.isArray(contextData.shapes)) {
		shapes = contextData.shapes;
	} else {
		const rawShapes = block.getAttribute('data-shapes');
		if (rawShapes) {
			try {
				shapes = JSON.parse(rawShapes);
			} catch {
				shapes = [];
			}
		}
	}

	const config = {
		mode: 'editor' as const,
		fen,
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
		mode: 'editor' as const,
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

	if (shapes && shapes.length > 0) {
		boardAPI.setShapes(shapes);
	}
}

store('roi/diagramme', {
	callbacks: {
		mountDiagramme() {
			const { ref } = getElement();
			if (!ref) {
				return;
			}
			const block = ref.closest<HTMLElement>('.roi-bloc-diagramme, .chessboard-block');
			if (!block) {
				return;
			}
			const context = getContext();
			initDiagrammeInstance(block, ref, context);
		},
	},
});

// Fallback initialization for DOM without Interactivity API runtime
document.addEventListener('DOMContentLoaded', () => {
	if (window.diagrammeViewInitialized) {
		return;
	}
	window.diagrammeViewInitialized = true;

	const blocks = document.querySelectorAll<HTMLElement>('.roi-bloc-diagramme, .roi-bloc-fen');
	for (const block of blocks) {
		const mountElement = block.querySelector<HTMLElement>('.diagramme-mount-element') || block;
		initDiagrammeInstance(block, mountElement);
	}
});
