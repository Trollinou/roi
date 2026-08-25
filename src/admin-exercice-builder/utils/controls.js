/* eslint-disable no-unused-vars */
/**
 * Controls utility for unified FEN & PGN inputs management.
 */

import { openFenEditor, openPgnEditor } from './modals';

/**
 * Extracts active player color ('white' or 'black') from a valid FEN string.
 *
 * @param {string} fen
 * @return {string} 'white' | 'black'
 */
export function getActiveColorFromFen(fen) {
	if (typeof fen !== 'string') {
		return 'white';
	}
	const parts = fen.trim().split(/\s+/);
	if (parts.length >= 2) {
		return parts[1].toLowerCase() === 'b' ? 'black' : 'white';
	}
	return 'white';
}

/**
 * Formats a shapes array into a summary display string "X ◯ - Y ➔".
 *
 * @param {Array} shapes Array of shape objects.
 * @return {string} Formatted shapes summary string.
 */
export function formatShapesSummary(shapes) {
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

/**
 * Updates orientation display element with calculated text "Blanc" or "Noir".
 *
 * @param {HTMLElement|null} element Element to update.
 * @param {string}           color   Color string ('white' | 'black' | 'w' | 'b').
 */
export function updateOrientationDisplay(element, color) {
	if (!element) {
		return;
	}
	const colorNormalized =
		color === 'b' || color === 'black' || color === 'Noir'
			? 'black'
			: 'white';
	const displayText = colorNormalized === 'black' ? 'Noir' : 'Blanc';

	if (element.tagName === 'INPUT') {
		element.value = displayText;
		element.dataset.color = colorNormalized;
	} else if (element.tagName === 'SELECT') {
		element.value = colorNormalized;
		element.dataset.color = colorNormalized;
	} else {
		element.textContent = displayText;
		element.dataset.color = colorNormalized;
	}
}

/**
 * Gets normalized orientation color ('white' | 'black') from a DOM element or fallback FEN string.
 *
 * @param {HTMLElement|null} element       DOM element.
 * @param {string}           [fallbackFen] Fallback FEN string.
 * @return {string} Normalized color 'white' or 'black'.
 */
export function getOrientationColor(element, fallbackFen = '') {
	if (element && element.dataset && element.dataset.color) {
		return element.dataset.color;
	}
	if (element && element.value) {
		const val = String(element.value).toLowerCase().trim();
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

/**
 * Sets up a FEN input & edit button with computed orientation & shapes indicator.
 *
 * @param {Object}                   config
 * @param {string|HTMLInputElement}  config.input           - Element or ID of FEN input
 * @param {string|HTMLButtonElement} [config.button]        - Element or ID of Edit button
 * @param {string|HTMLElement}       [config.colorSelect]   - Element or ID of Orientation display
 * @param {string|HTMLInputElement}  [config.shapesInput]   - Element or ID of hidden JSON shapes input
 * @param {string|HTMLElement}       [config.shapesSummary] - Element or ID of shapes summary text display
 * @param {Function}                 [config.onChange]      - Callback fired when FEN, orientation or shapes change (fen, color, shapes) => void
 * @param {Function}                 [config.getShapes]     - Optional function returning initial shapes array
 */
export function setupFenControl({
	input,
	button,
	colorSelect,
	shapesInput,
	shapesSummary,
	onChange,
	getShapes,
}) {
	const inputEl =
		typeof input === 'string' ? document.getElementById(input) : input;
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
			? document.getElementById(shapesInput)
			: shapesInput;
	if (!shapesInputEl && buttonEl && buttonEl.dataset.targetShapes) {
		shapesInputEl = document.getElementById(buttonEl.dataset.targetShapes);
	} else if (!shapesInputEl && inputEl) {
		shapesInputEl = document.getElementById(inputEl.id + '_shapes');
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

	function syncFields(fenVal, shapesArray, triggerCallback = true) {
		const detectedColor = getActiveColorFromFen(fenVal);
		updateOrientationDisplay(colorSelectEl, detectedColor);

		const shapes = Array.isArray(shapesArray) ? shapesArray : [];
		const summaryText = formatShapesSummary(shapes);

		if (shapesSummaryEl) {
			if (shapesSummaryEl.tagName === 'INPUT') {
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

	if (inputEl) {
		const initialFen = inputEl.value.trim();
		let initialShapes = [];
		if (typeof getShapes === 'function') {
			initialShapes = getShapes() || [];
		} else if (shapesInputEl && shapesInputEl.value) {
			try {
				initialShapes = JSON.parse(shapesInputEl.value);
			} catch (err) {
				// Ignore JSON parse error
			}
		}
		syncFields(initialFen, initialShapes, false);

		// Event: typing/pasting directly into the FEN text input (resets shapes to [] and "0 ◯ - 0 ➔")
		inputEl.addEventListener('input', function () {
			const fenVal = inputEl.value.trim();
			syncFields(fenVal, [], true);
		});

		// Expose Diagram API on inputEl for consuming components
		inputEl.getDiagram = function () {
			const fen = inputEl.value.trim();
			const color = getActiveColorFromFen(fen);
			let currentShapes = [];
			if (typeof getShapes === 'function') {
				currentShapes = getShapes();
			} else if (shapesInputEl && shapesInputEl.value) {
				try {
					currentShapes = JSON.parse(shapesInputEl.value);
				} catch (err) {
					// Ignore JSON parse error
				}
			}
			return {
				fen,
				orientation: color,
				color,
				shapes: currentShapes,
			};
		};

		inputEl.getShapes = function () {
			return inputEl.getDiagram().shapes;
		};

		inputEl.getFen = function () {
			return inputEl.value.trim();
		};
	}

	if (buttonEl) {
		buttonEl.addEventListener('click', function (event) {
			event.preventDefault();
			const currentFen = inputEl
				? inputEl.value.trim()
				: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

			let currentShapes = [];
			if (typeof getShapes === 'function') {
				currentShapes = getShapes();
			} else if (shapesInputEl && shapesInputEl.value) {
				try {
					currentShapes = JSON.parse(shapesInputEl.value);
				} catch (err) {
					// Ignore JSON parse error
				}
			}

			openFenEditor(
				{ fen: currentFen, shapes: currentShapes },
				function ({ fen, shapes: newShapes }) {
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

/**
 * Sets up a PGN textarea & edit button.
 *
 * @param {Object}                     config
 * @param {string|HTMLTextAreaElement} config.textarea     - Element or ID of PGN textarea
 * @param {string|HTMLButtonElement}   [config.button]     - Element or ID of Edit button
 * @param {string|Function}            [config.initialFen] - Initial FEN string or function returning initial FEN
 * @param {Function}                   [config.onChange]   - Callback fired when PGN changes (pgn) => void
 */
export function setupPgnControl({ textarea, button, initialFen, onChange }) {
	const textareaEl =
		typeof textarea === 'string'
			? document.getElementById(textarea)
			: textarea;
	const buttonEl =
		typeof button === 'string' ? document.getElementById(button) : button;

	if (textareaEl) {
		textareaEl.addEventListener('input', function () {
			if (typeof onChange === 'function') {
				onChange(textareaEl.value);
			}
		});
	}

	if (buttonEl) {
		buttonEl.addEventListener('click', function (e) {
			e.preventDefault();
			const currentPgn = textareaEl ? textareaEl.value : '';
			const fen =
				typeof initialFen === 'function'
					? initialFen()
					: initialFen || '';

			openPgnEditor(
				currentPgn,
				function (newPgn) {
					if (textareaEl) {
						textareaEl.value = newPgn;
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
