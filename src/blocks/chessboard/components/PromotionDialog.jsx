import React from 'react';

export default function PromotionDialog({ state, onPromotionSelected }) {
  const promotionPieces = [
    { name: 'Queen', data: 'q' },
    { name: 'Knight', data: 'n' },
    { name: 'Rook', data: 'r' },
    { name: 'Bishop', data: 'b' },
  ];

  function handleSelect(piece) {
    state.callback?.(piece.data);
    onPromotionSelected();
  }

  return (
    <dialog className="promotion-dialog" open>
      {promotionPieces.map((piece) => (
        <button
          key={piece.name}
          type="button"
          className={`${piece.name.toLowerCase()} ${state.color}`}
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
