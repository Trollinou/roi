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

export type StockfishMode = 'disabled' | 'hint' | 'bot' | 'elo';

export interface StockfishSearchLimit {
  movetime?: number;
  depth?: number;
  nodes?: number;
}

export interface StockfishConfig {
  workerUrl: string; // ex: '/stockfish.js'
  wasmUrl?: string; // ex: '/stockfish.wasm'
  whiteMode?: StockfishMode;
  whiteElo?: number; // 1320 à 3190
  blackMode?: StockfishMode;
  blackElo?: number; // 1320 à 3190
  stockfishMoveTime?: number; // Temps de réflexion en ms pour le bot (défaut: 1000)
  multiPv?: number; // Nombre de variantes (défaut: 1)
  showWdl?: boolean; // Probabilités Gain/Nulle/Perte (défaut: true)
  searchLimit?: StockfishSearchLimit;
  threads?: number;
  hashSize?: number;
}

export type EngineStatus = 'uninitialized' | 'loading' | 'ready' | 'searching' | 'stopping' | 'error';

export interface StockfishEvaluation {
  ply: number;
  fen: string;
  depth: number;
  seldepth?: number;
  scoreType: 'cp' | 'mate';
  scoreValue: number;
  whiteScoreValue: number;
  winChancePercentage: number;
  wdl?: [number, number, number];
  bestMove?: string;
  pv: string[];
  multipvIndex: number;
  nodes?: number;
  nps?: number;
  time?: number;
}

export type MoveJudgement =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win';

export interface MoveAnalysisReport {
  ply: number;
  san: string;
  uci: string;
  color: 'white' | 'black';
  judgement: MoveJudgement;
  playedMoveScore: number;
  bestMoveScore: number;
  diffPercentage: number;
  bestMoveUci: string;
  bestMoveSan: string;
  comment?: string;
}

export interface GameReviewReport {
  accuracyWhite: number;
  accuracyBlack: number;
  moves: MoveAnalysisReport[];
}
