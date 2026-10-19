import React from 'react';
import PiecePalette, { type SelectedPieceType } from './PiecePalette';
import type { Color } from '../../types/chess';

interface FenControlsPanelProps {
  importFenText: string;
  setImportFenText: (_text: string) => void;
  handleLoadFen: () => void;
  selectedPiece: SelectedPieceType;
  setSelectedPiece: (_piece: SelectedPieceType) => void;
  pieceSet: string;
  turn: string;
  onTurnChange: (_newTurn: string, _newOrientation: Color) => void;
  castling: string;
  handleCastlingChange: (_flag: string, _checked: boolean) => void;
  handleApply: () => void;
}

export default function FenControlsPanel({
  importFenText,
  setImportFenText,
  handleLoadFen,
  selectedPiece,
  setSelectedPiece,
  pieceSet,
  turn,
  onTurnChange,
  castling,
  handleCastlingChange,
  handleApply,
}: FenControlsPanelProps): React.ReactElement {
  return (
    <div className="fen-editor-controls-col">
      {/* Importer une FEN ou un PGN */}
      <div className="fen-editor-section">
        <div className="fen-editor-title">Importer une FEN / PGN</div>
        <div className="fen-import-row">
          <textarea
            className="fen-import-textarea"
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
            className="fen-import-btn"
            onClick={handleLoadFen}
          >
            Charger
          </button>
        </div>
      </div>

      {/* Palette de pièces */}
      <div className="fen-editor-section">
        <div className="fen-editor-title">Palette de pièces</div>
        <PiecePalette
          selectedPiece={selectedPiece}
          onSelect={setSelectedPiece}
          pieceSet={pieceSet}
        />
      </div>

      {/* Options de position */}
      <div className="fen-editor-section">
        <div className="fen-editor-title">Options de position</div>
        <div className="fen-editor-options-container">
          {/* Trait aux */}
          <div className="fen-editor-option-field">
            <label className="fen-editor-option-label" htmlFor="fen-editor-turn-select">
              Trait au tour de
            </label>
            <select
              id="fen-editor-turn-select"
              className="fen-editor-select"
              value={turn}
              onChange={(e) => {
                const newTurn = e.target.value;
                onTurnChange(newTurn, newTurn === 'b' ? 'black' : 'white');
              }}
            >
              <option value="w">Blancs</option>
              <option value="b">Noirs</option>
            </select>
          </div>

          {/* Droits de roque */}
          <div className="fen-editor-option-field">
            <span className="fen-editor-option-label">
              Droits de roque
            </span>
            <div className="fen-editor-checkbox-group">
              <div className="fen-editor-checkbox-row">
                <span className="fen-editor-castling-header">Blancs :</span>
                <label className="fen-editor-checkbox-label" htmlFor="fen-castling-K">
                  <input
                    id="fen-castling-K"
                    type="checkbox"
                    checked={castling.includes('K')}
                    onChange={(e) => handleCastlingChange('K', e.target.checked)}
                  />
                  Petit (O-O)
                </label>
                <label className="fen-editor-checkbox-label" htmlFor="fen-castling-Q">
                  <input
                    id="fen-castling-Q"
                    type="checkbox"
                    checked={castling.includes('Q')}
                    onChange={(e) => handleCastlingChange('Q', e.target.checked)}
                  />
                  Grand (O-O-O)
                </label>
              </div>
              <div className="fen-editor-checkbox-row">
                <span className="fen-editor-castling-header">Noirs :</span>
                <label className="fen-editor-checkbox-label" htmlFor="fen-castling-k">
                  <input
                    id="fen-castling-k"
                    type="checkbox"
                    checked={castling.includes('k')}
                    onChange={(e) => handleCastlingChange('k', e.target.checked)}
                  />
                  Petit (o-o)
                </label>
                <label className="fen-editor-checkbox-label" htmlFor="fen-castling-q">
                  <input
                    id="fen-castling-q"
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
      </div>

      {/* Bouton d'application principal */}
      <button
        type="button"
        className="fen-editor-apply-btn"
        onClick={handleApply}
      >
        Appliquer cette position
      </button>
    </div>
  );
}

