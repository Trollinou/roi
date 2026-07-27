import React from 'react';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
  PanelBody,
  TextControl,
  ToggleControl,
  SelectControl,
  Button,
  RangeControl,
  CheckboxControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PromotionDialog from './components/PromotionDialog';
import { BoardCore } from 'eg-chessboard';

export default function Edit({ attributes, setAttributes, clientId }) {
  const blockProps = useBlockProps({
    className: 'chessboard-block',
  });
  const boardRef = useRef(null);
  const boardApiRef = useRef(null);
  const [selectedPiece, setSelectedPiece] = useState(null); // { role, color } or 'eraser' or null

  const selectedPieceRef = useRef(selectedPiece);
  useEffect(() => {
    selectedPieceRef.current = selectedPiece;
  }, [selectedPiece]);

  // Vue reactive equivalent state
  const [boardState, setBoardState] = useState({
    showThreats: attributes.showThreats,
    promotionDialogState: { isEnabled: false },
    historyViewerState: { isEnabled: false },
  });

  const boardStateRef = useRef(boardState);
  useEffect(() => {
    boardStateRef.current = boardState;
  }, [boardState]);

  // Sync state with showThreats attribute
  useEffect(() => {
    setBoardState((prev) => ({ ...prev, showThreats: attributes.showThreats }));
  }, [attributes.showThreats]);

  const lastFenRef = useRef(attributes.fen);

  // Initialize board once on mount
  useEffect(() => {
    if (!boardRef.current) return;

    // Force editor/setup mode configurations
    const boardConfig = {
      fen: attributes.fen,
      orientation: attributes.orientation,
      coordinates: attributes.coordinates,
      viewOnly: false, // always editable in block editor
      movable: {
        free: true,
        color: 'both',
      },
      draggable: {
        deleteOnDropOff: true,
      },
      events: {
        select: (key) => {
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

    const mockProps = {
      boardConfig,
      playerColor: attributes.playerColor,
      reactiveConfig: attributes.reactiveConfig,
    };

    const boardStateProxy = new Proxy(boardStateRef.current, {
      set(target, prop, value) {
        target[prop] = value;
        setBoardState({ ...target });
        return true;
      },
    });

    const emit = (event, val) => {
      if (event === 'move') {
        lastFenRef.current = val.after;
        setAttributes({ fen: val.after });
      }
    };

    const boardAPI = new BoardCore(
      boardRef.current,
      boardStateProxy,
      () => {
        setBoardState({ ...boardStateProxy });
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
  }, []);

  // Sync orientation
  useEffect(() => {
    if (boardApiRef.current) {
      boardApiRef.current.setConfig({ orientation: attributes.orientation });
    }
  }, [attributes.orientation]);

  // Sync coordinates
  useEffect(() => {
    if (boardApiRef.current) {
      boardApiRef.current.setConfig({ coordinates: attributes.coordinates });
    }
  }, [attributes.coordinates]);

  // Sync FEN when modified externally (e.g. from Inspector controls or reset)
  useEffect(() => {
    if (boardApiRef.current && attributes.fen !== lastFenRef.current) {
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
  const getFenPart = (partIndex, defaultVal) => {
    const parts = (attributes.fen || '').split(' ');
    return parts[partIndex] || defaultVal;
  };

  const setFenPart = (partIndex, value) => {
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

  const updateCastling = (flag, checked) => {
    let current = getFenPart(2, 'KQkq');
    if (current === '-') current = '';
    if (checked) {
      if (!current.includes(flag)) {
        let newCastling = '';
        if (flag === 'K' || current.includes('K')) newCastling += 'K';
        if (flag === 'Q' || current.includes('Q')) newCastling += 'Q';
        if (flag === 'k' || current.includes('k')) newCastling += 'k';
        if (flag === 'q' || current.includes('q')) newCastling += 'q';
        current = newCastling || '-';
      }
    } else {
      current = current.replace(flag, '');
    }
    if (!current) current = '-';
    setFenPart(2, current);
  };

  const handleResetBoard = () => {
    const defaultFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    lastFenRef.current = defaultFen;
    setAttributes({ fen: defaultFen });
    if (boardApiRef.current) {
      boardApiRef.current.setPosition(defaultFen);
    }
  };

  const handleClearBoard = () => {
    const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
    lastFenRef.current = emptyFen;
    setAttributes({ fen: emptyFen });
    if (boardApiRef.current) {
      boardApiRef.current.setPosition(emptyFen);
    }
  };

  const gameMode = attributes.freeMode
    ? 'freemove'
    : !attributes.viewOnly
    ? attributes.playerColor === 'both'
      ? '2players'
      : '1player'
    : 'visualize';

  const handleGameModeChange = (newMode) => {
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
        playerColor: attributes.orientation,
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

  const handleOrientationChange = (newOrientation) => {
    const updates = { orientation: newOrientation };
    if (gameMode === '1player') {
      updates.playerColor = newOrientation;
    }
    setAttributes(updates);
  };

  const roles = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

  const renderPalettePiece = (role, color) => {
    const isActive =
      selectedPiece &&
      selectedPiece.role === role &&
      selectedPiece.color === color;
    return (
      <button
        key={`${role}-${color}`}
        type="button"
        className={`editor-palette-piece ${isActive ? 'active' : ''}`}
        onClick={() => {
          if (isActive) {
            setSelectedPiece(null);
          } else {
            setSelectedPiece({ role, color });
          }
        }}
        title={`Place ${color} ${role}`}
      >
        <cg-board
          className="editor-palette-board"
          style={{ backgroundImage: 'none' }}
        >
          <piece className={`${role} ${color} piece-inner`} />
        </cg-board>
      </button>
    );
  };

  const renderEraser = (withLabel = false) => {
    const isActive = selectedPiece === 'eraser';
    return (
      <button
        type="button"
        className={`editor-palette-eraser ${isActive ? 'active' : ''}`}
        onClick={() => {
          if (isActive) {
            setSelectedPiece(null);
          } else {
            setSelectedPiece('eraser');
          }
        }}
        title="Remove piece on click"
      >
        🗑️ {withLabel && 'Gomme (Effacer une pièce)'}
      </button>
    );
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

  const showTopBottomBars = (attributes.showMaterialIndicator !== false) || (attributes.clockPreset && attributes.clockPreset !== 'none');

  return (
    <div
      {...blockProps}
      onMouseDownCapture={() => {
        if (window.wp?.data?.dispatch) {
          window.wp.data.dispatch('core/block-editor').selectBlock(clientId);
        }
      }}
    >
      <InspectorControls>
        <div style={{ padding: '8px 16px 16px 16px' }}>
          <span
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
            }}
          >
            {__('Position FEN', 'roi')}
          </span>
          <TextControl
            __next40pxDefaultSize
            value={attributes.fen}
            onChange={(val) => {
              lastFenRef.current = val;
              setAttributes({ fen: val });
            }}
          />
        </div>

        <PanelBody
          title={__('Configuration', 'roi')}
          initialOpen={false}
        >
          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              {__('Charger une position', 'roi')}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                isDestructive
                isSecondary
                onClick={handleClearBoard}
                style={{ flex: 1 }}
              >
                {__('Échiquier vide', 'roi')}
              </Button>
              <Button
                isSecondary
                onClick={handleResetBoard}
                style={{ flex: 1 }}
              >
                {__('Position initiale', 'roi')}
              </Button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              {__('Palette de pièces', 'roi')}
            </span>
            <div
              className="editor-palette-container"
              style={{
                marginTop: 0,
                padding: 0,
                border: 'none',
                background: 'none',
              }}
            >
              <div className="editor-palette-grid-sidebar">
                <div className="editor-palette-row-sidebar">
                  {roles.map((role) => renderPalettePiece(role, 'white'))}
                </div>
                <div className="editor-palette-row-sidebar">
                  {roles.map((role) => renderPalettePiece(role, 'black'))}
                </div>
                <div className="editor-palette-row-eraser">
                  {renderEraser(true)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              {__('Traits aux', 'roi')}
            </span>
            <SelectControl
              __next40pxDefaultSize
              value={activeColor}
              options={[
                { label: __('Blanc', 'roi'), value: 'w' },
                { label: __('Noir', 'roi'), value: 'b' },
              ]}
              onChange={(val) => setFenPart(1, val)}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              {__('Roques', 'roi')}
            </span>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: 'none',
                marginTop: '8px',
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      width: '70px',
                      padding: '2px 0',
                      verticalAlign: 'middle',
                      border: 'none',
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>
                      {__('Blanc :', 'roi')}
                    </span>
                  </td>
                  <td
                    style={{
                      width: '90px',
                      padding: '2px 0',
                      verticalAlign: 'middle',
                      border: 'none',
                    }}
                  >
                    <CheckboxControl
                      label="O-O"
                      checked={castling.includes('K')}
                      onChange={(val) => updateCastling('K', val)}
                    />
                  </td>
                  <td
                    style={{
                      padding: '2px 0',
                      verticalAlign: 'middle',
                      border: 'none',
                    }}
                  >
                    <CheckboxControl
                      label="O-O-O"
                      checked={castling.includes('Q')}
                      onChange={(val) => updateCastling('Q', val)}
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: '2px 0',
                      verticalAlign: 'middle',
                      border: 'none',
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>
                      {__('Noir :', 'roi')}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '2px 0',
                      verticalAlign: 'middle',
                      border: 'none',
                    }}
                  >
                    <CheckboxControl
                      label="O-O"
                      checked={castling.includes('k')}
                      onChange={(val) => updateCastling('k', val)}
                    />
                  </td>
                  <td
                    style={{
                      padding: '2px 0',
                      verticalAlign: 'middle',
                      border: 'none',
                    }}
                  >
                    <CheckboxControl
                      label="O-O-O"
                      checked={castling.includes('q')}
                      onChange={(val) => updateCastling('q', val)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </PanelBody>

        <PanelBody
          title={__("Style de l'échiquier", 'roi')}
          initialOpen={true}
        >
          <ToggleControl
            label={__('Afficher les coordonnées', 'roi')}
            checked={attributes.coordinates}
            onChange={(val) => setAttributes({ coordinates: val })}
          />
          <ToggleControl
            label={__('Afficher les menaces', 'roi')}
            checked={attributes.showThreats}
            onChange={(val) => setAttributes({ showThreats: val })}
          />
          <ToggleControl
            label={__('Indicateur matériel', 'roi')}
            checked={attributes.showMaterialIndicator !== false}
            onChange={(val) => setAttributes({ showMaterialIndicator: val })}
          />
        </PanelBody>

        <PanelBody
          title={__('Mode de jeu', 'roi')}
          initialOpen={true}
        >
          <SelectControl
            __next40pxDefaultSize
            label={__('Orientation', 'roi')}
            value={attributes.orientation}
            options={[
              { label: __('Blanc', 'roi'), value: 'white' },
              { label: __('Noir', 'roi'), value: 'black' },
            ]}
            onChange={handleOrientationChange}
          />
          <SelectControl
            __next40pxDefaultSize
            label={__(
              'Mode de jeu (Mode visualisation)',
              'roi'
            )}
            value={gameMode}
            options={[
              {
                label: __('Visualiser', 'roi'),
                value: 'visualize',
              },
              {
                label: __('1 Joueur', 'roi'),
                value: '1player',
              },
              {
                label: __('2 Joueurs', 'roi'),
                value: '2players',
              },
              {
                label: __('Mode libre', 'roi'),
                value: 'freemove',
              },
            ]}
            onChange={handleGameModeChange}
          />
          {gameMode === '1player' && (
            <>
              <ToggleControl
                label={__('Activer Stockfish', 'roi')}
                checked={attributes.useStockfish}
                onChange={(val) => setAttributes({ useStockfish: val })}
              />
              {attributes.useStockfish && (
                <>
                  <RangeControl
                    __next40pxDefaultSize
                    label={__(
                      'Niveau de difficulté (ELO)',
                      'roi'
                    )}
                    value={attributes.stockfishElo}
                    onChange={(val) => setAttributes({ stockfishElo: val })}
                    min={1320}
                    max={2800}
                    step={10}
                  />
                  <SelectControl
                    __next40pxDefaultSize
                    label={__('Cadence (Pendule)', 'roi')}
                    value={attributes.clockPreset || 'none'}
                    options={[
                      { label: __('Sans pendule', 'roi'), value: 'none' },
                      { label: __('1 min (Bullet)', 'roi'), value: '1+0' },
                      { label: __('3 min + 2 s (Blitz)', 'roi'), value: '3+2' },
                      { label: __('5 min KO (Blitz)', 'roi'), value: '5+0' },
                      { label: __('10 min + 5 s (Rapide)', 'roi'), value: '10+5' },
                      { label: __('15 min + 10 s (Rapide)', 'roi'), value: '15+10' },
                    ]}
                    onChange={(val) => setAttributes({ clockPreset: val })}
                  />
                  <ToggleControl
                    label={__(
                      "Afficher la barre d'évaluation",
                      'roi'
                    )}
                    checked={attributes.showEvaluationBar}
                    onChange={(val) =>
                      setAttributes({ showEvaluationBar: val })
                    }
                  />
                </>
              )}
            </>
          )}
        </PanelBody>
      </InspectorControls>

      <section className={wrapClasses}>
        <div
          className="captured-clock-top captured-bar"
          style={{ display: showTopBottomBars ? 'flex' : 'none' }}
        >
          <div
            className="material-wrapper opponent-material"
            style={{ display: attributes.showMaterialIndicator !== false ? 'block' : 'none' }}
          ></div>
          <div className="player-info">{__('Adversaire', 'roi')}</div>
          <span className="captured-pieces-clock-opp captured-pieces"></span>
          <div
            className="game-clock opponent-clock"
            style={{
              display:
                attributes.clockPreset && attributes.clockPreset !== 'none'
                  ? 'block'
                  : 'none',
            }}
          >
            {attributes.clockPreset && attributes.clockPreset !== 'none' ? attributes.clockPreset : '--:--'}
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
                className="evaluation-bar-fill"
                style={{
                  marginTop: attributes.orientation === 'white' ? 'auto' : '0',
                  marginBottom:
                    attributes.orientation === 'white' ? '0' : 'auto',
                }}
              ></div>
            </div>
          )}
        </div>

        <div
          className="captured-clock-bottom captured-bar"
          style={{ display: showTopBottomBars ? 'flex' : 'none' }}
        >
          <div
            className="material-wrapper player-material"
            style={{ display: attributes.showMaterialIndicator !== false ? 'block' : 'none' }}
          ></div>
          <div className="player-info">{__('Toi', 'roi')}</div>
          <span className="captured-pieces-clock-player captured-pieces"></span>
          <div
            className="game-clock player-clock"
            style={{
              display:
                attributes.clockPreset && attributes.clockPreset !== 'none'
                  ? 'block'
                  : 'none',
            }}
          >
            {attributes.clockPreset && attributes.clockPreset !== 'none' ? attributes.clockPreset : '--:--'}
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
