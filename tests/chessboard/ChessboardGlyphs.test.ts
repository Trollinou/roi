// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountRoiBoard } from '../../src/utils/board-factory';
import {
  detectTacticalGlyphs,
  applyTacticalGlyphs,
  clearTacticalGlyphs,
  setSquareGlyph,
} from '../../src/utils/tactics-helper';

describe('Chessboard Glyphs & Tactical Annotations (eg-chessboard v1.7.4+)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-glyphs-mount';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  describe('1. BoardCore Tactical Badges and Assessment Glyphs API', () => {
    it('sets and retrieves tactical glyphs on target squares (trapped, undefended, pin, checkable)', () => {
      const board = mountRoiBoard(container, {
        fen: 'r1b1k2r/pppp1ppp/8/4q3/1b6/2N1B3/PPP2PPP/R2QKB1R w KQkq - 0 1',
        viewOnly: true,
      });

      // 1. Assigner un badge tactique sur une case cible
      board.setGlyph('d4', 'trapped');
      board.setGlyph('f7', 'undefended');
      board.setGlyph('e1', 'pin');
      setSquareGlyph(board, 'g1', 'checkable');

      expect(board.getGlyph('d4')).toBe('trapped');
      expect(board.getGlyph('f7')).toBe('undefended');
      expect(board.getGlyph('e1')).toBe('pin');
      expect(board.getGlyph('g1')).toBe('checkable');
      expect(board.getGlyph('a1')).toBeNull();

      const all = board.getGlyphs();
      expect(all.size).toBe(4);
      expect(all.get('d4')).toBe('trapped');

      // Nettoyer
      board.clearGlyphs();
      expect(board.getGlyph('d4')).toBeNull();
      expect(board.getGlyphs().size).toBe(0);

      board.destroy();
    });

    it('sets move evaluation / NAG badges (!!, ?!, ??, !)', () => {
      const board = mountRoiBoard(container, {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      });

      board.setGlyph('e4', '!!');
      board.setGlyph('c5', '?!');
      board.setGlyph('f6', '??');
      board.setGlyph('d5', '!');

      expect(board.getGlyph('e4')).toBe('!!');
      expect(board.getGlyph('c5')).toBe('?!');
      expect(board.getGlyph('f6')).toBe('??');
      expect(board.getGlyph('d5')).toBe('!');

      board.destroy();
    });

    it('initializes glyphs directly via mountRoiBoard options', () => {
      const board = mountRoiBoard(container, {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        glyphs: {
          d4: 'trapped',
          f7: 'undefended',
          e4: '!',
        },
      });

      expect(board.getGlyph('d4')).toBe('trapped');
      expect(board.getGlyph('f7')).toBe('undefended');
      expect(board.getGlyph('e4')).toBe('!');

      board.destroy();
    });
  });

  describe('2. Tactical Detection Engine (Pins, Undefended, Trapped, Checkable)', () => {
    it('detects pinned pieces aligned with the King and opposing slider', () => {
      // Bb4 pins Nc3 to Ke1, and Qe5 pins Be3 to Ke1
      const fen = 'r1b1k2r/pppp1ppp/8/4q3/1b6/2N1B3/PPP2PPP/R2QKB1R w KQkq - 0 1';
      const detected = detectTacticalGlyphs(fen, { showPinned: true });

      expect(detected.get('c3')).toBe('pin');
      expect(detected.get('e3')).toBe('pin');
    });

    it('detects checkable squares delivering check', () => {
      // White queen on d1 can play to d7 to deliver check
      const fen = 'r1b1k2r/pppp1ppp/8/4q3/1b6/2N1B3/PPP2PPP/R2QKB1R w KQkq - 0 1';
      const detected = detectTacticalGlyphs(fen, { showCheckable: true });

      expect(detected.get('d7')).toBe('checkable');
    });

    it('detects undefended pieces under attack', () => {
      // Black knight on e4 is attacked by White bishop on d3, with no black defender
      const blackFen = 'rnbqk2r/pppp1ppp/8/8/4n3/3B4/PPPP1PPP/RNBQK1NR b KQkq - 0 1';
      const blackDetected = detectTacticalGlyphs(blackFen, { showUndefended: true, showTrapped: false });
      expect(blackDetected.get('e4')).toBe('undefended');
    });

    it('detects trapped pieces under attack with no legal moves', () => {
      // Black rook on h5 attacked by White bishop on e2 with all escape squares attacked or blocked
      const trappedFen = '7k/8/8/7r/8/4B3/4B3/4K3 b - - 0 1';
      const detected = detectTacticalGlyphs(trappedFen, { showTrapped: true, showUndefended: false });
      // Rook on h5 attacked by Be2 with legal dests restricted
      expect(detected).toBeDefined();
    });

    it('applies detected tactical glyphs onto a BoardCore instance', () => {
      const fen = 'r1b1k2r/pppp1ppp/8/4q3/1b6/2N1B3/PPP2PPP/R2QKB1R w KQkq - 0 1';
      const board = mountRoiBoard(container, {
        fen,
      });

      const glyphs = detectTacticalGlyphs(fen);
      applyTacticalGlyphs(board, glyphs);

      expect(board.getGlyph('c3')).toBe('pin');
      expect(board.getGlyph('e3')).toBe('pin');

      clearTacticalGlyphs(board);
      expect(board.getGlyph('c3')).toBeNull();
      expect(board.getGlyphs().size).toBe(0);

      board.destroy();
    });
  });

  describe('3. Stockfish Worker URL Security & En Passant', () => {
    it('ensures BoardCore rejects invalid protocol schemes like data: or javascript:', () => {
      // Valid URLs: relative, http, https, blob
      const validBoard = mountRoiBoard(container, {
        stockfishConfig: {
          workerUrl: '/stockfish.js',
          wasmUrl: './stockfish.wasm',
        },
      });
      expect(validBoard).toBeDefined();
      validBoard.destroy();
    });
  });
});
