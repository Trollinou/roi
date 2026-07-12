import React, { useState, useEffect, useRef } from "react";
import { BoardCore } from "eg-chessboard";

/**
 * PgnEditor - Éditeur de PGN interactif avec outils de dessin et commentaires.
 * 
 * @param {Object} props
 * @param {string} props.initialPgn - PGN initial à charger
 * @param {string} props.initialFen - FEN initiale pour configurer le plateau si pas de PGN
 * @param {Function} props.onSave - Rappel appelé lors de la validation du PGN: onSave(pgn)
 * @param {Object} props.boardConfig - Configuration additionnelle pour l'échiquier
 */
export default function PgnEditor({
  initialPgn = "",
  initialFen = "",
  onSave,
  boardConfig = {},
}) {
  const [boardApi, setBoardApi] = useState(null);
  const [pgn, setPgn] = useState(initialPgn);
  const [selectedTool, setSelectedTool] = useState(null); // { type: 'circle'|'arrow'|'eraser', color?: string, mode?: string }
  const [arrowStart, setArrowStart] = useState(null);
  const [currentComment, setCurrentComment] = useState("");
  const [currentShapes, setCurrentShapes] = useState([]);

  const boardElRef = useRef(null);
  const boardApiRef = useRef(null);

  // Garder les refs à jour pour les callbacks asynchrones
  const selectedToolRef = useRef(selectedTool);
  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  const arrowStartRef = useRef(arrowStart);
  useEffect(() => {
    arrowStartRef.current = arrowStart;
  }, [arrowStart]);

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
    const comment = api.state.currentComment || "";
    const shapes = api.board.state.drawable.shapes || [];
    setCurrentComment(comment);
    setCurrentShapes(shapes);
    setPgn(api.getPgn() || "");
  };

  // Met à jour et injecte les annotations dans le coup en cours
  const applyAnnotations = (comment = currentCommentRef.current, shapes = currentShapesRef.current) => {
    if (boardApiRef.current) {
      boardApiRef.current.setComment(comment, shapes);
      boardApiRef.current.setShapes(shapes);
      setPgn(boardApiRef.current.getPgn() || "");
    }
  };

  // Clic sur une case (dessin ou gomme)
  const handleSquareClick = (square) => {
    if (!boardApiRef.current || !selectedToolRef.current) return;

    const tool = selectedToolRef.current;
    let newShapes = [...currentShapesRef.current];

    if (tool.type === "circle") {
      const color = tool.color;
      // Toggle du cercle
      const exists = newShapes.some(s => s.orig === square && !s.dest && s.brush === color);
      newShapes = newShapes.filter(s => !(s.orig === square && !s.dest));
      if (!exists) {
        newShapes.push({ orig: square, brush: color });
      }
      setArrowStart(null);
      setCurrentShapes(newShapes);
      applyAnnotations(currentCommentRef.current, newShapes);
    } else if (tool.type === "arrow") {
      const color = tool.color;
      if (!arrowStartRef.current) {
        setArrowStart(square);
        // Mettre la case en surbrillance temporaire
        const tempShapes = [...newShapes, { orig: square, brush: color }];
        boardApiRef.current.setShapes(tempShapes);
      } else {
        const start = arrowStartRef.current;
        setArrowStart(null);
        if (start === square) {
          syncPositionData(boardApiRef.current);
          return;
        }

        // Toggle de la flèche
        const exists = newShapes.some(s => s.orig === start && s.dest === square && s.brush === color);
        newShapes = newShapes.filter(s => !(s.orig === start && s.dest === square));
        if (!exists) {
          newShapes.push({ orig: start, dest: square, brush: color });
        }

        setCurrentShapes(newShapes);
        applyAnnotations(currentCommentRef.current, newShapes);
      }
    } else if (tool.type === "eraser") {
      // Filtrer pour retirer toute forme liée à cette case
      newShapes = newShapes.filter(s => s.orig !== square && s.dest !== square);
      setArrowStart(null);
      setCurrentShapes(newShapes);
      applyAnnotations(currentCommentRef.current, newShapes);
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
      },
      events: {
        select: (key) => {
          handleSquareClick(key);
        }
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
          setPgn(boardApiRef.current.getPgn() || "");
        }
      }
    };

    // Callback onBoardCreated local pour gérer l'initialisation
    const onBoardCreated = (api) => {
      // Désactiver Stockfish
      if (typeof api.updateStockfishConfig === "function") {
        api.updateStockfishConfig({
          workerUrl: "",
          whiteMode: "disabled",
          blackMode: "disabled",
        });
      }

      // Charger le PGN initial si fourni
      if (initialPgn) {
        try {
          api.loadPgn(initialPgn);
        } catch (e) {
          console.warn("Échec du chargement du PGN initial:", e);
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

    return () => {
      if (boardAPI.board) {
        boardAPI.board.destroy();
      }
    };
  }, []);

  // Désactiver les mouvements de pièces si un outil de dessin est sélectionné
  useEffect(() => {
    if (boardApiRef.current) {
      const isDrawing = selectedTool !== null;
      boardApiRef.current.setConfig({
        viewOnly: isDrawing,
        movable: {
          color: isDrawing ? "none" : "both",
        }
      });
    }
    setArrowStart(null);
  }, [selectedTool]);

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

  // Validation
  const handleValidate = () => {
    if (onSave && boardApi) {
      onSave(boardApi.getPgn());
    }
  };

  // Outils de dessin
  const colors = [
    { name: "green", label: "Vert", hex: "#2ecc71" },
    { name: "red", label: "Rouge", hex: "#e74c3c" },
    { name: "blue", label: "Bleu", hex: "#3498db" },
    { name: "yellow", label: "Jaune", hex: "#f1c40f" },
  ];

  return (
    <div className="pgn-editor-container">
      <style>{`
        .pgn-editor-container {
          display: flex;
          gap: 20px;
          max-width: 1000px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .pgn-editor-left-col {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 10px;
          border: 1px solid #e9ecef;
        }

        .pgn-editor-board-wrapper {
          width: 100%;
          aspect-ratio: 1;
          position: relative;
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

        .pgn-editor-right-col {
          width: 350px;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          max-height: 150px;
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

        .pgn-toolbar-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pgn-color-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .pgn-color-btn:hover {
          transform: scale(1.1);
        }

        .pgn-color-btn.active {
          border-color: #212529;
          box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.25);
        }

        .pgn-arrow-btn {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .pgn-arrow-btn:hover {
          background: #f1f3f5;
        }

        .pgn-arrow-btn.active {
          background: #e8f0fe;
          border-color: #3858e9;
          color: #3858e9;
        }

        .pgn-eraser-btn {
          flex: 1;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #ffccd5;
          background: #fff5f5;
          color: #e53e3e;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .pgn-eraser-btn:hover {
          background: #ffe3e6;
          border-color: #ffa8b6;
        }

        .pgn-eraser-btn.active {
          background: #e53e3e;
          color: #ffffff;
          border-color: #e53e3e;
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

        @media (max-width: 768px) {
          .pgn-editor-container {
            flex-direction: column;
          }
          .pgn-editor-right-col {
            width: 100%;
          }
        }
      `}</style>

      {/* Colonne de Gauche : Échiquier */}
      <div className="pgn-editor-left-col">
        <div className="pgn-editor-board-wrapper" onSquareClick={(square) => handleSquareClick(square)}>
          <div ref={boardElRef} />
        </div>
      </div>

      {/* Colonne de Droite : Outils d'édition */}
      <div className="pgn-editor-right-col">
        
        {/* 1. Affichage du PGN */}
        <div className="pgn-editor-section">
          <div className="pgn-editor-title">PGN en direct</div>
          <div className="pgn-display-area">
            {pgn || "Aucun coup joué."}
          </div>
        </div>

        {/* 2. Navigation */}
        <div className="pgn-navigation-bar">
          <button type="button" className="pgn-nav-btn" onClick={handleViewStart} title="Début">|&lt;</button>
          <button type="button" className="pgn-nav-btn" onClick={handleViewPrevious} title="Précédent">&lt;</button>
          <button type="button" className="pgn-nav-btn" onClick={handleViewNext} title="Suivant">&gt;</button>
          <button type="button" className="pgn-nav-btn" onClick={handleViewEnd} title="Fin">&gt;|</button>
        </div>

        {/* 3. Commentaire */}
        <div className="pgn-editor-section">
          <div className="pgn-editor-title">Commentaire du coup</div>
          <textarea
            className="pgn-comment-textarea"
            placeholder="Saisissez un commentaire pour la position actuelle..."
            value={currentComment}
            onChange={handleCommentChange}
          />
        </div>

        {/* 4. Barre d'outils Cercles */}
        <div className="pgn-editor-section">
          <div className="pgn-editor-title">Cercles</div>
          <div className="pgn-toolbar-row">
            {colors.map((c) => {
              const isActive = selectedTool?.type === "circle" && selectedTool?.color === c.name;
              return (
                <button
                  key={`circle-${c.name}`}
                  type="button"
                  className={`pgn-color-btn ${isActive ? "active" : ""}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setSelectedTool(isActive ? null : { type: "circle", color: c.name })}
                  title={`Cercle ${c.label}`}
                />
              );
            })}
            <button
              type="button"
              className={`pgn-eraser-btn ${selectedTool?.type === "eraser" && selectedTool?.mode === "circle" ? "active" : ""}`}
              onClick={() => setSelectedTool(selectedTool?.type === "eraser" && selectedTool?.mode === "circle" ? null : { type: "eraser", mode: "circle" })}
              title="Gomme Cercles"
            >
              ⃠ Gomme
            </button>
          </div>
        </div>

        {/* 5. Barre d'outils Flèches */}
        <div className="pgn-editor-section">
          <div className="pgn-editor-title">Flèches</div>
          <div className="pgn-toolbar-row">
            {colors.map((c) => {
              const isActive = selectedTool?.type === "arrow" && selectedTool?.color === c.name;
              return (
                <button
                  key={`arrow-${c.name}`}
                  type="button"
                  className={`pgn-arrow-btn ${isActive ? "active" : ""}`}
                  style={{ color: c.hex }}
                  onClick={() => setSelectedTool(isActive ? null : { type: "arrow", color: c.name })}
                  title={`Flèche ${c.label}`}
                >
                  ↗
                </button>
              );
            })}
            <button
              type="button"
              className={`pgn-eraser-btn ${selectedTool?.type === "eraser" && selectedTool?.mode === "arrow" ? "active" : ""}`}
              onClick={() => setSelectedTool(selectedTool?.type === "eraser" && selectedTool?.mode === "arrow" ? null : { type: "eraser", mode: "arrow" })}
              title="Gomme Flèches"
            >
              ⃠ Gomme
            </button>
          </div>
        </div>

        {/* 6. Validation */}
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
}
