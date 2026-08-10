import React from "react";

/**
 * PiecePalette - Sous-composant affichant la palette de pièces sélectionnables et la gomme.
 *
 * @param {Object} props
 * @param {Object|string|null} props.selectedPiece - Pièce sélectionnée ({ role, color }) ou "eraser" ou null
 * @param {Function} props.onSelect - Callback appelé lors de la sélection d'une pièce ou de la gomme : onSelect(piece)
 */
export function PiecePalette({ selectedPiece, onSelect }) {
  const roles = ["pawn", "knight", "bishop", "rook", "queen", "king"];

  const renderPalettePiece = (role, color) => {
    const isActive =
      selectedPiece &&
      typeof selectedPiece === "object" &&
      selectedPiece.role === role &&
      selectedPiece.color === color;

    return (
      <button
        key={`${role}-${color}`}
        type="button"
        className={`editor-palette-piece ${isActive ? "active" : ""}`}
        onClick={() => {
          if (isActive) {
            onSelect(null);
          } else {
            onSelect({ role, color });
          }
        }}
        title={`Placer ${color === "white" ? "un pion/pièce blanc" : "un pion/pièce noir"}`}
      >
        <cg-board
          className="editor-palette-board"
          style={{ backgroundImage: "none" }}
        >
          <piece className={`${role} ${color} piece-inner`} />
        </cg-board>
      </button>
    );
  };

  return (
    <div className="fen-editor-palette-group">
      <div className="fen-editor-palette-row">
        {roles.map((role) => renderPalettePiece(role, "white"))}
      </div>
      <div className="fen-editor-palette-row">
        {roles.map((role) => renderPalettePiece(role, "black"))}
      </div>
      <button
        type="button"
        className={`editor-palette-eraser ${selectedPiece === "eraser" ? "active" : ""}`}
        onClick={() => {
          onSelect(selectedPiece === "eraser" ? null : "eraser");
        }}
      >
        🗑️ Gomme (Effacer)
      </button>
    </div>
  );
}

export default PiecePalette;
