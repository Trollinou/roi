import { BoardCore } from 'eg-chessboard';
import { Chess } from 'chess.js';
import RoiFenEditor from './components/FenEditor';
import RoiPgnEditor from './components/PgnEditor';

// Patch de BoardCore.prototype.setPosition pour supporter les positions invalides ou partielles (sans rois)
const originalSetPosition = BoardCore.prototype.setPosition;
BoardCore.prototype.setPosition = function (fen) {
  let success = true;
  try {
    this.game.load(fen);
  } catch (e) {
    success = false;
  }

  if (!success) {
    // Si load() échoue, on vide le moteur et on remplit pièce par pièce (chess.js accepte clear+put sans rois)
    this.game.clear();
    const parts = fen.split(" ");
    const placement = parts[0];
    const rows = placement.split("/");
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      let fileIdx = 0;
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (isNaN(parseInt(char, 10))) {
          const isWhite = char === char.toUpperCase();
          const square = files[fileIdx] + ranks[r];
          this.game.put({ type: char.toLowerCase(), color: isWhite ? "w" : "b" }, square);
          fileIdx++;
        } else {
          fileIdx += parseInt(char, 10);
        }
      }
    }
  }

  // Appeler la méthode originale qui effectuera le rendu visuel
  originalSetPosition.call(this, fen);
};

window.RoiFenEditor = RoiFenEditor;
window.RoiPgnEditor = RoiPgnEditor;
window.EgBoardCore = BoardCore;
window.Chess = Chess;
