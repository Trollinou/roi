/**
 * Handler for Type 13: Ouvre'boîte.
 */

import { openFenEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );
let t13Shapes = [];

export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const fenInput = document.getElementById( 'roi_t13_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t13_couleur' );
	const questionInput = document.getElementById( 'roi_t13_question' );
	const correctRadio = document.querySelector(
		'input[name="roi_t13_correct"]:checked'
	);

	const fenDepart = fenInput
		? fenInput.value.trim()
		: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	const couleurJoueur = couleurSelect ? couleurSelect.value : 'white';
	const questionText = questionInput ? questionInput.value.trim() : '';
	const bonneReponseIndex = correctRadio
		? parseInt( correctRadio.value, 10 )
		: 0;

	const choixList = [];
	for ( let i = 0; i < 3; i++ ) {
		const texteInput = document.querySelector(
			`.t13-choix-texte[data-index="${ i }"]`
		);
		const sanInput = document.querySelector(
			`.t13-choix-san[data-index="${ i }"]`
		);
		const explicationInput = document.querySelector(
			`.t13-choix-explication[data-index="${ i }"]`
		);

		choixList.push( {
			texte: texteInput ? texteInput.value.trim() : '',
			san: sanInput ? sanInput.value.trim() : '',
			explication: explicationInput ? explicationInput.value.trim() : '',
		} );
	}

	const configData = {
		fen_depart: fenDepart,
		couleur_joueur: couleurJoueur,
		shapes: t13Shapes,
		question: questionText,
		choix: choixList,
		bonne_reponse: bonneReponseIndex,
	};

	textarea.value = JSON.stringify( configData, null, 4 );
}

export function init() {
	const fenInput = document.getElementById( 'roi_t13_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t13_couleur' );
	const questionInput = document.getElementById( 'roi_t13_question' );
	const btnFenEditor = document.getElementById( 'btn_open_fen_editor_t13' );

	if ( ! textarea ) {
		return;
	}

	// Restauration des données JSON si présent
	if ( textarea.value.trim() !== '' ) {
		try {
			const parsed = JSON.parse( textarea.value );
			if ( parsed && typeof parsed === 'object' ) {
				if ( parsed.fen_depart && fenInput ) {
					fenInput.value = parsed.fen_depart;
				}
				if ( parsed.couleur_joueur && couleurSelect ) {
					couleurSelect.value = parsed.couleur_joueur;
				}
				if ( Array.isArray( parsed.shapes ) ) {
					t13Shapes = parsed.shapes;
				}
				if ( typeof parsed.question === 'string' && questionInput ) {
					questionInput.value = parsed.question;
				}
				if ( Array.isArray( parsed.choix ) ) {
					for ( let i = 0; i < 3; i++ ) {
						if ( parsed.choix[ i ] ) {
							const item = parsed.choix[ i ];
							const texteInput = document.querySelector(
								`.t13-choix-texte[data-index="${ i }"]`
							);
							const sanInput = document.querySelector(
								`.t13-choix-san[data-index="${ i }"]`
							);
							const explicationInput = document.querySelector(
								`.t13-choix-explication[data-index="${ i }"]`
							);

							if ( texteInput && typeof item.texte === 'string' ) {
								texteInput.value = item.texte;
							}
							if ( sanInput && typeof item.san === 'string' ) {
								sanInput.value = item.san;
							}
							if (
								explicationInput &&
								typeof item.explication === 'string'
							) {
								explicationInput.value = item.explication;
							}
						}
					}
				}
				if ( typeof parsed.bonne_reponse === 'number' ) {
					const radioToSelect = document.querySelector(
						`input[name="roi_t13_correct"][value="${ parsed.bonne_reponse }"]`
					);
					if ( radioToSelect ) {
						radioToSelect.checked = true;
					}
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 13 initial :', e );
		}
	}

	// Écouteur Éditeur FEN Visuel
	if ( btnFenEditor ) {
		btnFenEditor.addEventListener( 'click', function () {
			const currentFen = fenInput
				? fenInput.value ||
				  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
				: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

			openFenEditor(
				{
					fen: currentFen,
					shapes: t13Shapes,
				},
				function ( result ) {
					if ( result && result.fen ) {
						if ( fenInput ) {
							fenInput.value = result.fen;
						}
						if ( result.shapes ) {
							t13Shapes = result.shapes;
						}
						if ( result.orientation && couleurSelect ) {
							couleurSelect.value = result.orientation;
						}
						updateConfig();
					}
				}
			);
		} );
	}

	// Écouteurs sur les éléments d'entrée pour la mise à jour temps réel
	const inputsToWatch = document.querySelectorAll(
		'#roi_builder_type_13 input, #roi_builder_type_13 select'
	);

	inputsToWatch.forEach( ( input ) => {
		input.addEventListener( 'input', updateConfig );
		input.addEventListener( 'change', updateConfig );
	} );

	// Mise à jour initiale de la config JSON
	updateConfig();
}
