import { parsePgn } from 'chessops/pgn';
import { extractShapesFromComments } from '../../utils/chessUtils';
import type { BoardShape } from '../../types/chess';

export const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function parsePgnOrFen(
  text: string,
  defaultFen: string = DEFAULT_FEN
): { fen: string; shapes: BoardShape[] } | null {
  if (!text || typeof text !== 'string') {
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  let parsedFen = '';
  const shapes: BoardShape[] = [];

  // 1. Extraire la FEN depuis l'en-tête [FEN "..."] si présent
  const fenMatch = trimmed.match(/\[FEN\s+"([^"]+)"\]/i);
  if (fenMatch && fenMatch[1]) {
    parsedFen = fenMatch[1].trim();
  }

  // 2. Récupérer les commentaires racine via parsePgn
  let rootComments: string[] = [];
  try {
    const games = parsePgn(trimmed);
    if (games && games.length > 0) {
      const game = games[0];
      if (game.headers && typeof game.headers.get === 'function') {
        const fenHeader = game.headers.get('FEN');
        if (fenHeader) {
          parsedFen = fenHeader.trim();
        }
      }
      if (Array.isArray(game.comments) && game.comments.length > 0) {
        rootComments = game.comments;
      }
    }
  } catch {
    const firstMoveIndex = trimmed.search(/\b\d+\s*\./);
    const initialSection =
      firstMoveIndex !== -1 ? trimmed.slice(0, firstMoveIndex) : trimmed;
    const fallbackMatches = initialSection.match(/\{([^}]*)\}/g);
    if (fallbackMatches) {
      rootComments = fallbackMatches.map((c) => c.slice(1, -1));
    }
  }

  if (rootComments.length > 0) {
    const parsed = extractShapesFromComments(rootComments.join(' '));
    shapes.push(...parsed.shapes);
  }

  // 3. Si aucune FEN n'a été trouvée dans les balises PGN
  if (!parsedFen) {
    const firstLine = trimmed.split('\n')[0].trim();
    if (firstLine.includes('/') && !firstLine.startsWith('[')) {
      parsedFen = firstLine;
    } else if (trimmed.startsWith('[') && trimmed.includes(']')) {
      parsedFen = defaultFen;
    } else {
      parsedFen = trimmed;
    }
  }

  return { fen: parsedFen, shapes };
}

export function updateCastlingFlags(castling: string, flag: string, checked: boolean): string {
  let current = castling === '-' ? '' : castling;
  if (checked) {
    if (!current.includes(flag)) {
      let next = '';
      if (flag === 'K' || current.includes('K')) {
        next += 'K';
      }
      if (flag === 'Q' || current.includes('Q')) {
        next += 'Q';
      }
      if (flag === 'k' || current.includes('k')) {
        next += 'k';
      }
      if (flag === 'q' || current.includes('q')) {
        next += 'q';
      }
      current = next || '-';
    }
  } else {
    current = current.replace(flag, '');
  }
  return current || '-';
}

