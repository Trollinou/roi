import React, { useState, useEffect, useRef } from "react";
import { BoardCore } from "eg-chessboard";

/**
 * FenEditor - Éditeur de position FEN autonome pour une utilisation dans une modale.
 * 
 * @param {Object} props
 * @param {string} props.initialFen - FEN initiale à charger
 * @param {Function} props.onSave - Rappel appelé avec la nouvelle FEN lors de la sauvegarde : onSave(fen)
 * @param {Object} props.boardConfig - Configuration additionnelle pour l'échiquier
 */
export default function FenEditor({ initialFen, onSave, boardConfig = {}, initialShapes = [] }) {
  const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  // États de la FEN
  const [position, setPosition] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  const [turn, setTurn] = useState("w");
  const [castling, setCastling] = useState("KQkq");
  const [orientation, setOrientation] = useState(boardConfig.orientation || "white");
  const [selectedPiece, setSelectedPiece] = useState(null); // { role, color } ou "eraser" ou null

  // États des dessins (flèches et cercles)
  const [selectedTool, setSelectedTool] = useState(null); // { type: 'circle'|'arrow'|'eraser', color?: string }
  const [arrowStart, setArrowStart] = useState(null);
  const [currentShapes, setCurrentShapes] = useState(initialShapes);

  const boardElRef = useRef(null);
  const boardApiRef = useRef(null);
  const selectedPieceRef = useRef(selectedPiece);

  // Garder les références à jour pour les callbacks asynchrones
  useEffect(() => {
    selectedPieceRef.current = selectedPiece;
  }, [selectedPiece]);

  const selectedToolRef = useRef(selectedTool);
  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  const arrowStartRef = useRef(arrowStart);
  useEffect(() => {
    arrowStartRef.current = arrowStart;
  }, [arrowStart]);

  const currentShapesRef = useRef(currentShapes);
  useEffect(() => {
    currentShapesRef.current = currentShapes;
  }, [currentShapes]);

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

  // Met à jour la position FEN à partir de l'état actuel de l'échiquier
  const syncPositionFromBoard = () => {
    if (boardApiRef.current && typeof boardApiRef.current.getPlacementFen === "function") {
      const posPart = boardApiRef.current.getPlacementFen();
      setPosition(posPart);
    }
  };

  // Gestion du clic sur une case (mode édition ou dessin)
  const handleSquareClick = (square) => {
    if (!boardApiRef.current) return;

    const activePiece = selectedPieceRef.current;
    const tool = selectedToolRef.current;

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
      // Après la modification, redessiner les formes si la FEN change
      boardApiRef.current.setShapes(currentShapesRef.current);
    } else if (tool) {
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
        boardApiRef.current.setShapes(newShapes);
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
            boardApiRef.current.setShapes(currentShapesRef.current);
            return;
          }

          // Toggle de la flèche
          const exists = newShapes.some(s => s.orig === start && s.dest === square && s.brush === color);
          newShapes = newShapes.filter(s => !(s.orig === start && s.dest === square));
          if (!exists) {
            newShapes.push({ orig: start, dest: square, brush: color });
          }

          setCurrentShapes(newShapes);
          boardApiRef.current.setShapes(newShapes);
        }
      } else if (tool.type === "eraser") {
        // Retirer toute forme liée à cette case
        newShapes = newShapes.filter(s => s.orig !== square && s.dest !== square);
        setArrowStart(null);
        setCurrentShapes(newShapes);
        boardApiRef.current.setShapes(newShapes);
      }
    }
  };

  // Calculer la case sous le clic en fonction des coordonnées de l'événement
  const getSquareFromClick = (e) => {
    const boardEl = boardElRef.current;
    if (!boardEl) return null;
    const rect = boardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const isBlack = boardApiRef.current && boardApiRef.current.getOrientation() === "black";
    
    const fileIdx = Math.floor((x / rect.width) * 8);
    const rankIdx = Math.floor((y / rect.height) * 8);
    
    if (fileIdx < 0 || fileIdx > 7 || rankIdx < 0 || rankIdx > 7) return null;
    
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
    
    const file = files[isBlack ? 7 - fileIdx : fileIdx];
    const rank = ranks[isBlack ? 7 - rankIdx : rankIdx];
    
    return file + rank;
  };

  const handleBoardClick = (e) => {
    if (!selectedToolRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const square = getSquareFromClick(e);
    if (square) {
      handleSquareClick(square);
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

    return () => {
      if (boardAPI.board) {
        boardAPI.board.destroy();
      }
    };
  }, []);

  // Synchronisation de la FEN lors des changements de prop initialFen externe
  useEffect(() => {
    if (boardApiRef.current && initialFen) {
      const parts = initialFen.split(" ");
      const pos = parts[0] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
      const t = parts[1] || "w";
      const cast = parts[2] || "KQkq";

      setPosition(pos);
      setTurn(t);
      setCastling(cast);

      boardApiRef.current.setPosition(initialFen);
    }
  }, [initialFen]);

  // Synchronisation de l'orientation avec l'échiquier
  useEffect(() => {
    if (boardApiRef.current) {
      boardApiRef.current.setConfig({ orientation });
    }
  }, [orientation]);

  // Réinitialisation de l'échiquier
  const handleReset = () => {
    if (boardApiRef.current) {
      boardApiRef.current.setPosition(defaultFen);
      setPosition("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
      setTurn("w");
      setCastling("KQkq");
    }
  };

  // Vider l'échiquier
  const handleClear = () => {
    const emptyFen = "8/8/8/8/8/8/8/8 w - - 0 1";
    if (boardApiRef.current) {
      boardApiRef.current.setPosition(emptyFen);
      setPosition("8/8/8/8/8/8/8/8");
      setTurn("w");
      setCastling("-");
    }
  };

  // Mise à jour des roques
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

  // Assemblage et sauvegarde de la FEN
  const handleApply = () => {
    if (onSave) {
      const finalFen = `${position} ${turn} ${castling} - 0 1`;
      onSave({ fen: finalFen, orientation, shapes: currentShapes });
    }
  };

  const colors = [
    { name: "green", label: "Vert", hex: "#2ecc71" },
    { name: "red", label: "Rouge", hex: "#e74c3c" },
    { name: "blue", label: "Bleu", hex: "#3498db" },
    { name: "yellow", label: "Jaune", hex: "#f1c40f" },
  ];

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
          setSelectedTool(null);
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

        .pgn-color-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          z-index: 5;
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
          position: relative;
          z-index: 5;
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
          position: relative;
          z-index: 5;
        }

        .pgn-eraser-btn:hover {
          background: #ffe3e6;
        }

        .pgn-eraser-btn.active {
          background: #e53e3e;
          color: #ffffff;
          border-color: #e53e3e;
        }
      `}</style>

      {/* Colonne Gauche - L'échiquier */}
      <div className="fen-editor-board-col">
        <section className="fen-editor-main-wrap">
          <div className="fen-editor-main-board" onClick={handleBoardClick}>
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
                setSelectedTool(null);
                setSelectedPiece(selectedPiece === "eraser" ? null : "eraser");
              }}
            >
              🗑️ Gomme (Effacer)
            </button>
          </div>
        </div>

        {/* Outils de dessin */}
        <div>
          <div className="fen-editor-section-title">Outils de dessin</div>
          <div className="fen-editor-palette-group" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Outil (Cercle / Flèche) */}
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                className={`pgn-arrow-btn ${selectedTool?.type === "circle" ? "active" : ""}`}
                style={{ width: "32px", height: "32px", fontSize: "15px" }}
                onClick={() => {
                  setSelectedPiece(null);
                  setSelectedTool(selectedTool?.type === "circle" ? null : { type: "circle", color: selectedTool?.color || "green" });
                }}
                title="Cercle"
              >
                ◯
              </button>
              <button
                type="button"
                className={`pgn-arrow-btn ${selectedTool?.type === "arrow" ? "active" : ""}`}
                style={{ width: "32px", height: "32px", fontSize: "15px" }}
                onClick={() => {
                  setSelectedPiece(null);
                  setSelectedTool(selectedTool?.type === "arrow" ? null : { type: "arrow", color: selectedTool?.color || "green" });
                }}
                title="Flèche"
              >
                ↗
              </button>
            </div>

            {/* Couleurs */}
            <div style={{ display: "flex", gap: "5px" }}>
              {colors.map((c) => {
                const isActive = (selectedTool?.type === "circle" || selectedTool?.type === "arrow") && selectedTool?.color === c.name;
                return (
                  <button
                    key={`color-${c.name}`}
                    type="button"
                    className={`pgn-color-btn ${isActive ? "active" : ""}`}
                    style={{ backgroundColor: c.hex, width: "24px", height: "24px" }}
                    onClick={() => {
                      setSelectedPiece(null);
                      const currentType = selectedTool?.type === "arrow" ? "arrow" : "circle";
                      setSelectedTool({ type: currentType, color: c.name });
                    }}
                    title={`Couleur ${c.label}`}
                  />
                );
              })}
            </div>

            {/* Gomme */}
            <button
              type="button"
              className={`pgn-eraser-btn ${selectedTool?.type === "eraser" ? "active" : ""}`}
              style={{ height: "32px", padding: "0 8px", fontSize: "11px", flex: "none" }}
              onClick={() => {
                setSelectedPiece(null);
                setSelectedTool(selectedTool?.type === "eraser" ? null : { type: "eraser" });
              }}
              title="Gomme"
            >
              ⃠ Gomme
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
}
