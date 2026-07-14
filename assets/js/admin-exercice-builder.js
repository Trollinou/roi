( function () {
	document.addEventListener( 'DOMContentLoaded', function () {
		const typeSelect = document.getElementById( 'roi_exercice_type' );
		const container = document.querySelector(
			'.roi-exercice-visual-builder-container'
		);
		const textarea = document.getElementById( 'roi_config_json' );
		const fenInput = document.getElementById( 'roi_fen_input' );
		const colorInput = document.getElementById( 'roi_color_input' );
		const generateBtn = document.getElementById( 'roi_generate_board_btn' );
		const undoBtn = document.getElementById( 'roi_undo_move_btn' );
		const solutionList = document.getElementById( 'roi_solution_list' );
		const block = document.getElementById(
			'roi-exercice-builder-chessboard'
		);

		if (
			! typeSelect ||
			! container ||
			! textarea ||
			! fenInput ||
			! colorInput ||
			! generateBtn ||
			! undoBtn ||
			! solutionList ||
			! block
		) {
			return;
		}

		// Gestion de la modale d'édition FEN avec React
		const openEditorBtn = document.getElementById( 'btn_open_fen_editor' );
		const modalOverlay = document.getElementById( 'roi_fen_modal_overlay' );
		const modalCloseBtn = document.getElementById( 'roi_fen_modal_close' );
		const reactRoot = document.getElementById( 'roi_fen_react_root' );

		if ( openEditorBtn && modalOverlay && modalCloseBtn && reactRoot ) {
			openEditorBtn.addEventListener( 'click', function () {
				const initialFen =
					fenInput.value.trim() ||
					'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

				// Afficher la modale
				modalOverlay.style.display = 'flex';

				// Monter le composant React autonome
				if ( window.RoiFenEditor && window.wp && window.wp.element ) {
					const editorComponent =
						window.RoiFenEditor.default || window.RoiFenEditor;
					const element = window.wp.element.createElement(
						editorComponent,
						{
							initialFen,
							onSave( nouvelleFen, nouvelleOrientation ) {
								// Mettre à jour la valeur de l'input FEN
								fenInput.value = nouvelleFen;

								// Mettre à jour l'orientation si fournie
								if ( nouvelleOrientation && colorInput ) {
									colorInput.value = nouvelleOrientation;
								}

								// Démonter proprement le composant React
								window.wp.element.unmountComponentAtNode(
									reactRoot
								);

								// Cacher la modale
								modalOverlay.style.display = 'none';

								// Régénérer le plateau de travail
								if ( generateBtn ) {
									generateBtn.click();
								}
							},
						}
					);
					window.wp.element.render( element, reactRoot );
				}
			} );

			// Fermer au clic sur la croix
			modalCloseBtn.addEventListener( 'click', function () {
				if ( window.wp && window.wp.element ) {
					window.wp.element.unmountComponentAtNode( reactRoot );
				}
				modalOverlay.style.display = 'none';
			} );

			// Fermer au clic à l'extérieur
			modalOverlay.addEventListener( 'click', function ( e ) {
				if ( e.target === modalOverlay ) {
					if ( window.wp && window.wp.element ) {
						window.wp.element.unmountComponentAtNode( reactRoot );
					}
					modalOverlay.style.display = 'none';
				}
			} );
		}

		// Tâche 1 : Initialisation Type 1 & Type 3
		const builderType1 = document.getElementById( 'roi_builder_type_1' );
		const t1Question = document.getElementById( 'roi_t1_question' );
		const t1Reponses = [
			document.getElementById( 'roi_t1_reponse_0' ),
			document.getElementById( 'roi_t1_reponse_1' ),
			document.getElementById( 'roi_t1_reponse_2' ),
		];
		const t1CorrectRadios = document.getElementsByName( 'roi_t1_correct' );

		// Références DOM pour le Type 2 (Pop'Echecs)
		const builderType2 = document.getElementById( 'roi_builder_type_2' );
		const t2Consigne = document.getElementById( 'roi_t2_consigne' );
		const t2FenFinale = document.getElementById( 'roi_t2_fen_finale' );
		const t2GenerateBtn = document.getElementById( 'roi_t2_generate_btn' );
		const t2ChessboardContainer = document.getElementById(
			'roi_t2_chessboard_container'
		);
		const t2Feedback = document.getElementById( 'roi_t2_feedback' );
		const t2CancelBtn = document.getElementById( 'roi_t2_cancel_btn' );
		const t2EditorBtn = document.getElementById( 'btn_open_fen_editor_t2' );

		// Références et variables pour le Type 4 (La Partie dont tu es le Héros)
		const builderType4 = document.getElementById( 'roi_builder_type_4' );
		const t4EtapesContainer = document.getElementById(
			'roi_t4_etapes_container'
		);
		const t4AddPgnBtn = document.getElementById( 'roi_t4_add_pgn' );
		const t4AddQcmBtn = document.getElementById( 'roi_t4_add_qcm' );
		const pgnModalOverlay = document.getElementById(
			'roi_pgn_modal_overlay'
		);
		const pgnModalCloseBtn = document.getElementById(
			'roi_pgn_modal_close'
		);
		const pgnReactRoot = document.getElementById( 'roi_pgn_react_root' );
		let t4Etapes = [];
		const builderTitle = document.getElementById(
			'roi_visual_builder_title'
		);

		// Références et variables pour le Type 5 (Posi'Plan)
		const builderType5 = document.getElementById( 'roi_builder_type_5' );
		const t5FenDepart = document.getElementById( 'roi_t5_fen_depart' );
		const t5Couleur = document.getElementById( 'roi_t5_couleur' );
		const t5EtapesContainer = document.getElementById(
			'roi_t5_etapes_container'
		);
		const t5AddEtapeBtn = document.getElementById( 'roi_t5_add_etape' );
		const t5EditorBtn = document.getElementById( 'btn_open_fen_editor_t5' );
		let t5Etapes = [];

		// Références et variables pour le Type 6 (Associ'Plan)
		const builderType6 = document.getElementById( 'roi_builder_type_6' );
		let t6Paires = [
			{ fen: '', couleur_joueur: 'white', description: '', pgn_data: '' },
			{ fen: '', couleur_joueur: 'white', description: '', pgn_data: '' },
			{ fen: '', couleur_joueur: 'white', description: '', pgn_data: '' },
			{ fen: '', couleur_joueur: 'white', description: '', pgn_data: '' }
		];

		function toggleVisibility() {
			// Types utilisant l'échiquier visuel générique (tous sauf 1, 2, 4, 5, 6)
			const visualTypes = [
				'3',
				'7',
				'8',
				'9',
				'10',
				'11',
				'12',
				'13',
				'14',
				'15',
				'16',
			];
			if ( visualTypes.includes( typeSelect.value ) ) {
				container.style.display = '';
				if ( builderTitle ) {
					const selectedOption =
						typeSelect.options[ typeSelect.selectedIndex ];
					const selectedText = selectedOption
						? selectedOption.text
						: 'ABCDaire Tactique';
					const cleanTitle = selectedText.replace(
						/^\d+\s*-\s*/,
						''
					);
					builderTitle.textContent =
						"Constructeur d'exercice visuel (" + cleanTitle + ')';
				}
			} else {
				container.style.display = 'none';
			}

			// Type 1 (100 Commandements)
			if ( builderType1 ) {
				if ( typeSelect.value === '1' ) {
					builderType1.style.display = '';
				} else {
					builderType1.style.display = 'none';
				}
			}

			// Type 2 (Pop'Echecs)
			if ( builderType2 ) {
				if ( typeSelect.value === '2' ) {
					builderType2.style.display = '';
				} else {
					builderType2.style.display = 'none';
				}
			}

			// Type 4 (La Partie dont tu es le Héros)
			if ( builderType4 ) {
				if ( typeSelect.value === '4' ) {
					builderType4.style.display = '';
					renderT4Etapes();
				} else {
					builderType4.style.display = 'none';
				}
			}

			// Type 5 (Posi'Plan)
			if ( builderType5 ) {
				if ( typeSelect.value === '5' ) {
					builderType5.style.display = '';
					renderT5Etapes();
				} else {
					builderType5.style.display = 'none';
				}
			}

			// Type 6 (Associ'Plan)
			if ( builderType6 ) {
				if ( typeSelect.value === '6' ) {
					builderType6.style.display = '';
				} else {
					builderType6.style.display = 'none';
				}
			}
		}

		// Initialisation des données Type 1 si le type est 1
		if ( typeSelect.value === '1' && textarea.value.trim() !== '' ) {
			try {
				const parsedT1 = JSON.parse( textarea.value );
				if ( parsedT1 && typeof parsedT1 === 'object' ) {
					if ( t1Question && typeof parsedT1.question === 'string' ) {
						t1Question.value = parsedT1.question;
					}
					if (
						parsedT1.reponses &&
						Array.isArray( parsedT1.reponses )
					) {
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
						for ( var rb = 0; rb < t1CorrectRadios.length; rb++ ) {
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
				console.log( 'Erreur parsing JSON Type 1 initial :', e );
			}
		}

		// Initialisation des données Type 4 si le type est 4
		if ( typeSelect.value === '4' && textarea.value.trim() !== '' ) {
			try {
				const parsedT4 = JSON.parse( textarea.value );
				if ( parsedT4 && Array.isArray( parsedT4.etapes ) ) {
					t4Etapes = parsedT4.etapes;
				}
			} catch ( e ) {
				console.log( 'Erreur parsing JSON Type 4 initial :', e );
			}
		}

		// Initialisation des données Type 5 si le type est 5
		if ( typeSelect.value === '5' && textarea.value.trim() !== '' ) {
			try {
				const parsedT5 = JSON.parse( textarea.value );
				if ( parsedT5 && typeof parsedT5 === 'object' ) {
					if ( t5FenDepart && typeof parsedT5.fen_depart === 'string' ) {
						t5FenDepart.value = parsedT5.fen_depart;
					}
					if ( t5Couleur && typeof parsedT5.couleur_joueur === 'string' ) {
						t5Couleur.value = parsedT5.couleur_joueur;
					}
					if ( Array.isArray( parsedT5.etapes ) ) {
						t5Etapes = parsedT5.etapes;
					}
				}
			} catch ( e ) {
				console.log( 'Erreur parsing JSON Type 5 initial :', e );
			}
		}

		// Initialisation des données Type 6
		if ( textarea.value.trim() !== '' ) {
			try {
				const parsedT6 = JSON.parse( textarea.value );
				if ( parsedT6 && typeof parsedT6 === 'object' && Array.isArray( parsedT6.paires ) ) {
					for ( let idx = 0; idx < 4; idx++ ) {
						if ( parsedT6.paires[ idx ] ) {
							t6Paires[ idx ] = {
								fen: parsedT6.paires[ idx ].fen || '',
								couleur_joueur: parsedT6.paires[ idx ].couleur_joueur || 'white',
								description: parsedT6.paires[ idx ].description || '',
								pgn_data: parsedT6.paires[ idx ].pgn_data || ''
							};
						}
					}
				}
			} catch ( e ) {
				console.log( 'Erreur parsing JSON Type 6 initial :', e );
			}
		}

		// Remplissage HTML et initialisation des événements Type 6
		fillT6HTML();
		initT6Events();

		// Logic de mise à jour pour Type 4
		function updateT4Config() {
			const t4Config = {
				etapes: t4Etapes,
			};
			textarea.value = JSON.stringify( t4Config, null, 4 );
		}

		// Logic de mise à jour pour Type 5
		function updateT5Config() {
			if ( ! t5FenDepart || ! t5Couleur ) {
				return;
			}
			const t5Config = {
				fen_depart: t5FenDepart.value.trim(),
				couleur_joueur: t5Couleur.value,
				etapes: t5Etapes,
			};
			textarea.value = JSON.stringify( t5Config, null, 4 );
		}

		// Logic de mise à jour pour Type 6
		function updateT6Config() {
			if ( ! builderType6 ) {
				return;
			}
			const fenInputs = builderType6.querySelectorAll( '.roi_t6_fen' );
			const colorSelects = builderType6.querySelectorAll( '.roi_t6_couleur' );
			const descTextareas = builderType6.querySelectorAll( '.roi_t6_desc' );
			const pgnTextareas = builderType6.querySelectorAll( '.roi_t6_pgn' );

			const config = {
				paires: t6Paires.map( function ( paire, idx ) {
					return {
						fen: fenInputs[ idx ] ? fenInputs[ idx ].value.trim() : paire.fen,
						couleur_joueur: colorSelects[ idx ] ? colorSelects[ idx ].value : paire.couleur_joueur,
						description: descTextareas[ idx ] ? descTextareas[ idx ].value : paire.description,
						pgn_data: pgnTextareas[ idx ] ? pgnTextareas[ idx ].value : paire.pgn_data
					};
				} )
			};
			t6Paires = config.paires;
			textarea.value = JSON.stringify( config, null, 4 );
		}

		function fillT6HTML() {
			if ( ! builderType6 ) {
				return;
			}
			const fenInputs = builderType6.querySelectorAll( '.roi_t6_fen' );
			const colorSelects = builderType6.querySelectorAll( '.roi_t6_couleur' );
			const descTextareas = builderType6.querySelectorAll( '.roi_t6_desc' );
			const pgnTextareas = builderType6.querySelectorAll( '.roi_t6_pgn' );

			for ( let idx = 0; idx < 4; idx++ ) {
				if ( fenInputs[ idx ] ) {
					fenInputs[ idx ].value = t6Paires[ idx ].fen || '';
				}
				if ( colorSelects[ idx ] ) {
					colorSelects[ idx ].value = t6Paires[ idx ].couleur_joueur || 'white';
				}
				if ( descTextareas[ idx ] ) {
					descTextareas[ idx ].value = t6Paires[ idx ].description || '';
				}
				if ( pgnTextareas[ idx ] ) {
					pgnTextareas[ idx ].value = t6Paires[ idx ].pgn_data || '';
				}
			}
		}

		function initT6Events() {
			if ( ! builderType6 ) {
				return;
			}
			const fenInputs = builderType6.querySelectorAll( '.roi_t6_fen' );
			const colorSelects = builderType6.querySelectorAll( '.roi_t6_couleur' );
			const descTextareas = builderType6.querySelectorAll( '.roi_t6_desc' );
			const pgnTextareas = builderType6.querySelectorAll( '.roi_t6_pgn' );

			fenInputs.forEach( function ( input, idx ) {
				input.addEventListener( 'input', function () {
					t6Paires[ idx ].fen = input.value.trim();
					updateT6Config();
				} );
			} );

			colorSelects.forEach( function ( select, idx ) {
				select.addEventListener( 'change', function () {
					t6Paires[ idx ].couleur_joueur = select.value;
					updateT6Config();
				} );
			} );

			descTextareas.forEach( function ( textareaEl, idx ) {
				textareaEl.addEventListener( 'input', function () {
					t6Paires[ idx ].description = textareaEl.value;
					updateT6Config();
				} );
			} );

			const fenButtons = builderType6.querySelectorAll( '.btn_open_fen_editor' );
			fenButtons.forEach( function ( btn ) {
				btn.addEventListener( 'click', function () {
					const idx = parseInt( btn.getAttribute( 'data-index' ), 10 );
					if ( isNaN( idx ) ) return;

					const currentFenInput = fenInputs[ idx ];
					const initialFen = ( currentFenInput ? currentFenInput.value.trim() : '' ) ||
						'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

					if ( modalOverlay && reactRoot ) {
						modalOverlay.style.display = 'flex';

						if ( window.RoiFenEditor && window.wp && window.wp.element ) {
							const editorComponent = window.RoiFenEditor.default || window.RoiFenEditor;
							const element = window.wp.element.createElement(
								editorComponent,
								{
									initialFen: initialFen,
									onSave: function ( nouvelleFen ) {
										if ( currentFenInput ) {
											currentFenInput.value = nouvelleFen;
										}
										t6Paires[ idx ].fen = nouvelleFen;
										window.wp.element.unmountComponentAtNode( reactRoot );
										modalOverlay.style.display = 'none';
										updateT6Config();
									}
								}
							);
							window.wp.element.render( element, reactRoot );
						}
					}
				} );
			} );

			const pgnButtons = builderType6.querySelectorAll( '.btn_open_pgn_editor' );
			pgnButtons.forEach( function ( btn ) {
				btn.addEventListener( 'click', function () {
					const idx = parseInt( btn.getAttribute( 'data-index' ), 10 );
					if ( isNaN( idx ) ) return;

					const currentPgnTextarea = pgnTextareas[ idx ];
					const initialPgn = ( currentPgnTextarea ? currentPgnTextarea.value.trim() : '' );

					if ( pgnModalOverlay && pgnReactRoot ) {
						pgnModalOverlay.style.display = 'flex';

						if ( window.RoiPgnEditor && window.wp && window.wp.element ) {
							const editorComponent = window.RoiPgnEditor.default || window.RoiPgnEditor;
							const element = window.wp.element.createElement(
								editorComponent,
								{
									initialPgn: initialPgn,
									onSave: function ( nouveauPgn ) {
										if ( currentPgnTextarea ) {
											currentPgnTextarea.value = nouveauPgn;
										}
										t6Paires[ idx ].pgn_data = nouveauPgn;
										window.wp.element.unmountComponentAtNode( pgnReactRoot );
										pgnModalOverlay.style.display = 'none';
										updateT6Config();
									}
								}
							);
							window.wp.element.render( element, pgnReactRoot );
						}
					}
				} );
			} );
		}

		// Rendu visuel des étapes du Type 5
		function renderT5Etapes() {
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
							<input type="text" class="t5-question-input" style="width: 100%; height: 30px;" value="${ etape.question || '' }">
						</div>
						<div>
							<label style="font-weight: 600; display: block; margin-bottom: 4px;">Réponse ordinateur (coup suivant de l'adversaire, ex: Nf6) :</label>
							<input type="text" class="t5-reponse-ordinateur-input" style="width: 100%; height: 30px;" value="${ etape.reponse_ordinateur || '' }" placeholder="Laissez vide s'il s'agit du coup final">
						</div>
						<div>
							<label style="font-weight: 600; display: block; margin-bottom: 6px;">Choix de réponse (sélectionnez la bonne réponse) :</label>
							<div style="display: flex; flex-direction: column; gap: 12px;">
								${ [ 0, 1, 2 ].map( function ( idx ) {
									const choixObj = etape.choix && etape.choix[ idx ] ? etape.choix[ idx ] : { texte: '', san: '', explication: '' };
									const isChecked = parseInt( etape.bonne_reponse, 10 ) === idx ? 'checked' : '';
									return `
										<div style="border: 1px dashed #ccc; padding: 10px; border-radius: 4px; background: #fff; display: flex; flex-direction: column; gap: 8px;">
											<div style="display: flex; align-items: center; gap: 8px;">
												<input type="radio" name="roi_t5_correct_${ i }" class="t5-correct-radio" value="${ idx }" ${ isChecked }>
												<strong style="font-size: 12px;">Choix ${ idx + 1 } :</strong>
											</div>
											<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
												<div>
													<label style="font-size: 11px; display: block;">Texte du bouton :</label>
													<input type="text" class="t5-choix-texte" data-choice-index="${ idx }" style="width: 100%; height: 28px;" value="${ choixObj.texte || '' }" placeholder="Ex: Fou c4">
												</div>
												<div>
													<label style="font-size: 11px; display: block;">Coup SAN (ex: Bc4) :</label>
													<input type="text" class="t5-choix-san" data-choice-index="${ idx }" style="width: 100%; height: 28px;" value="${ choixObj.san || '' }" placeholder="Ex: Bc4">
												</div>
											</div>
											<div>
												<label style="font-size: 11px; display: block;">Explication si erreur :</label>
												<input type="text" class="t5-choix-explication" data-choice-index="${ idx }" style="width: 100%; height: 28px;" value="${ choixObj.explication || '' }" placeholder="Explication affichée si mauvais choix">
											</div>
										</div>
									`;
								} ).join( '' ) }
							</div>
						</div>
						<div style="margin-top: 5px;">
							<button type="button" class="button button-link-delete btn-delete-t5-step" style="color: #b32d2e;">Supprimer l'étape</button>
						</div>
					</div>
				`;

				// Écouteurs d'événements
				const questionInput = div.querySelector( '.t5-question-input' );
				questionInput.addEventListener( 'input', function ( e ) {
					t5Etapes[ i ].question = e.target.value;
					updateT5Config();
				} );

				const reponseOrdiInput = div.querySelector( '.t5-reponse-ordinateur-input' );
				reponseOrdiInput.addEventListener( 'input', function ( e ) {
					t5Etapes[ i ].reponse_ordinateur = e.target.value;
					updateT5Config();
				} );

				const radioButtons = div.querySelectorAll( '.t5-correct-radio' );
				radioButtons.forEach( function ( rb ) {
					rb.addEventListener( 'change', function ( e ) {
						if ( e.target.checked ) {
							t5Etapes[ i ].bonne_reponse = parseInt( e.target.value, 10 );
							updateT5Config();
						}
					} );
				} );

				const choiceTexts = div.querySelectorAll( '.t5-choix-texte' );
				choiceTexts.forEach( function ( input ) {
					input.addEventListener( 'input', function ( e ) {
						const idx = parseInt( e.target.getAttribute( 'data-choice-index' ), 10 );
						if ( ! t5Etapes[ i ].choix ) {
							t5Etapes[ i ].choix = [ {}, {}, {} ];
						}
						if ( ! t5Etapes[ i ].choix[ idx ] ) {
							t5Etapes[ i ].choix[ idx ] = {};
						}
						t5Etapes[ i ].choix[ idx ].texte = e.target.value;
						updateT5Config();
					} );
				} );

				const choiceSans = div.querySelectorAll( '.t5-choix-san' );
				choiceSans.forEach( function ( input ) {
					input.addEventListener( 'input', function ( e ) {
						const idx = parseInt( e.target.getAttribute( 'data-choice-index' ), 10 );
						if ( ! t5Etapes[ i ].choix ) {
							t5Etapes[ i ].choix = [ {}, {}, {} ];
						}
						if ( ! t5Etapes[ i ].choix[ idx ] ) {
							t5Etapes[ i ].choix[ idx ] = {};
						}
						t5Etapes[ i ].choix[ idx ].san = e.target.value;
						updateT5Config();
					} );
				} );

				const choiceExps = div.querySelectorAll( '.t5-choix-explication' );
				choiceExps.forEach( function ( input ) {
					input.addEventListener( 'input', function ( e ) {
						const idx = parseInt( e.target.getAttribute( 'data-choice-index' ), 10 );
						if ( ! t5Etapes[ i ].choix ) {
							t5Etapes[ i ].choix = [ {}, {}, {} ];
						}
						if ( ! t5Etapes[ i ].choix[ idx ] ) {
							t5Etapes[ i ].choix[ idx ] = {};
						}
						t5Etapes[ i ].choix[ idx ].explication = e.target.value;
						updateT5Config();
					} );
				} );

				div.querySelector( '.btn-delete-t5-step' ).addEventListener( 'click', function () {
					t5Etapes.splice( i, 1 );
					renderT5Etapes();
					updateT5Config();
				} );

				t5EtapesContainer.appendChild( div );
			} );
		}

		// Câblage du bouton d'ajout d'étape Type 5
		if ( t5AddEtapeBtn ) {
			t5AddEtapeBtn.addEventListener( 'click', function () {
				t5Etapes.push( {
					question: '',
					choix: [
						{ texte: '', san: '', explication: '' },
						{ texte: '', san: '', explication: '' },
						{ texte: '', san: '', explication: '' }
					],
					bonne_reponse: 0,
					reponse_ordinateur: ''
				} );
				renderT5Etapes();
				updateT5Config();
			} );
		}

		if ( t5FenDepart ) {
			t5FenDepart.addEventListener( 'input', updateT5Config );
		}
		if ( t5Couleur ) {
			t5Couleur.addEventListener( 'change', updateT5Config );
		}

		// Gestion de la modale FenEditor pour le Type 5
		if ( t5EditorBtn && modalOverlay && modalCloseBtn && reactRoot ) {
			t5EditorBtn.addEventListener( 'click', function () {
				const initialFen =
					( t5FenDepart ? t5FenDepart.value.trim() : '' ) ||
					'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

				modalOverlay.style.display = 'flex';

				if ( window.RoiFenEditor && window.wp && window.wp.element ) {
					const editorComponent =
						window.RoiFenEditor.default || window.RoiFenEditor;
					const element = window.wp.element.createElement(
						editorComponent,
						{
							initialFen,
							onSave( nouvelleFen ) {
								if ( t5FenDepart ) {
									t5FenDepart.value = nouvelleFen;
								}
								window.wp.element.unmountComponentAtNode(
									reactRoot
								);
								modalOverlay.style.display = 'none';
								updateT5Config();
							},
						}
					);
					window.wp.element.render( element, reactRoot );
				}
			} );
		}

		// Rendu visuel des étapes du Type 4
		function renderT4Etapes() {
			if ( ! t4EtapesContainer ) {
				return;
			}
			t4EtapesContainer.innerHTML = '';

			if ( t4Etapes.length === 0 ) {
				t4EtapesContainer.innerHTML =
					'<p style="color: #646970; font-style: italic; text-align: center; padding: 15px 0;">Aucune étape ajoutée pour le moment.</p>';
				return;
			}

			t4Etapes.forEach( function ( etape, i ) {
				const div = document.createElement( 'div' );
				div.className = 'roi-t4-etape-card';
				div.setAttribute( 'data-index', i );
				div.style.border = '1px solid #ccd0d4';
				div.style.padding = '15px';
				div.style.marginBottom = '15px';
				div.style.background = '#fafafa';
				div.style.borderRadius = '6px';
				div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

				if ( etape.type === 'pgn' ) {
					div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 14px; color: #1e1e1e;">Étape ${
								i + 1
							} : Séquence PGN</strong>
                            <span style="font-size: 11px; padding: 3px 8px; background: #e8f0fe; color: #3858e9; border-radius: 12px; font-weight: 600; text-transform: uppercase;">PGN</span>
                        </div>
                        <textarea class="roi-t4-pgn-preview" readonly style="width: 100%; height: 60px; font-family: monospace; font-size: 12px; background: #f0f0f1; resize: none; border: 1px solid #ccd0d4; border-radius: 4px; padding: 8px; margin-bottom: 10px; color: #50575e;">${
							etape.pgn_data || ''
						}</textarea>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="button btn-edit-pgn" style="display: inline-flex; align-items: center; gap: 4px;"><span class="dashicons dashicons-edit" style="font-size: 16px; width: 16px; height: 16px; line-height: 1;"></span> Éditer le PGN</button>
                            <button type="button" class="button button-link-delete btn-delete-step" style="color: #b32d2e;">Supprimer</button>
                        </div>
                    `;

					// Câblage Édition PGN
					div.querySelector( '.btn-edit-pgn' ).addEventListener(
						'click',
						function () {
							if ( ! pgnModalOverlay || ! pgnReactRoot ) {
								return;
							}
							pgnModalOverlay.style.display = 'flex';

							if (
								window.RoiPgnEditor &&
								window.wp &&
								window.wp.element
							) {
								const editorComponent =
									window.RoiPgnEditor.default ||
									window.RoiPgnEditor;
								const element = window.wp.element.createElement(
									editorComponent,
									{
										initialPgn: etape.pgn_data || '',
										onSave( nouveauPgn, finalFen ) {
											t4Etapes[ i ].pgn_data = nouveauPgn;
											if ( finalFen ) {
												t4Etapes[ i ].final_fen = finalFen;
											}
											window.wp.element.unmountComponentAtNode(
												pgnReactRoot
											);
											pgnModalOverlay.style.display =
												'none';
											renderT4Etapes();
											updateT4Config();
										},
									}
								);
								window.wp.element.render(
									element,
									pgnReactRoot
								);
							}
						}
					);
				} else if ( etape.type === 'qcm' ) {
					div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 14px; color: #1e1e1e;">Étape ${
								i + 1
							} : QCM</strong>
                            <span style="font-size: 11px; padding: 3px 8px; background: #fff8e1; color: #b78103; border-radius: 12px; font-weight: 600; text-transform: uppercase;">QCM</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <label style="font-weight: 600; display: block; margin-bottom: 4px;">Question :</label>
                                <input type="text" class="qcm-question-input" style="width: 100%; height: 30px;" value="${
									etape.question || ''
								}">
                            </div>
                            <div style="display: flex; gap: 8px; align-items: flex-end;">
                                <div style="flex: 1;">
                                    <label style="font-weight: 600; display: block; margin-bottom: 4px;">FEN de départ :</label>
                                    <input type="text" class="qcm-fen-input" style="width: 100%; height: 30px;" value="${
										etape.fen || ''
									}">
                                </div>
                                <button type="button" class="button btn-edit-fen-qcm" style="height: 30px;" title="Éditer la position visuellement">Éditer la position</button>
                            </div>
                            <div>
                                <label style="font-weight: 600; display: block; margin-bottom: 6px;">Choix de réponse (sélectionnez la bonne réponse) :</label>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    ${ [ 0, 1, 2 ]
										.map( function ( idx ) {
											const choiceVal =
												etape.choix &&
												etape.choix[ idx ]
													? etape.choix[ idx ]
													: '';
											const isChecked =
												parseInt(
													etape.bonne_reponse,
													10
												) === idx
													? 'checked'
													: '';
											return `
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <input type="radio" name="roi_t4_qcm_correct_${ i }" class="qcm-correct-radio" value="${ idx }" ${ isChecked }>
                                                <input type="text" class="qcm-choix-input" data-choice-index="${ idx }" style="flex: 1; height: 30px;" placeholder="Réponse ${
													idx + 1
												}" value="${ choiceVal }">
                                            </div>
                                        `;
										} )
										.join( '' ) }
                                </div>
                            </div>
                            <div>
                                <button type="button" class="button button-link-delete btn-delete-step" style="color: #b32d2e;">Supprimer l'étape</button>
                            </div>
                        </div>
                    `;

					// Écouteurs d'événements pour le QCM
					const questionInput = div.querySelector(
						'.qcm-question-input'
					);
					questionInput.addEventListener( 'input', function ( e ) {
						t4Etapes[ i ].question = e.target.value;
						updateT4Config();
					} );

					const fenInputQcm = div.querySelector( '.qcm-fen-input' );
					fenInputQcm.addEventListener( 'input', function ( e ) {
						t4Etapes[ i ].fen = e.target.value;
						updateT4Config();
					} );

					const choiceInputs =
						div.querySelectorAll( '.qcm-choix-input' );
					choiceInputs.forEach( function ( ci ) {
						ci.addEventListener( 'input', function ( e ) {
							const cIdx = parseInt(
								e.target.getAttribute( 'data-choice-index' ),
								10
							);
							if ( ! t4Etapes[ i ].choix ) {
								t4Etapes[ i ].choix = [ '', '', '' ];
							}
							t4Etapes[ i ].choix[ cIdx ] = e.target.value;
							updateT4Config();
						} );
					} );

					const radioButtons =
						div.querySelectorAll( '.qcm-correct-radio' );
					radioButtons.forEach( function ( rb ) {
						rb.addEventListener( 'change', function ( e ) {
							if ( e.target.checked ) {
								t4Etapes[ i ].bonne_reponse = parseInt(
									e.target.value,
									10
								);
								updateT4Config();
							}
						} );
					} );

					// Câblage Édition FEN
					div.querySelector( '.btn-edit-fen-qcm' ).addEventListener(
						'click',
						function () {
							if ( ! modalOverlay || ! reactRoot ) {
								return;
							}
							modalOverlay.style.display = 'flex';

							const currentFen =
								etape.fen ||
								'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

							if (
								window.RoiFenEditor &&
								window.wp &&
								window.wp.element
							) {
								const editorComponent =
									window.RoiFenEditor.default ||
									window.RoiFenEditor;
								const element = window.wp.element.createElement(
									editorComponent,
									{
										initialFen: currentFen,
										onSave( nouvelleFen ) {
											t4Etapes[ i ].fen = nouvelleFen;
											fenInputQcm.value = nouvelleFen;
											window.wp.element.unmountComponentAtNode(
												reactRoot
											);
											modalOverlay.style.display = 'none';
											updateT4Config();
										},
									}
								);
								window.wp.element.render( element, reactRoot );
							}
						}
					);
				}

				// Câblage Suppression d'étape
				div.querySelector( '.btn-delete-step' ).addEventListener(
					'click',
					function () {
						t4Etapes.splice( i, 1 );
						renderT4Etapes();
						updateT4Config();
					}
				);

				t4EtapesContainer.appendChild( div );
			} );
		}

		// Câblage des boutons d'ajout d'étapes
		if ( t4AddPgnBtn ) {
			t4AddPgnBtn.addEventListener( 'click', function () {
				t4Etapes.push( {
					type: 'pgn',
					pgn_data: '',
				} );
				renderT4Etapes();
				updateT4Config();
			} );
		}

		if ( t4AddQcmBtn ) {
			t4AddQcmBtn.addEventListener( 'click', function () {
				let initialQcmFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

				// Parcourir à l'envers pour trouver le PGN le plus proche
				if ( t4Etapes.length > 0 ) {
					for ( let i = t4Etapes.length - 1; i >= 0; i-- ) {
						if ( t4Etapes[ i ].type === 'pgn' ) {
							if ( t4Etapes[ i ].final_fen ) {
								initialQcmFen = t4Etapes[ i ].final_fen;
							} else if ( t4Etapes[ i ].pgn_data ) {
								// Repli (fallback) si la FEN finale n'a pas encore été calculée/enregistrée
								try {
									if ( typeof window.Chess === 'function' ) {
										const tempChess = new window.Chess();
										tempChess.loadPgn( t4Etapes[ i ].pgn_data );
										initialQcmFen = tempChess.fen();
									}
								} catch ( e ) {
									console.warn( 'Impossible de lire le PGN précédent pour la FEN du QCM', e );
								}
							}
							break;
						}
					}
				}

				t4Etapes.push( {
					type: 'qcm',
					question: '',
					fen: initialQcmFen,
					choix: [ '', '', '' ],
					bonne_reponse: 0,
				} );
				renderT4Etapes();
				updateT4Config();
			} );
		}

		// Gestion de la modale PGN
		if ( pgnModalCloseBtn && pgnModalOverlay && pgnReactRoot ) {
			pgnModalCloseBtn.addEventListener( 'click', function () {
				if ( window.wp && window.wp.element ) {
					window.wp.element.unmountComponentAtNode( pgnReactRoot );
				}
				pgnModalOverlay.style.display = 'none';
			} );

			pgnModalOverlay.addEventListener( 'click', function ( e ) {
				if ( e.target === pgnModalOverlay ) {
					if ( window.wp && window.wp.element ) {
						window.wp.element.unmountComponentAtNode(
							pgnReactRoot
						);
					}
					pgnModalOverlay.style.display = 'none';
				}
			} );
		}

		// Logic de mise à jour pour Type 1
		function updateT1Config() {
			const reponsesArr = [];
			for ( let r = 0; r < 3; r++ ) {
				reponsesArr.push(
					t1Reponses[ r ] ? t1Reponses[ r ].value : ''
				);
			}

			let bonneReponseVal = null;
			for ( let rb = 0; rb < t1CorrectRadios.length; rb++ ) {
				if ( t1CorrectRadios[ rb ].checked ) {
					bonneReponseVal = parseInt(
						t1CorrectRadios[ rb ].value,
						10
					);
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

		if ( builderType1 ) {
			if ( t1Question ) {
				t1Question.addEventListener( 'input', updateT1Config );
			}
			t1Reponses.forEach( function ( inputField ) {
				if ( inputField ) {
					inputField.addEventListener( 'input', updateT1Config );
				}
			} );
			for ( var rb = 0; rb < t1CorrectRadios.length; rb++ ) {
				t1CorrectRadios[ rb ].addEventListener(
					'change',
					updateT1Config
				);
			}
		}

		// ============================================================
		// Type 2 — Pop'Echecs : Logique de sélection de pièce
		// ============================================================

		// Traduction des types de pièces (notation FEN -> nom français)
		const pieceNames = {
			p: { white: 'Pion Blanc', black: 'Pion Noir' },
			r: { white: 'Tour Blanche', black: 'Tour Noire' },
			n: { white: 'Cavalier Blanc', black: 'Cavalier Noir' },
			b: { white: 'Fou Blanc', black: 'Fou Noir' },
			q: { white: 'Dame Blanche', black: 'Dame Noire' },
			k: { white: 'Roi Blanc', black: 'Roi Noir' },
		};

		/**
		 * Retourne le nom lisible d'une pièce (ex: "Cavalier Blanc").
		 * @param {string} pieceType  - Type FEN (p, r, n, b, q, k).
		 * @param {string} pieceColor - "white" ou "black".
		 * @return {string}
		 */
		function getPieceName( pieceType, pieceColor ) {
			const entry = pieceNames[ pieceType ];
			if ( entry && entry[ pieceColor ] ) {
				return entry[ pieceColor ];
			}
			return pieceType.toUpperCase() + ' (' + pieceColor + ')';
		}

		// État interne du builder Type 2
		let t2BoardAPI = null;
		let t2BoardEl = null;
		let t2SelectedData = null; // { piece_type, piece_color, case_cible }

		/**
		 * Met à jour le JSON de configuration pour le Type 2.
		 * Construit l'objet : { consigne, fen_depart, fen_finale, piece_type, piece_color, case_cible }
		 */
		function updateT2Config() {
			if ( ! t2Consigne || ! t2FenFinale ) {
				return;
			}

			const t2Config = {
				consigne: t2Consigne.value,
				fen_finale: t2FenFinale.value.trim(),
			};

			// Si une pièce a été sélectionnée, ajouter les données de la pièce
			if ( t2SelectedData ) {
				t2Config.fen_depart = t2SelectedData.fen_depart;
				t2Config.piece_type = t2SelectedData.piece_type;
				t2Config.piece_color = t2SelectedData.piece_color;
				t2Config.case_cible = t2SelectedData.case_cible;
			}

			textarea.value = JSON.stringify( t2Config, null, 4 );
		}

		/**
		 * Gestion du clic sur une case de l'échiquier Type 2.
		 * Retire visuellement la pièce, affiche la case vide et dessine un cercle vert.
		 * @param square
		 */
		function handleT2SquareClick( square ) {
			if ( ! t2BoardAPI ) {
				return;
			}

			const fenFinale = t2FenFinale.value.trim();

			// 1. Toujours réinitialiser le plateau à la FEN finale complète avant une nouvelle sélection
			t2BoardAPI.setPosition( fenFinale );

			// Nettoyer les formes (cercles) précédentes
			if ( typeof t2BoardAPI.hideMoves === 'function' ) {
				t2BoardAPI.hideMoves();
			} else if ( typeof t2BoardAPI.setShapes === 'function' ) {
				t2BoardAPI.setShapes( [] );
			}

			const pieceOnSquare = findPieceOnSquare( fenFinale, square );

			if ( ! pieceOnSquare ) {
				// Si on clique sur une case vide, on annule la sélection en cours
				if ( t2CancelBtn ) {
					t2CancelBtn.click();
				}
				return;
			}

			// 2. Retirer visuellement la pièce
			t2BoardAPI.removePiece( square );

			// 3. Récupérer la FEN sans cette pièce (notre vraie FEN de départ)
			const fenDepart = t2BoardAPI.getFen();

			// 4. Dessiner un cercle vert sur la case vide pour marquer la cible
			if ( typeof t2BoardAPI.drawCircle === 'function' ) {
				t2BoardAPI.drawCircle( square, 'green' );
			} else if ( typeof t2BoardAPI.setShapes === 'function' ) {
				t2BoardAPI.setShapes( [ { orig: square, brush: 'green' } ] );
			}

			// Sauvegarder les données sélectionnées
			t2SelectedData = {
				piece_type: pieceOnSquare.type,
				piece_color: pieceOnSquare.color,
				case_cible: square,
				fen_depart: fenDepart,
			};

			// Mettre à jour le feedback visuel + afficher le bouton d'annulation
			const nomPiece = getPieceName(
				pieceOnSquare.type,
				pieceOnSquare.color
			);
			updateT2Feedback(
				'Pièce retirée : ' +
					nomPiece +
					' sur ' +
					square +
					' (Position de départ générée)',
				'#00a32a',
				true
			);

			// Mettre à jour le JSON
			updateT2Config();
		}
		/**
		 * Cherche quelle pièce est sur une case donnée à partir d'une FEN.
		 * @param {string} fen    - La FEN complète.
		 * @param {string} square - La case (ex: "e4").
		 * @return {{ type: string, color: string }|null}
		 */
		function findPieceOnSquare( fen, square ) {
			// Parser la partie placement de la FEN
			const placement = fen.split( ' ' )[ 0 ];
			const rows = placement.split( '/' );
			const files = 'abcdefgh';

			// Convertir la case en coordonnées (file = colonne, rank = rangée)
			const fileIndex = files.indexOf( square[ 0 ] );
			const rankIndex = 8 - parseInt( square[ 1 ], 10 );

			if ( fileIndex < 0 || rankIndex < 0 || rankIndex > 7 ) {
				return null;
			}

			const row = rows[ rankIndex ];
			if ( ! row ) {
				return null;
			}

			// Parcourir la rangée caractère par caractère
			let currentFile = 0;
			for ( let c = 0; c < row.length; c++ ) {
				const ch = row[ c ];
				if ( ch >= '1' && ch <= '8' ) {
					currentFile += parseInt( ch, 10 );
				} else {
					if ( currentFile === fileIndex ) {
						// Trouvé la pièce
						const isWhite = ch === ch.toUpperCase();
						return {
							type: ch.toLowerCase(),
							color: isWhite ? 'white' : 'black',
						};
					}
					currentFile++;
				}
			}

			return null;
		}

		// Gestion de la modale FenEditor pour le Type 2
		if ( t2EditorBtn && modalOverlay && modalCloseBtn && reactRoot ) {
			t2EditorBtn.addEventListener( 'click', function () {
				const initialFen =
					( t2FenFinale ? t2FenFinale.value.trim() : '' ) ||
					'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

				// Afficher la modale
				modalOverlay.style.display = 'flex';

				// Monter le composant React FenEditor
				if ( window.RoiFenEditor && window.wp && window.wp.element ) {
					const editorComponent =
						window.RoiFenEditor.default || window.RoiFenEditor;
					const element = window.wp.element.createElement(
						editorComponent,
						{
							initialFen,
							onSave( nouvelleFen ) {
								// Mettre à jour l'input FEN finale
								if ( t2FenFinale ) {
									t2FenFinale.value = nouvelleFen;
								}

								// Démonter le composant React
								window.wp.element.unmountComponentAtNode(
									reactRoot
								);

								// Cacher la modale
								modalOverlay.style.display = 'none';

								// Régénérer le plateau si visible
								if (
									t2GenerateBtn &&
									typeSelect.value === '2'
								) {
									t2GenerateBtn.click();
								}
							},
						}
					);
					window.wp.element.render( element, reactRoot );
				}
			} );
		}

		/**
		 * Réinitialise l'état visuel du feedback et du bouton d'annulation.
		 * @param {string}  message    - Le texte à afficher.
		 * @param {string}  color      - La couleur de la barre latérale.
		 * @param {boolean} showCancel - Afficher le bouton d'annulation.
		 */
		function updateT2Feedback( message, color, showCancel ) {
			if ( t2Feedback ) {
				t2Feedback.textContent = message;
				t2Feedback.style.borderLeftColor = color;
			}
			if ( t2CancelBtn ) {
				t2CancelBtn.style.display = showCancel ? '' : 'none';
			}
		}

		// Génération du plateau de sélection (Type 2)
		if ( t2GenerateBtn && t2ChessboardContainer ) {
			t2GenerateBtn.addEventListener( 'click', function ( e ) {
				const fen = t2FenFinale ? t2FenFinale.value.trim() : '';
				if ( ! fen ) {
					updateT2Feedback(
						'Erreur : veuillez saisir une FEN valide.',
						'#d63638',
						false
					);
					return;
				}

				// Vérifier si c'est un rechargement automatique depuis la base de données
				const isAutoLoad =
					t2GenerateBtn.getAttribute( 'data-autoload' ) === 'true';
				t2GenerateBtn.removeAttribute( 'data-autoload' ); // On nettoie pour les prochains vrais clics

				// Ne réinitialiser la sélection QUE si c'est un vrai clic de l'entraîneur
				if ( ! isAutoLoad ) {
					t2SelectedData = null;
					updateT2Feedback(
						"Cliquez sur une pièce de l'échiquier pour la retirer.",
						'#72aee6',
						false
					);
				}

				// Nettoyer l'ancien échiquier s'il existe
				if ( t2BoardAPI && typeof t2BoardAPI.destroy === 'function' ) {
					t2BoardAPI.destroy();
					t2BoardAPI = null;
				}

				// Créer un nouvel élément pour le plateau
				t2ChessboardContainer.innerHTML = '';
				t2BoardEl = document.createElement( 'div' );
				t2BoardEl.id = 'roi-t2-chessboard';
				t2BoardEl.className = 'roi-clean-admin-board';
				t2BoardEl.style.width = '100%';
				t2BoardEl.style.aspectRatio = '1';
				t2BoardEl.style.position = 'relative';
				t2ChessboardContainer.appendChild( t2BoardEl );

				// Attendre que EgBoardCore soit disponible
				var t2CheckInterval = setInterval( function () {
					if ( window.EgBoardCore ) {
						clearInterval( t2CheckInterval );

						const boardConfig = {
							fen,
							orientation: 'white',
							coordinates: true,
							viewOnly: false,
							movable: {
								free: false,
								color: 'both',
							},
							events: {
								select( square ) {
									handleT2SquareClick( square );
								},
							},
						};

						const boardState = {
							showThreats: false,
							freeMode: false,
							promotionDialogState: { isEnabled: false },
							historyViewerState: { isEnabled: false },
						};

						t2BoardAPI = new window.EgBoardCore(
							t2BoardEl,
							boardState,
							function () {},
							function () {},
							boardConfig,
							{ workerUrl: '' }
						);

						// Si une sélection existait déjà (chargée depuis la base de données)
						if (
							isAutoLoad &&
							t2SelectedData &&
							t2SelectedData.fen_depart
						) {
							t2BoardAPI.setPosition( t2SelectedData.fen_depart );
							if ( typeof t2BoardAPI.drawCircle === 'function' ) {
								t2BoardAPI.drawCircle(
									t2SelectedData.case_cible,
									'green'
								);
							} else if (
								typeof t2BoardAPI.setShapes === 'function'
							) {
								t2BoardAPI.setShapes( [
									{
										orig: t2SelectedData.case_cible,
										brush: 'green',
									},
								] );
							}
						}

						// Désactiver Stockfish
						if (
							typeof t2BoardAPI.updateStockfishConfig ===
							'function'
						) {
							t2BoardAPI.updateStockfishConfig( {
								whiteMode: 'disabled',
								blackMode: 'disabled',
							} );
						}

						// Mettre à jour le config JSON initial
						updateT2Config();
					}
				}, 50 );
			} );
		}

		// Annulation de la sélection de pièce (Type 2)
		if ( t2CancelBtn ) {
			t2CancelBtn.addEventListener( 'click', function () {
				// Réinitialiser les données de sélection
				t2SelectedData = null;

				// Recharger la position finale complète sur l'échiquier
				if ( t2BoardAPI && t2FenFinale ) {
					t2BoardAPI.setPosition( t2FenFinale.value.trim() );

					// Effacer le cercle vert
					if ( typeof t2BoardAPI.hideMoves === 'function' ) {
						t2BoardAPI.hideMoves();
					} else if ( typeof t2BoardAPI.setShapes === 'function' ) {
						t2BoardAPI.setShapes( [] );
					}
				}

				// Remettre le feedback à l'état initial
				updateT2Feedback(
					'Sélection annulée. Cliquez sur une pièce pour la retirer.',
					'#72aee6',
					false
				);

				// Mettre à jour le JSON (sans pièce sélectionnée)
				updateT2Config();
			} );
		}

		// Écoute des changements sur la consigne (Type 2) pour mettre à jour le JSON
		if ( t2Consigne ) {
			t2Consigne.addEventListener( 'input', function () {
				if ( typeSelect.value === '2' ) {
					updateT2Config();
				}
			} );
		}

		// Initialisation des données Type 2 depuis le JSON existant
		if ( typeSelect.value === '2' && textarea.value.trim() !== '' ) {
			try {
				const parsedT2 = JSON.parse( textarea.value );
				if ( parsedT2 && typeof parsedT2 === 'object' ) {
					if ( t2Consigne && typeof parsedT2.consigne === 'string' ) {
						t2Consigne.value = parsedT2.consigne;
					}
					if (
						t2FenFinale &&
						typeof parsedT2.fen_finale === 'string'
					) {
						t2FenFinale.value = parsedT2.fen_finale;
					}
					// Restaurer la sélection de pièce si elle existait
					if (
						parsedT2.piece_type &&
						parsedT2.piece_color &&
						parsedT2.case_cible &&
						parsedT2.fen_depart
					) {
						t2SelectedData = {
							piece_type: parsedT2.piece_type,
							piece_color: parsedT2.piece_color,
							case_cible: parsedT2.case_cible,
							fen_depart: parsedT2.fen_depart,
						};
						const nomPiece = getPieceName(
							parsedT2.piece_type,
							parsedT2.piece_color
						);
						updateT2Feedback(
							'Pièce retirée : ' +
								nomPiece +
								' sur ' +
								parsedT2.case_cible +
								' (Position de départ générée)',
							'#00a32a',
							true
						);
					}
					// Régénérer le plateau automatiquement si une FEN finale est présente
					if ( parsedT2.fen_finale && t2GenerateBtn ) {
						setTimeout( function () {
							// On ajoute un marqueur pour avertir le bouton que c'est un rechargement
							t2GenerateBtn.setAttribute(
								'data-autoload',
								'true'
							);
							t2GenerateBtn.click();
						}, 200 );
					}
				}
			} catch ( e ) {
				console.log( 'Erreur parsing JSON Type 2 initial :', e );
			}
		}

		// État local de la configuration
		const configData = { fen: '', couleur_joueur: 'white', solution: [] };

		// Chargement et parsing du JSON existant
		try {
			const parsed = JSON.parse( textarea.value );
			if ( parsed && typeof parsed === 'object' ) {
				configData.fen = parsed.fen || '';
				configData.couleur_joueur =
					parsed.couleur_joueur || parsed.color || 'white';
				configData.solution = parsed.solution || [];
			}
		} catch ( e ) {
			console.log(
				'JSON existant invalide ou vide, initialisation par défaut.'
			);
			configData.fen = fenInput.value.trim();
			configData.couleur_joueur = colorInput.value;
		}

		// Remplir les champs HTML associés avec l'état initial
		if ( configData.fen ) {
			fenInput.value = configData.fen;
		}
		if ( configData.couleur_joueur ) {
			colorInput.value = configData.couleur_joueur;
		}

		// Enregistrer l'écouteur et initialiser la visibilité
		typeSelect.addEventListener( 'change', toggleVisibility );
		toggleVisibility();

		// Initialisation propre et directe de BoardCore (sans passer par view.jsx)
		let boardAPI;
		var checkInterval = setInterval( function () {
			if ( window.EgBoardCore ) {
				clearInterval( checkInterval );

				const boardConfig = {
					fen:
						configData.fen ||
						fenInput.value.trim() ||
						'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
					orientation:
						configData.couleur_joueur ||
						colorInput.value ||
						'white',
					coordinates: true,
					viewOnly: false,
				};

				const boardState = {
					showThreats: false,
					freeMode: false,
					promotionDialogState: { isEnabled: false },
					historyViewerState: { isEnabled: false },
				};

				boardAPI = new window.EgBoardCore(
					block,
					boardState,
					function () {},
					function () {},
					boardConfig,
					{
						workerUrl: '', // Pas de Stockfish requis pour l'exercice builder
					}
				);

				initBuilder();
			}
		}, 50 );

		function initBuilder() {
			// Afficher la liste des coups initiaux
			renderSolutionList();

			// Configurer le callback de capture des coups et autoriser les deux camps
			function updateBoardConfig() {
				// Désactivation de Stockfish
				if ( typeof boardAPI.updateStockfishConfig === 'function' ) {
					boardAPI.updateStockfishConfig( {
						whiteMode: 'disabled',
						blackMode: 'disabled',
					} );
				}

				boardAPI.setConfig( {
					orientation: configData.couleur_joueur,
					viewOnly: false,
					movable: {
						color: 'both', // Permet aux deux camps (Blancs & Noirs) d'être joués
						events: {
							after( orig, dest, metadata ) {
								const history =
									boardAPI.getHistory( true ) || [];
								configData.solution = history.map(
									function ( m ) {
										return m.san;
									}
								);
								updateConfigAndUI();
							},
						},
					},
				} );
			}

			// Initialisation de la configuration sur l'échiquier
			updateBoardConfig();

			// Tâche 2 : Intégration de eg-chessboard (Générer l'échiquier de travail)
			generateBtn.addEventListener( 'click', function () {
				configData.fen = fenInput.value.trim();
				configData.couleur_joueur = colorInput.value;
				configData.solution = []; // Vider la solution lors d'une nouvelle génération

				// Charger la FEN et reconfigurer la couleur/callback/camp
				boardAPI.setPosition( configData.fen );
				updateBoardConfig();
				updateConfigAndUI();
			} );

			// Tâche 4 : Annulation du dernier coup
			undoBtn.addEventListener( 'click', function () {
				boardAPI.undoLastMove();
				const history = boardAPI.getHistory( true ) || [];
				configData.solution = history.map( function ( m ) {
					return m.san;
				} );
				updateConfigAndUI();
			} );
		}

		function updateConfigAndUI() {
			// Mettre à jour le JSON caché
			textarea.value = JSON.stringify( configData, null, 4 );

			// Mettre à jour la liste HTML visuelle
			renderSolutionList();
		}

		function renderSolutionList() {
			solutionList.innerHTML = '';
			if ( ! configData.solution || configData.solution.length === 0 ) {
				solutionList.innerHTML =
					'<li style="color: #646970; font-style: italic; list-style-type: none;">Aucun coup enregistré</li>';
				return;
			}

			for ( let i = 0; i < configData.solution.length; i++ ) {
				const li = document.createElement( 'li' );
				li.style.padding = '2px 0';

				const moveNum = Math.ceil( ( i + 1 ) / 2 );
				const isWhite = i % 2 === 0;
				const prefix = moveNum + ( isWhite ? '. ' : '... ' );

				li.textContent = prefix + configData.solution[ i ];
				solutionList.appendChild( li );
			}
		}
	} );
} )();
