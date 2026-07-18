/**
 * Handler for Type 5: Posi'Plan.
 */

import { openFenEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );
const t5FenDepart = document.getElementById( 'roi_t5_fen_depart' );
const t5Couleur = document.getElementById( 'roi_t5_couleur' );
const t5EtapesContainer = document.getElementById( 'roi_t5_etapes_container' );
const t5AddEtapeBtn = document.getElementById( 'roi_t5_add_etape' );
const t5EditorBtn = document.getElementById( 'btn_open_fen_editor_t5' );

let t5Etapes = [];
let t5Shapes = [];

export function updateConfig() {
	if ( ! t5FenDepart || ! t5Couleur || ! textarea ) {
		return;
	}
	const t5Config = {
		fen_depart: t5FenDepart.value.trim(),
		couleur_joueur: t5Couleur.value,
		shapes: t5Shapes,
		etapes: t5Etapes,
	};
	textarea.value = JSON.stringify( t5Config, null, 4 );
}

export function renderT5Etapes() {
	if ( ! t5EtapesContainer ) {
		return;
	}
	t5EtapesContainer.innerHTML = '';

	if ( t5Etapes.length === 0 ) {
		t5EtapesContainer.innerHTML =
			'<p style="color: #646970; font-style: italic; text-align: center; padding: 15px 0;">Aucune étape ajoutée pour le moment.</p>';
		return;
	}

	t5Etapes.forEach( function ( etape, i ) {
		const div = document.createElement( 'div' );
		div.className = 'roi-t5-etape-card';
		div.setAttribute( 'data-index', i );
		div.style.border = '1px solid #ccd0d4';
		div.style.padding = '15px';
		div.style.marginBottom = '15px';
		div.style.background = '#fafafa';
		div.style.borderRadius = '6px';
		div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

		div.innerHTML = `
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
				<strong style="font-size: 14px; color: #1e1e1e;">Étape ${ i + 1 }</strong>
				<span style="font-size: 11px; padding: 3px 8px; background: #e8f0fe; color: #3858e9; border-radius: 12px; font-weight: 600; text-transform: uppercase;">Posi'Plan</span>
			</div>
			<div style="display: flex; flex-direction: column; gap: 12px;">
				<div>
					<label style="font-weight: 600; display: block; margin-bottom: 4px;">Question :</label>
					<input type="text" class="t5-question-input" style="width: 100%; height: 30px;" value="${
						etape.question || ''
					}">
				</div>
				<div>
					<label style="font-weight: 600; display: block; margin-bottom: 4px;">Réponse ordinateur (coup suivant de l'adversaire, ex: Nf6) :</label>
					<input type="text" class="t5-reponse-ordinateur-input" style="width: 100%; height: 30px;" value="${
						etape.reponse_ordinateur || ''
					}" placeholder="Laissez vide s'il s'agit du coup final">
				</div>
				<div>
					<label style="font-weight: 600; display: block; margin-bottom: 6px;">Choix de réponse (sélectionnez la bonne réponse) :</label>
					<div style="display: flex; flex-direction: column; gap: 12px;">
						${ [ 0, 1, 2 ]
							.map( function ( idx ) {
								const choixObj =
									etape.choix && etape.choix[ idx ]
										? etape.choix[ idx ]
										: {
												texte: '',
												san: '',
												explication: '',
										  };
								const isChecked =
									parseInt( etape.bonne_reponse, 10 ) === idx
										? 'checked'
										: '';
								return `
								<div style="border: 1px dashed #ccc; padding: 10px; border-radius: 4px; background: #fff; display: flex; flex-direction: column; gap: 8px;">
									<div style="display: flex; align-items: center; gap: 8px;">
										<input type="radio" name="roi_t5_correct_${ i }" class="t5-correct-radio" value="${ idx }" ${ isChecked }>
										<strong style="font-size: 12px;">Choix ${ idx + 1 } :</strong>
									</div>
									<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
										<div>
											<label style="font-size: 11px; display: block;">Texte du bouton :</label>
											<input type="text" class="t5-choix-texte" data-choice-index="${ idx }" style="width: 100%; height: 28px;" value="${
												choixObj.texte || ''
											}" placeholder="Ex: Fou c4">
										</div>
										<div>
											<label style="font-size: 11px; display: block;">Coup SAN (ex: Bc4) :</label>
											<input type="text" class="t5-choix-san" data-choice-index="${ idx }" style="width: 100%; height: 28px;" value="${
												choixObj.san || ''
											}" placeholder="Ex: Bc4">
										</div>
									</div>
									<div>
										<label style="font-size: 11px; display: block;">Explication si erreur :</label>
										<input type="text" class="t5-choix-explication" data-choice-index="${ idx }" style="width: 100%; height: 28px;" value="${
											choixObj.explication || ''
										}" placeholder="Explication affichée si mauvais choix">
									</div>
								</div>
							`;
							} )
							.join( '' ) }
					</div>
				</div>
				<div style="margin-top: 5px;">
					<button type="button" class="button button-link-delete btn-delete-t5-step" style="color: #b32d2e;">Supprimer l'étape</button>
				</div>
			</div>
		`;

		const questionInput = div.querySelector( '.t5-question-input' );
		questionInput.addEventListener( 'input', function ( e ) {
			t5Etapes[ i ].question = e.target.value;
			updateConfig();
		} );

		const reponseOrdiInput = div.querySelector(
			'.t5-reponse-ordinateur-input'
		);
		reponseOrdiInput.addEventListener( 'input', function ( e ) {
			t5Etapes[ i ].reponse_ordinateur = e.target.value;
			updateConfig();
		} );

		const radioButtons = div.querySelectorAll( '.t5-correct-radio' );
		radioButtons.forEach( function ( rb ) {
			rb.addEventListener( 'change', function ( e ) {
				if ( e.target.checked ) {
					t5Etapes[ i ].bonne_reponse = parseInt(
						e.target.value,
						10
					);
					updateConfig();
				}
			} );
		} );

		const choiceTexts = div.querySelectorAll( '.t5-choix-texte' );
		choiceTexts.forEach( function ( input ) {
			input.addEventListener( 'input', function ( e ) {
				const idx = parseInt(
					e.target.getAttribute( 'data-choice-index' ),
					10
				);
				if ( ! t5Etapes[ i ].choix ) {
					t5Etapes[ i ].choix = [ {}, {}, {} ];
				}
				t5Etapes[ i ].choix[ idx ].texte = e.target.value;
				updateConfig();
			} );
		} );

		const choiceSans = div.querySelectorAll( '.t5-choix-san' );
		choiceSans.forEach( function ( input ) {
			input.addEventListener( 'input', function ( e ) {
				const idx = parseInt(
					e.target.getAttribute( 'data-choice-index' ),
					10
				);
				if ( ! t5Etapes[ i ].choix ) {
					t5Etapes[ i ].choix = [ {}, {}, {} ];
				}
				t5Etapes[ i ].choix[ idx ].san = e.target.value;
				updateConfig();
			} );
		} );

		const choiceExps = div.querySelectorAll( '.t5-choix-explication' );
		choiceExps.forEach( function ( input ) {
			input.addEventListener( 'input', function ( e ) {
				const idx = parseInt(
					e.target.getAttribute( 'data-choice-index' ),
					10
				);
				if ( ! t5Etapes[ i ].choix ) {
					t5Etapes[ i ].choix = [ {}, {}, {} ];
				}
				t5Etapes[ i ].choix[ idx ].explication = e.target.value;
				updateConfig();
			} );
		} );

		div.querySelector( '.btn-delete-t5-step' ).addEventListener(
			'click',
			function () {
				t5Etapes.splice( i, 1 );
				renderT5Etapes();
				updateConfig();
			}
		);

		t5EtapesContainer.appendChild( div );
	} );
}

export function init() {
	if ( ! t5EtapesContainer ) {
		return;
	}

	// Initialisation des données depuis le JSON initial
	if ( textarea && textarea.value.trim() !== '' ) {
		try {
			const parsedT5 = JSON.parse( textarea.value );
			if ( parsedT5 && typeof parsedT5 === 'object' ) {
				if ( t5FenDepart && typeof parsedT5.fen_depart === 'string' ) {
					t5FenDepart.value = parsedT5.fen_depart;
				}
				if (
					t5Couleur &&
					typeof parsedT5.couleur_joueur === 'string'
				) {
					t5Couleur.value = parsedT5.couleur_joueur;
				}
				if ( Array.isArray( parsedT5.etapes ) ) {
					t5Etapes = parsedT5.etapes;
				}
				t5Shapes = parsedT5.shapes || [];
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 5 initial :', e );
		}
	}

	renderT5Etapes();

	if ( t5AddEtapeBtn ) {
		t5AddEtapeBtn.addEventListener( 'click', function () {
			t5Etapes.push( {
				question: '',
				choix: [
					{ texte: '', san: '', explication: '' },
					{ texte: '', san: '', explication: '' },
					{ texte: '', san: '', explication: '' },
				],
				bonne_reponse: 0,
				reponse_ordinateur: '',
			} );
			renderT5Etapes();
			updateConfig();
		} );
	}

	if ( t5FenDepart ) {
		t5FenDepart.addEventListener( 'input', updateConfig );
	}
	if ( t5Couleur ) {
		t5Couleur.addEventListener( 'change', updateConfig );
	}

	if ( t5EditorBtn ) {
		t5EditorBtn.addEventListener( 'click', function () {
			const initialFen =
				( t5FenDepart ? t5FenDepart.value.trim() : '' ) ||
				'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

			openFenEditor(
				{ fen: initialFen, shapes: t5Shapes },
				function ( result ) {
					if ( t5FenDepart ) {
						t5FenDepart.value = result.fen;
					}
					t5Shapes = result.shapes;
					updateConfig();
				}
			);
		} );
	}
}
