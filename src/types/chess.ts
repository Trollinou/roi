/**
 * Types & Modèles pour le domaine des Échecs (Chess).
 */

export type Color = 'white' | 'black';
export type FileLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type RankNumber = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Square = `${FileLetter}${RankNumber}`;
export type PieceRole = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';

export type FenString = string;
export type PgnString = string;

export interface Piece {
  role: PieceRole;
  color: Color;
  promoted?: boolean;
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceRole;
  san?: string;
  captured?: Piece;
}

export interface BoardShape {
  orig: Square;
  dest?: Square;
  brush?: string;
  modifiers?: {
    lineWidth?: number;
    hilite?: boolean;
  };
}

export type Shape = BoardShape;

export interface MoveEvaluation {
  eval?: number; // Score en centipions (positif = avantage blanc)
  mate?: number; // Coups avant mat (positif = blanc mate, négatif = noir mate)
  bestMove?: string; // Coup UCI (ex: "e2e4")
  depth?: number;
  pv?: string[];
}

export interface ClockState {
  whiteTime: number; // millisecondes ou secondes
  blackTime: number;
  turn: Color;
  isRunning: boolean;
  increment: number;
}
