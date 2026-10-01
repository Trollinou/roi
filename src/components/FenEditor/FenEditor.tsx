import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { BoardCore } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import { parsePgn } from 'chessops/pgn';
import { extractShapesFromComments } from '../../utils/chessUtils';
import PiecePalette, { type SelectedPieceType } from './PiecePalette';
import DrawingLegend from '../DrawingLegend';
import useChessBoard, { type BoardApi } from '../../hooks/useChessBoard';
import type { BoardShape, Color, FenString } from '../../types/chess';
import './FenEditor.css';

export interface DiagramData {
  fen: FenString;
  orientation?: Color;
  shapes?: BoardShape[];
}

export interface FenEditorRef {
  clearDomBounds: () => void;
  redrawBoard: () => void;
  getDiagram: () => DiagramData;
  setDiagram: (newDiagram: DiagramData | string) => void;
}

export interface FenEditorSavePayload {
  fen: FenString;
  orientation: Color;
  shapes: BoardShape[];
  diagram: DiagramData;
}

export interface BoardConfigOptions {
  pieceSet?: string;
  boardTheme?: string;
  onBoardCreated?: (boardAPI: BoardCore) => void;
  [key: string]: unknown;
}

export interface FenEditorProps {
  initialFen?: string;
  fen?: string;
  orientation?: Color;
  onSave?: (payload: FenEditorSavePayload) => void;
  boardConfig?: BoardConfigOptions;
  initialShapes?: BoardShape[];
  diagram?: DiagramData;
  initialDiagram?: DiagramData;
}

/**
 * FenEditor - Éditeur de position FEN autonome pour une utilisation dans une modale.
 */
export const FenEditor = forwardRef<FenEditorRef, FenEditorProps>(function FenEditor(
  {
    initialFen,
    fen,
    orientation: propOrientation,
    onSave,
    boardConfig = {},
    initialShapes = [],
    diagram,
    initialDiagram,
  },
  ref
) {
  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const effectiveFen = diagram?.fen || initialDiagram?.fen || initialFen || fen || defaultFen;
  const effectiveShapes = diagram?.shapes || initialDiagram?.shapes || initialShapes || [];

  const parts = effectiveFen.split(' ');
  const initialPlacement = parts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const initialTurn = parts[1] || 'w';
  const initialCastling = parts[2] || 'KQkq';
  const effectiveOrientation =
    diagram?.orientation ||
    initialDiagram?.orientation ||
    propOrientation ||
    (initialTurn === 'b' ? 'black' : 'white');

  // États de la FEN
  const [position, setPosition] = useState(initialPlacement);
  const [turn, setTurn] = useState(initialTurn);
  const [castling, setCastling] = useState(initialCastling);
  const [orientation, setOrientation] = useState<Color>(effectiveOrientation as Color);
  const [importFenText, setImportFenText] = useState('');
  const [selectedPiece, setSelectedPiece] = useState<SelectedPieceType>(null);
  const [currentShapes, setCurrentShapes] = useState<BoardShape[]>(effectiveShapes);
  const [promotionState, setPromotionState] = useState<{
    isEnabled: boolean;
    color?: Color;
    callback?: (piece: string) => void;
  }>({ isEnabled: false });

  const boardElRef = useRef<HTMLDivElement | null>(null);
  const currentShapesRef = useRef<BoardShape[]>(effectiveShapes);
  const selectedPieceRef = useRef<SelectedPieceType>(selectedPiece);
  const orientationRef = useRef<Color>(orientation);
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
      const placement = (boardApiRef.current as unknown as { getPlacementFen?: () => string }).getPlacementFen?.();
      if (placement && placement !== positionRef.current) {
        positionRef.current = placement;
        setPosition(placement);
      }
    }
  };

  // Synchronisation dynamique de l'orientation sur l'échiquier selon le trait (turn)
  useEffect(() => {
    const computed: Color = turn === 'b' ? 'black' : 'white';
    setOrientation(computed);
    if (boardApiRef.current) {
      const currentOrient = (boardApiRef.current as unknown as { getOrientation?: () => Color }).getOrientation?.();
      if (currentOrient !== computed) {
        (boardApiRef.current as unknown as { setConfig?: (c: { orientation: Color }) => void }).setConfig?.({ orientation: computed });
      }
    }
  }, [turn]);

  // Gestion du clic sur une case (mode édition)
  const handleSquareClick = (square: string) => {
    if (!boardApiRef.current) return;

    const activePiece = selectedPieceRef.current;

    if (activePiece) {
      const bApi = boardApiRef.current as unknown as {
        removePiece: (sq: string) => void;
        putPiece: (p: { type: string; color: string }, sq: string) => void;
      };
      if (activePiece === 'eraser') {
        bApi.removePiece(square);
      } else {
        const type = activePiece.role === 'knight' ? 'n' : activePiece.role[0];
        const color = activePiece.color === 'white' ? 'w' : 'b';
        bApi.putPiece({ type, color }, square);
      }

      syncPositionFromBoard();
    }
  };

  // Initialisation et orchestration via custom hook
  const { boardApiRef } = useChessBoard<BoardApi>(
    boardElRef,
    () => {
      if (!boardElRef.current) return null;

      const currentFen = effectiveFen;
      const fParts = currentFen.split(' ');
      const pos = fParts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const t = fParts[1] || 'w';
      const cast = fParts[2] || 'KQkq';
      const initialOrient: Color = t === 'b' ? 'black' : 'white';

      setPosition(pos);
      setTurn(t);
      setCastling(cast);
      setOrientation(initialOrient);

      const selectedPieceSet = boardConfig.pieceSet || 'cburnett';
      const selectedBoardTheme = boardConfig.boardTheme || 'brown';

      const config = {
        mode: 'editor',
        pieceSet: selectedPieceSet,
        boardTheme: selectedBoardTheme,
        ...boardConfig,
        fen: currentFen,
        orientation: initialOrient,
        movable: {
          free: true,
          color: 'both',
        },
        draggable: {
          deleteOnDropOff: true,
        },
        drawable: {
          eraseOnClick: true,
          onChange: (shapes: BoardShape[]) => {
            setCurrentShapes(shapes);
            currentShapesRef.current = shapes;
          },
        },
        events: {
          select: (key: string) => {
            handleSquareClick(key);
          },
        },
      };

      const boardState = {
        mode: 'editor' as const,
        pieceSet: selectedPieceSet,
        boardTheme: selectedBoardTheme,
        freeMode: true,
        preserveShapesOnPositionChange: true,
        showThreats: false,
        promotionDialogState: { isEnabled: false },
        historyViewerState: { isEnabled: false },
      };

      const emit = (event: string) => {
        if (event === 'move') {
          syncPositionFromBoard();
        }
      };

      const handleStateChange = () => {
        if (boardApiRef.current) {
          const currentState = (boardApiRef.current as unknown as { getState: () => { promotionDialogState: { isEnabled: boolean } } }).getState();
          setPromotionState({ ...currentState.promotionDialogState });
          syncPositionFromBoard();
        }
      };

      const boardAPI = new BoardCore(
        boardElRef.current,
        boardState,
        handleStateChange,
        emit,
        config as any,
        {
          whiteMode: 'disabled',
          blackMode: 'disabled',
        }
      );

      boardAPI.setPieceSet(selectedPieceSet);
      boardAPI.setBoardTheme(selectedBoardTheme);

      if (typeof (boardAPI as any).setDiagram === 'function') {
        (boardAPI as any).setDiagram({ fen: currentFen, shapes: effectiveShapes });
      } else if (effectiveShapes && effectiveShapes.length > 0) {
        (boardAPI as any).setShapes(effectiveShapes);
      }

      if (boardConfig.onBoardCreated) {
        boardConfig.onBoardCreated(boardAPI);
      }

      return boardAPI as unknown as BoardApi;
    },
    []
  );

  function parsePgnOrFen(text: string): { fen: string; shapes: BoardShape[] } | null {
    if (!text || typeof text !== 'string') {
      return null;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    let parsedFen = '';
    const shapes: BoardShape[] = [];

    // 1. Extraire la FEN depuis l'en-tête [FEN "..."] si présent
    const fenMatch = trimmed.match(/\[FEN\s+"([^"]+)"\]/i);
    if (fenMatch && fenMatch[1]) {
      parsedFen = fenMatch[1].trim();
    }

    // 2. Récupérer les commentaires racine via parsePgn
    let rootComments: string[] = [];
    try {
      const games = parsePgn(trimmed);
      if (games && games.length > 0) {
        const game = games[0];
        if (game.headers && typeof game.headers.get === 'function') {
          const fenHeader = game.headers.get('FEN');
          if (fenHeader) {
            parsedFen = fenHeader.trim();
          }
        }
        if (Array.isArray(game.comments) && game.comments.length > 0) {
          rootComments = game.comments;
        }
      }
    } catch {
      const firstMoveIndex = trimmed.search(/\b\d+\s*\./);
      const initialSection =
        firstMoveIndex !== -1 ? trimmed.slice(0, firstMoveIndex) : trimmed;
      const fallbackMatches = initialSection.match(/\{([^}]*)\}/g);
      if (fallbackMatches) {
        rootComments = fallbackMatches.map((c) => c.slice(1, -1));
      }
    }

    if (rootComments.length > 0) {
      const parsed = extractShapesFromComments(rootComments.join(' '));
      shapes.push(...parsed.shapes);
    }

    // 3. Si aucune FEN n'a été trouvée dans les balises PGN
    if (!parsedFen) {
      const firstLine = trimmed.split('\n')[0].trim();
      if (firstLine.includes('/') && !firstLine.startsWith('[')) {
        parsedFen = firstLine;
      } else if (trimmed.startsWith('[') && trimmed.includes(']')) {
        parsedFen = defaultFen;
      } else {
        parsedFen = trimmed;
      }
    }

    return { fen: parsedFen, shapes };
  }

  // Exposer redrawBoard(), getDiagram() et setDiagram() au composant parent via ref
  useImperativeHandle(ref, () => ({
    clearDomBounds() {
      (boardApiRef.current as any)?.clearDomBounds?.();
    },
    redrawBoard() {
      (boardApiRef.current as any)?.clearDomBounds?.();
    },
    getDiagram(): DiagramData {
      const finalFen = `${position} ${turn} ${castling} - 0 1`;
      let shapes =
        currentShapesRef.current && Array.isArray(currentShapesRef.current)
          ? currentShapesRef.current
          : currentShapes && Array.isArray(currentShapes)
          ? currentShapes
          : [];
      if (
        (!shapes || shapes.length === 0) &&
        boardApiRef.current &&
        typeof (boardApiRef.current as any).getShapes === 'function'
      ) {
        shapes = (boardApiRef.current as any).getShapes() || [];
      }
      return {
        fen: finalFen,
        orientation: (turn === 'b' ? 'black' : 'white') as Color,
        shapes: shapes || [],
      };
    },
    setDiagram(newDiagram: DiagramData | string) {
      if (!newDiagram) return;
      const fenStr =
        typeof newDiagram === 'string'
          ? newDiagram.trim()
          : newDiagram.fen || defaultFen;
      const shapesArr =
        typeof newDiagram === 'object' && Array.isArray(newDiagram.shapes)
          ? newDiagram.shapes
          : [];
      const dParts = fenStr.split(' ');
      const pos = dParts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const t = dParts[1] || 'w';
      const cast = dParts[2] || 'KQkq';
      const computedOrient: Color = t === 'b' ? 'black' : 'white';

      setPosition(pos);
      setTurn(t);
      setCastling(cast);
      setOrientation(computedOrient);
      setCurrentShapes(shapesArr);
      currentShapesRef.current = shapesArr;

      if (boardApiRef.current) {
        const bApi = boardApiRef.current as any;
        if (typeof bApi.setDiagram === 'function') {
          bApi.setDiagram({ fen: fenStr, shapes: shapesArr });
        } else {
          bApi.setPosition?.(fenStr);
          bApi.setShapes?.(shapesArr);
        }
        bApi.setConfig?.({ orientation: computedOrient });
      }
    },
  }));

  // Chargement d'une FEN ou d'un PGN personnalisé
  const handleLoadFen = () => {
    const input = importFenText.trim();
    if (!input) return;

    try {
      const parsed = parsePgnOrFen(input);
      if (!parsed || !parsed.fen) {
        alert('Format FEN ou PGN non reconnu.');
        return;
      }

      const { fen: newFen, shapes: newShapes } = parsed;
      const lParts = newFen.split(/\s+/);
      const pos = lParts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const t = lParts[1] || 'w';
      const cast = lParts[2] || 'KQkq';
      const computedOrient: Color = t === 'b' ? 'black' : 'white';

      setPosition(pos);
      setTurn(t);
      setCastling(cast);
      setOrientation(computedOrient);
      setCurrentShapes(newShapes);
      currentShapesRef.current = newShapes;

      if (boardApiRef.current) {
        const bApi = boardApiRef.current as any;
        if (typeof bApi.setDiagram === 'function') {
          bApi.setDiagram({ fen: newFen, shapes: newShapes });
        } else {
          bApi.setPosition?.(newFen);
          bApi.setShapes?.(newShapes);
        }
        bApi.setConfig?.({ orientation: computedOrient });
      }

      syncPositionFromBoard();
      setImportFenText('');
    } catch (err) {
      alert('Erreur lors du chargement : ' + (err as Error).message);
    }
  };

  // Assemblage et sauvegarde de la FEN & du Diagramme
  const handleApply = () => {
    if (onSave) {
      const finalFen = `${position} ${turn} ${castling} - 0 1`;
      const currentOrientation: Color = turn === 'b' ? 'black' : 'white';
      let shapes =
        currentShapesRef.current && Array.isArray(currentShapesRef.current)
          ? currentShapesRef.current
          : currentShapes && Array.isArray(currentShapes)
          ? currentShapes
          : [];
      if (
        (!shapes || shapes.length === 0) &&
        boardApiRef.current &&
        typeof (boardApiRef.current as any).getShapes === 'function'
      ) {
        shapes = (boardApiRef.current as any).getShapes() || [];
      }
      const diagramObj: DiagramData = { fen: finalFen, orientation: currentOrientation, shapes };
      onSave({ fen: finalFen, orientation: currentOrientation, shapes, diagram: diagramObj });
    }
  };

  const handleClear = () => {
    const bApi = boardApiRef.current as any;
    bApi?.setPosition?.('8/8/8/8/8/8/8/8 w - - 0 1');
    bApi?.setShapes?.([]);
    setCurrentShapes([]);
    currentShapesRef.current = [];
    syncPositionFromBoard();
    setTurn('w');
    setOrientation('white');
    setCastling('-');
  };

  const handleReset = () => {
    const bApi = boardApiRef.current as any;
    bApi?.setPosition?.(defaultFen);
    bApi?.setShapes?.([]);
    setCurrentShapes([]);
    currentShapesRef.current = [];
    syncPositionFromBoard();
    setTurn('w');
    setOrientation('white');
    setCastling('KQkq');
  };

  const handleCastlingChange = (flag: string, checked: boolean) => {
    let current = castling === '-' ? '' : castling;
    if (checked) {
      if (!current.includes(flag)) {
        let next = '';
        if (flag === 'K' || current.includes('K')) next += 'K';
        if (flag === 'Q' || current.includes('Q')) next += 'Q';
        if (flag === 'k' || current.includes('k')) next += 'k';
        if (flag === 'q' || current.includes('q')) next += 'q';
        current = next || '-';
      }
    } else {
      current = current.replace(flag, '');
    }
    if (!current) current = '-';
    setCastling(current);
  };

  const pieceSet = boardConfig.pieceSet || 'cburnett';
  const boardTheme = boardConfig.boardTheme || 'brown';

  return (
    <div className="fen-editor-container">
      {/* Colonne Gauche - L'échiquier */}
      <div className="fen-editor-board-col">
        <section
          className={`main-wrap piece-set-${pieceSet} board-theme-${boardTheme} ${
            promotionState && promotionState.isEnabled ? 'disabledBoard' : ''
          }`}
        >
          <div className="main-board">
            {promotionState && promotionState.isEnabled && (
              <dialog className="promotion-dialog" open>
                <div className="promotion-pieces">
                  {[
                    { name: 'Queen', data: 'q' },
                    { name: 'Knight', data: 'n' },
                    { name: 'Rook', data: 'r' },
                    { name: 'Bishop', data: 'b' },
                  ].map((piece) => (
                    <button
                      key={piece.name}
                      type="button"
                      className={`promotion-piece-btn ${piece.name.toLowerCase()} ${promotionState.color || 'white'}`}
                      aria-label={piece.name}
                      onClick={() => {
                        if (promotionState.callback) {
                          promotionState.callback(piece.data);
                        }
                        if (boardApiRef.current) {
                          (boardApiRef.current as any).closePromotionDialog?.();
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
        <div className="fen-editor-actions" style={{ marginTop: '12px' }}>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              className="fen-editor-select"
              style={{
                flex: 1,
                minHeight: '42px',
                maxHeight: '100px',
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
              placeholder="Collez une position FEN ou un export PGN Lichess..."
              value={importFenText}
              onChange={(e) => setImportFenText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleLoadFen();
                }
              }}
            />
            <button
              type="button"
              className="fen-editor-btn fen-editor-btn-secondary"
              style={{ padding: '8px 14px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="fen-editor-section-title" style={{ marginBottom: '2px' }}>Options de position</div>

          {/* Trait aux */}
          <div className="fen-editor-option-field">
            <label className="fen-editor-checkbox-label" style={{ fontWeight: '500' }}>
              Trait au tour de
            </label>
            <select
              className="fen-editor-select"
              value={turn}
              onChange={(e) => {
                const newTurn = e.target.value;
                setTurn(newTurn);
                setOrientation(newTurn === 'b' ? 'black' : 'white');
              }}
            >
              <option value="w">Blancs</option>
              <option value="b">Noirs</option>
            </select>
          </div>

          {/* Droits de roque */}
          <div className="fen-editor-option-field">
            <label className="fen-editor-checkbox-label" style={{ fontWeight: '500' }}>
              Droits de roque
            </label>
            <div className="fen-editor-checkbox-group">
              <div className="fen-editor-checkbox-row">
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d' }}>Blancs :</span>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes('K')}
                    onChange={(e) => handleCastlingChange('K', e.target.checked)}
                  />
                  Petit (O-O)
                </label>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes('Q')}
                    onChange={(e) => handleCastlingChange('Q', e.target.checked)}
                  />
                  Grand (O-O-O)
                </label>
              </div>
              <div className="fen-editor-checkbox-row">
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d' }}>Noirs :</span>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes('k')}
                    onChange={(e) => handleCastlingChange('k', e.target.checked)}
                  />
                  Petit (o-o)
                </label>
                <label className="fen-editor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={castling.includes('q')}
                    onChange={(e) => handleCastlingChange('q', e.target.checked)}
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
          style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
        >
          Appliquer cette position
        </button>
      </div>
    </div>
  );
});

export default FenEditor;
