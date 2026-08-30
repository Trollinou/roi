import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { BoardCore } from "eg-chessboard";
import { parsePgn } from "chessops/pgn";
import PiecePalette from "./PiecePalette";
import DrawingLegend from "../DrawingLegend";
import useChessBoard from "../../hooks/useChessBoard";
import "./FenEditor.css";

/**
 * FenEditor - Éditeur de position FEN autonome pour une utilisation dans une modale.
 * 
 * @param {Object} props
 * @param {string} props.initialFen - FEN initiale à charger
 * @param {string} props.fen - FEN alternative (si initialFen absente)
 * @param {Function} props.onSave - Rappel appelé avec la nouvelle FEN lors de la sauvegarde : onSave(fen)
 * @param {Object} props.boardConfig - Configuration additionnelle pour l'échiquier
 * @param {Array} props.initialShapes - Annotations dessinées initiales
 * @param {Object} props.diagram - Objet diagramme ({ fen, shapes, orientation })
 * @param {Object} props.initialDiagram - Objet diagramme initial alternative
 * @param {React.Ref} ref - Ref impérative exposant redrawBoard(), getDiagram() et setDiagram()
 */
const FenEditor = forwardRef(function FenEditor({
  initialFen,
  fen,
  onSave,
  boardConfig = {},
  initialShapes = [],
  diagram,
  initialDiagram,
}, ref) {
  const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  const effectiveFen = diagram?.fen || initialDiagram?.fen || initialFen || fen || defaultFen;
  const effectiveShapes = diagram?.shapes || initialDiagram?.shapes || initialShapes || [];

  const parts = effectiveFen.split(" ");
  const initialPlacement = parts[0] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
  const initialTurn = parts[1] || "w";
  const initialCastling = parts[2] || "KQkq";
  const initialOrientation = initialTurn === "b" ? "black" : "white";

  // États de la FEN
  const [position, setPosition] = useState(initialPlacement);
  const [turn, setTurn] = useState(initialTurn);
  const [castling, setCastling] = useState(initialCastling);
  const [orientation, setOrientation] = useState(initialOrientation);
  const [importFenText, setImportFenText] = useState("");
  const [selectedPiece, setSelectedPiece] = useState(null); // { role, color } ou "eraser" ou null
  const [currentShapes, setCurrentShapes] = useState(effectiveShapes);
  const [promotionState, setPromotionState] = useState({ isEnabled: false });

  const boardElRef = useRef(null);
  const currentShapesRef = useRef(effectiveShapes);
  const selectedPieceRef = useRef(selectedPiece);
  const orientationRef = useRef(orientation);
  const positionRef = useRef(initialPlacement);

  useEffect(() => {
    currentShapesRef.current = currentShapes;
  }, [currentShapes]);

  useEffect(() => {
    selectedPieceRef.current = selectedPiece;
  }, [selectedPiece]);

  useEffect(() => {
    orientationRef.current = orientation;
  }, [orientation]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Met à jour la position FEN à partir de l'état actuel de l'échiquier
  const syncPositionFromBoard = () => {
    if (boardApiRef.current) {
      const placement = boardApiRef.current.getPlacementFen();
      if (placement && placement !== positionRef.current) {
        positionRef.current = placement;
        setPosition(placement);
      }
    }
  };

  // Synchronisation dynamique de l'orientation sur l'échiquier selon le trait (turn)
  useEffect(() => {
    const computed = turn === "b" ? "black" : "white";
    setOrientation(computed);
    if (boardApiRef.current) {
      const currentOrient = boardApiRef.current.getOrientation();
      if (currentOrient !== computed) {
        boardApiRef.current.setConfig({ orientation: computed });
      }
    }
  }, [turn]);

  // Gestion du clic sur une case (mode édition)
  const handleSquareClick = (square) => {
    if (!boardApiRef.current) return;

    const activePiece = selectedPieceRef.current;

    if (activePiece) {
      if (activePiece === "eraser") {
        boardApiRef.current.removePiece(square);
      } else {
        const type = activePiece.role === "knight" ? "n" : activePiece.role[0];
        const color = activePiece.color === "white" ? "w" : "b";
        boardApiRef.current.putPiece({ type, color }, square);
      }

      syncPositionFromBoard();
    }
  };

  // Initialisation et orchestration via custom hook
  const { boardApiRef } = useChessBoard(
    boardElRef,
    () => {
      if (!boardElRef.current) return null;

      const currentFen = effectiveFen;
      const parts = currentFen.split(" ");
      const pos = parts[0] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
      const t = parts[1] || "w";
      const cast = parts[2] || "KQkq";
      const initialOrient = t === "b" ? "black" : "white";

      setPosition(pos);
      setTurn(t);
      setCastling(cast);
      setOrientation(initialOrient);

      const selectedPieceSet = boardConfig.pieceSet || "cburnett";
      const selectedBoardTheme = boardConfig.boardTheme || "brown";

      const config = {
        mode: "editor",
        pieceSet: selectedPieceSet,
        boardTheme: selectedBoardTheme,
        ...boardConfig,
        fen: currentFen,
        orientation: initialOrient,
        movable: {
          free: true,
          color: "both",
        },
        draggable: {
          deleteOnDropOff: true,
        },
        drawable: {
          eraseOnClick: true,
          onChange: (shapes) => {
            setCurrentShapes(shapes);
            currentShapesRef.current = shapes;
          }
        },
        events: {
          select: (key) => {
            handleSquareClick(key);
          }
        }
      };

      const boardState = {
        mode: "editor",
        pieceSet: selectedPieceSet,
        boardTheme: selectedBoardTheme,
        freeMode: true,
        preserveShapesOnPositionChange: true,
        showThreats: false,
        promotionDialogState: { isEnabled: false },
        historyViewerState: { isEnabled: false },
      };

      const emit = (event) => {
        if (event === "move") {
          syncPositionFromBoard();
        }
      };

      const handleStateChange = () => {
        if (boardApiRef.current) {
          const currentState = boardApiRef.current.getState();
          setPromotionState({ ...currentState.promotionDialogState });
          syncPositionFromBoard();
        }
      };

      const boardAPI = new BoardCore(
        boardElRef.current,
        boardState,
        handleStateChange,
        emit,
        config,
        {
          whiteMode: "disabled",
          blackMode: "disabled",
        }
      );

      boardAPI.setPieceSet(selectedPieceSet);
      boardAPI.setBoardTheme(selectedBoardTheme);

      if (typeof boardAPI.setDiagram === "function") {
        boardAPI.setDiagram({ fen: currentFen, shapes: effectiveShapes });
      } else if (effectiveShapes && effectiveShapes.length > 0) {
        boardAPI.setShapes(effectiveShapes);
      }

      if (boardConfig.onBoardCreated) {
        boardConfig.onBoardCreated(boardAPI);
      }

      return boardAPI;
    },
    []
  );

/**
 * Parse a FEN string or Lichess PGN export with annotations ([%csl ...] and [%cal ...]).
 *
 * @param {string} text Raw FEN or PGN string.
 * @return {{ fen: string, shapes: Array<{ orig: string, dest?: string, brush: string }> } | null}
 */
function parsePgnOrFen(text) {
  if (!text || typeof text !== "string") {
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const brushMap = {
    g: "green",
    r: "red",
    b: "blue",
    y: "yellow",
    c: "green",
    o: "yellow",
  };

  let fen = "";
  const shapes = [];

  // 1. Extraire la FEN depuis l'en-tête [FEN "..."] si présent
  const fenMatch = trimmed.match(/\[FEN\s+"([^"]+)"\]/i);
  if (fenMatch && fenMatch[1]) {
    fen = fenMatch[1].trim();
  }

  // 2. Récupérer les commentaires racine (position initiale) via parsePgn
  let rootComments = [];
  try {
    const games = parsePgn(trimmed);
    if (games && games.length > 0) {
      const game = games[0];
      if (game.headers && typeof game.headers.get === "function") {
        const fenHeader = game.headers.get("FEN");
        if (fenHeader) {
          fen = fenHeader.trim();
        }
      }
      if (Array.isArray(game.comments) && game.comments.length > 0) {
        rootComments = game.comments;
      }
    }
  } catch (e) {
    const firstMoveIndex = trimmed.search(/\b\d+\s*\./);
    const initialSection =
      firstMoveIndex !== -1 ? trimmed.slice(0, firstMoveIndex) : trimmed;
    const fallbackMatches = initialSection.match(/\{([^}]*)\}/g);
    if (fallbackMatches) {
      rootComments = fallbackMatches.map((c) => c.slice(1, -1));
    }
  }

  if (rootComments.length > 0) {
    const commentsText = rootComments.join(" ");

    // Extraire les cercles [%csl ...] ou [%cpl ...]
    const cslRegex = /\[%(?:csl|cpl)\s+([^\]]+)\]/gi;
    let cslMatch;
    while ((cslMatch = cslRegex.exec(commentsText)) !== null) {
      const items = cslMatch[1].split(",");
      for (const item of items) {
        const cleanItem = item.trim();
        if (cleanItem.length >= 3) {
          const brushChar = cleanItem[0].toLowerCase();
          const brush = brushMap[brushChar] || "green";
          const orig = cleanItem.substring(1, 3).toLowerCase();
          shapes.push({ orig, brush });
        }
      }
    }

    // Extraire les flèches [%cal ...]
    const calRegex = /\[%cal\s+([^\]]+)\]/gi;
    let calMatch;
    while ((calMatch = calRegex.exec(commentsText)) !== null) {
      const items = calMatch[1].split(",");
      for (const item of items) {
        const cleanItem = item.trim();
        if (cleanItem.length >= 5) {
          const brushChar = cleanItem[0].toLowerCase();
          const brush = brushMap[brushChar] || "green";
          const orig = cleanItem.substring(1, 3).toLowerCase();
          const dest = cleanItem.substring(3, 5).toLowerCase();
          shapes.push({ orig, dest, brush });
        }
      }
    }
  }

  // 3. Si aucune FEN n'a été trouvée dans les balises PGN
  if (!fen) {
    const firstLine = trimmed.split("\n")[0].trim();
    if (firstLine.includes("/") && !firstLine.startsWith("[")) {
      fen = firstLine;
    } else if (trimmed.startsWith("[") && trimmed.includes("]")) {
      fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    } else {
      fen = trimmed;
    }
  }

  return { fen, shapes };
}

  // Exposer redrawBoard(), getDiagram() et setDiagram() au composant parent via ref
  useImperativeHandle(ref, () => ({
    redrawBoard() {
      boardApiRef.current?.redraw(true);
    },
    getDiagram() {
      const finalFen = `${position} ${turn} ${castling} - 0 1`;
      let shapes = (currentShapesRef.current && Array.isArray(currentShapesRef.current))
        ? currentShapesRef.current
        : (currentShapes && Array.isArray(currentShapes) ? currentShapes : []);
      if ((!shapes || shapes.length === 0) && boardApiRef.current && typeof boardApiRef.current.getShapes === "function") {
        shapes = boardApiRef.current.getShapes() || [];
      }
      return {
        fen: finalFen,
        orientation: turn === "b" ? "black" : "white",
        shapes: shapes || [],
      };
    },
    setDiagram(newDiagram) {
      if (!newDiagram) return;
      const fenStr = typeof newDiagram === "string" ? newDiagram.trim() : newDiagram.fen || defaultFen;
      const shapesArr = Array.isArray(newDiagram.shapes) ? newDiagram.shapes : [];
      const parts = fenStr.split(" ");
      const pos = parts[0] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
      const t = parts[1] || "w";
      const cast = parts[2] || "KQkq";
      const computedOrient = t === "b" ? "black" : "white";

      setPosition(pos);
      setTurn(t);
      setCastling(cast);
      setOrientation(computedOrient);
      setCurrentShapes(shapesArr);
      currentShapesRef.current = shapesArr;

      if (boardApiRef.current) {
        if (typeof boardApiRef.current.setDiagram === "function") {
          boardApiRef.current.setDiagram({ fen: fenStr, shapes: shapesArr });
        } else {
          boardApiRef.current.setPosition(fenStr);
          boardApiRef.current.setShapes(shapesArr);
        }
        boardApiRef.current.setConfig({ orientation: computedOrient });
      }
    }
  }));

  // Chargement d'une FEN ou d'un PGN (avec formes) personnalisé
  const handleLoadFen = () => {
    const input = importFenText.trim();
    if (!input) return;

    try {
      const parsed = parsePgnOrFen(input);
      if (!parsed || !parsed.fen) {
        alert("Format FEN ou PGN non reconnu.");
        return;
      }

      const { fen: newFen, shapes: newShapes } = parsed;

      const parts = newFen.split(/\s+/);
      const pos = parts[0] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
      const t = parts[1] || "w";
      const cast = parts[2] || "KQkq";
      const computedOrient = t === "b" ? "black" : "white";

      setPosition(pos);
      setTurn(t);
      setCastling(cast);
      setOrientation(computedOrient);
      setCurrentShapes(newShapes);
      currentShapesRef.current = newShapes;

      if (boardApiRef.current) {
        if (typeof boardApiRef.current.setDiagram === "function") {
          boardApiRef.current.setDiagram({ fen: newFen, shapes: newShapes });
        } else {
          boardApiRef.current.setPosition(newFen);
          boardApiRef.current.setShapes(newShapes);
        }
        boardApiRef.current.setConfig({ orientation: computedOrient });
      }

      syncPositionFromBoard();
      setImportFenText("");
    } catch (err) {
      alert("Erreur lors du chargement : " + err.message);
    }
  };

  // Assemblage et sauvegarde de la FEN & du Diagramme
  const handleApply = () => {
    if (onSave) {
      const finalFen = `${position} ${turn} ${castling} - 0 1`;
      const currentOrientation = turn === "b" ? "black" : "white";
      let shapes = (currentShapesRef.current && Array.isArray(currentShapesRef.current))
        ? currentShapesRef.current
        : (currentShapes && Array.isArray(currentShapes) ? currentShapes : []);
      if ((!shapes || shapes.length === 0) && boardApiRef.current && typeof boardApiRef.current.getShapes === "function") {
        shapes = boardApiRef.current.getShapes() || [];
      }
      const diagramObj = { fen: finalFen, orientation: currentOrientation, shapes };
      onSave({ fen: finalFen, orientation: currentOrientation, shapes, diagram: diagramObj });
    }
  };

  const handleClear = () => {
    boardApiRef.current?.setPosition("8/8/8/8/8/8/8/8 w - - 0 1");
    boardApiRef.current?.setShapes([]);
    setCurrentShapes([]);
    currentShapesRef.current = [];
    syncPositionFromBoard();
    setTurn("w");
    setOrientation("white");
    setCastling("-");
  };

  const handleReset = () => {
    boardApiRef.current?.setPosition(defaultFen);
    boardApiRef.current?.setShapes([]);
    setCurrentShapes([]);
    currentShapesRef.current = [];
    syncPositionFromBoard();
    setTurn("w");
    setOrientation("white");
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

  const pieceSet = boardConfig.pieceSet || "cburnett";
  const boardTheme = boardConfig.boardTheme || "brown";

  return (
    <div className="fen-editor-container">
      {/* Colonne Gauche - L'échiquier */}
      <div className="fen-editor-board-col">
        <section
          className={`main-wrap piece-set-${pieceSet} board-theme-${boardTheme} ${
            promotionState && promotionState.isEnabled ? "disabledBoard" : ""
          }`}
        >
          <div className="main-board">
            {promotionState && promotionState.isEnabled && (
              <dialog className="promotion-dialog" open>
                <div className="promotion-pieces">
                  {[
                    { name: "Queen", data: "q" },
                    { name: "Knight", data: "n" },
                    { name: "Rook", data: "r" },
                    { name: "Bishop", data: "b" },
                  ].map((piece) => (
                    <button
                      key={piece.name}
                      type="button"
                      className={`promotion-piece-btn ${piece.name.toLowerCase()} ${promotionState.color || "white"}`}
                      aria-label={piece.name}
                      onClick={() => {
                        if (promotionState.callback) {
                          promotionState.callback(piece.data);
                        }
                        if (boardApiRef.current) {
                          boardApiRef.current.closePromotionDialog();
                        }
                      }}
                    />
                  ))}
                </div>
              </dialog>
            )}
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
        <DrawingLegend className="fen-editor-drawing-legend" />
      </div>

      {/* Colonne Droite - Contrôles */}
      <div className="fen-editor-controls-col">
        {/* Importer une FEN ou un PGN */}
        <div>
          <div className="fen-editor-section-title">Importer une FEN / PGN</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <textarea
              className="fen-editor-select"
              style={{ flex: 1, minHeight: "42px", maxHeight: "100px", resize: "vertical", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.4" }}
              placeholder="Collez une position FEN ou un export PGN Lichess..."
              value={importFenText}
              onChange={(e) => setImportFenText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleLoadFen();
                }
              }}
            />
            <button
              type="button"
              className="fen-editor-btn fen-editor-btn-secondary"
              style={{ padding: "8px 14px", whiteSpace: "nowrap", alignSelf: "flex-start" }}
              onClick={handleLoadFen}
            >
              Charger
            </button>
          </div>
        </div>

        <div>
          {/* Palette de pièces */}
          <div className="fen-editor-section-title">Palette de pièces</div>
          <PiecePalette
            selectedPiece={selectedPiece}
            onSelect={setSelectedPiece}
            pieceSet={pieceSet}
          />
        </div>

        {/* Options de position */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="fen-editor-section-title" style={{ marginBottom: "2px" }}>Options de position</div>

          {/* Trait aux */}
          <div className="fen-editor-option-field">
            <label className="fen-editor-checkbox-label" style={{ fontWeight: "500" }}>
              Trait au tour de
            </label>
            <select
              className="fen-editor-select"
              value={turn}
              onChange={(e) => {
                const newTurn = e.target.value;
                setTurn(newTurn);
                setOrientation(newTurn === "b" ? "black" : "white");
              }}
            >
              <option value="w">Blancs</option>
              <option value="b">Noirs</option>
            </select>
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
