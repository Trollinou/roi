(function() {
    document.addEventListener("DOMContentLoaded", function() {
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
            openEditorBtn.addEventListener("click", function() {
                var initialFen = fenInput.value.trim() || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
                
                // Afficher la modale
                modalOverlay.style.display = "flex";

                // Monter le composant React autonome
                if (window.RoiFenEditor && window.wp && window.wp.element) {
                    var editorComponent = window.RoiFenEditor.default || window.RoiFenEditor;
                    var element = window.wp.element.createElement(editorComponent, {
                        initialFen: initialFen,
                        onSave: function(nouvelleFen, nouvelleOrientation) {
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
            modalCloseBtn.addEventListener("click", function() {
                if (window.wp && window.wp.element) {
                    window.wp.element.unmountComponentAtNode(reactRoot);
                }
                modalOverlay.style.display = "none";
            });

            // Fermer au clic à l'extérieur
            modalOverlay.addEventListener("click", function(e) {
                if (e.target === modalOverlay) {
                    if (window.wp && window.wp.element) {
                        window.wp.element.unmountComponentAtNode(reactRoot);
                    }
                    modalOverlay.style.display = "none";
                }
            });
        }

        // Tâche 1 : Initialisation
        // Afficher le constructeur uniquement pour le type 3 (ABCDaire Tactique)
        function toggleVisibility() {
            if (typeSelect.value === "3") {
                container.style.display = "";
            } else {
                container.style.display = "none";
            }
        }
        typeSelect.addEventListener("change", toggleVisibility);
        toggleVisibility();

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
        var checkInterval = setInterval(function() {
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
                    function() {},
                    function() {},
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
                            after: function(orig, dest, metadata) {
                                var history = boardAPI.getHistory(true) || [];
                                configData.solution = history.map(function(m) {
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
            generateBtn.addEventListener("click", function() {
                configData.fen = fenInput.value.trim();
                configData.couleur_joueur = colorInput.value;
                configData.solution = []; // Vider la solution lors d'une nouvelle génération

                // Charger la FEN et reconfigurer la couleur/callback/camp
                boardAPI.setPosition(configData.fen);
                updateBoardConfig();
                updateConfigAndUI();
            });

            // Tâche 4 : Annulation du dernier coup
            undoBtn.addEventListener("click", function() {
                boardAPI.undoLastMove();
                var history = boardAPI.getHistory(true) || [];
                configData.solution = history.map(function(m) {
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
