/**
 * Utilitaires pour la manipulation et la validation de PGN et FEN.
 */

import type { BoardShape, FenString, PgnString, PieceRole, PieceSymbol } from '../types/chess';

/**
 * Garantit que les entêtes PGN contiennent [SetUp "1"] et [FEN "..."] si un FEN initial personnalisé est défini.
 */
export function ensurePgnFenHeader(pgn: PgnString | undefined, fen: FenString | undefined): string {
  if (!fen || typeof fen !== 'string') {
    return pgn || '';
  }
  const cleanedFen = fen.trim();
  if (
    !cleanedFen ||
    cleanedFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  ) {
    return pgn || '';
  }

  const cleanedPgn = pgn ? pgn.trim() : '';
  if (cleanedPgn.includes('[FEN ')) {
    return cleanedPgn;
  }

  const setupHeaders = `[SetUp "1"]\n[FEN "${cleanedFen}"]\n`;

  if (!cleanedPgn) {
    return setupHeaders;
  }

  if (cleanedPgn.includes(']')) {
    const lastHeaderIndex = cleanedPgn.lastIndexOf(']');
    const headersPart = cleanedPgn.slice(0, lastHeaderIndex + 1);
    const movesPart = cleanedPgn.slice(lastHeaderIndex + 1).trim();
    return `${headersPart}\n${setupHeaders}\n${movesPart}`;
  }

  return `${setupHeaders}\n${cleanedPgn}`;
}

/**
 * Convertit un coup SAN de notation internationale (K, Q, R, B, N)
 * en notation française (R, D, T, F, C).
 */
export function toFrenchNotation(san: string): string {
  if (!san || typeof san !== 'string') {
    return '';
  }
  const pieceMap: Record<string, string> = {
    K: 'R', // Roi
    Q: 'D', // Dame
    R: 'T', // Tour
    B: 'F', // Fou
    N: 'C', // Cavalier
  };
  return san.replace(/[KQRBN]/g, (match) => pieceMap[match] || match);
}

/**
 * Noms des rôles de pièces en français.
 */
export const ROLE_NAMES_FR: Record<string, string> = {
  pawn: 'Pion',
  knight: 'Cavalier',
  bishop: 'Fou',
  rook: 'Tour',
  queen: 'Dame',
  king: 'Roi',
  p: 'Pion',
  n: 'Cavalier',
  b: 'Fou',
  r: 'Tour',
  q: 'Dame',
  k: 'Roi',
};

/**
 * Retourne le nom en français d'une pièce à partir de son rôle ou caractère FEN.
 */
export function getPieceLabel(roleOrChar: PieceRole | PieceSymbol | string | undefined): string {
  if (!roleOrChar) {
    return 'Pièce';
  }
  const key = String(roleOrChar).toLowerCase();
  return ROLE_NAMES_FR[key] || 'Pièce';
}

/**
 * Palette de correspondance des codes de couleur Lichess vers les noms de brosses.
 */
export const PGN_BRUSH_MAP: Record<string, string> = {
  g: 'green',
  r: 'red',
  b: 'blue',
  y: 'yellow',
  c: 'green',
  o: 'yellow',
};

export interface ExtractedShapesResult {
  shapes: BoardShape[];
  cleanedText: string;
}

/**
 * Extrait les formes graphiques ([%csl ...], [%cal ...], [%cpl ...]) et le texte nettoyé d'un commentaire PGN.
 */
export function extractShapesFromComments(commentsText: string | undefined): ExtractedShapesResult {
  if (!commentsText || typeof commentsText !== 'string') {
    return { shapes: [], cleanedText: '' };
  }
  const shapes: BoardShape[] = [];

  // 1. Cercles [%csl ...] ou [%cpl ...]
  const cslRegex = /\[%(?:csl|cpl)\s+([^\]]+)\]/gi;
  let cslMatch: RegExpExecArray | null;
  while ((cslMatch = cslRegex.exec(commentsText)) !== null) {
    const items = cslMatch[1].split(',');
    for (const item of items) {
      const clean = item.trim();
      if (clean.length >= 3) {
        const brushChar = clean[0].toLowerCase();
        const brush = PGN_BRUSH_MAP[brushChar] || 'green';
        const orig = clean.substring(1, 3).toLowerCase();
        if (!shapes.some((s) => s.orig === orig && !s.dest)) {
          shapes.push({ orig, brush } as BoardShape);
        }
      }
    }
  }

  // 2. Flèches [%cal ...]
  const calRegex = /\[%cal\s+([^\]]+)\]/gi;
  let calMatch: RegExpExecArray | null;
  while ((calMatch = calRegex.exec(commentsText)) !== null) {
    const items = calMatch[1].split(',');
    for (const item of items) {
      const clean = item.trim();
      if (clean.length >= 5) {
        const brushChar = clean[0].toLowerCase();
        const brush = PGN_BRUSH_MAP[brushChar] || 'green';
        const orig = clean.substring(1, 3).toLowerCase();
        const dest = clean.substring(3, 5).toLowerCase();
        if (!shapes.some((s) => s.orig === orig && s.dest === dest)) {
          shapes.push({ orig, dest, brush } as BoardShape);
        }
      }
    }
  }

  // 3. Texte épuré
  const cleanedText = commentsText
    .replace(/\[%[^\]]+\]/g, '')
    .trim()
    .replace(/\s{2,}/g, ' ');

  return { shapes, cleanedText };
}
