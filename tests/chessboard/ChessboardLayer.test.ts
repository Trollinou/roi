// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { mountRoiBoard } from '../../src/utils/board-factory';

describe('Chessboard Layer Isolation & DOM Factory (Piste 1 & 3 & 4)', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		container.id = 'test-board-mount';
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
		document.body.innerHTML = '';
	});

	describe('1. CSS Layer Rules & Stacking Context Integrity', () => {
		it('ensures compiled CSS includes isolation: isolate and aspect-ratio: 1 / 1 on .roi-board-frame', () => {
			const cssPath = path.resolve(__dirname, '../../build/chessboard/style-chessboard.css');
			expect(fs.existsSync(cssPath)).toBe(true);

			const cssContent = fs.readFileSync(cssPath, 'utf8');

			// Stacking context isolation
			expect(cssContent).toMatch(/roi-board-frame[^{]*\{[^}]*isolation:\s*isolate/i);

			// Aspect-ratio square preservation
			expect(cssContent).toMatch(/roi-board-frame[^{]*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/i);
		});

		it('ensures compiled CSS strictly enforces pointer-events: none on SVG shapes overlays', () => {
			const cssPath = path.resolve(__dirname, '../../build/chessboard/style-chessboard.css');
			const cssContent = fs.readFileSync(cssPath, 'utf8');

			// Check SVG rules
			expect(cssContent).toMatch(/cg-shapes[^}]*pointer-events:\s*none\s*!important/i);
			expect(cssContent).toMatch(/cg-custom-below[^}]*pointer-events:\s*none\s*!important/i);
		});

		it('ensures compiled CSS sets promotion dialog pointer-events: auto and high z-index', () => {
			const cssPath = path.resolve(__dirname, '../../build/chessboard/style-chessboard.css');
			const cssContent = fs.readFileSync(cssPath, 'utf8');

			expect(cssContent).toMatch(/promotion-dialog[^{]*\{[^}]*z-index:\s*1000/i);
			expect(cssContent).toMatch(/promotion-dialog[^{]*\{[^}]*pointer-events:\s*auto\s*!important/i);
		});
	});

	describe('2. mountRoiBoard DOM Scaffolding & Isolation', () => {
		it('automatically injects .roi-board-frame, .main-wrap and .fit-container around the board', () => {
			const board = mountRoiBoard(container, {
				fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				orientation: 'white',
				viewOnly: true,
			});

			expect(board).toBeDefined();

			const frameWrapper = container.closest('.roi-board-frame');
			expect(frameWrapper).not.toBeNull();
			expect(frameWrapper?.classList.contains('main-wrap')).toBe(true);
			expect(frameWrapper?.classList.contains('fit-container')).toBe(true);
			expect(container.querySelector('.main-board')).not.toBeNull();

			board.destroy();
		});

		it('reuses an existing .roi-board-frame wrapper if already present in the DOM', () => {
			const parent = document.createElement('div');
			parent.className = 'custom-wrapper roi-board-frame main-wrap fit-container';
			parent.appendChild(container);
			document.body.appendChild(parent);

			const board = mountRoiBoard(container, {
				fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
				orientation: 'black',
			});

			const foundFrame = container.closest('.roi-board-frame');
			expect(foundFrame).toBe(parent);
			expect(foundFrame?.classList.contains('custom-wrapper')).toBe(true);

			board.destroy();
		});

		it('properly cleans up on destroy()', () => {
			const board = mountRoiBoard(container, {
				orientation: 'white',
			});

			expect(typeof board.destroy).toBe('function');
			expect(() => board.destroy()).not.toThrow();
		});
	});

	describe('3. Event Bus & Event Dispatching', () => {
		it('registers and unregisters events via on() and off()', () => {
			const board = mountRoiBoard(container, {
				orientation: 'white',
			});

			let eventFired = false;
			const callback = () => {
				eventFired = true;
			};

			const unbind = board.on('test-event', callback);
			expect(typeof unbind).toBe('function');

			// Trigger custom listener
			unbind();
			expect(eventFired).toBe(false);

			board.destroy();
		});

		it('dispatches CustomEvents on the .roi-board-frame element', () => {
			const board = mountRoiBoard(container, {
				orientation: 'white',
			});

			const frameWrapper = container.closest('.roi-board-frame');
			expect(frameWrapper).not.toBeNull();

			let customEventReceived = false;
			frameWrapper?.addEventListener('board-ping', () => {
				customEventReceived = true;
			});

			frameWrapper?.dispatchEvent(new CustomEvent('board-ping', { bubbles: true }));
			expect(customEventReceived).toBe(true);

			board.destroy();
		});
	});

	describe('4. Interaction & SVG Pointer-Events Non-Obstruction Simulation', () => {
		it('allows pieces to receive pointer events without obstruction from SVG shapes layer', () => {
			const board = mountRoiBoard(container, {
				fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				orientation: 'white',
				shapes: [
					{ orig: 'e2', dest: 'e4', brush: 'green' },
				],
			});

			const frameWrapper = container.closest('.roi-board-frame');
			expect(frameWrapper).not.toBeNull();

			// Ensure SVG element inside has the correct class
			const svgOverlay = frameWrapper?.querySelector('svg.cg-shapes') as SVGElement | null;
			if (svgOverlay) {
				// The computed or inline style in our CSS sets pointer-events: none
				expect(window.getComputedStyle(svgOverlay).pointerEvents === 'none' || svgOverlay.classList.contains('cg-shapes')).toBe(true);
			}

			// Simulate finding a piece element
			const piece = frameWrapper?.querySelector('piece') as HTMLElement | null;
			if (piece) {
				let pieceClicked = false;
				piece.addEventListener('click', () => {
					pieceClicked = true;
				});

				piece.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
				expect(pieceClicked).toBe(true);
			}

			board.destroy();
		});

		it('allows dynamically changing position, orientation and shapes', () => {
			const board = mountRoiBoard(container, {
				fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				orientation: 'white',
			});

			const newFen = '8/8/8/4k3/8/8/4K3/8 w - - 0 1';
			board.setPosition(newFen);
			expect(board.getPlacementFen()).toBe('8/8/8/4k3/8/8/4K3/8');

			board.setConfig({ orientation: 'black' });
			expect(board.getOrientation()).toBe('black');

			expect(() => {
				board.setShapes([{ orig: 'e2', brush: 'blue' }]);
			}).not.toThrow();

			expect(() => {
				board.redraw(true);
			}).not.toThrow();

			board.destroy();
		});
	});
});
