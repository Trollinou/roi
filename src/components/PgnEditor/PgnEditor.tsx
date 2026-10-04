import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { BoardCore } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import DrawingLegend from '../DrawingLegend';
import { ensurePgnFenHeader, toFrenchNotation } from '../../utils/chessUtils';
import useChessBoard, { type BoardApi } from '../../hooks/useChessBoard';
import type { BoardShape, FenString, PgnString } from '../../types/chess';
import './PgnEditor.scss';

export interface VariationItem {
  index?: number;
  san?: string;
  isMainline?: boolean;
  [key: string]: unknown;
}

export interface PgnEditorRef {
  clearDomBounds: () => void;
  redrawBoard: () => void;
}

export interface PgnEditorProps {
  initialPgn?: PgnString;
  initialFen?: FenString;
  onSave?: (pgn: PgnString, finalFen: FenString) => void;
  boardConfig?: {
    pieceSet?: string;
    boardTheme?: string;
    orientation?: 'white' | 'black';
    onBoardCreated?: (api: BoardCore) => void;
    [key: string]: unknown;
  };
}

/**
 * PgnEditor - Éditeur de PGN interactif avec outils de dessin et commentaires.
 */
export const PgnEditor = forwardRef<PgnEditorRef, PgnEditorProps>(function PgnEditorComponent(
  { initialPgn = '', initialFen = '', onSave, boardConfig = {} },
  ref
) {
  const [boardApiState, setBoardApiState] = useState<BoardCore | null>(null);
  const [pgn, setPgn] = useState<string>(initialPgn);
  const [importPgnText, setImportPgnText] = useState('');
  const [currentComment, setCurrentComment] = useState('');
  const [currentShapes, setCurrentShapes] = useState<BoardShape[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [variations, setVariations] = useState<VariationItem[]>([]);
  const [plyViewing, setPlyViewing] = useState(0);
  const [totalPlies, setTotalPlies] = useState(0);
  const [copied, setCopied] = useState(false);

  const boardElRef = useRef<HTMLDivElement | null>(null);
  const currentCommentRef = useRef(currentComment);
  const currentShapesRef = useRef(currentShapes);

  useEffect(() => {
    currentCommentRef.current = currentComment;
  }, [currentComment]);

  useEffect(() => {
    currentShapesRef.current = currentShapes;
  }, [currentShapes]);

  // Synchronise les données de la position actuelle
  const syncPositionData = (api: BoardCore | BoardApi | null = boardApiRef.current) => {
    if (!api) return;
    const bCore = api as any;
    const state = typeof bCore.getState === 'function' ? bCore.getState() : {};
    const comment = typeof bCore.getCurrentComment === 'function' ? bCore.getCurrentComment() : '';
    const shapes = typeof bCore.getShapes === 'function' ? bCore.getShapes() : [];
    setCurrentComment(comment || '');
    setCurrentShapes(shapes || []);
    const rawPgn = typeof bCore.getPgn === 'function' ? bCore.getPgn() || '' : '';
    setPgn(ensurePgnFenHeader(rawPgn, initialFen));
    if (typeof bCore.getVariationsAtPly === 'function') {
      setVariations(bCore.getVariationsAtPly() || []);
    }
    const currentPly =
      state.ply !== undefined
        ? state.ply
        : typeof bCore.getCurrentPlyNumber === 'function'
        ? bCore.getCurrentPlyNumber()
        : 0;
    const historyState =
      typeof bCore.getHistoryViewerState === 'function'
        ? bCore.getHistoryViewerState()
        : {};
    setPlyViewing(
      historyState?.plyViewing !== undefined
        ? historyState.plyViewing
        : currentPly
    );
    setTotalPlies(currentPly);
  };

  const pieceSet = boardConfig.pieceSet || 'cburnett';
  const boardTheme = boardConfig.boardTheme || 'brown';

  // Initialisation et orchestration via custom hook
  const { boardApiRef } = useChessBoard<BoardApi>(
    boardElRef,
    () => {
      if (!boardElRef.current) return null;

      const config = {
        mode: 'study',
        readOnly: isReadOnly,
        pieceSet,
        boardTheme,
        ...boardConfig,
        pgn: initialPgn,
        fen: initialFen || undefined,
        orientation: boardConfig.orientation || 'white',
        movable: {
          free: false,
          color: 'both',
        },
      };

      const boardState = {
        mode: 'study' as const,
        pieceSet,
        boardTheme,
        showThreats: false,
        promotionDialogState: { isEnabled: false },
        historyViewerState: { isEnabled: false },
      };

      const handleStateChange = () => {
        syncPositionData(boardApiRef.current);
      };

      const emit = (event: string) => {
        if (event === 'move') {
          if (boardApiRef.current) {
            syncPositionData(boardApiRef.current);
          }
        }
      };

      const onBoardCreated = (api: BoardCore) => {
        if (typeof (api as any).updateStockfishConfig === 'function') {
          (api as any).updateStockfishConfig({
            workerUrl: '',
            whiteMode: 'disabled',
            blackMode: 'disabled',
          });
        }

        const pgnToLoad = ensurePgnFenHeader(initialPgn, initialFen);
        if (pgnToLoad && pgnToLoad.trim() !== '') {
          try {
            api.loadPgn(pgnToLoad);
          } catch (e) {
            console.warn('Échec du chargement du PGN initial:', e);
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
        { ...config, onBoardCreated } as any,
        {
          whiteMode: 'disabled',
          blackMode: 'disabled',
        }
      );

      if (!boardApiRef.current) {
        onBoardCreated(boardAPI);
      }

      return boardAPI as unknown as BoardApi;
    },
    []
  );

  // Exposer clearDomBounds() et redrawBoard() au composant parent via ref
  useImperativeHandle(ref, () => ({
    clearDomBounds() {
      (boardApiRef.current as any)?.clearDomBounds?.();
    },
    redrawBoard() {
      (boardApiRef.current as any)?.clearDomBounds?.();
    },
  }));

  // Met à jour et injecte les annotations dans le coup en cours
  const applyAnnotations = (
    comment = currentCommentRef.current,
    shapes = currentShapesRef.current
  ) => {
    const bApi = boardApiRef.current as any;
    if (bApi) {
      bApi.setComment?.(comment, shapes);
      bApi.setShapes?.(shapes);
      const rawPgn = bApi.getPgn?.() || '';
      setPgn(ensurePgnFenHeader(rawPgn, initialFen));
    }
  };

  // Gestion du mode Lecteur vs Éditeur
  const toggleReadOnly = () => {
    const nextReadOnly = !isReadOnly;
    setIsReadOnly(nextReadOnly);
    const bApi = boardApiRef.current as any;
    if (bApi && typeof bApi.setReadOnly === 'function') {
      bApi.setReadOnly(nextReadOnly);
      syncPositionData(boardApiRef.current);
    }
  };

  // Actions sur les variantes
  const handleSelectVariation = (idx: number) => {
    const bApi = boardApiRef.current as any;
    if (bApi && typeof bApi.selectVariation === 'function') {
      if (bApi.selectVariation(idx)) {
        syncPositionData(boardApiRef.current);
      }
    }
  };

  const handlePromoteVariation = (idx: number) => {
    const bApi = boardApiRef.current as any;
    if (bApi && typeof bApi.promoteVariation === 'function') {
      if (bApi.promoteVariation(idx)) {
        syncPositionData(boardApiRef.current);
      }
    }
  };

  const handleDeleteVariation = (idx: number) => {
    const bApi = boardApiRef.current as any;
    if (bApi && typeof bApi.deleteVariation === 'function') {
      if (bApi.deleteVariation(idx)) {
        syncPositionData(boardApiRef.current);
      }
    }
  };

  // Actions de navigation
  const handleViewStart = () => {
    const api = (boardApiRef.current || boardApiState) as any;
    if (api) {
      api.viewStart?.();
      syncPositionData(api);
    }
  };

  const handleViewPrevious = () => {
    const api = (boardApiRef.current || boardApiState) as any;
    if (api) {
      api.viewPrevious?.();
      syncPositionData(api);
    }
  };

  const handleViewNext = () => {
    const api = (boardApiRef.current || boardApiState) as any;
    if (api) {
      api.viewNext?.();
      syncPositionData(api);
    }
  };

  const handleViewEnd = () => {
    const api = (boardApiRef.current || boardApiState) as any;
    if (api) {
      api.stopViewingHistory?.();
      syncPositionData(api);
    }
  };

  // Modification du texte du commentaire
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCurrentComment(text);
    applyAnnotations(text, currentShapes);
  };

  // Validation
  const handleValidate = () => {
    const api = (boardApiRef.current || boardApiState) as any;
    if (onSave && api) {
      const rawPgn = api.getPgn?.() || '';
      const finalPgn = ensurePgnFenHeader(rawPgn, initialFen);
      let finalFen = '';
      try {
        finalFen = api.getFinalFenFromPgn?.(finalPgn) || '';
      } catch (e) {
        console.warn('Échec du calcul de la FEN finale', e);
      }
      onSave(finalPgn, finalFen);
    }
  };

  return (
    <div className="pgn-editor-container">
      {/* Bandeau de Mode */}
      <div className="pgn-mode-bar">
        <div className={`pgn-mode-badge ${isReadOnly ? 'reader' : 'editor'}`}>
          {isReadOnly ? '📖 Mode Lecteur PGN' : '✏️ Mode Éditeur PGN (Création de variantes)'}
        </div>
        <button
          type="button"
          className="pgn-mode-toggle-btn"
          onClick={toggleReadOnly}
        >
          {isReadOnly ? '✏️ Passer en Mode Éditeur' : '📖 Passer en Mode Lecteur'}
        </button>
      </div>

      <div className="pgn-editor-main-layout">
        {/* Colonne de Gauche : Échiquier & Navigation */}
        <div className="pgn-editor-left-col">
          <section className={`main-wrap piece-set-${pieceSet} board-theme-${boardTheme}`}>
            <div className="main-board">
              <div ref={boardElRef} />
            </div>
          </section>

          {/* Barre de Navigation avec Compteur */}
          <div className="pgn-navigation-bar" style={{ marginTop: '12px', position: 'relative', zIndex: 10 }}>
            <button type="button" className="pgn-nav-btn" onClick={handleViewStart} title="Début" style={{ position: 'relative', zIndex: 11, pointerEvents: 'auto' }}>|&lt;</button>
            <button type="button" className="pgn-nav-btn" onClick={handleViewPrevious} title="Précédent" style={{ position: 'relative', zIndex: 11, pointerEvents: 'auto' }}>&lt;</button>
            <span className="pgn-ply-indicator" style={{ position: 'relative', zIndex: 11 }}>Coup {plyViewing} / {totalPlies}</span>
            <button type="button" className="pgn-nav-btn" onClick={handleViewNext} title="Suivant" style={{ position: 'relative', zIndex: 11, pointerEvents: 'auto' }}>&gt;</button>
            <button type="button" className="pgn-nav-btn" onClick={handleViewEnd} title="En direct" style={{ position: 'relative', zIndex: 11, pointerEvents: 'auto' }}>&gt;|</button>
          </div>

          {/* Aide au dessin */}
          <DrawingLegend className="pgn-editor-drawing-legend" />
        </div>

        {/* Colonne de Droite : Outils d'édition */}
        <div className="pgn-editor-right-col">
          {/* Importer un PGN ou une FEN */}
          <div className="pgn-editor-section">
            <div className="pgn-editor-title">Importer un PGN / FEN</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea
                className="pgn-comment-textarea"
                style={{ height: '32px', flex: 1, padding: '6px' }}
                placeholder="Collez un PGN ou une FEN ici..."
                value={importPgnText}
                onChange={(e) => setImportPgnText(e.target.value)}
              />
              <button
                type="button"
                className="pgn-nav-btn"
                style={{ padding: '0 12px', height: '32px', fontSize: '12px' }}
                onClick={() => {
                  const api = (boardApiRef.current || boardApiState) as any;
                  if (api && importPgnText.trim()) {
                    const input = importPgnText.trim();
                    const isFen = !input.includes('[') && input.split('/').length >= 4;

                    try {
                      if (isFen) {
                        api.setPosition?.(input);
                      } else {
                        api.loadPgn?.(input);
                      }
                      syncPositionData(api);
                      setImportPgnText('');
                    } catch (err) {
                      alert('Erreur lors du chargement : ' + (err as Error).message);
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
              {pgn || 'Aucun coup joué.'}
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
                        {toFrenchNotation(v.san || '') || `Variante ${idx + 1}`}
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
            style={{ fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => {
              const api = (boardApiRef.current || boardApiState) as any;
              if (api && api.game) {
                const currentFen =
                  api.board && api.board.state && api.board.state.fen
                    ? api.board.state.fen
                    : api.game.fen();
                const copyWithFallback = () => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(currentFen);
                  }
                  const textarea = document.createElement('textarea');
                  textarea.value = currentFen;
                  textarea.style.fontSize = '12pt';
                  textarea.style.position = 'fixed';
                  textarea.style.top = '0';
                  textarea.style.left = '0';
                  textarea.style.width = '2em';
                  textarea.style.height = '2em';
                  textarea.style.padding = '0';
                  textarea.style.border = 'none';
                  textarea.style.outline = 'none';
                  textarea.style.boxShadow = 'none';
                  textarea.style.background = 'transparent';
                  document.body.appendChild(textarea);
                  textarea.focus();
                  textarea.select();
                  try {
                    document.execCommand('copy');
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
                  .catch((err) => console.error('Erreur copie FEN :', err));
              }
            }}
          >
            {copied ? '✓ FEN copiée !' : '📋 Copier la FEN actuelle'}
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
