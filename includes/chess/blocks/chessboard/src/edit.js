/**
 * @file This file contains the editor component for the Chessboard Gutenberg block.
 * @author Your Name
 * @version 1.0.0
 */

import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl, ToggleControl, RangeControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component, useEffect, useState } from '@wordpress/element';
import { PieceSelectionDialog, PIECE_SELECTION_DIALOG_RESULT_TYPE } from './extensions/PieceSelectionDialog.js';

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
        this.clickTimeout = null;
    }

    /**
     * Initializes the chessboard when the component mounts.
     */
    async componentDidMount() {
        await this.initChessboard();
    }

    /**
     * Destroys the chessboard instance when the component unmounts.
     */
    componentWillUnmount() {
        if (this.chessboard) {
            this.chessboard.destroy();
        }
    }

    /**
     * Handles component updates, re-initializing the board on style changes
     * or updating the position if the FEN string changes.
     * @param {object} prevProps - The previous props.
     * @param {object} prevState - The previous state.
     */
    async componentDidUpdate(prevProps, prevState) {
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
                ],
            });

            this.chessboard.enableMoveInput((event) => {
                if (event.type === INPUT_EVENT_TYPE.movingOverSquare) {
                    if (this.clickTimeout) {
                        clearTimeout(this.clickTimeout);
                        this.clickTimeout = null;
                    }
                    return;
                }
                if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
                    if (this.chessboard.isPieceSelectionDialogShown()) {
                        return false;
                    }
                    return true;
                }
                if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
                    return true;
                }
                if (event.type === INPUT_EVENT_TYPE.moveInputCanceled) {
                    this.chessboard.setPiece(event.squareFrom, null);
                    setTimeout(() => {
                        const partialFen = this.chessboard.getPosition();
                        const completeFen = this.completeFen(partialFen);
                        this.props.onChange(completeFen);
                    }, 10);
                    return;
                }
                if (event.type === INPUT_EVENT_TYPE.moveInputFinished) {
                    setTimeout(() => {
                        const partialFen = this.chessboard.getPosition();
                        const completeFen = this.completeFen(partialFen);
                        this.props.onChange(completeFen);
                    }, 10);
                }
            });

            this.chessboard.enableSquareSelect((event) => {
                if (this.chessboard.isPieceSelectionDialogShown()) {
                    return;
                }
                if (this.clickTimeout) {
                    clearTimeout(this.clickTimeout);
                }
                this.clickTimeout = setTimeout(() => {
                    this.chessboard.showPieceSelectionDialog(event.square, (result) => {
                        if (result.type === PIECE_SELECTION_DIALOG_RESULT_TYPE.pieceSelected) {
                            this.chessboard.setPiece(result.square, result.piece);
                            setTimeout(() => {
                                const partialFen = this.chessboard.getPosition();
                                const completeFen = this.completeFen(partialFen);
                                this.props.onChange(completeFen);
                            }, 10);
                        }
                    });
                }, 200);
            });

            this.setState({ chessboardLoaded: true });

        } catch (error) {
            console.error('Erreur chargement échiquier:', error);
            if (this.editorRef) {
                this.editorRef.innerHTML = '<div style="padding: 20px; text-align: center; background: #fee; border-radius: 4px; color: #c00;">⚠️ Erreur de chargement</div>';
            }
        }
    }

    /**
     * Clears all pieces from the board.
     */
    clearBoard() {
        if (this.chessboard) {
            this.props.onChange('8/8/8/8/8/8/8/8 w - - 0 1');
        }
    }

    /**
     * Renders the FEN editor interface, including piece selection palettes
     * and the chessboard itself.
     * @returns {JSX.Element} The rendered component.
     */
    render() {
        return (
            <div>
                <div
                    ref={(ref) => { this.editorRef = ref; }}
                    style={{
                        maxWidth: '500px',
                        margin: '0 auto',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        marginTop: '15px'
                    }}
                >
                    <Button
                        isSecondary
                        onClick={() => this.clearBoard()}
                    >
                        {__('Vider l\'échiquier', 'roi')}
                    </Button>

                    <Button
                        isSecondary
                        onClick={() => this.props.onChange('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')}
                    >
                        {__('Position initiale', 'roi')}
                    </Button>
                </div>

                <p
                    style={{
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#646970',
                        marginTop: '15px',
                        fontStyle: 'italic'
                    }}
                >
                    {__('💡 Cliquez sur une case pour choisir une pièce. Glissez-déposez pour déplacer. Glissez en dehors pour supprimer.', 'roi')}
                </p>
            </div>
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

    return (
        <div {...blockProps}>
            <InspectorControls>
                <PanelBody title={__('Configuration', 'roi')}>
                    <TextControl
                        label={__('Position FEN', 'roi')}
                        value={attributes.fen}
                        onChange={(value) => setAttributes({ fen: value })}
                        help={
                            !fenValidation.isValid ? (
                                <span style={{ color: 'red' }}>{fenValidation.error}</span>
                            ) : (
                                __('Modifiable visuellement ci-dessous', 'roi')
                            )
                        }
                    />
                     <SelectControl
                        label={__('Trait', 'roi')}
                        value={attributes.turn}
                        options={[
                            { label: __('Aux Blancs', 'roi'), value: 'w' },
                            { label: __('Aux Noirs', 'roi'), value: 'b' }
                        ]}
                        onChange={(value) => setAttributes({ turn: value })}
                        help={__('Qui doit jouer le prochain coup ?', 'roi')}
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

            <div
                style={{
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px solid #0073aa'
                }}
            >
                <h3
                    style={{
                        textAlign: 'center',
                        marginTop: '0',
                        marginBottom: '15px'
                    }}
                >
                    {__('📝 Éditeur de position', 'roi')}
                </h3>

                <SimpleFenEditor
                    fen={attributes.fen}
                    pieces={attributes.pieces}
                    borderType={attributes.borderType}
                    cssClass={attributes.cssClass}
                    orientation={attributes.orientation}
                    showCoordinates={attributes.showCoordinates}
                    onChange={(newFen) => setAttributes({ fen: newFen })}
                />

                <div
                    style={{
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                    }}
                >
                    {attributes.fen}
                </div>

                <div
                    style={{
                        marginTop: '10px',
                        textAlign: 'center',
                        fontSize: '13px'
                    }}
                >
                    <strong>
                        {isEngineEnabled ? '🎮 Jeu vs IA' :
                            isMovesEnabled ? '✏️ Exercice' :
                                '👁️ Démo'
                        }
                    </strong>
                </div>
            </div>
        </div>
    );
}
