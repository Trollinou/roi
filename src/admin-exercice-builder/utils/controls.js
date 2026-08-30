/* eslint-disable no-unused-vars */
/**
 * Controls utility for unified FEN & PGN inputs management.
 */

import { openFenEditor, openPgnEditor } from './modals';
import { parsePgn } from 'chessops/pgn';

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
 * Checks PGN status: 'empty' | 'valid_with_moves' | 'valid_no_moves' | 'invalid'
 *
 * @param {string} pgnString
 * @return {'empty' | 'valid_with_moves' | 'valid_no_moves' | 'invalid'} PGN validation status code.
 */
export function checkPgnStatus(pgnString) {
	if (!pgnString || typeof pgnString !== 'string') {
		return 'empty';
	}
	const trimmed = pgnString.trim();
	if (!trimmed) {
		return 'empty';
	}

	try {
		const games = parsePgn(trimmed);
		if (!games || games.length === 0) {
			return 'invalid';
		}
		const game = games[0];
		const hasMoves = !!(
			game.moves &&
			game.moves.children &&
			game.moves.children.length > 0
		);

		if (hasMoves) {
			return 'valid_with_moves';
		}

		const hasExplicitHeader = /\[\s*[A-Za-z0-9_]+\s+"[^"]*"\s*\]/.test(
			trimmed
		);
		const hasExplicitComment = /\{[^}]*\}/.test(trimmed);

		if (hasExplicitHeader || hasExplicitComment) {
			return 'valid_no_moves';
		}

		return 'invalid';
	} catch (e) {
		return 'invalid';
	}
}

/**
 * Checks if a PGN string contains at least one playable move outside of comments and headers.
 *
 * @param {string} pgnString
 * @return {boolean} True if playable move(s) are detected.
 */
export function hasPgnMoves(pgnString) {
	return checkPgnStatus(pgnString) === 'valid_with_moves';
}

/**
 * Updates visual validation notice element for a PGN textarea.
 *
 * @param {HTMLTextAreaElement|null} textareaEl
 * @param {HTMLElement|null}         [statusEl]
 */
export function updatePgnStatus(textareaEl, statusEl) {
	if (!textareaEl) {
		return;
	}
	let targetStatusEl = statusEl;
	if (!targetStatusEl && textareaEl.id) {
		targetStatusEl = document.getElementById(`${textareaEl.id}_status`);
	}
	if (!targetStatusEl) {
		const wrapper =
			textareaEl.closest('.roi-control-textarea-wrapper') ||
			textareaEl.parentElement;
		if (wrapper) {
			targetStatusEl = wrapper.querySelector('.roi-pgn-status');
			if (!targetStatusEl) {
				targetStatusEl = document.createElement('div');
				targetStatusEl.className = 'roi-pgn-status';
				wrapper.appendChild(targetStatusEl);
			}
		}
	}

	if (!targetStatusEl) {
		return;
	}

	const status = checkPgnStatus(textareaEl.value);

	if (status === 'empty') {
		targetStatusEl.style.display = 'none';
		targetStatusEl.innerHTML = '';
		return;
	}

	if (status === 'invalid') {
		targetStatusEl.style.display = 'block';
		targetStatusEl.className = 'roi-pgn-status roi-pgn-status-error';
		targetStatusEl.style.marginTop = '6px';
		targetStatusEl.style.padding = '6px 10px';
		targetStatusEl.style.backgroundColor = '#fcf0f1';
		targetStatusEl.style.border = '1px solid #d63638';
		targetStatusEl.style.borderLeft = '4px solid #d63638';
		targetStatusEl.style.borderRadius = '3px';
		targetStatusEl.style.color = '#8a1f11';
		targetStatusEl.style.fontSize = '12px';
		targetStatusEl.style.lineHeight = '1.4';
		targetStatusEl.innerHTML =
			'❌ <strong>Format PGN non reconnu</strong> ou invalide. Veuillez coller un PGN valide ou utiliser <em>« Éditer le PGN »</em>.';
		return;
	}

	if (status === 'valid_no_moves') {
		targetStatusEl.style.display = 'block';
		targetStatusEl.className = 'roi-pgn-status roi-pgn-status-warning';
		targetStatusEl.style.marginTop = '6px';
		targetStatusEl.style.padding = '6px 10px';
		targetStatusEl.style.backgroundColor = '#fff8e5';
		targetStatusEl.style.border = '1px solid #dba617';
		targetStatusEl.style.borderLeft = '4px solid #dba617';
		targetStatusEl.style.borderRadius = '3px';
		targetStatusEl.style.color = '#614700';
		targetStatusEl.style.fontSize = '12px';
		targetStatusEl.style.lineHeight = '1.4';
		targetStatusEl.innerHTML =
			'⚠️ <strong>Aucun coup solution détecté</strong> dans ce PGN (uniquement position / commentaires). Cliquez sur <em>« Éditer le PGN »</em> pour jouer le coup attendu.';
		return;
	}

	if (status === 'valid_with_moves') {
		targetStatusEl.style.display = 'block';
		targetStatusEl.className = 'roi-pgn-status roi-pgn-status-success';
		targetStatusEl.style.marginTop = '6px';
		targetStatusEl.style.padding = '4px 8px';
		targetStatusEl.style.backgroundColor = '#edfaef';
		targetStatusEl.style.border = '1px solid #68de7c';
		targetStatusEl.style.borderLeft = '4px solid #00a32a';
		targetStatusEl.style.borderRadius = '3px';
		targetStatusEl.style.color = '#135e26';
		targetStatusEl.style.fontSize = '12px';
		targetStatusEl.style.lineHeight = '1.4';
		targetStatusEl.innerHTML =
			'✓ <strong>Coup(s) solution présent(s)</strong> dans la séquence PGN.';
	}
}

/**
 * Sets up a PGN textarea & edit button.
 *
 * @param {Object}                     config
 * @param {string|HTMLTextAreaElement} config.textarea     - Element or ID of PGN textarea
 * @param {string|HTMLButtonElement}   [config.button]     - Element or ID of Edit button
 * @param {string|HTMLElement}         [config.status]     - Optional element or ID of status notice
 * @param {string|Function}            [config.initialFen] - Initial FEN string or function returning initial FEN
 * @param {Function}                   [config.onChange]   - Callback fired when PGN changes (pgn) => void
 */
export function setupPgnControl({
	textarea,
	button,
	status,
	initialFen,
	onChange,
}) {
	const textareaEl =
		typeof textarea === 'string'
			? document.getElementById(textarea)
			: textarea;
	const buttonEl =
		typeof button === 'string' ? document.getElementById(button) : button;
	const statusEl =
		typeof status === 'string' ? document.getElementById(status) : status;

	if (textareaEl) {
		updatePgnStatus(textareaEl, statusEl);

		textareaEl.addEventListener('input', function () {
			updatePgnStatus(textareaEl, statusEl);
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
						updatePgnStatus(textareaEl, statusEl);
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

const BRUSH_MAP = {
	g: 'green',
	r: 'red',
	b: 'blue',
	y: 'yellow',
	c: 'green',
	o: 'yellow',
};

/**
 * Extracts initial FEN, orientation, and initial annotation shapes from a PGN string.
 *
 * @param {string} pgnString PGN source string.
 * @return {{ fen: string, orientation: 'white' | 'black', shapes: Array<{ orig: string, dest?: string, brush: string }> }} Extracted FEN, orientation and shapes.
 */
export function extractFenOrientationAndShapes(pgnString) {
	if (!pgnString || typeof pgnString !== 'string') {
		const defaultFen =
			'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		return { fen: defaultFen, orientation: 'white', shapes: [] };
	}

	const trimmed = pgnString.trim();

	// 1. Balise [FEN "..."]
	const fenMatch = trimmed.match(/\[FEN\s+"([^"]+)"\]/i);
	let fen = fenMatch
		? fenMatch[1].trim()
		: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

	if (!fenMatch && trimmed.includes('/') && !trimmed.startsWith('[')) {
		const firstLine = trimmed.split('\n')[0].trim();
		if (firstLine.includes('/') && firstLine.split('/').length >= 4) {
			fen = firstLine;
		}
	}

	const orientation = getActiveColorFromFen(fen);
	const shapes = [];

	// Extraire les formes UNIQUEMENT de la position initiale (commentaires racine / début de PGN avant tout coup)
	let rootComments = [];
	try {
		const games = parsePgn(trimmed);
		if (games && games.length > 0) {
			const game = games[0];
			if (game.headers && typeof game.headers.get === 'function') {
				const fenHeader = game.headers.get('FEN');
				if (fenHeader) {
					fen = fenHeader.trim();
				}
			}
			if (Array.isArray(game.comments) && game.comments.length > 0) {
				rootComments = game.comments;
			}
		}
	} catch (e) {
		const firstMoveIndex = trimmed.search(/\b\d+\s*\./);
		const initialSection =
			firstMoveIndex !== -1 ? trimmed.slice(0, firstMoveIndex) : trimmed;
		const fallbackMatches = initialSection.match(/\{([^}]*)\}/g);
		if (fallbackMatches) {
			rootComments = fallbackMatches.map((c) => c.slice(1, -1));
		}
	}

	if (rootComments.length > 0) {
		const commentsText = rootComments.join(' ');

		const cslRegex = /\[%(?:csl|cpl)\s+([^\]]+)\]/gi;
		let cslMatch;
		while ((cslMatch = cslRegex.exec(commentsText)) !== null) {
			const items = cslMatch[1].split(',');
			for (const item of items) {
				const cleanItem = item.trim();
				if (cleanItem.length >= 3) {
					const brushChar = cleanItem[0].toLowerCase();
					const brush = BRUSH_MAP[brushChar] || 'green';
					const orig = cleanItem.substring(1, 3).toLowerCase();
					shapes.push({ orig, brush });
				}
			}
		}

		const calRegex = /\[%cal\s+([^\]]+)\]/gi;
		let calMatch;
		while ((calMatch = calRegex.exec(commentsText)) !== null) {
			const items = calMatch[1].split(',');
			for (const item of items) {
				const cleanItem = item.trim();
				if (cleanItem.length >= 5) {
					const brushChar = cleanItem[0].toLowerCase();
					const brush = BRUSH_MAP[brushChar] || 'green';
					const orig = cleanItem.substring(1, 3).toLowerCase();
					const dest = cleanItem.substring(3, 5).toLowerCase();
					shapes.push({ orig, dest, brush });
				}
			}
		}
	}

	return { fen, orientation, shapes };
}
