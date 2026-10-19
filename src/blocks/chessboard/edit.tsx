import React from 'react';
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PromotionDialog from './components/PromotionDialog';
import ChessboardInspector from './components/ChessboardInspector';
import { BoardCore } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import type { PieceRole, Color } from '../../types';

export interface ChessboardBlockAttributes {
  fen?: string;
  orientation?: Color;
  coordinates?: boolean;
  viewOnly?: boolean;
  playerColor?: 'white' | 'black' | 'both';
  showThreats?: boolean;
  useStockfish?: boolean;
  stockfishElo?: number;
  showEvaluationBar?: boolean;
  freeMode?: boolean;
  clockPreset?: string;
  showMaterialIndicator?: boolean;
  boardConfig?: Record<string, unknown>;
  reactiveConfig?: boolean;
}

interface EditProps {
  attributes: ChessboardBlockAttributes;
  setAttributes: (_attrs: Partial<ChessboardBlockAttributes>) => void;
  clientId: string;
}

export default function Edit({ attributes, setAttributes, clientId }: EditProps): React.ReactElement {
  const blockProps = useBlockProps({
    className: 'chessboard-block',
  });
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardApiRef = useRef<any>(null);
  const [selectedPiece, setSelectedPiece] = useState<{ role: PieceRole; color: Color } | 'eraser' | null>(null);

  const selectedPieceRef = useRef(selectedPiece);
  useEffect(() => {
    selectedPieceRef.current = selectedPiece;
  }, [selectedPiece]);

  // Vue reactive equivalent state
  const [boardState, setBoardState] = useState({
    mode: 'editor' as const,
    showThreats: !!attributes.showThreats,
    promotionDialogState: { isEnabled: false },
    historyViewerState: { isEnabled: false },
  });

  const boardStateRef = useRef(boardState);
  useEffect(() => {
    boardStateRef.current = boardState;
  }, [boardState]);

  // Sync state with showThreats attribute
  useEffect(() => {
    setBoardState((prev) => ({ ...prev, showThreats: !!attributes.showThreats }));
  }, [attributes.showThreats]);

  const lastFenRef = useRef(attributes.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // Initialize board once on mount
  useEffect(() => {
    if (!boardRef.current) {return;}

    // Force editor/setup mode configurations
    const boardConfig = {
      mode: 'editor' as const,
      fen: attributes.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: attributes.orientation || 'white',
      coordinates: attributes.coordinates !== false,
      viewOnly: false, // always editable in block editor
      movable: {
        free: true,
        color: 'both' as const,
      },
      draggable: {
        deleteOnDropOff: true,
      },
      events: {
        select: (key: string) => {
          if (selectedPieceRef.current && boardApiRef.current) {
            if (selectedPieceRef.current === 'eraser') {
              boardApiRef.current.removePiece(key);
            } else {
              boardApiRef.current.putPiece(
                {
                  type:
                    selectedPieceRef.current.role === 'knight'
                      ? 'n'
                      : selectedPieceRef.current.role[0],
                  color: selectedPieceRef.current.color === 'white' ? 'w' : 'b',
                },
                key
              );
            }
          }
        },
      },
      ...attributes.boardConfig,
    };

    const boardStateObj = { ...boardStateRef.current };

    const emit = (event: string, val: any) => {
      if (event === 'move') {
        lastFenRef.current = val.after;
        setAttributes({ fen: val.after });
      }
    };

    const boardAPI = new BoardCore(
      boardRef.current,
      boardStateObj,
      () => {
        if (boardApiRef.current && typeof boardApiRef.current.getState === 'function') {
          setBoardState({ ...boardApiRef.current.getState() });
        }
      },
      emit,
      boardConfig
    );
    boardApiRef.current = boardAPI;

    if (attributes.showThreats) {
      boardAPI.drawThreats();
    }

    return () => {
      boardAPI?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync orientation
  useEffect(() => {
    if (boardApiRef.current) {
      boardApiRef.current.setConfig({ orientation: attributes.orientation || 'white' });
    }
  }, [attributes.orientation]);

  // Sync coordinates
  useEffect(() => {
    if (boardApiRef.current) {
      boardApiRef.current.setConfig({ coordinates: attributes.coordinates !== false });
    }
  }, [attributes.coordinates]);

  // Sync FEN when modified externally (e.g. from Inspector controls or reset)
  useEffect(() => {
    if (boardApiRef.current && attributes.fen && attributes.fen !== lastFenRef.current) {
      lastFenRef.current = attributes.fen;
      boardApiRef.current.setPosition(attributes.fen);
    }
  }, [attributes.fen]);

  useEffect(() => {
    if (boardApiRef.current) {
      if (attributes.showThreats) {
        boardApiRef.current.drawThreats();
      } else {
        boardApiRef.current.hideMoves();
      }
    }
  }, [attributes.showThreats]);

  // FEN component helpers
  const getFenPart = (partIndex: number, defaultVal: string): string => {
    const parts = (attributes.fen || '').split(' ');
    return parts[partIndex] || defaultVal;
  };

  const setFenPart = (partIndex: number, value: string): void => {
    const parts = (
      attributes.fen ||
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    ).split(' ');
    parts[partIndex] = value;
    const newFen = parts.join(' ');
    lastFenRef.current = newFen;
    setAttributes({ fen: newFen });
    if (boardApiRef.current) {
      boardApiRef.current.setPosition(newFen);
    }
  };

  const activeColor = getFenPart(1, 'w');
  const castling = getFenPart(2, 'KQkq');

  const updateCastling = (flag: string, checked: boolean): void => {
    let current = getFenPart(2, 'KQkq');
    if (current === '-') {current = '';}
    if (checked) {
      if (!current.includes(flag)) {
        let newCastling = '';
        if (flag === 'K' || current.includes('K')) {newCastling += 'K';}
        if (flag === 'Q' || current.includes('Q')) {newCastling += 'Q';}
        if (flag === 'k' || current.includes('k')) {newCastling += 'k';}
        if (flag === 'q' || current.includes('q')) {newCastling += 'q';}
        current = newCastling || '-';
      }
    } else {
      current = current.replace(flag, '');
    }
    if (!current) {current = '-';}
    setFenPart(2, current);
  };

  const handleResetBoard = (): void => {
    const defaultFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    lastFenRef.current = defaultFen;
    setAttributes({ fen: defaultFen });
    if (boardApiRef.current) {
      boardApiRef.current.setPosition(defaultFen);
    }
  };

  const handleClearBoard = (): void => {
    const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
    lastFenRef.current = emptyFen;
    setAttributes({ fen: emptyFen });
    if (boardApiRef.current) {
      boardApiRef.current.setPosition(emptyFen);
    }
  };

  let gameMode = 'visualize';
  if (attributes.freeMode) {
    gameMode = 'freemove';
  } else if (!attributes.viewOnly) {
    gameMode = attributes.playerColor === 'both' ? '2players' : '1player';
  }

  const handleGameModeChange = (newMode: string): void => {
    if (newMode === 'freemove') {
      setAttributes({
        freeMode: true,
        viewOnly: false,
        playerColor: 'both',
        useStockfish: false,
      });
    } else if (newMode === 'visualize') {
      setAttributes({
        freeMode: false,
        viewOnly: true,
        playerColor: 'both',
        useStockfish: false,
      });
    } else if (newMode === '1player') {
      setAttributes({
        freeMode: false,
        viewOnly: false,
        playerColor: attributes.orientation || 'white',
      });
    } else if (newMode === '2players') {
      setAttributes({
        freeMode: false,
        viewOnly: false,
        playerColor: 'both',
        useStockfish: false,
      });
    }
  };

  const handleOrientationChange = (newOrientation: Color): void => {
    const updates: Partial<ChessboardBlockAttributes> = { orientation: newOrientation };
    if (gameMode === '1player') {
      updates.playerColor = newOrientation;
    }
    setAttributes(updates);
  };

  const wrapClasses = [
    'main-wrap',
    boardState.promotionDialogState.isEnabled ? 'disabledBoard' : '',
    boardState.historyViewerState.isEnabled ? 'viewingHistory' : '',
    attributes.useStockfish && attributes.showEvaluationBar
      ? 'has-evaluation-bar'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hasClock = Boolean(attributes.clockPreset && attributes.clockPreset !== 'none');
  const showMaterial = attributes.showMaterialIndicator !== false;
  const showTopBottomBars = showMaterial || hasClock;

  return (
    <div
      {...blockProps}
      onMouseDownCapture={() => {
        if (window.wp?.data?.dispatch) {
          window.wp.data.dispatch('core/block-editor')?.selectBlock?.(clientId);
        }
      }}
    >
      <ChessboardInspector
        attributes={attributes}
        setAttributes={setAttributes}
        selectedPiece={selectedPiece}
        setSelectedPiece={setSelectedPiece}
        activeColor={activeColor}
        castling={castling}
        gameMode={gameMode}
        onFenInputChange={(val: string) => {
          lastFenRef.current = val;
          setAttributes({ fen: val });
        }}
        setFenPart={setFenPart}
        updateCastling={updateCastling}
        handleClearBoard={handleClearBoard}
        handleResetBoard={handleResetBoard}
        handleOrientationChange={handleOrientationChange}
        handleGameModeChange={handleGameModeChange}
      />

      <section className={wrapClasses}>
        <div
          className={`captured-clock-top captured-bar ${showTopBottomBars ? '' : 'hidden-bar'}`}
        >
          <div
            className={`material-wrapper opponent-material ${showMaterial ? '' : 'is-hidden'}`}
          ></div>
          <div className="player-info">{__('Adversaire', 'roi')}</div>
          <span className="captured-pieces-clock-opp captured-pieces"></span>
          <div
            className={`game-clock opponent-clock ${hasClock ? '' : 'is-hidden'}`}
          >
            {hasClock ? attributes.clockPreset : '--:--'}
          </div>
        </div>

        <div className="main-board">
          {boardState.promotionDialogState.isEnabled && (
            <PromotionDialog
              state={boardState.promotionDialogState}
              onPromotionSelected={() => {
                setBoardState((prev) => ({
                  ...prev,
                  promotionDialogState: { isEnabled: false },
                }));
              }}
            />
          )}
          <div ref={boardRef}></div>
          {attributes.useStockfish && attributes.showEvaluationBar && (
            <div className="evaluation-bar">
              <div
                className={`evaluation-bar-fill ${
                  attributes.orientation === 'black' ? 'evaluation-bar-fill--flipped' : ''
                }`}
              ></div>
            </div>
          )}
        </div>

        <div
          className={`captured-clock-bottom captured-bar ${showTopBottomBars ? '' : 'hidden-bar'}`}
        >
          <div
            className={`material-wrapper player-material ${showMaterial ? '' : 'is-hidden'}`}
          ></div>
          <div className="player-info">{__('Toi', 'roi')}</div>
          <span className="captured-pieces-clock-player captured-pieces"></span>
          <div
            className={`game-clock player-clock ${hasClock ? '' : 'is-hidden'}`}
          >
            {hasClock ? attributes.clockPreset : '--:--'}
          </div>
        </div>

        {!attributes.viewOnly && (
          <>
            <div className="chess-status">
              {__('À vous de jouer', 'roi')}
            </div>
            {!attributes.freeMode && (
              <div className="chess-controls">
                <button type="button" className="control-btn new-game">
                  {__('Nouvelle partie', 'roi')}
                </button>
                <button type="button" className="control-btn flip-board">
                  {__('Retourner', 'roi')}
                </button>
                <button type="button" className="control-btn undo-move">
                  {__('Annuler', 'roi')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
