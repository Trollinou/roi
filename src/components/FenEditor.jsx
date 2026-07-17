import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { BoardCore } from "eg-chessboard";

/**
 * FenEditor - Éditeur de position FEN autonome pour une utilisation dans une modale.
 * 
 * @param {Object} props
 * @param {string} props.initialFen - FEN initiale à charger
 * @param {Function} props.onSave - Rappel appelé avec la nouvelle FEN lors de la sauvegarde : onSave(fen)
 * @param {Object} props.boardConfig - Configuration additionnelle pour l'échiquier
 * @param {React.Ref} ref - Ref impérative exposant redrawBoard() pour forcer le recalcul des bounds
 */
const FenEditor = forwardRef(function FenEditor({ initialFen, onSave, boardConfig = {}, initialShapes = [] }, ref) {
  const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  // États de la FEN
  const [position, setPosition] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  const [turn, setTurn] = useState("w");
  const [castling, setCastling] = useState("KQkq");
  const [orientation, setOrientation] = useState(boardConfig.orientation || "white");
  const [selectedPiece, setSelectedPiece] = useState(null); // { role, color } ou "eraser" ou null
  const [currentShapes, setCurrentShapes] = useState(initialShapes);

  const boardElRef = useRef(null);
  const boardApiRef = useRef(null);

  // Exposer redrawBoard() au composant parent via ref
  useImperativeHandle(ref, () => ({
    redrawBoard() {
      if (boardApiRef.current && boardApiRef.current.board) {
        // La clé absolue : invalider le cache des bounds de Chessground
        if (boardApiRef.current.board.state?.dom?.bounds?.clear) {
          boardApiRef.current.board.state.dom.bounds.clear();
        }
        boardApiRef.current.board.redrawAll();
      }
    }
  }));
  const selectedPieceRef = useRef(selectedPiece);

  // Garder les références à jour pour les callbacks asynchrones
  useEffect(() => {
    selectedPieceRef.current = selectedPiece;
  }, [selectedPiece]);

  // Met à jour la position FEN à partir de l'état actuel de l'échiquier
  const syncPositionFromBoard = () => {
    if (boardApiRef.current && typeof boardApiRef.current.getFen === "function") {
      const fullFen = boardApiRef.current.getFen();
      const posPart = fullFen.split(" ")[0];
      setPosition(posPart);
    }
  };

  // Gestion du clic sur une case (mode édition)
  const handleSquareClick = (square) => {
    if (!boardApiRef.current) return;

    const activePiece = selectedPieceRef.current;

    if (activePiece) {
      if (activePiece === "eraser") {
        boardApiRef.current.removePiece(square);
        syncPositionFromBoard();
      } else {
        const type = activePiece.role === "knight" ? "n" : activePiece.role[0];
        const color = activePiece.color === "white" ? "w" : "b";
        boardApiRef.current.putPiece({ type, color }, square);
        syncPositionFromBoard();
      }
    }
  };

  // Initialisation et cycle de vie de BoardCore
  useEffect(() => {
    if (!boardElRef.current) return;

    const currentFen = initialFen || defaultFen;
    const parts = currentFen.split(" ");
    const pos = parts[0] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    const t = parts[1] || "w";
    const cast = parts[2] || "KQkq";

    setPosition(pos);
    setTurn(t);
    setCastling(cast);

    // Configuration de BoardCore
    const config = {
      ...boardConfig,
      fen: currentFen,
      orientation,
      movable: {
        free: true,
        color: "both",
      },
      draggable: {
        deleteOnDropOff: true,
      },
      drawable: {
        onChange: (shapes) => {
          setCurrentShapes(shapes);
        }
      },
      events: {
        select: (key) => {
          handleSquareClick(key);
        }
      }
    };

    const boardState = {
      showThreats: false,
      freeMode: true,
      promotionDialogState: { isEnabled: false },
      historyViewerState: { isEnabled: false },
    };

    const emit = (event) => {
      if (event === "move") {
        syncPositionFromBoard();
      }
    };

    // Création de l'instance
    const boardAPI = new BoardCore(
      boardElRef.current,
      boardState,
      () => {},
      emit,
      config,
      {
        whiteMode: "disabled",
        blackMode: "disabled",
      }
    );

    boardApiRef.current = boardAPI;

    if (initialShapes && initialShapes.length > 0) {
      boardAPI.setShapes(initialShapes);
    }

    if (boardConfig.onBoardCreated) {
      boardConfig.onBoardCreated(boardAPI);
    }

    // Recalcul fiable des bounds via ResizeObserver
    // Dans l'iFrame Gutenberg, les dimensions se stabilisent après le premier rendu.
    // Un simple setTimeout(200ms) n'est pas suffisant ; le ResizeObserver détecte
    // le moment exact où le conteneur atteint ses dimensions finales et force
    // Chessground à recalculer ses bounds (position de référence pour le drag/dessin).
    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined" && boardElRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (boardAPI.board) {
          boardAPI.board.redrawAll();
        }
      });
      resizeObserver.observe(boardElRef.current);
    } else {
      // Fallback si ResizeObserver n'est pas disponible
      setTimeout(() => {
        if (boardAPI.board) {
          boardAPI.board.redrawAll();
        }
      }, 300);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (boardAPI.board) {
        boardAPI.board.destroy();
      }
    };
  }, []);

  // Assemblage et sauvegarde de la FEN
  const handleApply = () => {
    if (onSave) {
      const finalFen = `${position} ${turn} ${castling} - 0 1`;
      const shapes = boardApiRef.current && typeof boardApiRef.current.getShapes === "function"
        ? boardApiRef.current.getShapes()
        : currentShapes;
      onSave({ fen: finalFen, orientation, shapes });
    }
  };

  const handleClear = () => {
    boardApiRef.current.setPosition("8/8/8/8/8/8/8/8 w - - 0 1");
    syncPositionFromBoard();
    setTurn("w");
    setCastling("-");
  };

  const handleReset = () => {
    boardApiRef.current.setPosition(defaultFen);
    syncPositionFromBoard();
    setTurn("w");
    setCastling("KQkq");
  };

  const handleCastlingChange = (flag, checked) => {
    let current = castling === "-" ? "" : castling;
    if (checked) {
      if (!current.includes(flag)) {
        let next = "";
        if (flag === "K" || current.includes("K")) next += "K";
        if (flag === "Q" || current.includes("Q")) next += "Q";
        if (flag === "k" || current.includes("k")) next += "k";
        if (flag === "q" || current.includes("q")) next += "q";
        current = next || "-";
      }
    } else {
      current = current.replace(flag, "");
    }
    if (!current) current = "-";
    setCastling(current);
  };

  const roles = ["pawn", "knight", "bishop", "rook", "queen", "king"];

  // Pièce de palette cliquable réutilisant les composants et le CSS natif de Chessground/Wikipedia
  const renderPalettePiece = (role, color) => {
    const isActive = selectedPiece && selectedPiece.role === role && selectedPiece.color === color;
    return (
      <button
        key={`${role}-${color}`}
        type="button"
        className={`editor-palette-piece ${isActive ? "active" : ""}`}
        onClick={() => {
          if (isActive) {
            setSelectedPiece(null);
          } else {
            setSelectedPiece({ role, color });
          }
        }}
        title={`Placer ${color === "white" ? "un pion/pièce blanc" : "un pion/pièce noir"}`}
      >
        <cg-board
          className="editor-palette-board"
          style={{ backgroundImage: "none" }}
        >
          <piece className={`${role} ${color} piece-inner`} />
        </cg-board>
      </button>
    );
  };

  return (
    <div className="fen-editor-container">
      {/* Styles autonomes intégrés pour l'agencement de la modale */}
      <style>{`
        .fen-editor-container {
          display: flex;
          flex-direction: row;
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .fen-editor-board-col {
          flex: 0 0 400px;
          width: 400px;
        }

        .fen-editor-main-wrap {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .fen-editor-main-board {
          position: relative;
          width: 400px;
          height: 400px;
          overflow: hidden;
        }

        .fen-editor-main-board > div {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Forcer la réactivité de cg-container et empêcher les overlays SVG de bloquer les clics */
        cg-container {
          width: 100% !important;
          height: 100% !important;
        }

        .fen-editor-main-board svg {
          pointer-events: none !important;
        }

        .fen-editor-controls-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: flex-start;
        }

        .fen-editor-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .fen-editor-palette-group {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          position: relative;
          z-index: 5;
        }

        .fen-editor-palette-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          margin-bottom: 6px;
        }

        .editor-palette-piece {
          aspect-ratio: 1;
          background: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          position: relative;
          padding: 0;
          transition: all 0.2s ease;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .editor-palette-piece:hover {
          background: #e9ecef;
          border-color: #ced4da;
        }

        .editor-palette-piece.active {
          background: #3858e9 !important;
          border-color: #3858e9 !important;
          box-shadow: inset 0 0 0 2px #fff, 0 0 0 2px #3858e9 !important;
        }

        .editor-palette-board {
          position: relative;
          display: contents;
        }

        cg-board.editor-palette-board {
          background-image: none !important;
        }

        .editor-palette-piece .piece-inner {
          position: absolute;
          top: 5%;
          left: 5%;
          width: 90%;
          height: 90%;
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
        }

        .editor-palette-eraser {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffebee;
          border: 1px solid #ffcdd2;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          color: #c62828;
          width: 100%;
          padding: 8px 12px;
          font-size: 14px;
          margin-top: 8px;
          transition: all 0.2s ease;
          aspect-ratio: auto !important;
          height: 38px !important;
        }

        .editor-palette-eraser:hover {
          background: #ffcdd2;
        }

        .editor-palette-eraser.active {
          background: #d32f2f !important;
          color: #ffffff !important;
          border-color: #d32f2f !important;
          box-shadow: inset 0 0 0 2px #fff, 0 0 0 2px #d32f2f !important;
        }

        .fen-editor-option-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fen-editor-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          background-color: #ffffff;
          font-size: 14px;
          color: #495057;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }

        .fen-editor-select:focus {
          border-color: #3858e9;
        }

        .fen-editor-checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .fen-editor-checkbox-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fen-editor-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #495057;
          cursor: pointer;
        }

        .fen-editor-checkbox-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .fen-editor-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          position: relative;
          z-index: 5;
        }

        .fen-editor-actions .fen-editor-btn {
          flex: 1;
        }

        .fen-editor-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          position: relative;
          z-index: 5;
        }

        .fen-editor-btn-secondary {
          background: #f1f3f5;
          color: #495057;
          border: 1px solid #dee2e6;
        }

        .fen-editor-btn-secondary:hover {
          background: #e9ecef;
        }

        .fen-editor-btn-primary {
          background: #3858e9;
          color: #ffffff;
        }

        .fen-editor-btn-primary:hover {
          background: #2b45be;
        }

        .fen-editor-drawing-legend {
          margin-top: 16px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 12px;
          color: #495057;
          line-height: 1.5;
        }

        .fen-editor-drawing-legend .legend-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fen-editor-drawing-legend .legend-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
          margin-bottom: 8px;
        }

        .fen-editor-drawing-legend .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fen-editor-drawing-legend .legend-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .fen-editor-drawing-legend .legend-tip {
          font-size: 11px;
          color: #868e96;
          border-top: 1px dashed #dee2e6;
          padding-top: 6px;
          margin-top: 4px;
        }

        /* Réduction de la taille de l'échiquier sur les écrans de faible hauteur */
        @media (max-height: 750px) {
          .fen-editor-board-col {
            flex: 0 0 320px;
            width: 320px;
          }
          .fen-editor-main-board {
            width: 320px;
            height: 320px;
          }
        }

        @media (max-width: 768px) {
          .fen-editor-container {
            flex-direction: column;
          }
          .fen-editor-board-col {
            min-width: 100%;
          }
        }
      `}</style>

      {/* Colonne Gauche - L'échiquier */}
      <div className="fen-editor-board-col">
        <section className="fen-editor-main-wrap">
          <div className="fen-editor-main-board">
            <div ref={boardElRef} />
          </div>
        </section>
        
        {/* Actions rapides sous l'échiquier */}
        <div className="fen-editor-actions" style={{ marginTop: "12px" }}>
          <button
            type="button"
            className="fen-editor-btn fen-editor-btn-secondary"
            onClick={handleClear}
          >
            Échiquier vide
          </button>
          <button
            type="button"
            className="fen-editor-btn fen-editor-btn-secondary"
            onClick={handleReset}
          >
            Position initiale
          </button>
        </div>

        {/* Aide au dessin */}
        <div className="fen-editor-drawing-legend">
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
          <div className="legend-tip">
            <em>Flèches : Glisser-déposer avec le clic droit. Clic gauche simple sur l'échiquier pour tout effacer.</em>
          </div>
        </div>
      </div>

      {/* Colonne Droite - Contrôles */}
      <div className="fen-editor-controls-col">
        <div>
          {/* Palette de pièces */}
          <div className="fen-editor-section-title">Palette de pièces</div>
          <div className="fen-editor-palette-group">
            <div className="fen-editor-palette-row">
              {roles.map((role) => renderPalettePiece(role, "white"))}
            </div>
            <div className="fen-editor-palette-row">
              {roles.map((role) => renderPalettePiece(role, "black"))}
            </div>
            <button
              type="button"
              className={`editor-palette-eraser ${selectedPiece === "eraser" ? "active" : ""}`}
              onClick={() => {
                setSelectedPiece(selectedPiece === "eraser" ? null : "eraser");
              }}
            >
              🗑️ Gomme (Effacer)
            </button>
          </div>
        </div>

        {/* Options de position */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="fen-editor-section-title">Options de position</div>

          {/* Grille pour Orientation et Trait */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Orientation */}
            <div className="fen-editor-option-field">
              <label className="fen-editor-checkbox-label" style={{ fontWeight: "500" }}>
                Orientation
              </label>
              <select
                className="fen-editor-select"
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
              >
                <option value="white">Blancs</option>
                <option value="black">Noirs</option>
              </select>
            </div>

            {/* Trait aux */}
            <div className="fen-editor-option-field">
              <label className="fen-editor-checkbox-label" style={{ fontWeight: "500" }}>
                Trait au tour de
              </label>
              <select
                className="fen-editor-select"
                value={turn}
                onChange={(e) => setTurn(e.target.value)}
              >
                <option value="w">Blancs</option>
                <option value="b">Noirs</option>
              </select>
            </div>
          </div>

          {/* Droits de roque */}
          <div className="fen-editor-option-field">
            <label className="fen-editor-checkbox-label" style={{ fontWeight: "500" }}>
              Droits de roque
            </label>
            <div className="fen-editor-checkbox-group">
              <div className="fen-editor-checkbox-row">
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#6c757d" }}>Blancs :</span>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes("K")}
                    onChange={(e) => handleCastlingChange("K", e.target.checked)}
                  />
                  Petit (O-O)
                </label>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes("Q")}
                    onChange={(e) => handleCastlingChange("Q", e.target.checked)}
                  />
                  Grand (O-O-O)
                </label>
              </div>
              <div className="fen-editor-checkbox-row">
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#6c757d" }}>Noirs :</span>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes("k")}
                    onChange={(e) => handleCastlingChange("k", e.target.checked)}
                  />
                  Petit (o-o)
                </label>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes("q")}
                    onChange={(e) => handleCastlingChange("q", e.target.checked)}
                  />
                  Grand (o-o-o)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton d'application principal */}
        <button
          type="button"
          className="fen-editor-btn fen-editor-btn-primary"
          onClick={handleApply}
          style={{ width: "100%", padding: "12px 16px", fontSize: "15px" }}
        >
          Appliquer cette position
        </button>
      </div>
    </div>
  );
});

export default FenEditor;
