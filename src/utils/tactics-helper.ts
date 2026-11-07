/**
 * Utilitaires pour l'analyse tactique et l'affichage des glyphes visuels ROI.
 */

import { Chess, makeSquare, between, opposite } from 'chessops';
import { parseFen } from 'chessops/fen';
import type { BoardCore, TacticalGlyph, BoardGlyph } from 'eg-chessboard';
export type { AssessmentGlyph, TacticalGlyph, BoardGlyph } from 'eg-chessboard';

export interface TacticalDetectionOptions {
  showPinned?: boolean;
  showUndefended?: boolean;
  showTrapped?: boolean;
  showCheckable?: boolean;
}

/**
 * Analyse une position FEN et détecte les motifs tactiques pour les badges visuels :
 * - 'pin' : pièce clouée devant le Roi
 * - 'trapped' : pièce attaquée sans aucune case de fuite légale
 * - 'undefended' : pièce attaquée sans aucune pièce amie pour la protéger
 * - 'checkable' : case de destination d'un coup légal donnant échec
 */
export function detectTacticalGlyphs(
  fenStr: string,
  options: TacticalDetectionOptions = {}
): Map<string, TacticalGlyph> {
  const {
    showPinned = true,
    showUndefended = true,
    showTrapped = true,
    showCheckable = true,
  } = options;

  const glyphs = new Map<string, TacticalGlyph>();
  const parsed = parseFen(fenStr);
  if (!parsed.isOk) {
    return glyphs;
  }

  const pos = Chess.fromSetup(parsed.unwrap()).unwrap();
  const turn = pos.turn;
  const oppColor = opposite(turn);
  const occupied = pos.board.occupied;
  const turnSquares = pos.board[turn];

  // 1. Cases donnant échec (Checkable)
  if (showCheckable) {
    for (const [fromSq, dests] of pos.allDests()) {
      for (const toSq of dests) {
        const clone = pos.clone();
        clone.play({ from: fromSq, to: toSq });
        if (clone.isCheck()) {
          glyphs.set(makeSquare(toSq), 'checkable');
        }
      }
    }
  }

  // 2. Clouages (Pins)
  if (showPinned) {
    const kingSq = pos.board.kingOf(turn);
    if (kingSq !== undefined) {
      const oppSliders = pos.board
        .rooksAndQueens()
        .union(pos.board.bishopsAndQueens())
        .intersect(pos.board[oppColor]);

      for (const sliderSq of oppSliders) {
        const b = between(sliderSq, kingSq);
        if (b.nonEmpty()) {
          const piecesBetween = b.intersect(occupied);
          if (piecesBetween.size() === 1) {
            const pinnedSq = [...piecesBetween][0];
            if (turnSquares.has(pinnedSq)) {
              glyphs.set(makeSquare(pinnedSq), 'pin');
            }
          }
        }
      }
    }
  }

  // 3. Pièces piégées (Trapped) & non protégées (Undefended)
  for (const sq of turnSquares) {
    const role = pos.board.getRole(sq);
    if (role === 'king') {
      continue;
    }
    const sqName = makeSquare(sq);

    const attackers = pos.kingAttackers(sq, oppColor, occupied);
    if (attackers.nonEmpty()) {
      const dests = pos.dests(sq);
      const defenders = pos.kingAttackers(sq, turn, occupied.without(sq));

      if (showTrapped && dests.isEmpty() && role !== 'pawn') {
        if (!glyphs.has(sqName)) {
          glyphs.set(sqName, 'trapped');
        }
      } else if (showUndefended && defenders.isEmpty()) {
        if (!glyphs.has(sqName)) {
          glyphs.set(sqName, 'undefended');
        }
      }
    }
  }

  return glyphs;
}

/**
 * Applique une liste ou un dictionnaire de glyphes sur un échiquier.
 */
export function applyTacticalGlyphs(
  boardApi: BoardCore,
  glyphs: Map<string, BoardGlyph | null> | Record<string, BoardGlyph | null>
): void {
  if (glyphs instanceof Map) {
    glyphs.forEach((glyph, square) => {
      boardApi.setGlyph(square, glyph);
    });
  } else {
    Object.entries(glyphs).forEach(([square, glyph]) => {
      boardApi.setGlyph(square, glyph);
    });
  }
}

/**
 * Supprime tous les glyphes tactiques / visuels d'un échiquier.
 */
export function clearTacticalGlyphs(boardApi: BoardCore): void {
  boardApi.clearGlyphs();
}

/**
 * Assigne un glyphe d'évaluation ou tactique sur une case spécifique.
 */
export function setSquareGlyph(
  boardApi: BoardCore,
  square: string,
  glyph: BoardGlyph | null
): void {
  boardApi.setGlyph(square, glyph);
}
