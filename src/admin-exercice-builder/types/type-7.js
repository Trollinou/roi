/**
 * Handler pour le Type 7 : Marche du Héros.
 */

import { openPgnEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );
const t7ModeSelect = document.getElementById( 'roi_t7_mode' );
const t7SeriesContainer = document.getElementById( 'roi_t7_series_container' );

let t7Series = [];
let t7Mode = '3x5';

/**
 * Met à jour la configuration globale au format JSON.
 */
export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const t7Config = {
		mode: t7Mode,
		series: t7Series,
	};
	textarea.value = JSON.stringify( t7Config, null, 4 );
}

/**
 * Ajuste la longueur du tableau des séries en fonction du mode sélectionné.
 */
function adjustSeriesLength() {
	const numSeries = t7Mode === '3x5' ? 3 : 5;
	while ( t7Series.length < numSeries ) {
		t7Series.push( {
			pgn_data: '',
			couleur_joueur: 'white',
			shapes: [],
		} );
	}
	if ( t7Series.length > numSeries ) {
		t7Series = t7Series.slice( 0, numSeries );
	}
}

/**
 * Génère le rendu HTML des séries de Marche du Héros.
 */
export function renderT7Series() {
	if ( ! t7SeriesContainer ) {
		return;
	}
	t7SeriesContainer.innerHTML = '';

	t7Series.forEach( function ( serie, i ) {
		const div = document.createElement( 'div' );
		div.className = 'roi-t7-serie-card';
		div.setAttribute( 'data-index', i );
		div.style.border = '1px solid #ccd0d4';
		div.style.padding = '15px';
		div.style.marginBottom = '15px';
		div.style.background = '#fafafa';
		div.style.borderRadius = '6px';
		div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

		div.innerHTML = `
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
				<strong style="font-size: 14px; color: #1e1e1e;">Série ${ i + 1 }</strong>
			</div>
			<div style="margin-bottom: 10px;">
				<label style="font-weight: 600; display: block; margin-bottom: 4px;">Orientation :</label>
				<select class="roi-t7-orientation" style="width: 120px;">
					<option value="white" ${
						serie.couleur_joueur === 'white' ? 'selected' : ''
					}>Blancs</option>
					<option value="black" ${
						serie.couleur_joueur === 'black' ? 'selected' : ''
					}>Noirs</option>
				</select>
			</div>
			<div style="margin-bottom: 10px;">
				<label style="font-weight: 600; display: block; margin-bottom: 4px;">Séquence PGN :</label>
				<textarea class="roi-t7-pgn-preview" readonly style="width: 100%; height: 60px; font-family: monospace; font-size: 12px; background: #f0f0f1; resize: none; border: 1px solid #ccd0d4; border-radius: 4px; padding: 8px; color: #50575e;">${
					serie.pgn_data || ''
				}</textarea>
			</div>
			<div>
				<button type="button" class="button btn-edit-pgn" style="display: inline-flex; align-items: center; gap: 4px;">
					<span class="dashicons dashicons-edit" style="font-size: 16px; width: 16px; height: 16px; line-height: 1;"></span> Éditer le PGN
				</button>
			</div>
		`;

		// Changement d'orientation
		const selectEl = div.querySelector( '.roi-t7-orientation' );
		selectEl.addEventListener( 'change', function ( e ) {
			t7Series[ i ].couleur_joueur = e.target.value;
			updateConfig();
		} );

		// Édition du PGN via la modale
		div.querySelector( '.btn-edit-pgn' ).addEventListener(
			'click',
			function () {
				openPgnEditor( serie.pgn_data || '', function ( nouveauPgn ) {
					t7Series[ i ].pgn_data = nouveauPgn;
					div.querySelector( '.roi-t7-pgn-preview' ).value =
						nouveauPgn;
					updateConfig();
				} );
			}
		);

		t7SeriesContainer.appendChild( div );
	} );
}

/**
 * Initialise le handler.
 */
export function init() {
	if ( ! t7SeriesContainer ) {
		return;
	}

	// Restauration des données depuis le textarea
	if ( textarea && textarea.value.trim() !== '' ) {
		try {
			const parsedT7 = JSON.parse( textarea.value );
			if ( parsedT7 && typeof parsedT7 === 'object' ) {
				if ( parsedT7.mode ) {
					t7Mode = parsedT7.mode;
					if ( t7ModeSelect ) {
						t7ModeSelect.value = t7Mode;
					}
				}
				if ( Array.isArray( parsedT7.series ) ) {
					t7Series = parsedT7.series.map( function ( s ) {
						return {
							pgn_data: s.pgn_data || '',
							couleur_joueur:
								s.couleur_joueur || s.orientation || 'white',
							shapes: s.shapes || [],
						};
					} );
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 7 initial :', e );
		}
	}

	if ( t7ModeSelect ) {
		// Supprimer les anciens écouteurs en clonant l'élément
		const newModeSelect = t7ModeSelect.cloneNode( true );
		t7ModeSelect.parentNode.replaceChild( newModeSelect, t7ModeSelect );
		newModeSelect.addEventListener( 'change', function ( e ) {
			t7Mode = e.target.value;
			adjustSeriesLength();
			renderT7Series();
			updateConfig();
		} );
	}

	adjustSeriesLength();
	renderT7Series();
}
