/**
 * @file This file contains the editor component for the Chessboard Gutenberg block.
 * @author Your Name
 * @version 1.0.0
 */

import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl, ToggleControl, RangeControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component, useEffect, useState } from '@wordpress/element';
import { PieceSelectionDialog, PIECE_SELECTION_DIALOG_RESULT_TYPE } from './extensions/PieceSelectionDialog.js';
import { FEN } from '../../../vendor/cm-chessboard/src/model/Position.js';
import { Arrows } from '../../../vendor/cm-chessboard/src/extensions/arrows/Arrows.js';
import { Markers, MARKER_TYPE } from '../../../vendor/cm-chessboard/src/extensions/markers/Markers.js';
import { RightClickAnnotator } from '../../../vendor/cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js';


// ========================================
// CLASSE SimpleFenEditor
// ========================================
/**
 * @class SimpleFenEditor
 * @extends Component
 * @classdesc A component that provides a visual FEN editor using cm-chessboard,
 * allowing users to place, move, and remove pieces to construct a board position.
 */
class SimpleFenEditor extends Component {
    /**
     * Creates an instance of SimpleFenEditor.
     * @param {object} props - The component props.
     */
    constructor(props) {
        super(props);
        this.state = {
            chessboardLoaded: false
        };
        this.editorRef = null;
        this.chessboard = null;
        this.isMoveInProgress = false;
        this.resizeObserver = null;
    }

    /**
     * Initializes the chessboard and sets up a resize observer when the component mounts.
     */
    async componentDidMount() {
        await this.initChessboard();
        this.resizeObserver = new ResizeObserver(() => {
            if (this.chessboard) {
                this.chessboard.redraw();
            }
        });
        if (this.editorRef) {
            this.resizeObserver.observe(this.editorRef);
        }
    }

    /**
     * Destroys the chessboard instance and disconnects the resize observer when the component unmounts.
     */
    componentWillUnmount() {
        if (this.chessboard) {
            this.chessboard.destroy();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    /**
     * Handles component updates, re-initializing the board on style changes
     * or updating the position if the FEN string changes.
     * @param {object} prevProps - The previous props.
     */
    async componentDidUpdate(prevProps) {
        if (
            prevProps.pieces !== this.props.pieces ||
            prevProps.borderType !== this.props.borderType ||
            prevProps.cssClass !== this.props.cssClass ||
            prevProps.orientation !== this.props.orientation ||
            prevProps.showCoordinates !== this.props.showCoordinates
        ) {
            await this.initChessboard();
        }
        else if (prevProps.fen !== this.props.fen && this.chessboard && this.state.chessboardLoaded) {
            try {
                await this.chessboard.setPosition(this.props.fen, false);
                this.addSquareClickHandlers();
            } catch (e) {
                console.warn('FEN invalide:', e);
            }
        }
    }

    addSquareClickHandlers() {
        if (!this.editorRef) return;
        const boardGroup = this.editorRef.querySelector('g.board.input-enabled');
        if (!boardGroup) {
            console.warn('g.board.input-enabled non trouvé');
            return;
        }
        boardGroup.style.cursor = 'pointer';
        // Clone and replace to remove old event listeners
        const newBoardGroup = boardGroup.cloneNode(true);
        boardGroup.parentNode.replaceChild(newBoardGroup, boardGroup);

        newBoardGroup.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) { // Ne réagit qu'au clic gauche
                return;
            }
            if (this.isMoveInProgress || this.chessboard.isPieceSelectionDialogShown()) {
                return;
            }
            const target = e.target;
            if (target && target.classList && target.classList.contains('square')) {
                const squareName = target.getAttribute('data-square');
                if (!squareName) return;

                const piece = this.chessboard.getPiece(squareName);
                if (piece) {
                    // Clic sur une pièce : géré par le drag-and-drop de cm-chessboard
                } else {
                    this.chessboard.showPieceSelectionDialog(squareName, (result) => {
                        if (result.type === PIECE_SELECTION_DIALOG_RESULT_TYPE.pieceSelected) {
                            this.chessboard.setPiece(result.square, result.piece);
                            setTimeout(() => {
                                const partialFen = this.chessboard.getPosition();
                                const completeFen = this.completeFen(partialFen);
                                this.props.onChange(completeFen);
                            }, 10);
                        }
                    });
                }
            }
        });
    }

    /**
     * Completes a partial FEN string (piece placement) with the full FEN data
     * from the block's attributes (turn, castling rights, etc.).
     * @param {string} partialFen - The piece placement part of the FEN.
     * @returns {string} The full, completed FEN string.
     */
    completeFen(partialFen) {
        const tokens = this.props.fen.split(' ');
        tokens[0] = partialFen;
        return tokens.join(' ');
    }

    /**
     * Initializes the cm-chessboard instance for the editor.
     * This function dynamically imports the library, creates a new chessboard
     * instance with the appropriate settings for freeform editing, and sets up
     * event handlers.
     */
    async initChessboard() {
        if (!this.editorRef) return;
        if (this.chessboard) {
            this.chessboard.destroy();
        }
        try {
            const ChessboardModule = await import(/* webpackIgnore: true */ roiChessEditor.chessboardUrl);
            const { Chessboard, INPUT_EVENT_TYPE, BORDER_TYPE, COLOR } = ChessboardModule;

            this.chessboard = new Chessboard(this.editorRef, {
                position: this.props.fen,
                orientation: COLOR[this.props.orientation],
                responsive: true,
                assetsUrl: roiChessEditor.assetsUrl,
                assetsCache: false,
                style: {
                    aspectRatio: 1,
                    borderType: BORDER_TYPE[this.props.borderType],
                    pieces: { file: `pieces/${this.props.pieces}.svg` },
                    cssClass: this.props.cssClass,
                    showCoordinates: this.props.showCoordinates,
                },
                extensions: [
                    { class: PieceSelectionDialog },
                    { class: Arrows },
                    { class: Markers, props: { autoMarkers: MARKER_TYPE.frame } },
                    { class: RightClickAnnotator },
                ],
            });

            this.chessboard.enableMoveInput((event) => {
                if (event.type === INPUT_EVENT_TYPE.movingOverSquare) {
                    return;
                }
                if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
                    if (this.chessboard.isPieceSelectionDialogShown()) {
                        return false;
                    }
                    this.isMoveInProgress = true;
                    return true;
                }
                if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
                    return true;
                }
                if (event.type === INPUT_EVENT_TYPE.moveInputCanceled) {
                    this.isMoveInProgress = false;
                    this.chessboard.setPiece(event.squareFrom, null);
                    setTimeout(() => {
                        const partialFen = this.chessboard.getPosition();
                        const completeFen = this.completeFen(partialFen);
                        this.props.onChange(completeFen);
                    }, 10);
                    return;
                }
                if (event.type === INPUT_EVENT_TYPE.moveInputFinished) {
                    this.isMoveInProgress = false;
                    setTimeout(() => {
                        const partialFen = this.chessboard.getPosition();
                        const completeFen = this.completeFen(partialFen);
                        this.props.onChange(completeFen);
                    }, 10);
                }
            });

            setTimeout(() => {
                this.addSquareClickHandlers();
            }, 50);

            this.setState({ chessboardLoaded: true });

        } catch (error) {
            console.error('Erreur chargement échiquier:', error);
            if (this.editorRef) {
                this.editorRef.innerHTML = '<div style="padding: 20px; text-align: center; background: #fee; border-radius: 4px; color: #c00;">⚠️ Erreur de chargement</div>';
            }
        }
    }

    /**
     * Renders the FEN editor interface, including the chessboard itself.
     * @returns {JSX.Element} The rendered component.
     */
    render() {
        return (
            <div ref={(ref) => { this.editorRef = ref; }} />
        );
    }
}

/**
 * The main Edit component for the Gutenberg block.
 * @param {object} props - The component props provided by WordPress.
 * @param {object} props.attributes - The block's attributes.
 * @param {function} props.setAttributes - A function to update the block's attributes.
 * @returns {JSX.Element} The rendered block editor interface.
 */
export default function Edit(props) {
    const { attributes, setAttributes } = props;
    const { fen, turn = 'w' } = attributes;

    const [fenValidation, setFenValidation] = useState({ isValid: true, error: null });

    const isEngineEnabled = attributes.enableEngine === 'true';
    const isMovesEnabled = attributes.enableMoves === 'true';
    const blockProps = useBlockProps();

    useEffect(() => {
        /**
         * Validates the FEN string using chess.js.
         */
        async function validate() {
            try {
                const { Chess } = await import(/* webpackIgnore: true */ roiChessEditor.chessJsSrc);
                new Chess(fen);
                setFenValidation({ isValid: true, error: null });
            } catch (e) {
                setFenValidation({ isValid: false, error: e.message });
            }
        }
        validate();
    }, [fen]);

    useEffect(() => {
        // Disables the engine if the FEN becomes invalid.
        if (!fenValidation.isValid && isEngineEnabled) {
            setAttributes({ enableEngine: 'false' });
        }
    }, [fenValidation.isValid]);

    useEffect(() => {
        /**
         * Synchronizes the 'turn' attribute with the turn specified in the FEN string.
         */
        async function syncTurnFromFen() {
            try {
                const { Chess } = await import(/* webpackIgnore: true */ roiChessEditor.chessJsSrc);
                const chess = new Chess(fen);
                if (chess.turn() !== turn) {
                    setAttributes({ turn: chess.turn() });
                }
            } catch (e) {
                // Ignore invalid FEN
            }
        }
        syncTurnFromFen();
    }, [fen]);

    useEffect(() => {
        /**
         * Synchronizes the FEN string with the 'turn' attribute.
         */
        async function syncFenFromTurn() {
            try {
                const { Chess } = await import(/* webpackIgnore: true */ roiChessEditor.chessJsSrc);
                const chess = new Chess(fen);
                if (chess.turn() !== turn) {
                    const tokens = chess.fen().split(' ');
                    tokens[1] = turn;
                    setAttributes({ fen: tokens.join(' ') });
                }
            } catch (e) {
                // Ignore invalid FEN
            }
        }
        syncFenFromTurn();
    }, [turn]);

    /**
     * Handles changes to the castling rights checkboxes.
     * @param {string} right - The castling right to change ('K', 'Q', 'k', 'q').
     * @param {boolean} isChecked - The new state of the checkbox.
     */
    const handleCastleChange = (right, isChecked) => {
        const fenTokens = fen.split(' ');
        let castling = fenTokens[2] || '-';
        if (castling === '-') {
            castling = '';
        }

        if (isChecked) {
            castling += right;
        } else {
            castling = castling.replace(right, '');
        }

        const sortedCastling = ['K', 'Q', 'k', 'q']
            .filter(r => castling.includes(r))
            .join('');

        fenTokens[2] = sortedCastling || '-';
        setAttributes({ fen: fenTokens.join(' ') });
    };

    const castlingRights = (fen.split(' ')[2] || '-');

    return (
        <div {...blockProps}>
            <InspectorControls>
                <PanelBody title={__('Configuration', 'roi')}>
                    <SelectControl
                        label={__("Charger une position", 'roi')}
                        value={''} // Unmanaged value
                        options={[
                            { label: __('Sélectionner...', 'roi'), value: '', disabled: true },
                            { label: __('Position initiale', 'roi'), value: FEN.start },
                            { label: __('Échiquier vide', 'roi'), value: FEN.empty }
                        ]}
                        onChange={(value) => {
                            if (value) setAttributes({ fen: value });
                        }}
                    />
                    <TextControl
                        label={__('Position FEN', 'roi')}
                        value={attributes.fen}
                        onChange={(value) => setAttributes({ fen: value })}
                        help={
                            !fenValidation.isValid ? (
                                <span style={{ color: 'red' }}>{fenValidation.error}</span>
                            ) : null
                        }
                    />
                    <div className="castling-controls">
                        <label className="castling-controls__label">{__('Roques', 'roi')}</label>
                        <div className="castling-controls__row">
                            <span>{__('Blancs :', 'roi')}</span>
                            <CheckboxControl label="O-O" checked={castlingRights.includes('K')} onChange={(isChecked) => handleCastleChange('K', isChecked)} />
                            <CheckboxControl label="O-O-O" checked={castlingRights.includes('Q')} onChange={(isChecked) => handleCastleChange('Q', isChecked)} />
                        </div>
                        <div className="castling-controls__row">
                            <span>{__('Noirs :', 'roi')}</span>
                            <CheckboxControl label="O-O" checked={castlingRights.includes('k')} onChange={(isChecked) => handleCastleChange('k', isChecked)} />
                            <CheckboxControl label="O-O-O" checked={castlingRights.includes('q')} onChange={(isChecked) => handleCastleChange('q', isChecked)} />
                        </div>
                    </div>
                    <SelectControl
                        label={__('Trait', 'roi')}
                        value={attributes.turn}
                        options={[
                            { label: __('Aux Blancs', 'roi'), value: 'w' },
                            { label: __('Aux Noirs', 'roi'), value: 'b' }
                        ]}
                        onChange={(value) => setAttributes({ turn: value })}
                    />
                </PanelBody>
                <PanelBody title={__('Style de l\'échiquier', 'roi')}>
                    <SelectControl
                        label={__('Type de bordure', 'roi')}
                        value={attributes.borderType}
                        options={[
                            { label: __('Aucune', 'roi'), value: 'none' },
                            { label: __('Fine', 'roi'), value: 'thin' },
                            { label: __('Cadre', 'roi'), value: 'frame' },
                        ]}
                        onChange={(value) => setAttributes({ borderType: value })}
                    />
                    <ToggleControl
                        label={__('Afficher les coordonnées', 'roi')}
                        checked={attributes.showCoordinates}
                        onChange={(value) => setAttributes({ showCoordinates: value })}
                    />
                    <SelectControl
                        label={__('Style des pièces', 'roi')}
                        value={attributes.pieces}
                        options={[
                            { label: __('Standard', 'roi'), value: 'standard' },
                            { label: __('Staunty', 'roi'), value: 'staunty' },
                        ]}
                        onChange={(value) => setAttributes({ pieces: value })}
                    />
                    <SelectControl
                        label={__('Couleur de l\'échiquier', 'roi')}
                        value={attributes.cssClass}
                        options={[
                            { label: __('Vert', 'roi'), value: 'green' },
                            { label: __('Classique', 'roi'), value: 'chessboard-js' },
                            { label: __('Club', 'roi'), value: 'chess-club' },
                            { label: __('Bleu', 'roi'), value: 'blue' },
                            { label: __('Noir et blanc', 'roi'), value: 'black-and-white' },
                        ]}
                        onChange={(value) => setAttributes({ cssClass: value })}
                    />
                </PanelBody>
                <PanelBody title={__('Mode de jeu', 'roi')}>
                    <SelectControl
                        label={__('Orientation', 'roi')}
                        value={attributes.orientation}
                        options={[
                            { label: __('Blancs', 'roi'), value: 'white' },
                            { label: __('Noirs', 'roi'), value: 'black' }
                        ]}
                        onChange={(value) => setAttributes({ orientation: value })}
                    />
                    <ToggleControl
                        label={__('Permettre de déplacer', 'roi')}
                        checked={isMovesEnabled}
                        onChange={(value) => setAttributes({ enableMoves: value ? 'true' : 'false' })}
                    />
                    <ToggleControl
                        label={__('Activer le moteur Stockfish', 'roi')}
                        checked={isEngineEnabled}
                        onChange={(value) => setAttributes({ enableEngine: value ? 'true' : 'false' })}
                        disabled={!fenValidation.isValid}
                        help={
                            !fenValidation.isValid
                                ? __('Le FEN doit être valide pour activer le moteur.', 'roi')
                                : ''
                        }
                    />
                    {isEngineEnabled && (
                        <RangeControl
                            className="elo-range-control"
                            label={`${__('Niveau', 'roi')} (ELO ${attributes.engineElo})`}
                            value={attributes.engineElo}
                            onChange={(value) => setAttributes({ engineElo: value })}
                            min={1200}
                            max={2800}
                            step={100}
                        />
                    )}
                </PanelBody>
            </InspectorControls>

            <SimpleFenEditor
                fen={attributes.fen}
                pieces={attributes.pieces}
                borderType={attributes.borderType}
                cssClass={attributes.cssClass}
                orientation={attributes.orientation}
                showCoordinates={attributes.showCoordinates}
                onChange={(newFen) => setAttributes({ fen: newFen })}
            />
        </div>
    );
}
