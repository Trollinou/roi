import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { BoardCore } from 'eg-chessboard';
import type {
  BoardMode,
  PieceSet,
  BoardTheme,
  DrawShape,
  StockfishConfig,
  StockfishEvaluation,
  EngineStatus,
  Move,
  PromotionDetail,
} from 'eg-chessboard';
import type { Color, Shape } from '../../types/chess';
import PromotionDialog, { type PromotionState } from '../../blocks/chessboard/components/PromotionDialog';

export type ChessboardConfig = Record<string, any>;

export interface RoiChessboardProps {
  /** Position FEN initiale ou active */
  fen?: string;
  /** Partie PGN (pour chargement ou étude) */
  pgn?: string;
  /** Orientation de l'échiquier (blancs en bas ou noirs en bas) */
  orientation?: Color;
  /** Affichage des coordonnées algébriques */
  coordinates?: boolean;
  /** Mode lecture seule (aucun déplacement utilisateur) */
  viewOnly?: boolean;
  /** Mode de l'échiquier (game, editor, study, analysis) */
  mode?: BoardMode;
  /** Couleur contrôlée par le joueur ('white' | 'black' | 'both') */
  playerColor?: 'white' | 'black' | 'both';
  /** Mode libre (déplacements hors règles pour configuration) */
  freeMode?: boolean;
  /** Flèches et cercles de surbrillance */
  shapes?: (DrawShape | Shape)[];
  /** Affichage automatique des menaces */
  showThreats?: boolean;
  /** Jeu de pièces utilisé (défaut 'cburnett') */
  pieceSet?: PieceSet;
  /** Thème graphique de l'échiquier (défaut 'brown') */
  boardTheme?: BoardTheme;
  /** Configuration personnalisée Chessground */
  boardConfig?: ChessboardConfig;
  /** Configuration Stockfish (WebAssembly / Worker) */
  stockfishConfig?: StockfishConfig;
  /** Classes CSS supplémentaires pour le conteneur racine */
  className?: string;
  /** Styles inline optionnels pour le conteneur racine */
  style?: React.CSSProperties;
  /** Éléments enfants injectés dans .main-board (ex: barres d'évaluation, overlays) */
  children?: React.ReactNode;
  /** Callback lors de la création de l'instance BoardCore */
  onBoardCreated?: (_boardApi: BoardCore) => void;
  /** Callback lors d'un déplacement */
  onMove?: (_move: Move) => void;
  /** Callback au changement de trait */
  onTurnChange?: (_color: Color, _ply: number) => void;
  /** Callback lors d'un clic sur une case */
  onSquareClick?: (_square: string) => void;
  /** Callback lors d'un changement de flèches/dessins */
  onShapesChange?: (_shapes: DrawShape[]) => void;
  /** Callback lors d'une promotion */
  onPromotion?: (_detail: PromotionDetail) => void;
  /** Callback d'évaluation du moteur Stockfish */
  onEvaluation?: (_evalData: StockfishEvaluation) => void;
  /** Callback d'indice/conseil Stockfish */
  onStockfishHint?: (_hint: string) => void;
  /** Callback de statut du moteur Stockfish */
  onEngineStatus?: (_status: EngineStatus) => void;
}

/**
 * Composant Échiquier Standardisé ROI (Piste 2).
 *
 * Encapsule BoardCore avec :
 * 1. Isolation matérielle hermétique (.roi-board-frame)
 * 2. Suivi de redimensionnement dynamique (ResizeObserver + requestAnimationFrame)
 * 3. Gestion réactive complète de FEN, PGN, orientation, formes et coordonnées
 * 4. Nettoyage strict des ressources au démontage
 */
export const RoiChessboard = forwardRef<BoardCore | null, RoiChessboardProps>(
  (
    {
      fen,
      pgn,
      orientation = 'white',
      coordinates = true,
      viewOnly = false,
      mode = 'game',
      playerColor = 'both',
      freeMode = false,
      shapes,
      showThreats = false,
      pieceSet = 'cburnett',
      boardTheme = 'brown',
      boardConfig = {},
      stockfishConfig,
      className = '',
      style,
      children,
      onBoardCreated,
      onMove,
      onTurnChange,
      onSquareClick,
      onShapesChange,
      onPromotion,
      onEvaluation,
      onStockfishHint,
      onEngineStatus,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLElement | null>(null);
    const mountElRef = useRef<HTMLDivElement | null>(null);
    const boardApiRef = useRef<BoardCore | null>(null);

    const [promotionState, setPromotionState] = useState<PromotionState>({ isEnabled: false });

    // Référence mutable pour les callbacks afin d'éviter de réinstancier BoardCore
    const callbacksRef = useRef({
      onBoardCreated,
      onMove,
      onTurnChange,
      onSquareClick,
      onShapesChange,
      onPromotion,
      onEvaluation,
      onStockfishHint,
      onEngineStatus,
    });

    useEffect(() => {
      callbacksRef.current = {
        onBoardCreated,
        onMove,
        onTurnChange,
        onSquareClick,
        onShapesChange,
        onPromotion,
        onEvaluation,
        onStockfishHint,
        onEngineStatus,
      };
    });

    // Expose l'instance BoardCore au parent via React ref
    useImperativeHandle(ref, () => boardApiRef.current as BoardCore, []);

    // Initialisation unique du plateau
    useEffect(() => {
      if (!mountElRef.current) {
        return;
      }

      const initialBoardConfig: ChessboardConfig = {
        coordinates,
        orientation,
        viewOnly,
        fen,
        ...boardConfig,
        movable: {
          free: freeMode,
          color: playerColor === 'both' ? undefined : playerColor,
          ...boardConfig.movable,
        },
      };

      const initialBoardState = {
        mode,
        pieceSet,
        boardTheme,
        showThreats,
        promotionDialogState: { isEnabled: false },
        historyViewerState: { isEnabled: false },
      };

      const emit = (event: string, ...args: unknown[]) => {
        const cbs = callbacksRef.current;
        switch (event) {
          case 'move':
            cbs.onMove?.(args[0] as Move);
            break;
          case 'turn-change':
            cbs.onTurnChange?.(args[0] as Color, args[1] as number);
            break;
          case 'square-click':
            cbs.onSquareClick?.(args[0] as string);
            break;
          case 'shapes-change':
            cbs.onShapesChange?.(args[0] as DrawShape[]);
            break;
          case 'promotion':
            cbs.onPromotion?.(args[0] as PromotionDetail);
            break;
          case 'evaluation':
            cbs.onEvaluation?.(args[0] as StockfishEvaluation);
            break;
          case 'stockfish-hint':
            cbs.onStockfishHint?.(args[0] as string);
            break;
          case 'engine-status':
            cbs.onEngineStatus?.(args[0] as EngineStatus);
            break;
        }
      };

      const handleStateChange = () => {
        if (!boardApiRef.current) {
          return;
        }
        const state = (boardApiRef.current as any).getState?.();
        if (state?.promotionDialogState) {
          setPromotionState({ ...state.promotionDialogState });
        }
      };

      const defaultStockfishConfig: StockfishConfig = stockfishConfig || {
        whiteMode: 'disabled',
        blackMode: 'disabled',
      };

      const boardInstance = new BoardCore(
        mountElRef.current,
        initialBoardState,
        handleStateChange,
        emit,
        initialBoardConfig,
        defaultStockfishConfig
      );

      boardApiRef.current = boardInstance;

      if (pgn) {
        try {
          boardInstance.loadPgn(pgn);
        } catch (e) {
          console.warn('[RoiChessboard] Erreur chargement PGN initial:', e);
        }
      }

      if (shapes && shapes.length > 0) {
        boardInstance.setShapes(shapes as any);
      }

      if (showThreats) {
        boardInstance.drawThreats();
      }

      callbacksRef.current.onBoardCreated?.(boardInstance);

      // --- Mécanisme de Redimensionnement & Bounds (ResizeObserver) ---
      let resizeObserver: ResizeObserver | null = null;
      const triggerRedraw = () => {
        if (boardApiRef.current && typeof boardApiRef.current.redraw === 'function') {
          boardApiRef.current.redraw(true);
        }
      };

      window.requestAnimationFrame(triggerRedraw);

      if (typeof window.ResizeObserver !== 'undefined' && containerRef.current) {
        let lastWidth = 0;
        let lastHeight = 0;

        resizeObserver = new window.ResizeObserver((entries) => {
          for (const entry of entries) {
            const width = Math.round(entry.contentRect.width);
            const height = Math.round(entry.contentRect.height);

            if (width > 0 && height > 0) {
              if (lastWidth === 0 && lastHeight === 0) {
                lastWidth = width;
                lastHeight = height;
              } else if (
                Math.abs(width - lastWidth) > 1 ||
                Math.abs(height - lastHeight) > 1
              ) {
                lastWidth = width;
                lastHeight = height;
                window.requestAnimationFrame(triggerRedraw);
              }
            }
          }
        });
        resizeObserver.observe(containerRef.current);
      }

      const clearBounds = () => {
        if (boardApiRef.current && typeof boardApiRef.current.clearDomBounds === 'function') {
          boardApiRef.current.clearDomBounds();
        }
      };

      const containerEl = containerRef.current;
      if (containerEl) {
        containerEl.addEventListener('pointerdown', clearBounds, true);
        containerEl.addEventListener('mousedown', clearBounds, true);
        containerEl.addEventListener('touchstart', clearBounds, true);
      }

      window.addEventListener('scroll', clearBounds, { capture: true, passive: true });
      window.addEventListener('resize', clearBounds, { passive: true });

      return () => {
        if (containerEl) {
          containerEl.removeEventListener('pointerdown', clearBounds, true);
          containerEl.removeEventListener('mousedown', clearBounds, true);
          containerEl.removeEventListener('touchstart', clearBounds, true);
        }
        window.removeEventListener('scroll', clearBounds, { capture: true });
        window.removeEventListener('resize', clearBounds);

        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (boardInstance) {
          boardInstance.destroy();
        }
        boardApiRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Synchronisation FEN
    const lastFenRef = useRef<string | undefined>(fen);
    useEffect(() => {
      if (boardApiRef.current && fen && fen !== lastFenRef.current) {
        lastFenRef.current = fen;
        boardApiRef.current.setPosition(fen);
      }
    }, [fen]);

    // Synchronisation PGN
    const lastPgnRef = useRef<string | undefined>(pgn);
    useEffect(() => {
      if (boardApiRef.current && pgn && pgn !== lastPgnRef.current) {
        lastPgnRef.current = pgn;
        try {
          boardApiRef.current.loadPgn(pgn);
        } catch (e) {
          console.warn('[RoiChessboard] Erreur sync PGN:', e);
        }
      }
    }, [pgn]);

    // Synchronisation Orientation
    useEffect(() => {
      if (boardApiRef.current) {
        boardApiRef.current.setConfig({ orientation });
      }
    }, [orientation]);

    // Synchronisation Coordonnées
    useEffect(() => {
      if (boardApiRef.current) {
        boardApiRef.current.setConfig({ coordinates });
      }
    }, [coordinates]);

    // Synchronisation Lecture seule
    useEffect(() => {
      if (boardApiRef.current) {
        boardApiRef.current.setConfig({ viewOnly });
      }
    }, [viewOnly]);

    // Synchronisation Formes (Shapes)
    useEffect(() => {
      if (boardApiRef.current && shapes) {
        boardApiRef.current.setShapes(shapes as any);
      }
    }, [shapes]);

    // Synchronisation Menaces
    useEffect(() => {
      if (boardApiRef.current) {
        if (showThreats) {
          boardApiRef.current.drawThreats();
        } else {
          boardApiRef.current.setShapes([]);
        }
      }
    }, [showThreats]);

    // Synchronisation Jeu de pièces & Thème
    useEffect(() => {
      if (boardApiRef.current) {
        boardApiRef.current.setPieceSet(pieceSet);
        boardApiRef.current.setBoardTheme(boardTheme);
      }
    }, [pieceSet, boardTheme]);

    return (
      <section
        ref={containerRef}
        className={`main-wrap piece-set-${pieceSet} board-theme-${boardTheme} roi-board-frame ${
          promotionState.isEnabled ? 'disabledBoard' : ''
        } ${className}`.trim()}
        style={style}
      >
        <div className="main-board">
          {promotionState.isEnabled && (
            <PromotionDialog
              state={promotionState}
              onPromotionSelected={() => {
                boardApiRef.current?.closePromotionDialog();
                setPromotionState({ isEnabled: false });
              }}
            />
          )}
          <div ref={mountElRef} className="chessboard-mount-element" />
          {children}
        </div>
      </section>
    );
  }
);

RoiChessboard.displayName = 'RoiChessboard';

export default RoiChessboard;
