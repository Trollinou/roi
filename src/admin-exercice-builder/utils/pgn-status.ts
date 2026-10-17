/**
 * PGN validation and status badge utilities for Admin Exercice Builder.
 */

import { parsePgn } from 'chessops/pgn';
import { extractShapesFromComments } from '../../utils/chessUtils';
import type { BoardShape, Color } from '../../types/chess';

export function getActiveColorFromFen(fen: string | undefined): Color {
  if (typeof fen !== 'string') {
    return 'white';
  }
  const parts = fen.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[1].toLowerCase() === 'b' ? 'black' : 'white';
  }
  return 'white';
}

export type PgnStatusCode = 'empty' | 'valid_with_moves' | 'valid_no_moves' | 'invalid';

export function checkPgnStatus(pgnString: string | undefined): PgnStatusCode {
  if (!pgnString || typeof pgnString !== 'string') {
    return 'empty';
  }
  const trimmed = pgnString.trim();
  if (!trimmed) {
    return 'empty';
  }

  try {
    const games = parsePgn(trimmed);
    if (!games || games.length === 0) {
      return 'invalid';
    }
    const game = games[0];
    const hasMoves = !!(
      game.moves &&
      game.moves.children &&
      game.moves.children.length > 0
    );

    if (hasMoves) {
      return 'valid_with_moves';
    }

    const hasExplicitHeader = /\[\s*[A-Za-z0-9_]+\s+"[^"]*"\s*\]/.test(trimmed);
    const hasExplicitComment = /\{[^}]*\}/.test(trimmed);

    if (hasExplicitHeader || hasExplicitComment) {
      return 'valid_no_moves';
    }

    return 'invalid';
  } catch {
    return 'invalid';
  }
}

export function hasPgnMoves(pgnString: string | undefined): boolean {
  return checkPgnStatus(pgnString) === 'valid_with_moves';
}

export function updatePgnStatus(
  textareaEl: HTMLTextAreaElement | HTMLInputElement | null,
  statusEl?: HTMLElement | null
): void {
  if (!textareaEl) {
    return;
  }
  let targetStatusEl: HTMLElement | null = statusEl || null;
  if (!targetStatusEl && textareaEl.id) {
    targetStatusEl = document.getElementById(`${textareaEl.id}_status`);
  }
  if (!targetStatusEl) {
    const wrapper =
      textareaEl.closest('.roi-control-textarea-wrapper') ||
      textareaEl.parentElement;
    if (wrapper) {
      targetStatusEl = wrapper.querySelector('.roi-pgn-status') as HTMLElement | null;
      if (!targetStatusEl) {
        targetStatusEl = document.createElement('div');
        targetStatusEl.className = 'roi-pgn-status';
        wrapper.appendChild(targetStatusEl);
      }
    }
  }

  if (!targetStatusEl) {
    return;
  }

  const status = checkPgnStatus(textareaEl.value);

  if (status === 'empty') {
    targetStatusEl.style.display = 'none';
    targetStatusEl.innerHTML = '';
    return;
  }

  if (status === 'invalid') {
    targetStatusEl.style.display = 'block';
    targetStatusEl.className = 'roi-pgn-status roi-pgn-status-error';
    targetStatusEl.style.marginTop = '6px';
    targetStatusEl.style.padding = '6px 10px';
    targetStatusEl.style.backgroundColor = '#fcf0f1';
    targetStatusEl.style.border = '1px solid #d63638';
    targetStatusEl.style.borderLeft = '4px solid #d63638';
    targetStatusEl.style.borderRadius = '3px';
    targetStatusEl.style.color = '#8a1f11';
    targetStatusEl.style.fontSize = '12px';
    targetStatusEl.style.lineHeight = '1.4';
    targetStatusEl.innerHTML =
      '❌ <strong>Format PGN non reconnu</strong> ou invalide. Veuillez coller un PGN valide ou utiliser <em>« Éditer le PGN »</em>.';
    return;
  }

  if (status === 'valid_no_moves') {
    targetStatusEl.style.display = 'block';
    targetStatusEl.className = 'roi-pgn-status roi-pgn-status-warning';
    targetStatusEl.style.marginTop = '6px';
    targetStatusEl.style.padding = '6px 10px';
    targetStatusEl.style.backgroundColor = '#fff8e5';
    targetStatusEl.style.border = '1px solid #dba617';
    targetStatusEl.style.borderLeft = '4px solid #dba617';
    targetStatusEl.style.borderRadius = '3px';
    targetStatusEl.style.color = '#614700';
    targetStatusEl.style.fontSize = '12px';
    targetStatusEl.style.lineHeight = '1.4';
    targetStatusEl.innerHTML =
      '⚠️ <strong>Aucun coup solution détecté</strong> dans ce PGN (uniquement position / commentaires). Cliquez sur <em>« Éditer le PGN »</em> pour jouer le coup attendu.';
    return;
  }

  if (status === 'valid_with_moves') {
    targetStatusEl.style.display = 'block';
    targetStatusEl.className = 'roi-pgn-status roi-pgn-status-success';
    targetStatusEl.style.marginTop = '6px';
    targetStatusEl.style.padding = '4px 8px';
    targetStatusEl.style.backgroundColor = '#edfaef';
    targetStatusEl.style.border = '1px solid #68de7c';
    targetStatusEl.style.borderLeft = '4px solid #00a32a';
    targetStatusEl.style.borderRadius = '3px';
    targetStatusEl.style.color = '#135e26';
    targetStatusEl.style.fontSize = '12px';
    targetStatusEl.style.lineHeight = '1.4';
    targetStatusEl.innerHTML =
      '✓ <strong>Coup(s) solution présent(s)</strong> dans la séquence PGN.';
  }
}

export function extractFenOrientationAndShapes(pgnString: string | undefined): {
  fen: string;
  orientation: Color;
  shapes: BoardShape[];
} {
  if (!pgnString || typeof pgnString !== 'string') {
    const defaultFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    return { fen: defaultFen, orientation: 'white', shapes: [] };
  }

  const trimmed = pgnString.trim();

  // 1. Balise [FEN "..."]
  const fenMatch = trimmed.match(/\[FEN\s+"([^"]+)"\]/i);
  let fen = fenMatch
    ? fenMatch[1].trim()
    : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  if (!fenMatch && trimmed.includes('/') && !trimmed.startsWith('[')) {
    let firstLine = trimmed.split('\n')[0].trim();
    if (firstLine.includes('{')) {
      firstLine = firstLine.split('{')[0].trim();
    }
    if (firstLine.includes('/') && firstLine.split('/').length >= 4) {
      fen = firstLine;
    }
  }

  const fenParts = fen.split(/\s+/);
  if (fenParts.length === 1 && fenParts[0].includes('/')) {
    fen = `${fenParts[0]} w - - 0 1`;
  }

  const orientation = getActiveColorFromFen(fen);
  const shapes: BoardShape[] = [];

  let rootComments: string[] = [];
  try {
    const games = parsePgn(trimmed);
    if (games && games.length > 0) {
      const game = games[0];
      if (game.headers && typeof (game.headers as any).get === 'function') {
        const fenHeader = (game.headers as any).get('FEN');
        if (fenHeader) {
          fen = fenHeader.trim();
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

  return { fen, orientation, shapes };
}

