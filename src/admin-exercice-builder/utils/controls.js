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
export function getActiveColorFromFen( fen ) {
	if ( typeof fen !== 'string' ) {
		return 'white';
	}
	const parts = fen.trim().split( /\s+/ );
	if ( parts.length >= 2 ) {
		return parts[ 1 ].toLowerCase() === 'b' ? 'black' : 'white';
	}
	return 'white';
}

/**
 * Sets up a FEN input & edit button with optional orientation selector sync.
 *
 * @param {Object}                   config
 * @param {string|HTMLInputElement}  config.input         - Element or ID of FEN input
 * @param {string|HTMLButtonElement} [config.button]      - Element or ID of Edit button
 * @param {string|HTMLSelectElement} [config.colorSelect] - Element or ID of Orientation select
 * @param {Function}                 [config.onChange]    - Callback fired when FEN or color changes (fen, color) => void
 * @param {Function}                 [config.getShapes]   - Optional function returning initial shapes array
 */
export function setupFenControl( {
	input,
	button,
	colorSelect,
	onChange,
	getShapes,
} ) {
	const inputEl =
		typeof input === 'string' ? document.getElementById( input ) : input;
	const buttonEl =
		typeof button === 'string' ? document.getElementById( button ) : button;
	const colorSelectEl =
		typeof colorSelect === 'string'
			? document.getElementById( colorSelect )
			: colorSelect;

	if ( inputEl ) {
		// Event: typing/pasting directly into the FEN text input
		inputEl.addEventListener( 'input', function () {
			const fenVal = inputEl.value.trim();
			if ( fenVal ) {
				const detectedColor = getActiveColorFromFen( fenVal );
				if ( colorSelectEl ) {
					colorSelectEl.value = detectedColor;
				}
				if ( typeof onChange === 'function' ) {
					onChange(
						fenVal,
						colorSelectEl ? colorSelectEl.value : detectedColor
					);
				}
			}
		} );
	}

	if ( colorSelectEl ) {
		colorSelectEl.addEventListener( 'change', function () {
			const fenVal = inputEl ? inputEl.value.trim() : '';
			if ( typeof onChange === 'function' ) {
				onChange( fenVal, colorSelectEl.value );
			}
		} );
	}

	if ( buttonEl ) {
		buttonEl.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			const currentFen = inputEl
				? inputEl.value.trim()
				: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
			const shapes = typeof getShapes === 'function' ? getShapes() : [];

			openFenEditor(
				{ fen: currentFen, shapes },
				function ( { fen, shapes: newShapes } ) {
					const newFen = fen || currentFen;
					if ( inputEl ) {
						inputEl.value = newFen;
					}
					const detectedColor = getActiveColorFromFen( newFen );
					if ( colorSelectEl ) {
						colorSelectEl.value = detectedColor;
					}
					if ( typeof onChange === 'function' ) {
						onChange(
							newFen,
							colorSelectEl ? colorSelectEl.value : detectedColor,
							newShapes
						);
					}
				}
			);
		} );
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
export function setupPgnControl( { textarea, button, initialFen, onChange } ) {
	const textareaEl =
		typeof textarea === 'string'
			? document.getElementById( textarea )
			: textarea;
	const buttonEl =
		typeof button === 'string' ? document.getElementById( button ) : button;

	if ( textareaEl ) {
		textareaEl.addEventListener( 'input', function () {
			if ( typeof onChange === 'function' ) {
				onChange( textareaEl.value );
			}
		} );
	}

	if ( buttonEl ) {
		buttonEl.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			const currentPgn = textareaEl ? textareaEl.value : '';
			const fen =
				typeof initialFen === 'function'
					? initialFen()
					: initialFen || '';

			openPgnEditor(
				currentPgn,
				function ( newPgn ) {
					if ( textareaEl ) {
						textareaEl.value = newPgn;
					}
					if ( typeof onChange === 'function' ) {
						onChange( newPgn );
					}
				},
				fen
			);
		} );
	}
}
