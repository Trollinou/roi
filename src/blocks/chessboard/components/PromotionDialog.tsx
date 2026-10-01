import React from 'react';
import type { Color } from '../../../types/chess';

export interface PromotionState {
  isEnabled?: boolean;
  color?: Color | string;
  callback?: (piece: string) => void;
  [key: string]: unknown;
}

export interface PromotionDialogProps {
  state: PromotionState;
  onPromotionSelected: () => void;
}

export default function PromotionDialog({
  state,
  onPromotionSelected,
}: PromotionDialogProps): React.JSX.Element {
  const promotionPieces = [
    { name: 'Queen', data: 'q' },
    { name: 'Knight', data: 'n' },
    { name: 'Rook', data: 'r' },
    { name: 'Bishop', data: 'b' },
  ];

  function handleSelect(piece: { name: string; data: string }): void {
    state.callback?.(piece.data);
    onPromotionSelected();
  }

  return (
    <dialog className="promotion-dialog" open>
      {promotionPieces.map((piece) => (
        <button
          key={piece.name}
          type="button"
          className={`${piece.name.toLowerCase()} ${state.color || 'white'}`}
          aria-label={piece.name}
          onClick={() => handleSelect(piece)}
          onTouchStart={(e) => {
            e.preventDefault();
            handleSelect(piece);
          }}
        />
      ))}
    </dialog>
  );
}
