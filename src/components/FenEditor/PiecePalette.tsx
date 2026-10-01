import React from 'react';
import type { Color, PieceRole } from '../../types/chess';

export interface PalettePieceItem {
  role: PieceRole;
  color: Color;
}

export type SelectedPieceType = PalettePieceItem | 'eraser' | null;

export interface PiecePaletteProps {
  selectedPiece: SelectedPieceType;
  onSelect: (piece: SelectedPieceType) => void;
  pieceSet?: string;
}

/**
 * PiecePalette - Sous-composant affichant la palette de pièces sélectionnables et la gomme.
 */
export function PiecePalette({
  selectedPiece,
  onSelect,
  pieceSet = 'cburnett',
}: PiecePaletteProps): React.JSX.Element {
  const roles: PieceRole[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

  const renderPalettePiece = (role: PieceRole, color: Color) => {
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
            onSelect(null);
          } else {
            onSelect({ role, color });
          }
        }}
        title={`Placer ${color === 'white' ? 'un pion/pièce blanc' : 'un pion/pièce noir'}`}
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

  return (
    <div className={`fen-editor-palette-group piece-set-${pieceSet}`}>
      <div className="fen-editor-palette-row">
        {roles.map((role) => renderPalettePiece(role, 'white'))}
      </div>
      <div className="fen-editor-palette-row">
        {roles.map((role) => renderPalettePiece(role, 'black'))}
      </div>
      <button
        type="button"
        className={`editor-palette-eraser ${selectedPiece === 'eraser' ? 'active' : ''}`}
        onClick={() => {
          onSelect(selectedPiece === 'eraser' ? null : 'eraser');
        }}
      >
        🗑️ Gomme (Effacer)
      </button>
    </div>
  );
}

export default PiecePalette;
