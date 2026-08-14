import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { BoardCore } from "eg-chessboard";
import DrawingLegend from "../DrawingLegend";
import { ensurePgnFenHeader } from "../../utils/chessUtils";
import useChessBoard from "../../hooks/useChessBoard";
import "./PgnEditor.css";

/**
 * PgnEditor - Éditeur de PGN interactif avec outils de dessin et commentaires.
 * 
 * @param {Object} props
 * @param {string} props.initialPgn - PGN initial à charger
 * @param {string} props.initialFen - FEN initiale pour configurer le plateau si pas de PGN
 * @param {Function} props.onSave - Rappel appelé lors de la validation du PGN: onSave(pgn, finalFen)
 * @param {Object} props.boardConfig - Configuration additionnelle pour l'échiquier
 * @param {React.Ref} ref - Ref impérative exposant redrawBoard() pour forcer le recalcul des bounds
 */
const PgnEditor = forwardRef(function PgnEditor({
  initialPgn = "",
  initialFen = "",
  onSave,
  boardConfig = {},
}, ref) {
  const [boardApiState, setBoardApiState] = useState(null);
  const [pgn, setPgn] = useState(initialPgn);
  const [importPgnText, setImportPgnText] = useState("");
  const [currentComment, setCurrentComment] = useState("");
  const [currentShapes, setCurrentShapes] = useState([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [variations, setVariations] = useState([]);
  const [plyViewing, setPlyViewing] = useState(0);
  const [totalPlies, setTotalPlies] = useState(0);
  const [copied, setCopied] = useState(false);

  const boardElRef = useRef(null);
  const currentCommentRef = useRef(currentComment);
  const currentShapesRef = useRef(currentShapes);

  useEffect(() => {
    currentCommentRef.current = currentComment;
  }, [currentComment]);

  useEffect(() => {
    currentShapesRef.current = currentShapes;
  }, [currentShapes]);

  // Synchronise les données de la position actuelle
  const syncPositionData = (api = boardApiRef.current) => {
    if (!api) return;
    const comment = api.getCurrentComment();
    const shapes = api.getShapes();
    setCurrentComment(comment);
    setCurrentShapes(shapes);
    const rawPgn = api.getPgn() || "";
    setPgn(ensurePgnFenHeader(rawPgn, initialFen));
    if (typeof api.getVariationsAtPly === "function") {
      setVariations(api.getVariationsAtPly() || []);
    }
    if (typeof api.getHistoryViewerState === "function") {
      const historyState = api.getHistoryViewerState() || {};
      const currentPly = typeof api.getCurrentPlyNumber === "function" ? api.getCurrentPlyNumber() : 0;
      setPlyViewing(historyState.plyViewing !== undefined ? historyState.plyViewing : currentPly);
      setTotalPlies(currentPly);
    }
  };

  // Initialisation et orchestration via custom hook
  const { boardApiRef } = useChessBoard(
    boardElRef,
    () => {
      if (!boardElRef.current) return null;

      const config = {
        mode: "study",
        readOnly: isReadOnly,
        ...boardConfig,
        pgn: initialPgn,
        fen: initialFen || undefined,
        orientation: boardConfig.orientation || "white",
        movable: {
          free: false,
          color: "both",
        }
      };

      const boardState = {
        mode: "study",
        showThreats: false,
        promotionDialogState: { isEnabled: false },
        historyViewerState: { isEnabled: false },
      };

      const handleStateChange = () => {
        syncPositionData(boardApiRef.current);
      };

      const emit = (event) => {
        if (event === "move") {
          if (boardApiRef.current) {
            syncPositionData(boardApiRef.current);
          }
        }
      };

      const onBoardCreated = (api) => {
        api.updateStockfishConfig({
          workerUrl: "",
          whiteMode: "disabled",
          blackMode: "disabled",
        });

        const pgnToLoad = ensurePgnFenHeader(initialPgn, initialFen);
        if (pgnToLoad && pgnToLoad.trim() !== "") {
          try {
            api.loadPgn(pgnToLoad);
          } catch (e) {
            console.warn("Échec du chargement du PGN initial:", e);
            if (initialFen) {
              api.setPosition(initialFen);
            }
          }
        } else if (initialFen) {
          api.setPosition(initialFen);
        }

        setBoardApiState(api);
        syncPositionData(api);

        if (boardConfig.onBoardCreated) {
          boardConfig.onBoardCreated(api);
        }
      };

      const boardAPI = new BoardCore(
        boardElRef.current,
        boardState,
        handleStateChange,
        emit,
        { ...config, onBoardCreated },
        {
          whiteMode: "disabled",
          blackMode: "disabled",
        }
      );

      if (!boardApiRef.current) {
        onBoardCreated(boardAPI);
      }

      return boardAPI;
    },
    []
  );

  // Exposer redrawBoard() au composant parent via ref
  useImperativeHandle(ref, () => ({
    redrawBoard() {
      boardApiRef.current?.redraw(true);
    }
  }));

  // Met à jour et injecte les annotations dans le coup en cours
  const applyAnnotations = (comment = currentCommentRef.current, shapes = currentShapesRef.current) => {
    if (boardApiRef.current) {
      boardApiRef.current.setComment(comment, shapes);
      boardApiRef.current.setShapes(shapes);
      const rawPgn = boardApiRef.current.getPgn() || "";
      setPgn(ensurePgnFenHeader(rawPgn, initialFen));
    }
  };

  // Gestion du mode Lecteur vs Éditeur
  const toggleReadOnly = () => {
    const nextReadOnly = !isReadOnly;
    setIsReadOnly(nextReadOnly);
    if (boardApiRef.current && typeof boardApiRef.current.setReadOnly === "function") {
      boardApiRef.current.setReadOnly(nextReadOnly);
      syncPositionData(boardApiRef.current);
    }
  };

  // Actions sur les variantes
  const handleSelectVariation = (idx) => {
    if (boardApiRef.current && typeof boardApiRef.current.selectVariation === "function") {
      if (boardApiRef.current.selectVariation(idx)) {
        syncPositionData(boardApiRef.current);
      }
    }
  };

  const handlePromoteVariation = (idx) => {
    if (boardApiRef.current && typeof boardApiRef.current.promoteVariation === "function") {
      if (boardApiRef.current.promoteVariation(idx)) {
        syncPositionData(boardApiRef.current);
      }
    }
  };

  const handleDeleteVariation = (idx) => {
    if (boardApiRef.current && typeof boardApiRef.current.deleteVariation === "function") {
      if (boardApiRef.current.deleteVariation(idx)) {
        syncPositionData(boardApiRef.current);
      }
    }
  };

  // Actions de navigation
  const handleViewStart = () => {
    const api = boardApiRef.current || boardApiState;
    if (api) {
      api.viewStart();
      syncPositionData(api);
    }
  };

  const handleViewPrevious = () => {
    const api = boardApiRef.current || boardApiState;
    if (api) {
      api.viewPrevious();
      syncPositionData(api);
    }
  };

  const handleViewNext = () => {
    const api = boardApiRef.current || boardApiState;
    if (api) {
      api.viewNext();
      syncPositionData(api);
    }
  };

  const handleViewEnd = () => {
    const api = boardApiRef.current || boardApiState;
    if (api) {
      api.stopViewingHistory();
      syncPositionData(api);
    }
  };

  // Modification du texte du commentaire
  const handleCommentChange = (e) => {
    const text = e.target.value;
    setCurrentComment(text);
    applyAnnotations(text, currentShapes);
  };

  // Validation
  const handleValidate = () => {
    const api = boardApiRef.current || boardApiState;
    if (onSave && api) {
      const rawPgn = api.getPgn() || "";
      const finalPgn = ensurePgnFenHeader(rawPgn, initialFen);
      let finalFen = "";
      try {
        finalFen = api.getFinalFenFromPgn(finalPgn);
      } catch (e) {
        console.warn("Échec du calcul de la FEN finale", e);
      }
      onSave(finalPgn, finalFen);
    }
  };

  return (
    <div className="pgn-editor-container">
      {/* Bandeau de Mode */}
      <div className="pgn-mode-bar">
        <div className={`pgn-mode-badge ${isReadOnly ? "reader" : "editor"}`}>
          {isReadOnly ? "📖 Mode Lecteur PGN" : "✏️ Mode Éditeur PGN (Création de variantes)"}
        </div>
        <button
          type="button"
          className="pgn-mode-toggle-btn"
          onClick={toggleReadOnly}
        >
          {isReadOnly ? "✏️ Passer en Mode Éditeur" : "📖 Passer en Mode Lecteur"}
        </button>
      </div>

      <div className="pgn-editor-main-layout">
        {/* Colonne de Gauche : Échiquier & Navigation */}
        <div className="pgn-editor-left-col">
          <div className="pgn-editor-board-wrapper">
            <div ref={boardElRef} />
          </div>

          {/* Barre de Navigation avec Compteur */}
          <div className="pgn-navigation-bar" style={{ marginTop: "12px" }}>
            <button type="button" className="pgn-nav-btn" onClick={handleViewStart} title="Début">|&lt;</button>
            <button type="button" className="pgn-nav-btn" onClick={handleViewPrevious} title="Précédent">&lt;</button>
            <span className="pgn-ply-indicator">Coup {plyViewing} / {totalPlies}</span>
            <button type="button" className="pgn-nav-btn" onClick={handleViewNext} title="Suivant">&gt;</button>
            <button type="button" className="pgn-nav-btn" onClick={handleViewEnd} title="En direct">&gt;|</button>
          </div>

          {/* Aide au dessin */}
          <DrawingLegend className="pgn-editor-drawing-legend" />
        </div>

        {/* Colonne de Droite : Outils d'édition */}
        <div className="pgn-editor-right-col">

          {/* Importer un PGN ou une FEN */}
          <div className="pgn-editor-section">
            <div className="pgn-editor-title">Importer un PGN / FEN</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea
                className="pgn-comment-textarea"
                style={{ height: "32px", flex: 1, padding: "6px" }}
                placeholder="Collez un PGN ou une FEN ici..."
                value={importPgnText}
                onChange={(e) => setImportPgnText(e.target.value)}
              />
              <button
                type="button"
                className="pgn-nav-btn"
                style={{ padding: "0 12px", height: "32px", fontSize: "12px" }}
                onClick={() => {
                  const api = boardApiRef.current || boardApiState;
                  if (api && importPgnText.trim()) {
                    const input = importPgnText.trim();
                    const isFen = !input.includes("[") && input.split("/").length >= 4;

                    try {
                      if (isFen) {
                        api.setPosition(input);
                      } else {
                        api.loadPgn(input);
                      }
                      syncPositionData(api);
                      setImportPgnText("");
                    } catch (err) {
                      alert("Erreur lors du chargement : " + err.message);
                    }
                  }
                }}
              >
                Charger
              </button>
            </div>
          </div>

          {/* Affichage du PGN en direct */}
          <div className="pgn-editor-section">
            <div className="pgn-editor-title">PGN en direct</div>
            <div className="pgn-display-area">
              {pgn || "Aucun coup joué."}
            </div>
          </div>

          {/* Variantes alternatives au coup courant */}
          {variations.length > 0 && (
            <div className="pgn-editor-section">
              <div className="pgn-editor-title">🌿 Variantes alternatives ({variations.length})</div>
              <div className="pgn-variations-list">
                {variations.map((v, idx) => (
                  <div key={v.index ?? idx} className="pgn-variation-row">
                    <div>
                      <button
                        type="button"
                        className="pgn-var-san-btn"
                        onClick={() => handleSelectVariation(v.index ?? idx)}
                      >
                        {v.san || `Variante ${idx + 1}`}
                      </button>
                      {v.isMainline && <span className="pgn-var-main-badge">Principale</span>}
                    </div>
                    {!isReadOnly && (
                      <div className="pgn-var-actions">
                        {!v.isMainline && (
                          <button
                            type="button"
                            className="pgn-var-action-btn promote"
                            title="Promouvoir en ligne principale"
                            onClick={() => handlePromoteVariation(v.index ?? idx)}
                          >
                            ⬆️ Promouvoir
                          </button>
                        )}
                        <button
                          type="button"
                          className="pgn-var-action-btn delete"
                          title="Supprimer cette variante"
                          onClick={() => handleDeleteVariation(v.index ?? idx)}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commentaire */}
          <div className="pgn-editor-section">
            <div className="pgn-editor-title">Commentaire du coup</div>
            <textarea
              className="pgn-comment-textarea"
              placeholder="Saisissez un commentaire pour la position actuelle..."
              value={currentComment}
              onChange={handleCommentChange}
            />
          </div>

          {/* Copier la FEN actuelle */}
          <button
            type="button"
            className="pgn-nav-btn"
            style={{ fontSize: "12px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            onClick={() => {
              const api = boardApiRef.current || boardApiState;
              if (api && api.game) {
                const currentFen = (api.board && api.board.state && api.board.state.fen)
                  ? api.board.state.fen
                  : api.game.fen();
                const copyWithFallback = () => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(currentFen);
                  }
                  const textarea = document.createElement("textarea");
                  textarea.value = currentFen;
                  textarea.style.fontSize = "12pt";
                  textarea.style.position = "fixed";
                  textarea.style.top = "0";
                  textarea.style.left = "0";
                  textarea.style.width = "2em";
                  textarea.style.height = "2em";
                  textarea.style.padding = "0";
                  textarea.style.border = "none";
                  textarea.style.outline = "none";
                  textarea.style.boxShadow = "none";
                  textarea.style.background = "transparent";
                  document.body.appendChild(textarea);
                  textarea.focus();
                  textarea.select();
                  try {
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                    return Promise.resolve();
                  } catch (err) {
                    document.body.removeChild(textarea);
                    return Promise.reject(err);
                  }
                };

                copyWithFallback()
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                  .catch((err) => console.error("Erreur copie FEN :", err));
              }
            }}
          >
            {copied ? "✓ FEN copiée !" : "📋 Copier la FEN actuelle"}
          </button>

          {/* Validation */}
          <button
            type="button"
            className="pgn-validate-btn"
            onClick={handleValidate}
          >
            Valider ce PGN
          </button>

        </div>
      </div>
    </div>
  );
});

export default PgnEditor;
