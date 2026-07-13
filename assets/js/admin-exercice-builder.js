(function () {
    document.addEventListener("DOMContentLoaded", function () {
        var typeSelect = document.getElementById("roi_exercice_type");
        var container = document.querySelector(".roi-exercice-visual-builder-container");
        var textarea = document.getElementById("roi_config_json");
        var fenInput = document.getElementById("roi_fen_input");
        var colorInput = document.getElementById("roi_color_input");
        var generateBtn = document.getElementById("roi_generate_board_btn");
        var undoBtn = document.getElementById("roi_undo_move_btn");
        var solutionList = document.getElementById("roi_solution_list");
        var block = document.getElementById("roi-exercice-builder-chessboard");

        if (!typeSelect || !container || !textarea || !fenInput || !colorInput || !generateBtn || !undoBtn || !solutionList || !block) {
            return;
        }

        // Gestion de la modale d'édition FEN avec React
        var openEditorBtn = document.getElementById("btn_open_fen_editor");
        var modalOverlay = document.getElementById("roi_fen_modal_overlay");
        var modalCloseBtn = document.getElementById("roi_fen_modal_close");
        var reactRoot = document.getElementById("roi_fen_react_root");

        if (openEditorBtn && modalOverlay && modalCloseBtn && reactRoot) {
            openEditorBtn.addEventListener("click", function () {
                var initialFen = fenInput.value.trim() || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

                // Afficher la modale
                modalOverlay.style.display = "flex";

                // Monter le composant React autonome
                if (window.RoiFenEditor && window.wp && window.wp.element) {
                    var editorComponent = window.RoiFenEditor.default || window.RoiFenEditor;
                    var element = window.wp.element.createElement(editorComponent, {
                        initialFen: initialFen,
                        onSave: function (nouvelleFen, nouvelleOrientation) {
                            // Mettre à jour la valeur de l'input FEN
                            fenInput.value = nouvelleFen;

                            // Mettre à jour l'orientation si fournie
                            if (nouvelleOrientation && colorInput) {
                                colorInput.value = nouvelleOrientation;
                            }

                            // Démonter proprement le composant React
                            window.wp.element.unmountComponentAtNode(reactRoot);

                            // Cacher la modale
                            modalOverlay.style.display = "none";

                            // Régénérer le plateau de travail
                            if (generateBtn) {
                                generateBtn.click();
                            }
                        }
                    });
                    window.wp.element.render(element, reactRoot);
                }
            });

            // Fermer au clic sur la croix
            modalCloseBtn.addEventListener("click", function () {
                if (window.wp && window.wp.element) {
                    window.wp.element.unmountComponentAtNode(reactRoot);
                }
                modalOverlay.style.display = "none";
            });

            // Fermer au clic à l'extérieur
            modalOverlay.addEventListener("click", function (e) {
                if (e.target === modalOverlay) {
                    if (window.wp && window.wp.element) {
                        window.wp.element.unmountComponentAtNode(reactRoot);
                    }
                    modalOverlay.style.display = "none";
                }
            });
        }

        // Tâche 1 : Initialisation Type 1 & Type 3
        var builderType1 = document.getElementById("roi_builder_type_1");
        var t1Question = document.getElementById("roi_t1_question");
        var t1Reponses = [
            document.getElementById("roi_t1_reponse_0"),
            document.getElementById("roi_t1_reponse_1"),
            document.getElementById("roi_t1_reponse_2")
        ];
        var t1CorrectRadios = document.getElementsByName("roi_t1_correct");

        // Références DOM pour le Type 2 (Pop'Echecs)
        var builderType2 = document.getElementById("roi_builder_type_2");
        var t2Consigne = document.getElementById("roi_t2_consigne");
        var t2FenFinale = document.getElementById("roi_t2_fen_finale");
        var t2GenerateBtn = document.getElementById("roi_t2_generate_btn");
        var t2ChessboardContainer = document.getElementById("roi_t2_chessboard_container");
        var t2Feedback = document.getElementById("roi_t2_feedback");
        var t2CancelBtn = document.getElementById("roi_t2_cancel_btn");
        var t2EditorBtn = document.getElementById("btn_open_fen_editor_t2");

        // Références et variables pour le Type 4 (La Partie dont tu es le Héros)
        var builderType4 = document.getElementById("roi_builder_type_4");
        var t4EtapesContainer = document.getElementById("roi_t4_etapes_container");
        var t4AddPgnBtn = document.getElementById("roi_t4_add_pgn");
        var t4AddQcmBtn = document.getElementById("roi_t4_add_qcm");
        var pgnModalOverlay = document.getElementById("roi_pgn_modal_overlay");
        var pgnModalCloseBtn = document.getElementById("roi_pgn_modal_close");
        var pgnReactRoot = document.getElementById("roi_pgn_react_root");
        var t4Etapes = [];

        function toggleVisibility() {
            // Type 3 (ABCDaire Tactique)
            if (typeSelect.value === "3") {
                container.style.display = "";
            } else {
                container.style.display = "none";
            }

            // Type 1 (100 Commandements)
            if (builderType1) {
                if (typeSelect.value === "1") {
                    builderType1.style.display = "";
                } else {
                    builderType1.style.display = "none";
                }
            }

            // Type 2 (Pop'Echecs)
            if (builderType2) {
                if (typeSelect.value === "2") {
                    builderType2.style.display = "";
                } else {
                    builderType2.style.display = "none";
                }
            }

            // Type 4 (La Partie dont tu es le Héros)
            if (builderType4) {
                if (typeSelect.value === "4") {
                    builderType4.style.display = "";
                    renderT4Etapes();
                } else {
                    builderType4.style.display = "none";
                }
            }
        }
        typeSelect.addEventListener("change", toggleVisibility);
        toggleVisibility();

        // Initialisation des données Type 1 si le type est 1
        if (typeSelect.value === "1" && textarea.value.trim() !== "") {
            try {
                var parsedT1 = JSON.parse(textarea.value);
                if (parsedT1 && typeof parsedT1 === "object") {
                    if (t1Question && typeof parsedT1.question === "string") {
                        t1Question.value = parsedT1.question;
                    }
                    if (parsedT1.reponses && Array.isArray(parsedT1.reponses)) {
                        for (var r = 0; r < 3; r++) {
                            if (t1Reponses[r] && typeof parsedT1.reponses[r] !== "undefined") {
                                t1Reponses[r].value = parsedT1.reponses[r];
                            }
                        }
                    }
                    if (typeof parsedT1.bonne_reponse !== "undefined" && parsedT1.bonne_reponse !== null) {
                        var brIndex = parseInt(parsedT1.bonne_reponse, 10);
                        for (var rb = 0; rb < t1CorrectRadios.length; rb++) {
                            if (parseInt(t1CorrectRadios[rb].value, 10) === brIndex) {
                                t1CorrectRadios[rb].checked = true;
                            }
                        }
                    }
                }
            } catch (e) {
                console.log("Erreur parsing JSON Type 1 initial :", e);
            }
        }

        // Initialisation des données Type 4 si le type est 4
        if (typeSelect.value === "4" && textarea.value.trim() !== "") {
            try {
                var parsedT4 = JSON.parse(textarea.value);
                if (parsedT4 && Array.isArray(parsedT4.etapes)) {
                    t4Etapes = parsedT4.etapes;
                }
            } catch (e) {
                console.log("Erreur parsing JSON Type 4 initial :", e);
            }
        }

        // Logic de mise à jour pour Type 4
        function updateT4Config() {
            var t4Config = {
                etapes: t4Etapes
            };
            textarea.value = JSON.stringify(t4Config, null, 4);
        }

        // Rendu visuel des étapes du Type 4
        function renderT4Etapes() {
            if (!t4EtapesContainer) return;
            t4EtapesContainer.innerHTML = "";

            if (t4Etapes.length === 0) {
                t4EtapesContainer.innerHTML = '<p style="color: #646970; font-style: italic; text-align: center; padding: 15px 0;">Aucune étape ajoutée pour le moment.</p>';
                return;
            }

            t4Etapes.forEach(function (etape, i) {
                var div = document.createElement("div");
                div.className = "roi-t4-etape-card";
                div.setAttribute("data-index", i);
                div.style.border = "1px solid #ccd0d4";
                div.style.padding = "15px";
                div.style.marginBottom = "15px";
                div.style.background = "#fafafa";
                div.style.borderRadius = "6px";
                div.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";

                if (etape.type === "pgn") {
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 14px; color: #1e1e1e;">Étape ${i + 1} : Séquence PGN</strong>
                            <span style="font-size: 11px; padding: 3px 8px; background: #e8f0fe; color: #3858e9; border-radius: 12px; font-weight: 600; text-transform: uppercase;">PGN</span>
                        </div>
                        <textarea class="roi-t4-pgn-preview" readonly style="width: 100%; height: 60px; font-family: monospace; font-size: 12px; background: #f0f0f1; resize: none; border: 1px solid #ccd0d4; border-radius: 4px; padding: 8px; margin-bottom: 10px; color: #50575e;">${etape.pgn_data || ''}</textarea>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="button btn-edit-pgn" style="display: inline-flex; align-items: center; gap: 4px;"><span class="dashicons dashicons-edit" style="font-size: 16px; width: 16px; height: 16px; line-height: 1;"></span> Éditer le PGN</button>
                            <button type="button" class="button button-link-delete btn-delete-step" style="color: #b32d2e;">Supprimer</button>
                        </div>
                    `;

                    // Câblage Édition PGN
                    div.querySelector(".btn-edit-pgn").addEventListener("click", function () {
                        if (!pgnModalOverlay || !pgnReactRoot) return;
                        pgnModalOverlay.style.display = "flex";

                        if (window.RoiPgnEditor && window.wp && window.wp.element) {
                            var editorComponent = window.RoiPgnEditor.default || window.RoiPgnEditor;
                            var element = window.wp.element.createElement(editorComponent, {
                                initialPgn: etape.pgn_data || "",
                                onSave: function (nouveauPgn) {
                                    t4Etapes[i].pgn_data = nouveauPgn;
                                    window.wp.element.unmountComponentAtNode(pgnReactRoot);
                                    pgnModalOverlay.style.display = "none";
                                    renderT4Etapes();
                                    updateT4Config();
                                }
                            });
                            window.wp.element.render(element, pgnReactRoot);
                        }
                    });
                } else if (etape.type === "qcm") {
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="font-size: 14px; color: #1e1e1e;">Étape ${i + 1} : QCM</strong>
                            <span style="font-size: 11px; padding: 3px 8px; background: #fff8e1; color: #b78103; border-radius: 12px; font-weight: 600; text-transform: uppercase;">QCM</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <label style="font-weight: 600; display: block; margin-bottom: 4px;">Question :</label>
                                <input type="text" class="qcm-question-input" style="width: 100%; height: 30px;" value="${etape.question || ''}">
                            </div>
                            <div style="display: flex; gap: 8px; align-items: flex-end;">
                                <div style="flex: 1;">
                                    <label style="font-weight: 600; display: block; margin-bottom: 4px;">FEN de départ :</label>
                                    <input type="text" class="qcm-fen-input" style="width: 100%; height: 30px;" value="${etape.fen || ''}">
                                </div>
                                <button type="button" class="button btn-edit-fen-qcm" style="height: 30px;" title="Éditer la position visuellement">Éditer la position</button>
                            </div>
                            <div>
                                <label style="font-weight: 600; display: block; margin-bottom: 6px;">Choix de réponse (sélectionnez la bonne réponse) :</label>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    ${[0, 1, 2].map(function (idx) {
                                        var choiceVal = etape.choix && etape.choix[idx] ? etape.choix[idx] : '';
                                        var isChecked = parseInt(etape.bonne_reponse, 10) === idx ? 'checked' : '';
                                        return `
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <input type="radio" name="roi_t4_qcm_correct_${i}" class="qcm-correct-radio" value="${idx}" ${isChecked}>
                                                <input type="text" class="qcm-choix-input" data-choice-index="${idx}" style="flex: 1; height: 30px;" placeholder="Réponse ${idx + 1}" value="${choiceVal}">
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            <div>
                                <button type="button" class="button button-link-delete btn-delete-step" style="color: #b32d2e;">Supprimer l'étape</button>
                            </div>
                        </div>
                    `;

                    // Écouteurs d'événements pour le QCM
                    var questionInput = div.querySelector(".qcm-question-input");
                    questionInput.addEventListener("input", function (e) {
                        t4Etapes[i].question = e.target.value;
                        updateT4Config();
                    });

                    var fenInputQcm = div.querySelector(".qcm-fen-input");
                    fenInputQcm.addEventListener("input", function (e) {
                        t4Etapes[i].fen = e.target.value;
                        updateT4Config();
                    });

                    var choiceInputs = div.querySelectorAll(".qcm-choix-input");
                    choiceInputs.forEach(function (ci) {
                        ci.addEventListener("input", function (e) {
                            var cIdx = parseInt(e.target.getAttribute("data-choice-index"), 10);
                            if (!t4Etapes[i].choix) {
                                t4Etapes[i].choix = ["", "", ""];
                            }
                            t4Etapes[i].choix[cIdx] = e.target.value;
                            updateT4Config();
                        });
                    });

                    var radioButtons = div.querySelectorAll(".qcm-correct-radio");
                    radioButtons.forEach(function (rb) {
                        rb.addEventListener("change", function (e) {
                            if (e.target.checked) {
                                t4Etapes[i].bonne_reponse = parseInt(e.target.value, 10);
                                updateT4Config();
                            }
                        });
                    });

                    // Câblage Édition FEN
                    div.querySelector(".btn-edit-fen-qcm").addEventListener("click", function () {
                        if (!modalOverlay || !reactRoot) return;
                        modalOverlay.style.display = "flex";

                        var currentFen = etape.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

                        if (window.RoiFenEditor && window.wp && window.wp.element) {
                            var editorComponent = window.RoiFenEditor.default || window.RoiFenEditor;
                            var element = window.wp.element.createElement(editorComponent, {
                                initialFen: currentFen,
                                onSave: function (nouvelleFen) {
                                    t4Etapes[i].fen = nouvelleFen;
                                    fenInputQcm.value = nouvelleFen;
                                    window.wp.element.unmountComponentAtNode(reactRoot);
                                    modalOverlay.style.display = "none";
                                    updateT4Config();
                                }
                            });
                            window.wp.element.render(element, reactRoot);
                        }
                    });
                }

                // Câblage Suppression d'étape
                div.querySelector(".btn-delete-step").addEventListener("click", function () {
                    t4Etapes.splice(i, 1);
                    renderT4Etapes();
                    updateT4Config();
                });

                t4EtapesContainer.appendChild(div);
            });
        }

        // Câblage des boutons d'ajout d'étapes
        if (t4AddPgnBtn) {
            t4AddPgnBtn.addEventListener("click", function () {
                t4Etapes.push({
                    type: "pgn",
                    pgn_data: ""
                });
                renderT4Etapes();
                updateT4Config();
            });
        }

        if (t4AddQcmBtn) {
            t4AddQcmBtn.addEventListener("click", function () {
                t4Etapes.push({
                    type: "qcm",
                    question: "",
                    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    choix: ["", "", ""],
                    bonne_reponse: 0
                });
                renderT4Etapes();
                updateT4Config();
            });
        }

        // Gestion de la modale PGN
        if (pgnModalCloseBtn && pgnModalOverlay && pgnReactRoot) {
            pgnModalCloseBtn.addEventListener("click", function () {
                if (window.wp && window.wp.element) {
                    window.wp.element.unmountComponentAtNode(pgnReactRoot);
                }
                pgnModalOverlay.style.display = "none";
            });

            pgnModalOverlay.addEventListener("click", function (e) {
                if (e.target === pgnModalOverlay) {
                    if (window.wp && window.wp.element) {
                        window.wp.element.unmountComponentAtNode(pgnReactRoot);
                    }
                    pgnModalOverlay.style.display = "none";
                }
            });
        }
        }

        // Logic de mise à jour pour Type 1
        function updateT1Config() {
            var reponsesArr = [];
            for (var r = 0; r < 3; r++) {
                reponsesArr.push(t1Reponses[r] ? t1Reponses[r].value : "");
            }

            var bonneReponseVal = null;
            for (var rb = 0; rb < t1CorrectRadios.length; rb++) {
                if (t1CorrectRadios[rb].checked) {
                    bonneReponseVal = parseInt(t1CorrectRadios[rb].value, 10);
                    break;
                }
            }

            var t1Config = {
                question: t1Question ? t1Question.value : "",
                reponses: reponsesArr,
                bonne_reponse: bonneReponseVal
            };

            textarea.value = JSON.stringify(t1Config, null, 4);
        }

        if (builderType1) {
            if (t1Question) {
                t1Question.addEventListener("input", updateT1Config);
            }
            t1Reponses.forEach(function (inputField) {
                if (inputField) {
                    inputField.addEventListener("input", updateT1Config);
                }
            });
            for (var rb = 0; rb < t1CorrectRadios.length; rb++) {
                t1CorrectRadios[rb].addEventListener("change", updateT1Config);
            }
        }

        // ============================================================
        // Type 2 — Pop'Echecs : Logique de sélection de pièce
        // ============================================================

        // Traduction des types de pièces (notation FEN -> nom français)
        var pieceNames = {
            p: { white: "Pion Blanc", black: "Pion Noir" },
            r: { white: "Tour Blanche", black: "Tour Noire" },
            n: { white: "Cavalier Blanc", black: "Cavalier Noir" },
            b: { white: "Fou Blanc", black: "Fou Noir" },
            q: { white: "Dame Blanche", black: "Dame Noire" },
            k: { white: "Roi Blanc", black: "Roi Noir" }
        };

        /**
         * Retourne le nom lisible d'une pièce (ex: "Cavalier Blanc").
         * @param {string} pieceType - Type FEN (p, r, n, b, q, k).
         * @param {string} pieceColor - "white" ou "black".
         * @returns {string}
         */
        function getPieceName(pieceType, pieceColor) {
            var entry = pieceNames[pieceType];
            if (entry && entry[pieceColor]) {
                return entry[pieceColor];
            }
            return pieceType.toUpperCase() + " (" + pieceColor + ")";
        }

        // État interne du builder Type 2
        var t2BoardAPI = null;
        var t2BoardEl = null;
        var t2SelectedData = null; // { piece_type, piece_color, case_cible }

        /**
         * Met à jour le JSON de configuration pour le Type 2.
         * Construit l'objet : { consigne, fen_depart, fen_finale, piece_type, piece_color, case_cible }
         */
        function updateT2Config() {
            if (!t2Consigne || !t2FenFinale) {
                return;
            }

            var t2Config = {
                consigne: t2Consigne.value,
                fen_finale: t2FenFinale.value.trim()
            };

            // Si une pièce a été sélectionnée, ajouter les données de la pièce
            if (t2SelectedData) {
                t2Config.fen_depart = t2SelectedData.fen_depart;
                t2Config.piece_type = t2SelectedData.piece_type;
                t2Config.piece_color = t2SelectedData.piece_color;
                t2Config.case_cible = t2SelectedData.case_cible;
            }

            textarea.value = JSON.stringify(t2Config, null, 4);
        }

        /**
         * Gestion du clic sur une case de l'échiquier Type 2.
         * Retire visuellement la pièce, affiche la case vide et dessine un cercle vert.
         */
        function handleT2SquareClick(square) {
            if (!t2BoardAPI) {
                return;
            }

            var fenFinale = t2FenFinale.value.trim();

            // 1. Toujours réinitialiser le plateau à la FEN finale complète avant une nouvelle sélection
            t2BoardAPI.setPosition(fenFinale);

            // Nettoyer les formes (cercles) précédentes
            if (typeof t2BoardAPI.hideMoves === "function") {
                t2BoardAPI.hideMoves();
            } else if (typeof t2BoardAPI.setShapes === "function") {
                t2BoardAPI.setShapes([]);
            }

            var pieceOnSquare = findPieceOnSquare(fenFinale, square);

            if (!pieceOnSquare) {
                // Si on clique sur une case vide, on annule la sélection en cours
                if (t2CancelBtn) t2CancelBtn.click();
                return;
            }

            // 2. Retirer visuellement la pièce
            t2BoardAPI.removePiece(square);

            // 3. Récupérer la FEN sans cette pièce (notre vraie FEN de départ)
            var fenDepart = t2BoardAPI.getFen();

            // 4. Dessiner un cercle vert sur la case vide pour marquer la cible
            if (typeof t2BoardAPI.drawCircle === "function") {
                t2BoardAPI.drawCircle(square, 'green');
            } else if (typeof t2BoardAPI.setShapes === "function") {
                t2BoardAPI.setShapes([{ orig: square, brush: 'green' }]);
            }

            // Sauvegarder les données sélectionnées
            t2SelectedData = {
                piece_type: pieceOnSquare.type,
                piece_color: pieceOnSquare.color,
                case_cible: square,
                fen_depart: fenDepart
            };

            // Mettre à jour le feedback visuel + afficher le bouton d'annulation
            var nomPiece = getPieceName(pieceOnSquare.type, pieceOnSquare.color);
            updateT2Feedback("Pièce retirée : " + nomPiece + " sur " + square + " (Position de départ générée)", "#00a32a", true);

            // Mettre à jour le JSON
            updateT2Config();
        }
        /**
         * Cherche quelle pièce est sur une case donnée à partir d'une FEN.
         * @param {string} fen - La FEN complète.
         * @param {string} square - La case (ex: "e4").
         * @returns {{ type: string, color: string }|null}
         */
        function findPieceOnSquare(fen, square) {
            // Parser la partie placement de la FEN
            var placement = fen.split(" ")[0];
            var rows = placement.split("/");
            var files = "abcdefgh";

            // Convertir la case en coordonnées (file = colonne, rank = rangée)
            var fileIndex = files.indexOf(square[0]);
            var rankIndex = 8 - parseInt(square[1], 10);

            if (fileIndex < 0 || rankIndex < 0 || rankIndex > 7) {
                return null;
            }

            var row = rows[rankIndex];
            if (!row) {
                return null;
            }

            // Parcourir la rangée caractère par caractère
            var currentFile = 0;
            for (var c = 0; c < row.length; c++) {
                var ch = row[c];
                if (ch >= "1" && ch <= "8") {
                    currentFile += parseInt(ch, 10);
                } else {
                    if (currentFile === fileIndex) {
                        // Trouvé la pièce
                        var isWhite = ch === ch.toUpperCase();
                        return {
                            type: ch.toLowerCase(),
                            color: isWhite ? "white" : "black"
                        };
                    }
                    currentFile++;
                }
            }

            return null;
        }

        // Gestion de la modale FenEditor pour le Type 2
        if (t2EditorBtn && modalOverlay && modalCloseBtn && reactRoot) {
            t2EditorBtn.addEventListener("click", function () {
                var initialFen = (t2FenFinale ? t2FenFinale.value.trim() : "") || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

                // Afficher la modale
                modalOverlay.style.display = "flex";

                // Monter le composant React FenEditor
                if (window.RoiFenEditor && window.wp && window.wp.element) {
                    var editorComponent = window.RoiFenEditor.default || window.RoiFenEditor;
                    var element = window.wp.element.createElement(editorComponent, {
                        initialFen: initialFen,
                        onSave: function (nouvelleFen) {
                            // Mettre à jour l'input FEN finale
                            if (t2FenFinale) {
                                t2FenFinale.value = nouvelleFen;
                            }

                            // Démonter le composant React
                            window.wp.element.unmountComponentAtNode(reactRoot);

                            // Cacher la modale
                            modalOverlay.style.display = "none";

                            // Régénérer le plateau si visible
                            if (t2GenerateBtn && typeSelect.value === "2") {
                                t2GenerateBtn.click();
                            }
                        }
                    });
                    window.wp.element.render(element, reactRoot);
                }
            });
        }

        /**
         * Réinitialise l'état visuel du feedback et du bouton d'annulation.
         * @param {string} message - Le texte à afficher.
         * @param {string} color - La couleur de la barre latérale.
         * @param {boolean} showCancel - Afficher le bouton d'annulation.
         */
        function updateT2Feedback(message, color, showCancel) {
            if (t2Feedback) {
                t2Feedback.textContent = message;
                t2Feedback.style.borderLeftColor = color;
            }
            if (t2CancelBtn) {
                t2CancelBtn.style.display = showCancel ? "" : "none";
            }
        }

        // Génération du plateau de sélection (Type 2)
        if (t2GenerateBtn && t2ChessboardContainer) {
            t2GenerateBtn.addEventListener("click", function (e) {
                var fen = t2FenFinale ? t2FenFinale.value.trim() : "";
                if (!fen) {
                    updateT2Feedback("Erreur : veuillez saisir une FEN valide.", "#d63638", false);
                    return;
                }

                // Vérifier si c'est un rechargement automatique depuis la base de données
                var isAutoLoad = t2GenerateBtn.getAttribute("data-autoload") === "true";
                t2GenerateBtn.removeAttribute("data-autoload"); // On nettoie pour les prochains vrais clics

                // Ne réinitialiser la sélection QUE si c'est un vrai clic de l'entraîneur
                if (!isAutoLoad) {
                    t2SelectedData = null;
                    updateT2Feedback("Cliquez sur une pièce de l'échiquier pour la retirer.", "#72aee6", false);
                }

                // Nettoyer l'ancien échiquier s'il existe
                if (t2BoardAPI && typeof t2BoardAPI.destroy === "function") {
                    t2BoardAPI.destroy();
                    t2BoardAPI = null;
                }

                // Créer un nouvel élément pour le plateau
                t2ChessboardContainer.innerHTML = "";
                t2BoardEl = document.createElement("div");
                t2BoardEl.id = "roi-t2-chessboard";
                t2BoardEl.className = "roi-clean-admin-board";
                t2BoardEl.style.width = "100%";
                t2BoardEl.style.aspectRatio = "1";
                t2BoardEl.style.position = "relative";
                t2ChessboardContainer.appendChild(t2BoardEl);

                // Attendre que EgBoardCore soit disponible
                var t2CheckInterval = setInterval(function () {
                    if (window.EgBoardCore) {
                        clearInterval(t2CheckInterval);

                        var boardConfig = {
                            fen: fen,
                            orientation: "white",
                            coordinates: true,
                            viewOnly: false,
                            movable: {
                                free: false,
                                color: "both"
                            },
                            events: {
                                select: function (square) {
                                    handleT2SquareClick(square);
                                }
                            }
                        };

                        var boardState = {
                            showThreats: false,
                            freeMode: false,
                            promotionDialogState: { isEnabled: false },
                            historyViewerState: { isEnabled: false }
                        };

                        t2BoardAPI = new window.EgBoardCore(
                            t2BoardEl,
                            boardState,
                            function () { },
                            function () { },
                            boardConfig,
                            { workerUrl: "" }
                        );

                        // Si une sélection existait déjà (chargée depuis la base de données)
                        if (isAutoLoad && t2SelectedData && t2SelectedData.fen_depart) {
                            t2BoardAPI.setPosition(t2SelectedData.fen_depart);
                            if (typeof t2BoardAPI.drawCircle === "function") {
                                t2BoardAPI.drawCircle(t2SelectedData.case_cible, 'green');
                            } else if (typeof t2BoardAPI.setShapes === "function") {
                                t2BoardAPI.setShapes([{ orig: t2SelectedData.case_cible, brush: 'green' }]);
                            }
                        }

                        // Désactiver Stockfish
                        if (typeof t2BoardAPI.updateStockfishConfig === "function") {
                            t2BoardAPI.updateStockfishConfig({
                                whiteMode: "disabled",
                                blackMode: "disabled"
                            });
                        }

                        // Mettre à jour le config JSON initial
                        updateT2Config();
                    }
                }, 50);
            });
        }

        // Annulation de la sélection de pièce (Type 2)
        if (t2CancelBtn) {
            t2CancelBtn.addEventListener("click", function () {
                // Réinitialiser les données de sélection
                t2SelectedData = null;

                // Recharger la position finale complète sur l'échiquier
                if (t2BoardAPI && t2FenFinale) {
                    t2BoardAPI.setPosition(t2FenFinale.value.trim());

                    // Effacer le cercle vert
                    if (typeof t2BoardAPI.hideMoves === "function") {
                        t2BoardAPI.hideMoves();
                    } else if (typeof t2BoardAPI.setShapes === "function") {
                        t2BoardAPI.setShapes([]);
                    }
                }

                // Remettre le feedback à l'état initial
                updateT2Feedback("Sélection annulée. Cliquez sur une pièce pour la retirer.", "#72aee6", false);

                // Mettre à jour le JSON (sans pièce sélectionnée)
                updateT2Config();
            });
        }

        // Écoute des changements sur la consigne (Type 2) pour mettre à jour le JSON
        if (t2Consigne) {
            t2Consigne.addEventListener("input", function () {
                if (typeSelect.value === "2") {
                    updateT2Config();
                }
            });
        }

        // Initialisation des données Type 2 depuis le JSON existant
        if (typeSelect.value === "2" && textarea.value.trim() !== "") {
            try {
                var parsedT2 = JSON.parse(textarea.value);
                if (parsedT2 && typeof parsedT2 === "object") {
                    if (t2Consigne && typeof parsedT2.consigne === "string") {
                        t2Consigne.value = parsedT2.consigne;
                    }
                    if (t2FenFinale && typeof parsedT2.fen_finale === "string") {
                        t2FenFinale.value = parsedT2.fen_finale;
                    }
                    // Restaurer la sélection de pièce si elle existait
                    if (parsedT2.piece_type && parsedT2.piece_color && parsedT2.case_cible && parsedT2.fen_depart) {
                        t2SelectedData = {
                            piece_type: parsedT2.piece_type,
                            piece_color: parsedT2.piece_color,
                            case_cible: parsedT2.case_cible,
                            fen_depart: parsedT2.fen_depart
                        };
                        var nomPiece = getPieceName(parsedT2.piece_type, parsedT2.piece_color);
                        updateT2Feedback("Pièce retirée : " + nomPiece + " sur " + parsedT2.case_cible + " (Position de départ générée)", "#00a32a", true);
                    }
                    // Régénérer le plateau automatiquement si une FEN finale est présente
                    if (parsedT2.fen_finale && t2GenerateBtn) {
                        setTimeout(function () {
                            // On ajoute un marqueur pour avertir le bouton que c'est un rechargement
                            t2GenerateBtn.setAttribute("data-autoload", "true");
                            t2GenerateBtn.click();
                        }, 200);
                    }
                }
            } catch (e) {
                console.log("Erreur parsing JSON Type 2 initial :", e);
            }
        }

        // État local de la configuration
        let configData = { fen: "", couleur_joueur: "white", solution: [] };

        // Chargement et parsing du JSON existant
        try {
            var parsed = JSON.parse(textarea.value);
            if (parsed && typeof parsed === "object") {
                configData.fen = parsed.fen || "";
                configData.couleur_joueur = parsed.couleur_joueur || parsed.color || "white";
                configData.solution = parsed.solution || [];
            }
        } catch (e) {
            console.log("JSON existant invalide ou vide, initialisation par défaut.");
            configData.fen = fenInput.value.trim();
            configData.couleur_joueur = colorInput.value;
        }

        // Remplir les champs HTML associés avec l'état initial
        if (configData.fen) {
            fenInput.value = configData.fen;
        }
        if (configData.couleur_joueur) {
            colorInput.value = configData.couleur_joueur;
        }

        // Initialisation propre et directe de BoardCore (sans passer par view.jsx)
        var boardAPI;
        var checkInterval = setInterval(function () {
            if (window.EgBoardCore) {
                clearInterval(checkInterval);

                var boardConfig = {
                    fen: configData.fen || fenInput.value.trim() || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    orientation: configData.couleur_joueur || colorInput.value || "white",
                    coordinates: true,
                    viewOnly: false,
                };

                var boardState = {
                    showThreats: false,
                    freeMode: false,
                    promotionDialogState: { isEnabled: false },
                    historyViewerState: { isEnabled: false },
                };

                boardAPI = new window.EgBoardCore(
                    block,
                    boardState,
                    function () { },
                    function () { },
                    boardConfig,
                    {
                        workerUrl: "" // Pas de Stockfish requis pour l'exercice builder
                    }
                );

                initBuilder();
            }
        }, 50);

        function initBuilder() {
            // Afficher la liste des coups initiaux
            renderSolutionList();

            // Configurer le callback de capture des coups et autoriser les deux camps
            function updateBoardConfig() {
                // Désactivation de Stockfish
                if (typeof boardAPI.updateStockfishConfig === "function") {
                    boardAPI.updateStockfishConfig({
                        whiteMode: 'disabled',
                        blackMode: 'disabled'
                    });
                }

                boardAPI.setConfig({
                    orientation: configData.couleur_joueur,
                    viewOnly: false,
                    movable: {
                        color: 'both', // Permet aux deux camps (Blancs & Noirs) d'être joués
                        events: {
                            after: function (orig, dest, metadata) {
                                var history = boardAPI.getHistory(true) || [];
                                configData.solution = history.map(function (m) {
                                    return m.san;
                                });
                                updateConfigAndUI();
                            }
                        }
                    }
                });
            }

            // Initialisation de la configuration sur l'échiquier
            updateBoardConfig();

            // Tâche 2 : Intégration de eg-chessboard (Générer l'échiquier de travail)
            generateBtn.addEventListener("click", function () {
                configData.fen = fenInput.value.trim();
                configData.couleur_joueur = colorInput.value;
                configData.solution = []; // Vider la solution lors d'une nouvelle génération

                // Charger la FEN et reconfigurer la couleur/callback/camp
                boardAPI.setPosition(configData.fen);
                updateBoardConfig();
                updateConfigAndUI();
            });

            // Tâche 4 : Annulation du dernier coup
            undoBtn.addEventListener("click", function () {
                boardAPI.undoLastMove();
                var history = boardAPI.getHistory(true) || [];
                configData.solution = history.map(function (m) {
                    return m.san;
                });
                updateConfigAndUI();
            });
        }

        function updateConfigAndUI() {
            // Mettre à jour le JSON caché
            textarea.value = JSON.stringify(configData, null, 4);

            // Mettre à jour la liste HTML visuelle
            renderSolutionList();
        }

        function renderSolutionList() {
            solutionList.innerHTML = "";
            if (!configData.solution || configData.solution.length === 0) {
                solutionList.innerHTML = '<li style="color: #646970; font-style: italic; list-style-type: none;">Aucun coup enregistré</li>';
                return;
            }

            for (var i = 0; i < configData.solution.length; i++) {
                var li = document.createElement("li");
                li.style.padding = "2px 0";

                var moveNum = Math.ceil((i + 1) / 2);
                var isWhite = (i % 2 === 0);
                var prefix = moveNum + (isWhite ? ". " : "... ");

                li.textContent = prefix + configData.solution[i];
                solutionList.appendChild(li);
            }
        }
    });
})();
