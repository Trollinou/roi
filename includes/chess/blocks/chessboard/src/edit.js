import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl, ToggleControl, RangeControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component, useState } from '@wordpress/element';
import { Chess } from '../../../vendor/chess.js/chess.js';

// ========================================
// COMPOSANT PieceIcon
// ========================================
class PieceIcon extends Component {
    constructor(props) {
        super(props);
        this.svgRef = null;
    }

    componentDidMount() {
        this.drawPiece();
    }

    componentDidUpdate() {
        this.drawPiece();
    }

    drawPiece() {
        if (!this.svgRef) return;
        while (this.svgRef.firstChild) {
            this.svgRef.removeChild(this.svgRef.firstChild);
        }
        if (this.props.chessboard && this.props.chessboard.view) {
            this.props.chessboard.view.drawPiece(this.svgRef, this.props.pieceCode, { x: 0, y: 0 });
            setTimeout(() => {
                if (this.svgRef) {
                    const useElement = this.svgRef.querySelector('use');
                    if (useElement) {
                        useElement.removeAttribute('transform');
                    }
                }
            }, 0);
        }
    }

    render() {
        return (
            <svg
                ref={(ref) => { this.svgRef = ref; }}
                style={{
                    width: '40px',
                    height: '40px',
                }}
            />
        );
    }
}

// ========================================
// CLASSE SimpleFenEditor
// ========================================
class SimpleFenEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedPiece: null,
            chessboardLoaded: false,
            chess: new Chess(),
            fenError: null
        };
        this.editorRef = null;
        this.chessboard = null;
    }

    async componentDidMount() {
        this.state.chess.load(this.props.fen);
        await this.initChessboard();
    }

    componentWillUnmount() {
        if (this.chessboard) {
            this.chessboard.destroy();
        }
    }

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
        else if (prevProps.fen !== this.props.fen) {
            this.state.chess.load(this.props.fen);
            if (this.chessboard && this.state.chessboardLoaded) {
                try {
                    await this.chessboard.setPosition(this.props.fen, false);
                    this.addSquareClickHandlers();
                } catch (e) {
                    console.warn('FEN invalide:', e);
                }
            }
        }
    }

    async initChessboard() {
        if (!this.editorRef) return;
        if (this.chessboard) {
            this.chessboard.destroy();
        }
        try {
            const ChessboardModule = await import(/* webpackIgnore: true */ roiChessEditor.chessboardUrl);
            const { Chessboard, INPUT_EVENT_TYPE, BORDER_TYPE, COLOR } = ChessboardModule;

            this.chessboard = new Chessboard(this.editorRef, {
                position: this.state.chess.fen(),
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
                }
            });

            this.chessboard.enableMoveInput((event) => {
                switch (event.type) {
                    case INPUT_EVENT_TYPE.moveInputStarted:
                        return true;

                    case INPUT_EVENT_TYPE.validateMoveInput:
                        // In editor mode, we allow any piece placement.
                        return true;

                    case INPUT_EVENT_TYPE.moveInputFinished:
                        // `move` validates the move, which we don't want in the editor.
                        // We manually `get`, `remove`, and `put` the piece to simulate a move.
                        const piece = this.state.chess.get(event.squareFrom);
                        if (piece) {
                            this.state.chess.remove(event.squareFrom);
                            this.state.chess.put(piece, event.squareTo);
                            this.props.onChange(this.state.chess.fen());
                        }
                        break;

                    case INPUT_EVENT_TYPE.moveInputCanceled:
                        // Si l'annulation est due à un mouvement illégal
                        if (event.legal === false) {
                            // On peut choisir de ne rien faire ou de remettre la pièce à sa place.
                            // cm-chessboard le fait automatiquement.

                        } else { // Annulation par l'utilisateur (clic droit, etc.)
                            const piece = this.state.chess.get(event.squareFrom);
                            if(piece) {
                                this.state.chess.remove(event.squareFrom);
                                this.props.onChange(this.state.chess.fen());
                            }
                        }
                        break;
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

    addSquareClickHandlers() {
        if (!this.editorRef) return;
        const boardGroup = this.editorRef.querySelector('g.board.input-enabled');
        if (!boardGroup) {
            console.warn('g.board.input-enabled non trouvé');
            return;
        }
        boardGroup.style.cursor = 'pointer';
        boardGroup.replaceWith(boardGroup.cloneNode(true));
        const newBoardGroup = this.editorRef.querySelector('g.board.input-enabled');

        newBoardGroup.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.classList && target.classList.contains('square')) {
                const squareName = target.getAttribute('data-square');
                if (!squareName) return;

                if (this.state.selectedPiece) {
                    const piece = {
                        type: this.state.selectedPiece.charAt(1),
                        color: this.state.selectedPiece.charAt(0)
                    };
                    this.state.chess.put(piece, squareName);
                } else {
                    this.state.chess.remove(squareName);
                }

                const newFen = this.state.chess.fen();
                this.props.onChange(newFen);
                if (this.chessboard) {
                    this.chessboard.setPosition(newFen);
                }
            }
        });
    }

    clearBoard() {
        this.state.chess.clear();
        const newFen = this.state.chess.fen();
        this.props.onChange(newFen);
        if (this.chessboard) {
            this.chessboard.setPosition(newFen, false);
        }
    }

    render() {
        const whitePieces = [
            { code: 'wp', label: 'Pion blanc' },
            { code: 'wn', label: 'Cavalier blanc' },
            { code: 'wb', label: 'Fou blanc' },
            { code: 'wr', label: 'Tour blanche' },
            { code: 'wq', label: 'Dame blanche' },
            { code: 'wk', label: 'Roi blanc' }
        ];
        const blackPieces = [
            { code: 'bp', label: 'Pion noir' },
            { code: 'bn', label: 'Cavalier noir' },
            { code: 'bb', label: 'Fou noir' },
            { code: 'br', label: 'Tour noire' },
            { code: 'bq', label: 'Dame noire' },
            { code: 'bk', label: 'Roi noir' }
        ];
        const pieceButtonStyle = {
            padding: '0',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        };

        return (
            <div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '6px',
                        marginBottom: '15px',
                        padding: '10px',
                        backgroundColor: '#2c3338',
                        borderRadius: '4px'
                    }}
                >
                    {blackPieces.map(piece =>
                        <button
                            key={piece.code}
                            className={`button ${this.state.selectedPiece === piece.code ? 'is-primary roi-chess-piece-selected' : ''}`}
                            onClick={() => {
                                this.setState({ selectedPiece: this.state.selectedPiece === piece.code ? null : piece.code });
                            }}
                            title={piece.label}
                            style={pieceButtonStyle}
                        >
                            <PieceIcon pieceCode={piece.code} chessboard={this.chessboard} />
                        </button>
                    )}
                </div>

                <div
                    ref={(ref) => { this.editorRef = ref; }}
                    style={{
                        maxWidth: '500px',
                        margin: '0 auto',
                        cursor: this.state.selectedPiece ? 'copy' : 'default'
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: '#f0f0f1',
                        borderRadius: '4px'
                    }}
                >
                    {whitePieces.map(piece =>
                        <button
                            key={piece.code}
                            className={`button ${this.state.selectedPiece === piece.code ? 'is-primary roi-chess-piece-selected' : ''}`}
                            onClick={() => {
                                this.setState({ selectedPiece: this.state.selectedPiece === piece.code ? null : piece.code });
                            }}
                            title={piece.label}
                            style={pieceButtonStyle}
                        >
                            <PieceIcon pieceCode={piece.code} chessboard={this.chessboard} />
                        </button>
                    )}
                </div>

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
                        onClick={() => {
                            this.state.chess.reset();
                            this.props.onChange(this.state.chess.fen());
                        }}
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
                    {__('💡 Cliquez sur une pièce puis sur une case pour la placer. Glissez-déposez pour déplacer. Glissez en dehors pour supprimer.', 'roi')}
                </p>
            </div>
        );
    }
}


export default function Edit(props) {
    const { attributes, setAttributes } = props;
    const isEngineEnabled = attributes.enableEngine === 'true';
    const isMovesEnabled = attributes.enableMoves === 'true';
    const blockProps = useBlockProps();
    const [fenError, setFenError] = useState(null);
    const [fenSuccess, setFenSuccess] = useState(false);

    const handleFenChange = (newFen) => {
        try {
            const chess = new Chess(newFen);
            setAttributes({ fen: chess.fen() });
            setFenError(null);
            setFenSuccess(true);
            setTimeout(() => setFenSuccess(false), 2000);
        } catch (e) {
            // Ne mettez pas à jour l'attribut avec un FEN invalide
            setFenError(__('FEN invalide', 'roi'));
            setFenSuccess(false);
        }
    };

    return (
        <div {...blockProps}>
            <InspectorControls>
                <PanelBody title={__('Configuration', 'roi')}>
                    <TextControl
                        label={__('Position FEN', 'roi')}
                        value={attributes.fen}
                        onChange={handleFenChange}
                        help={__('Modifiable visuellement ci-dessous', 'roi')}
                        className={fenSuccess ? 'is-success' : ''}
                    />
                    {fenError && <p style={{ color: 'red' }}>{fenError}</p>}
                    {fenSuccess && <p style={{ color: 'green' }}>{__('FEN valide', 'roi')}</p>}
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
