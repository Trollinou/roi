import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl, ToggleControl, RangeControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import metadata from './block.json';


// ========================================
// CLASSE SimpleFenEditor
// ========================================
class SimpleFenEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedPiece: null,
            chessboardLoaded: false
        };
        this.editorRef = null;
        this.chessboard = null;
    }

    async componentDidMount() {
        await this.initChessboard();
    }

    componentWillUnmount() {
        if (this.chessboard) {
            this.chessboard.destroy();
        }
    }

    async componentDidUpdate(prevProps) {
        if (this.chessboard && this.state.chessboardLoaded) {
            if (prevProps.fen !== this.props.fen) {
                try {
                    await this.chessboard.setPosition(this.props.fen, false);
                    this.addSquareClickHandlers();
                } catch (e) {
                    console.warn('FEN invalide:', e);
                }
            } else if (
                prevProps.pieces !== this.props.pieces ||
                prevProps.borderType !== this.props.borderType ||
                prevProps.cssClass !== this.props.cssClass
            ) {
                await this.initChessboard();
            }
        }
    }

    completeFen(partialFen) {
        const tokens = partialFen.trim().split(/\s+/);
        if (tokens.length === 6) {
            return partialFen;
        }
        return partialFen + ' w KQkq - 0 1';
    }

    async initChessboard() {
        if (!this.editorRef) return;

        if (this.chessboard) {
            this.chessboard.destroy();
        }

        try {
            const ChessboardModule = await import(/* webpackIgnore: true */ roiChessEditor.chessboardUrl);
            const { Chessboard, INPUT_EVENT_TYPE, BORDER_TYPE } = ChessboardModule;

            this.chessboard = new Chessboard(this.editorRef, {
                position: this.props.fen,
                assetsUrl: roiChessEditor.assetsUrl,
                style: {
                    aspectRatio: 1,
                    borderType: BORDER_TYPE[this.props.borderType.toUpperCase()],
                    pieces: { file: `pieces/${this.props.pieces}.svg` },
                    cssClass: this.props.cssClass,
                }
            });

            this.chessboard.enableMoveInput((event) => {
                if (event.type === INPUT_EVENT_TYPE.movingOverSquare) {
                    return;
                }

                if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
                    return true;
                }

                if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
                    return true;
                }

                if (event.type === INPUT_EVENT_TYPE.moveInputCanceled) {
                    console.log('Mouvement annulé, suppression de la pièce');
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

            setTimeout(() => {
                this.addSquareClickHandlers();
                this.setState({ chessboardLoaded: true });
            }, 500);

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
                    this.chessboard.setPiece(squareName, this.state.selectedPiece);
                }

                setTimeout(() => {
                    const partialFen = this.chessboard.getPosition();
                    const completeFen = this.completeFen(partialFen);
                    this.props.onChange(completeFen);
                }, 10);
            }
        });

        console.log('Écouteur de clic ajouté');
    }

    clearBoard() {
        if (this.chessboard) {
            this.chessboard.setPosition('8/8/8/8/8/8/8/8 w - - 0 1', false).then(() => {
                const partialFen = this.chessboard.getPosition();
                const completeFen = this.completeFen(partialFen);
                this.props.onChange(completeFen);
            });
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

        const pieceImageUrl = (pieceCode) => {
            return `${roiChessEditor.assetsUrl}pieces/${this.props.pieces}/${pieceCode}.svg`;
        };

        const pieceButtonStyle = {
            padding: '8px',
            minWidth: '50px',
            height: '50px',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundSize: '80%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
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
                            className={`button ${this.state.selectedPiece === piece.code ? 'button-primary' : ''}`}
                            onClick={() => {
                                this.setState({ selectedPiece: this.state.selectedPiece === piece.code ? null : piece.code });
                            }}
                            title={piece.label}
                            style={{ ...pieceButtonStyle, backgroundImage: `url(${pieceImageUrl(piece.code)})` }}
                        />
                    )}
                </div>

                <div
                    ref={(ref) => { this.editorRef = ref; }}
                    style={{
                        maxWidth: '500px',
                        margin: '0 auto'
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
                            className={`button ${this.state.selectedPiece === piece.code ? 'button-primary' : ''}`}
                            onClick={() => {
                                this.setState({ selectedPiece: this.state.selectedPiece === piece.code ? null : piece.code });
                            }}
                            title={piece.label}
                            style={{ ...pieceButtonStyle, backgroundImage: `url(${pieceImageUrl(piece.code)})` }}
                        />
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
                    {__('💡 Cliquez sur une pièce puis sur une case pour la placer. Glissez-déposez pour déplacer. Glissez en dehors pour supprimer.', 'roi')}
                </p>
            </div>
        );
    }
}

// ========================================
// ENREGISTREMENT DU BLOC
// ========================================
registerBlockType(metadata.name, {
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const isEngineEnabled = attributes.enableEngine === 'true';
        const isMovesEnabled = attributes.enableMoves === 'true';

        return (
            <div className='wp-block-roi-chessboard'>
                <InspectorControls>
                    <PanelBody title={__('Configuration', 'roi')}>
                        <TextControl
                            label={__('Position FEN', 'roi')}
                            value={attributes.fen}
                            onChange={(value) => setAttributes({ fen: value })}
                            help={__('Modifiable visuellement ci-dessous', 'roi')}
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
                        <ToggleControl
                            label={__('Activer le moteur Stockfish', 'roi')}
                            checked={isEngineEnabled}
                            onChange={(value) => setAttributes({ enableEngine: value ? 'true' : 'false' })}
                        />
                        <ToggleControl
                            label={__('Permettre de déplacer', 'roi')}
                            checked={isMovesEnabled}
                            onChange={(value) => setAttributes({ enableMoves: value ? 'true' : 'false' })}
                        />
                        {isEngineEnabled && (
                            <SelectControl
                                label={__('Couleur', 'roi')}
                                value={attributes.playerColor}
                                options={[
                                    { label: __('Blancs', 'roi'), value: 'white' },
                                    { label: __('Noirs', 'roi'), value: 'black' }
                                ]}
                                onChange={(value) => setAttributes({ playerColor: value })}
                            />
                        )}
                        {isEngineEnabled && (
                            <RangeControl
                                label={__('Niveau', 'roi')}
                                value={parseInt(attributes.engineLevel)}
                                onChange={(value) => setAttributes({ engineLevel: value.toString() })}
                                min={0}
                                max={20}
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
    },

    save: () => {
        return null;
    }
});
