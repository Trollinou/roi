import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { BoardCore } from "eg-chessboard";

/**
 * PgnEditor - Éditeur de PGN interactif avec outils de dessin et commentaires.
 * 
 * @param {Object} props
 * @param {string} props.initialPgn - PGN initial à charger
 * @param {string} props.initialFen - FEN initiale pour configurer le plateau si pas de PGN
 * @param {Function} props.onSave - Rappel appelé lors de la validation du PGN: onSave(pgn)
 * @param {Object} props.boardConfig - Configuration additionnelle pour l'échiquier
 * @param {React.Ref} ref - Ref impérative exposant redrawBoard() pour forcer le recalcul des bounds
 */
/**
 * Garantit que les entêtes PGN contiennent [SetUp "1"] et [FEN "..."] si un FEN initial personnalisé est défini.
 */
function ensurePgnFenHeader(pgn, fen) {
  if (!fen || typeof fen !== "string") return pgn || "";
  const cleanedFen = fen.trim();
  if (
    !cleanedFen ||
    cleanedFen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ) {
    return pgn || "";
  }

  const cleanedPgn = pgn ? pgn.trim() : "";
  if (cleanedPgn.includes("[FEN ")) {
    return cleanedPgn;
  }

  const setupHeaders = `[SetUp "1"]\n[FEN "${cleanedFen}"]\n`;

  if (!cleanedPgn) {
    return setupHeaders;
  }

  if (cleanedPgn.includes("]")) {
    const lastHeaderIndex = cleanedPgn.lastIndexOf("]");
    const headersPart = cleanedPgn.slice(0, lastHeaderIndex + 1);
    const movesPart = cleanedPgn.slice(lastHeaderIndex + 1).trim();
    return `${headersPart}\n${setupHeaders}\n${movesPart}`;
  }

  return `${setupHeaders}\n${cleanedPgn}`;
}

const PgnEditor = forwardRef(function PgnEditor({
  initialPgn = "",
  initialFen = "",
  onSave,
  boardConfig = {},
}, ref) {
  const [boardApi, setBoardApi] = useState(null);
  const [pgn, setPgn] = useState(initialPgn);
  const [importPgnText, setImportPgnText] = useState("");
  const [currentComment, setCurrentComment] = useState("");
  const [currentShapes, setCurrentShapes] = useState([]);

  const boardElRef = useRef(null);
  const boardApiRef = useRef(null);

  // Exposer redrawBoard() au composant parent via ref
  useImperativeHandle(ref, () => ({
    redrawBoard() {
      boardApiRef.current?.redraw(true);
    }
  }));

  // Garder les refs à jour pour les callbacks asynchrones
  const currentCommentRef = useRef(currentComment);
  useEffect(() => {
    currentCommentRef.current = currentComment;
  }, [currentComment]);

  const currentShapesRef = useRef(currentShapes);
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
  };

  // Met à jour et injecte les annotations dans le coup en cours
  const applyAnnotations = (comment = currentCommentRef.current, shapes = currentShapesRef.current) => {
    if (boardApiRef.current) {
      boardApiRef.current.setComment(comment, shapes);
      boardApiRef.current.setShapes(shapes);
      const rawPgn = boardApiRef.current.getPgn() || "";
      setPgn(ensurePgnFenHeader(rawPgn, initialFen));
    }
  };

  // Initialisation de BoardCore
  useEffect(() => {
    if (!boardElRef.current) return;

    // Configuration de BoardCore
    const config = {
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
      showThreats: false,
      freeMode: false,
      promotionDialogState: { isEnabled: false },
      historyViewerState: { isEnabled: false },
    };

    const handleStateChange = () => {
      syncPositionData(boardApiRef.current);
    };

    const emit = (event) => {
      if (event === "move") {
        // Saisie de coup : Réinitialise le commentaire et les formes à vide
        setCurrentComment("");
        setCurrentShapes([]);
        if (boardApiRef.current) {
          const rawPgn = boardApiRef.current.getPgn() || "";
          setPgn(ensurePgnFenHeader(rawPgn, initialFen));
        }
      }
    };

    // Callback onBoardCreated local pour gérer l'initialisation
    const onBoardCreated = (api) => {
      // Désactiver Stockfish
      api.updateStockfishConfig({
        workerUrl: "",
        whiteMode: "disabled",
        blackMode: "disabled",
      });

      // Charger le PGN initial si fourni (en s'assurant d'injecter la FEN si absente)
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

      setBoardApi(api);
      boardApiRef.current = api;
      syncPositionData(api);

      // Chaîner avec la prop externe si présente
      if (boardConfig.onBoardCreated) {
        boardConfig.onBoardCreated(api);
      }
    };

    // Création de l'instance
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

    // Si le framework ou le cycle de vie n'appelle pas onBoardCreated de config automatiquement :
    if (!boardApiRef.current) {
      onBoardCreated(boardAPI);
    }

    // Recalcul fiable des bounds via ResizeObserver
    // Dans l'iFrame Gutenberg, les dimensions se stabilisent après le premier rendu.
    // Un simple setTimeout(200ms) n'est pas suffisant ; le ResizeObserver détecte
    // le moment exact où le conteneur atteint ses dimensions finales et force
    // Chessground à recalculer ses bounds (position de référence pour le drag/dessin/flèches).
    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined" && boardElRef.current) {
      resizeObserver = new ResizeObserver(() => {
        boardAPI.redraw(true);
      });
      resizeObserver.observe(boardElRef.current);
    } else {
      // Fallback si ResizeObserver n'est pas disponible
      setTimeout(() => {
        boardAPI.redraw(true);
      }, 300);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      boardAPI.destroy();
    };
  }, []);


  // Actions de navigation
  const handleViewStart = () => {
    if (boardApi) {
      boardApi.viewStart();
      syncPositionData(boardApi);
    }
  };

  const handleViewPrevious = () => {
    if (boardApi) {
      boardApi.viewPrevious();
      syncPositionData(boardApi);
    }
  };

  const handleViewNext = () => {
    if (boardApi) {
      boardApi.viewNext();
      syncPositionData(boardApi);
    }
  };

  const handleViewEnd = () => {
    if (boardApi) {
      boardApi.stopViewingHistory();
      syncPositionData(boardApi);
    }
  };

  // Modification du texte du commentaire
  const handleCommentChange = (e) => {
    const text = e.target.value;
    setCurrentComment(text);
    applyAnnotations(text, currentShapes);
  };

  const [copied, setCopied] = useState(false);

  // Validation
  const handleValidate = () => {
    if (onSave && boardApi) {
      const rawPgn = boardApi.getPgn() || "";
      const finalPgn = ensurePgnFenHeader(rawPgn, initialFen);
      let finalFen = "";
      try {
        finalFen = boardApi.getFinalFenFromPgn(finalPgn);
      } catch (e) {
        console.warn("Échec du calcul de la FEN finale", e);
      }
      onSave(finalPgn, finalFen);
    }
  };

  // Outils de dessin
  return (
    <div className="pgn-editor-container">
      <style>{`
        .pgn-editor-container {
          display: flex;
          gap: 24px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
        }

        .pgn-editor-left-col {
          width: 400px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .pgn-editor-board-wrapper {
          width: 400px;
          height: 400px;
          position: relative;
          cursor: pointer;
          overflow: hidden;
        }

        .pgn-editor-board-wrapper > div {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        cg-container {
          width: 100% !important;
          height: 100% !important;
        }

        .pgn-editor-board-wrapper svg {
          pointer-events: none !important;
        }

        .pgn-editor-right-col {
          width: 350px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pgn-editor-section {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
        }

        .pgn-editor-title {
          font-size: 13px;
          font-weight: 700;
          color: #495057;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .pgn-display-area {
          max-height: 120px;
          overflow-y: auto;
          font-family: "Courier New", Courier, monospace;
          font-size: 13px;
          line-height: 1.5;
          color: #2b2b2b;
          background: #ffffff;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .pgn-navigation-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .pgn-nav-btn {
          padding: 8px;
          background: #ffffff;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #495057;
        }

        .pgn-nav-btn:hover {
          background: #e9ecef;
          border-color: #adb5bd;
          color: #212529;
        }

        .pgn-comment-textarea {
          width: 100%;
          height: 70px;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          font-size: 13px;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
        }

        .pgn-comment-textarea:focus {
          border-color: #3858e9;
        }

        .pgn-validate-btn {
          width: 100%;
          padding: 12px;
          background: #3858e9;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(56, 88, 233, 0.2);
          text-align: center;
        }

        .pgn-validate-btn:hover {
          background: #2b45be;
          box-shadow: 0 4px 16px rgba(56, 88, 233, 0.3);
        }

        .pgn-editor-drawing-legend {
          margin-top: 16px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 12px;
          color: #495057;
          line-height: 1.5;
        }

        .pgn-editor-drawing-legend .legend-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pgn-editor-drawing-legend .legend-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
          margin-bottom: 8px;
        }

        .pgn-editor-drawing-legend .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pgn-editor-drawing-legend .legend-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .pgn-editor-drawing-legend .legend-tip {
          font-size: 11px;
          color: #868e96;
          border-top: 1px dashed #dee2e6;
          padding-top: 6px;
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .pgn-editor-container {
            flex-direction: column;
          }
          .pgn-editor-right-col {
            width: 100%;
          }
        }
      `}</style>

      {/* Colonne de Gauche : Échiquier & Import PGN */}
      <div className="pgn-editor-left-col">
        <div className="pgn-editor-board-wrapper">
          <div ref={boardElRef} />
        </div>

        {/* Barre de Navigation */}
        <div className="pgn-navigation-bar" style={{ marginTop: "12px" }}>
          <button type="button" className="pgn-nav-btn" onClick={handleViewStart} title="Début">|&lt;</button>
          <button type="button" className="pgn-nav-btn" onClick={handleViewPrevious} title="Précédent">&lt;</button>
          <button type="button" className="pgn-nav-btn" onClick={handleViewNext} title="Suivant">&gt;</button>
          <button type="button" className="pgn-nav-btn" onClick={handleViewEnd} title="Fin">&gt;|</button>
        </div>

        {/* Aide au dessin */}
        <div className="pgn-editor-drawing-legend">
          <div className="legend-title">✍️ Annotations (comme Lichess)</div>
          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ backgroundColor: "#15ba3a" }} />
              <span><strong>Vert</strong> : Clic droit</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ backgroundColor: "#e22222" }} />
              <span><strong>Rouge</strong> : Shift + Clic dr.</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ backgroundColor: "#2072e2" }} />
              <span><strong>Bleu</strong> : Alt + Clic dr.</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ backgroundColor: "#e8c005" }} />
              <span><strong>Jaune</strong> : Shift + Alt + Clic dr.</span>
            </div>
          </div>
        </div>
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
                if (boardApi && importPgnText.trim()) {
                  const input = importPgnText.trim();
                  
                  // Une FEN ne contient pas de crochets '[' (propres aux tags PGN)
                  // et possède des slashes '/' pour diviser les rangées.
                  const isFen = !input.includes("[") && input.split("/").length >= 4;

                  try {
                    if (isFen) {
                      boardApi.setPosition(input);
                    } else {
                      boardApi.loadPgn(input);
                    }
                    syncPositionData(boardApi);
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

        {/* 2. Affichage du PGN en direct */}
        <div className="pgn-editor-section">
          <div className="pgn-editor-title">PGN en direct</div>
          <div className="pgn-display-area">
            {pgn || "Aucun coup joué."}
          </div>
        </div>

        {/* 4. Commentaire */}
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
            if (boardApi && boardApi.game) {
              const currentFen = (boardApi.board && boardApi.board.state && boardApi.board.state.fen)
                ? boardApi.board.state.fen
                : boardApi.game.fen();
              const copyWithFallback = () => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  return navigator.clipboard.writeText(currentFen);
                }
                // Fallback for non-secure HTTP contexts
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

        {/* 7. Validation */}
        <button
          type="button"
          className="pgn-validate-btn"
          onClick={handleValidate}
        >
          Valider ce PGN
        </button>

      </div>
    </div>
  );
});

export default PgnEditor;
