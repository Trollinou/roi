import React from 'react';
import { InspectorControls } from '@wordpress/block-editor';
import {
  PanelBody,
  TextControl,
  ToggleControl,
  SelectControl,
  Button,
  RangeControl,
  CheckboxControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { PieceRole, Color } from '../../../types';
import type { ChessboardBlockAttributes } from '../edit';

interface ChessboardInspectorProps {
  attributes: ChessboardBlockAttributes;
  setAttributes: (_attrs: Partial<ChessboardBlockAttributes>) => void;
  selectedPiece: { role: PieceRole; color: Color } | 'eraser' | null;
  setSelectedPiece: (_piece: { role: PieceRole; color: Color } | 'eraser' | null) => void;
  activeColor: string;
  castling: string;
  gameMode: string;
  onFenInputChange: (_val: string) => void;
  setFenPart: (_partIndex: number, _value: string) => void;
  updateCastling: (_flag: string, _checked: boolean) => void;
  handleClearBoard: () => void;
  handleResetBoard: () => void;
  handleOrientationChange: (_newOrientation: Color) => void;
  handleGameModeChange: (_newMode: string) => void;
}

const ROLES: PieceRole[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export default function ChessboardInspector({
  attributes,
  setAttributes,
  selectedPiece,
  setSelectedPiece,
  activeColor,
  castling,
  gameMode,
  onFenInputChange,
  setFenPart,
  updateCastling,
  handleClearBoard,
  handleResetBoard,
  handleOrientationChange,
  handleGameModeChange,
}: ChessboardInspectorProps): React.ReactElement {
  const renderPalettePiece = (role: PieceRole, color: Color): React.ReactElement => {
    const isActive =
      selectedPiece &&
      typeof selectedPiece === 'object' &&
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
        <cg-board className="editor-palette-board">
          <piece className={`${role} ${color} piece-inner`} />
        </cg-board>
      </button>
    );
  };

  const renderEraser = (withLabel = false): React.ReactElement => {
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

  return (
    <InspectorControls>
      <div className="roi-inspector-fen-header">
        <span className="roi-inspector-label">
          {__('Position FEN', 'roi')}
        </span>
        <TextControl
          __next40pxDefaultSize
          value={attributes.fen || ''}
          onChange={onFenInputChange}
        />
      </div>

      <PanelBody title={__('Configuration', 'roi')} initialOpen={false}>
        <div className="roi-inspector-field">
          <span className="roi-inspector-label">
            {__('Charger une position', 'roi')}
          </span>
          <div className="roi-inspector-btn-row">
            <Button
              isDestructive
              isSecondary
              onClick={handleClearBoard}
              className="roi-inspector-flex-btn"
            >
              {__('Échiquier vide', 'roi')}
            </Button>
            <Button
              isSecondary
              onClick={handleResetBoard}
              className="roi-inspector-flex-btn"
            >
              {__('Position initiale', 'roi')}
            </Button>
          </div>
        </div>

        <div className="roi-inspector-field">
          <span className="roi-inspector-label">
            {__('Palette de pièces', 'roi')}
          </span>
          <div className="editor-palette-container editor-palette-container--sidebar">
            <div className="editor-palette-grid-sidebar">
              <div className="editor-palette-row-sidebar">
                {ROLES.map((role) => renderPalettePiece(role, 'white'))}
              </div>
              <div className="editor-palette-row-sidebar">
                {ROLES.map((role) => renderPalettePiece(role, 'black'))}
              </div>
              <div className="editor-palette-row-eraser">
                {renderEraser(true)}
              </div>
            </div>
          </div>
        </div>

        <div className="roi-inspector-field">
          <span className="roi-inspector-label">
            {__('Traits aux', 'roi')}
          </span>
          <SelectControl
            __next40pxDefaultSize
            value={activeColor}
            options={[
              { label: __('Blanc', 'roi'), value: 'w' },
              { label: __('Noir', 'roi'), value: 'b' },
            ]}
            onChange={(val: string) => setFenPart(1, val)}
          />
        </div>

        <div className="roi-inspector-field--compact">
          <span className="roi-inspector-label">
            {__('Roques', 'roi')}
          </span>
          <table className="roi-inspector-castling-table">
            <tbody>
              <tr>
                <td className="roi-inspector-castling-label-cell">
                  <span className="roi-inspector-castling-side">
                    {__('Blanc :', 'roi')}
                  </span>
                </td>
                <td className="roi-inspector-castling-check-cell">
                  <CheckboxControl
                    label="O-O"
                    checked={castling.includes('K')}
                    onChange={(val: boolean) => updateCastling('K', val)}
                  />
                </td>
                <td className="roi-inspector-castling-cell">
                  <CheckboxControl
                    label="O-O-O"
                    checked={castling.includes('Q')}
                    onChange={(val: boolean) => updateCastling('Q', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="roi-inspector-castling-cell">
                  <span className="roi-inspector-castling-side">
                    {__('Noir :', 'roi')}
                  </span>
                </td>
                <td className="roi-inspector-castling-cell">
                  <CheckboxControl
                    label="O-O"
                    checked={castling.includes('k')}
                    onChange={(val: boolean) => updateCastling('k', val)}
                  />
                </td>
                <td className="roi-inspector-castling-cell">
                  <CheckboxControl
                    label="O-O-O"
                    checked={castling.includes('q')}
                    onChange={(val: boolean) => updateCastling('q', val)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PanelBody>

      <PanelBody title={__("Style de l'échiquier", 'roi')} initialOpen={true}>
        <ToggleControl
          label={__('Afficher les coordonnées', 'roi')}
          checked={attributes.coordinates !== false}
          onChange={(val: boolean) => setAttributes({ coordinates: val })}
        />
        <ToggleControl
          label={__('Afficher les menaces', 'roi')}
          checked={!!attributes.showThreats}
          onChange={(val: boolean) => setAttributes({ showThreats: val })}
        />
        <ToggleControl
          label={__('Indicateur matériel', 'roi')}
          checked={attributes.showMaterialIndicator !== false}
          onChange={(val: boolean) => setAttributes({ showMaterialIndicator: val })}
        />
      </PanelBody>

      <PanelBody title={__('Mode de jeu', 'roi')} initialOpen={true}>
        <SelectControl
          __next40pxDefaultSize
          label={__('Orientation', 'roi')}
          value={attributes.orientation || 'white'}
          options={[
            { label: __('Blanc', 'roi'), value: 'white' },
            { label: __('Noir', 'roi'), value: 'black' },
          ]}
          onChange={(val: string) => handleOrientationChange(val as Color)}
        />
        <SelectControl
          __next40pxDefaultSize
          label={__('Mode de jeu (Mode visualisation)', 'roi')}
          value={gameMode}
          options={[
            { label: __('Visualiser', 'roi'), value: 'visualize' },
            { label: __('1 Joueur', 'roi'), value: '1player' },
            { label: __('2 Joueurs', 'roi'), value: '2players' },
            { label: __('Mode libre', 'roi'), value: 'freemove' },
          ]}
          onChange={handleGameModeChange}
        />
        {gameMode === '1player' && (
          <>
            <ToggleControl
              label={__('Activer Stockfish', 'roi')}
              checked={!!attributes.useStockfish}
              onChange={(val: boolean) => setAttributes({ useStockfish: val })}
            />
            {attributes.useStockfish && (
              <>
                <RangeControl
                  __next40pxDefaultSize
                  label={__('Niveau de difficulté (ELO)', 'roi')}
                  value={attributes.stockfishElo || 1500}
                  onChange={(val?: number) => setAttributes({ stockfishElo: val ?? 1500 })}
                  min={1320}
                  max={3190}
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
                  onChange={(val: string) => setAttributes({ clockPreset: val })}
                />
                <ToggleControl
                  label={__("Afficher la barre d'évaluation", 'roi')}
                  checked={!!attributes.showEvaluationBar}
                  onChange={(val: boolean) =>
                    setAttributes({ showEvaluationBar: val })
                  }
                />
              </>
            )}
          </>
        )}
      </PanelBody>
    </InspectorControls>
  );
}

