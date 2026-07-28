/**
 * Handler for Type 10: Echec'éval.
 */

import { openFenEditor, openPgnEditor } from '../utils/modals';

const textarea = document.getElementById( 'roi_config_json' );

let t10Questions = [];
let t10Shapes = [];

/**
 * Serializes configuration to JSON.
 */
export function updateConfig() {
	if ( ! textarea ) {
		return;
	}

	const fenInput = document.getElementById( 'roi_t10_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t10_couleur' );
	const themeInput = document.getElementById( 'roi_t10_theme' );
	const solutionMovesInput = document.getElementById(
		'roi_t10_solution_moves'
	);
	const pgnExplicationInput = document.getElementById(
		'roi_t10_pgn_explication'
	);

	const fenDepart = fenInput
		? fenInput.value.trim()
		: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5';
	const couleurJoueur = couleurSelect ? couleurSelect.value : 'white';
	const themeText = themeInput ? themeInput.value.trim() : '';
	const pgnExplicationText = pgnExplicationInput
		? pgnExplicationInput.value.trim()
		: '';

	let solutionMoves = [];
	if ( solutionMovesInput && solutionMovesInput.value.trim() !== '' ) {
		solutionMoves = solutionMovesInput.value
			.split( ',' )
			.map( ( m ) => m.trim() )
			.filter( Boolean );
	}

	const configData = {
		fen_depart: fenDepart,
		couleur_joueur: couleurJoueur,
		shapes: t10Shapes,
		theme: themeText,
		questions: t10Questions,
		solution_moves: solutionMoves,
		pgn_explication: pgnExplicationText,
	};

	textarea.value = JSON.stringify( configData, null, 4 );
}

/**
 * Dynamically renders questions HTML cards.
 */

function renderT10Questions() {
	const questionsContainer = document.getElementById(
		'roi_t10_questions_container'
	);
	if ( ! questionsContainer ) {
		return;
	}

	questionsContainer.innerHTML = '';

	t10Questions.forEach( ( q, index ) => {
		const card = document.createElement( 'div' );
		card.className = 'roi-t10-question-card';
		card.dataset.index = index;
		card.style.cssText =
			'padding: 12px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;';

		// Header (Title & Delete)
		const headerDiv = document.createElement( 'div' );
		headerDiv.style.cssText =
			'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';

		const titleEl = document.createElement( 'strong' );
		titleEl.style.cssText = 'font-size: 13px; color: #1d2327;';
		titleEl.textContent = `Question ${ index + 1 }`;

		const deleteBtn = document.createElement( 'button' );
		deleteBtn.type = 'button';
		deleteBtn.className =
			'button button-link-delete roi_t10_remove_question';
		deleteBtn.style.cssText = 'color: #b32d2e; text-decoration: none;';
		deleteBtn.textContent = 'Supprimer';
		deleteBtn.addEventListener( 'click', () => {
			t10Questions.splice( index, 1 );
			renderT10Questions();
			updateConfig();
		} );

		headerDiv.appendChild( titleEl );
		headerDiv.appendChild( deleteBtn );

		// Body Container
		const bodyDiv = document.createElement( 'div' );
		bodyDiv.style.cssText =
			'display: flex; flex-direction: column; gap: 10px;';

		// Question Text Input
		const textGroup = document.createElement( 'div' );
		const textLabel = document.createElement( 'label' );
		textLabel.style.cssText = 'font-weight: 600; font-size: 12px;';
		textLabel.textContent = 'Intitulé de la question :';
		const textInput = document.createElement( 'input' );
		textInput.type = 'text';
		textInput.className = 'roi_t10_q_texte';
		textInput.style.cssText = 'width: 100%; height: 30px;';
		textInput.placeholder = 'Ex: Le Roi blanc est-il en sécurité ?';
		textInput.value = q.texte || '';
		textInput.addEventListener( 'input', ( e ) => {
			q.texte = e.target.value;
			updateConfig();
		} );
		textGroup.appendChild( textLabel );
		textGroup.appendChild( textInput );

		// Type & Reponse Attendue Selects Row
		const selectsRow = document.createElement( 'div' );
		selectsRow.style.cssText =
			'display: flex; gap: 15px; align-items: center;';

		// Type Select Group
		const typeGroup = document.createElement( 'div' );
		typeGroup.style.cssText = 'flex: 1;';
		const typeLabel = document.createElement( 'label' );
		typeLabel.style.cssText = 'font-weight: 600; font-size: 12px;';
		typeLabel.textContent = 'Type de réponse :';
		const typeSelect = document.createElement( 'select' );
		typeSelect.className = 'roi_t10_q_type';
		typeSelect.style.cssText = 'width: 100%; height: 30px;';

		const optYesNo = document.createElement( 'option' );
		optYesNo.value = 'yesno';
		optYesNo.textContent = 'Oui / Non (yesno)';
		const optEval = document.createElement( 'option' );
		optEval.value = 'evaluation';
		optEval.textContent = 'Évaluation (evaluation)';

		typeSelect.appendChild( optYesNo );
		typeSelect.appendChild( optEval );
		typeSelect.value = q.type_reponse || 'yesno';

		typeGroup.appendChild( typeLabel );
		typeGroup.appendChild( typeSelect );

		// Reponse Select Group
		const reponseGroup = document.createElement( 'div' );
		reponseGroup.style.cssText = 'flex: 1;';
		const reponseLabel = document.createElement( 'label' );
		reponseLabel.style.cssText = 'font-weight: 600; font-size: 12px;';
		reponseLabel.textContent = 'Réponse attendue :';
		const reponseSelect = document.createElement( 'select' );
		reponseSelect.className = 'roi_t10_q_reponse';
		reponseSelect.style.cssText = 'width: 100%; height: 30px;';

		function updateReponseOptions( newType, currentVal ) {
			reponseSelect.innerHTML = '';
			if ( newType === 'evaluation' ) {
				const evalOptions = [
					{ value: 'bonne', label: 'Bonne' },
					{ value: 'neutre', label: 'Neutre' },
					{ value: 'mauvaise', label: 'Mauvaise' },
				];
				evalOptions.forEach( ( optData ) => {
					const opt = document.createElement( 'option' );
					opt.value = optData.value;
					opt.textContent = optData.label;
					reponseSelect.appendChild( opt );
				} );
				const validEvalValues = [ 'bonne', 'neutre', 'mauvaise' ];
				reponseSelect.value = validEvalValues.includes( currentVal )
					? currentVal
					: 'bonne';
			} else {
				const yesNoOptions = [
					{ value: 'oui', label: 'Oui' },
					{ value: 'non', label: 'Non' },
				];
				yesNoOptions.forEach( ( optData ) => {
					const opt = document.createElement( 'option' );
					opt.value = optData.value;
					opt.textContent = optData.label;
					reponseSelect.appendChild( opt );
				} );
				const validYesNoValues = [ 'oui', 'non' ];
				reponseSelect.value = validYesNoValues.includes( currentVal )
					? currentVal
					: 'non';
			}
		}

		updateReponseOptions( q.type_reponse, q.reponse_attendue );

		typeSelect.addEventListener( 'change', ( e ) => {
			const newType = e.target.value;
			q.type_reponse = newType;
			updateReponseOptions( newType, q.reponse_attendue );
			q.reponse_attendue = reponseSelect.value;
			updateConfig();
		} );

		reponseSelect.addEventListener( 'change', ( e ) => {
			q.reponse_attendue = e.target.value;
			updateConfig();
		} );

		reponseGroup.appendChild( reponseLabel );
		reponseGroup.appendChild( reponseSelect );

		selectsRow.appendChild( typeGroup );
		selectsRow.appendChild( reponseGroup );

		// Explication Input Group
		const explGroup = document.createElement( 'div' );
		const explLabel = document.createElement( 'label' );
		explLabel.style.cssText = 'font-weight: 600; font-size: 12px;';
		explLabel.textContent = 'Explication :';
		const explInput = document.createElement( 'input' );
		explInput.type = 'text';
		explInput.className = 'roi_t10_q_explication';
		explInput.style.cssText = 'width: 100%; height: 30px;';
		explInput.placeholder = "Ex: Le centre va s'ouvrir dangereusement.";
		explInput.value = q.explication || '';
		explInput.addEventListener( 'input', ( e ) => {
			q.explication = e.target.value;
			updateConfig();
		} );
		explGroup.appendChild( explLabel );
		explGroup.appendChild( explInput );

		// Assemble Card
		bodyDiv.appendChild( textGroup );
		bodyDiv.appendChild( selectsRow );
		bodyDiv.appendChild( explGroup );

		card.appendChild( headerDiv );
		card.appendChild( bodyDiv );

		questionsContainer.appendChild( card );
	} );
}

/**
 * Initializes Type 10 handlers.
 */
export function init() {
	if ( ! textarea ) {
		return;
	}

	const fenInput = document.getElementById( 'roi_t10_fen_depart' );
	const couleurSelect = document.getElementById( 'roi_t10_couleur' );
	const themeInput = document.getElementById( 'roi_t10_theme' );
	const solutionMovesInput = document.getElementById(
		'roi_t10_solution_moves'
	);
	const pgnExplicationInput = document.getElementById(
		'roi_t10_pgn_explication'
	);
	const btnFenEditor = document.getElementById( 'btn_open_fen_editor_t10' );
	const addQuestionBtn = document.getElementById( 'roi_t10_add_question' );

	// Restoration from saved JSON
	if ( textarea.value.trim() !== '' ) {
		try {
			const parsed = JSON.parse( textarea.value );
			if ( parsed && typeof parsed === 'object' ) {
				if ( typeof parsed.fen_depart === 'string' && fenInput ) {
					fenInput.value = parsed.fen_depart;
				}
				if (
					typeof parsed.couleur_joueur === 'string' &&
					couleurSelect
				) {
					couleurSelect.value = parsed.couleur_joueur;
				}
				if ( Array.isArray( parsed.shapes ) ) {
					t10Shapes = parsed.shapes;
				}
				if ( typeof parsed.theme === 'string' && themeInput ) {
					themeInput.value = parsed.theme;
				}
				if ( Array.isArray( parsed.questions ) ) {
					t10Questions = parsed.questions.map( ( q ) => ( {
						texte: typeof q.texte === 'string' ? q.texte : '',
						type_reponse:
							q.type_reponse === 'evaluation'
								? 'evaluation'
								: 'yesno',
						reponse_attendue:
							typeof q.reponse_attendue === 'string'
								? q.reponse_attendue
								: 'non',
						explication:
							typeof q.explication === 'string'
								? q.explication
								: '',
					} ) );
				}
				if (
					Array.isArray( parsed.solution_moves ) &&
					solutionMovesInput
				) {
					solutionMovesInput.value =
						parsed.solution_moves.join( ', ' );
				} else if (
					typeof parsed.solution_moves === 'string' &&
					solutionMovesInput
				) {
					solutionMovesInput.value = parsed.solution_moves;
				}
				if (
					typeof parsed.pgn_explication === 'string' &&
					pgnExplicationInput
				) {
					pgnExplicationInput.value = parsed.pgn_explication;
				}
			}
		} catch ( e ) {
			console.warn( 'Erreur parsing JSON Type 10 initial :', e );
		}
	}

	renderT10Questions();

	// Add question button listener
	if ( addQuestionBtn ) {
		addQuestionBtn.addEventListener( 'click', () => {
			t10Questions.push( {
				texte: '',
				type_reponse: 'yesno',
				reponse_attendue: 'non',
				explication: '',
			} );
			renderT10Questions();
			updateConfig();
		} );
	}

	// FEN Modal Trigger Listener
	if ( btnFenEditor ) {
		btnFenEditor.addEventListener( 'click', function () {
			const currentFen = fenInput
				? fenInput.value ||
				  'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5'
				: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5';

			openFenEditor(
				{
					fen: currentFen,
					shapes: t10Shapes,
				},
				function ( result ) {
					if ( result ) {
						if ( result.fen && fenInput ) {
							fenInput.value = result.fen;
						}
						if ( result.shapes ) {
							t10Shapes = result.shapes;
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

	// PGN Modal Trigger Listener for Explication Finale
	const btnPgnExplication = document.getElementById(
		'btn_open_pgn_editor_t10_explication'
	);
	if ( btnPgnExplication ) {
		btnPgnExplication.addEventListener( 'click', function () {
			const initialPgn = pgnExplicationInput
				? pgnExplicationInput.value.trim()
				: '';
			const currentFen = fenInput
				? fenInput.value ||
				  'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5'
				: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5';

			openPgnEditor(
				initialPgn,
				function ( nouveauPgn ) {
					if ( pgnExplicationInput ) {
						pgnExplicationInput.value = nouveauPgn;
					}
					updateConfig();
				},
				currentFen
			);
		} );
	}

	// Real-time update listeners for top-level inputs
	const inputsToWatch = [
		couleurSelect,
		themeInput,
		solutionMovesInput,
		pgnExplicationInput,
	];

	inputsToWatch.forEach( ( input ) => {
		if ( input ) {
			input.addEventListener( 'input', updateConfig );
			input.addEventListener( 'change', updateConfig );
		}
	} );

	updateConfig();
}
