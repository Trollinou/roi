/**
 * Handler for Type 1: 100 Commandements.
 */

const textarea = document.getElementById( 'roi_config_json' );
const t1Question = document.getElementById( 'roi_t1_question' );
const t1Reponses = [
	document.getElementById( 'roi_t1_reponse_0' ),
	document.getElementById( 'roi_t1_reponse_1' ),
	document.getElementById( 'roi_t1_reponse_2' ),
];
const t1CorrectRadios = document.getElementsByName( 'roi_t1_correct' );

export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const reponsesArr = [];
	for ( let r = 0; r < 3; r++ ) {
		reponsesArr.push( t1Reponses[ r ] ? t1Reponses[ r ].value : '' );
	}

	let bonneReponseVal = null;
	for ( let rb = 0; rb < t1CorrectRadios.length; rb++ ) {
		if ( t1CorrectRadios[ rb ].checked ) {
			bonneReponseVal = parseInt( t1CorrectRadios[ rb ].value, 10 );
			break;
		}
	}

	const t1Config = {
		question: t1Question ? t1Question.value : '',
		reponses: reponsesArr,
		bonne_reponse: bonneReponseVal,
	};

	textarea.value = JSON.stringify( t1Config, null, 4 );
}

export function init() {
	if ( ! t1Question ) {
		return;
	}

	// Initialisation des données depuis le JSON
	if ( textarea && textarea.value.trim() !== '' ) {
		try {
			const parsedT1 = JSON.parse( textarea.value );
			if ( parsedT1 && typeof parsedT1 === 'object' ) {
				if ( t1Question && typeof parsedT1.question === 'string' ) {
					t1Question.value = parsedT1.question;
				}
				if ( parsedT1.reponses && Array.isArray( parsedT1.reponses ) ) {
					for ( let r = 0; r < 3; r++ ) {
						if (
							t1Reponses[ r ] &&
							typeof parsedT1.reponses[ r ] !== 'undefined'
						) {
							t1Reponses[ r ].value = parsedT1.reponses[ r ];
						}
					}
				}
				if (
					typeof parsedT1.bonne_reponse !== 'undefined' &&
					parsedT1.bonne_reponse !== null
				) {
					const brIndex = parseInt( parsedT1.bonne_reponse, 10 );
					for ( let rb = 0; rb < t1CorrectRadios.length; rb++ ) {
						if (
							parseInt( t1CorrectRadios[ rb ].value, 10 ) ===
							brIndex
						) {
							t1CorrectRadios[ rb ].checked = true;
						}
					}
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 1 initial :', e );
		}
	}

	// Écouteurs d'événements
	t1Question.addEventListener( 'input', updateConfig );
	t1Reponses.forEach( function ( inputField ) {
		if ( inputField ) {
			inputField.addEventListener( 'input', updateConfig );
		}
	} );
	for ( let rb = 0; rb < t1CorrectRadios.length; rb++ ) {
		t1CorrectRadios[ rb ].addEventListener( 'change', updateConfig );
	}
}
