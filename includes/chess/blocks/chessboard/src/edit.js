import { __ } from '@wordpress/i18n';
import {
    InspectorControls,
    useBlockProps,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    SelectControl,
    ToggleControl,
    RangeControl,
    ExternalLink,
} from '@wordpress/components';

const getEloLabel = (level) => {
    const eloMap = [
        '100–400', '400–600', '600–800', '800–1000', '1000–1200',
        '1200–1400', '1400–1600', '1600–1800', '1800–2000', '2000–2200',
        '2200–2300', '2300–2400', '2400–2500', '2500–2600', '2600–2700',
        '2700–2800', '2800–2900', '2900–3000', '3000–3100', '3100–3200',
        '3200+'
    ];
    return eloMap[level] || level;
};

export default function Edit({ attributes, setAttributes }) {
    const {
        fen,
        playerColor,
        engineLevel,
        enableEngine,
        enableMoves,
    } = attributes;

    const blockProps = useBlockProps();

    // Convertir les strings en booleans pour les toggles
    const isEngineEnabled = enableEngine === 'true';
    const isMovesEnabled = enableMoves === 'true';

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Configuration de l\'échiquier', 'roi')}>
                    <TextControl
                        label={__('Position FEN', 'roi')}
                        value={fen}
                        onChange={(value) => setAttributes({ fen: value })}
                        help={
                            <>
                                {__('Notation FEN de la position', 'roi')}
                                {' '}
                                <ExternalLink href="https://lichess.org/editor">
                                    {__('Éditeur de position', 'roi')}
                                </ExternalLink>
                            </>
                        }
                    />
                </PanelBody>

                <PanelBody title={__('Mode de jeu', 'roi')}>
                    <ToggleControl
                        label={__('Activer le moteur Stockfish', 'roi')}
                        checked={isEngineEnabled}
                        onChange={(value) =>
                            setAttributes({ enableEngine: value ? 'true' : 'false' })
                        }
                        help={__('Permet de jouer contre l\'ordinateur', 'roi')}
                    />

                    <ToggleControl
                        label={__('Permettre de déplacer les pièces', 'roi')}
                        checked={isMovesEnabled}
                        onChange={(value) =>
                            setAttributes({ enableMoves: value ? 'true' : 'false' })
                        }
                        help={__('Mode exercice ou démonstration', 'roi')}
                    />

                    {isEngineEnabled && (
                        <>
                            <SelectControl
                                label={__('Couleur du joueur', 'roi')}
                                value={playerColor}
                                options={[
                                    { label: __('Blancs', 'roi'), value: 'white' },
                                    { label: __('Noirs', 'roi'), value: 'black' },
                                ]}
                                onChange={(value) => setAttributes({ playerColor: value })}
                            />

                            <RangeControl
                                className="elo-range-control"
                                label={`${__('Niveau du moteur', 'roi')} (ELO ${getEloLabel(parseInt(engineLevel))})`}
                                value={parseInt(engineLevel)}
                                onChange={(value) =>
                                    setAttributes({ engineLevel: value.toString() })
                                }
                                min={0}
                                max={20}
                            />
                        </>
                    )}
                </PanelBody>

                <PanelBody title={__('Exemples de positions', 'roi')} initialOpen={false}>
                    <div style={{ marginBottom: '10px' }}>
                        <button
                            className="button button-secondary"
                            onClick={() =>
                                setAttributes({
                                    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                })
                            }
                        >
                            {__('Position initiale', 'roi')}
                        </button>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <button
                            className="button button-secondary"
                            onClick={() =>
                                setAttributes({
                                    fen: '8/8/8/8/8/8/8/4K3 w - - 0 1',
                                    enableEngine: 'false',
                                    enableMoves: 'true',
                                })
                            }
                        >
                            {__('Exercice - Roi seul', 'roi')}
                        </button>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <button
                            className="button button-secondary"
                            onClick={() =>
                                setAttributes({
                                    fen: '8/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1',
                                    enableEngine: 'false',
                                    enableMoves: 'true',
                                })
                            }
                        >
                            {__('Exercice - Pièces blanches', 'roi')}
                        </button>
                    </div>
                    <div>
                        <button
                            className="button button-secondary"
                            onClick={() =>
                                setAttributes({
                                    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
                                    enableEngine: 'true',
                                    enableMoves: 'true',
                                })
                            }
                        >
                            {__('Partie italienne', 'roi')}
                        </button>
                    </div>
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div
                    style={{
                        border: '2px dashed #ccc',
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f5f5f5',
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>♟️</div>
                    <h3 style={{ margin: '10px 0' }}>
                        {__('Échiquier interactif', 'roi')}
                    </h3>
                    <p style={{ margin: '10px 0', color: '#666' }}>
                        {isEngineEnabled && isMovesEnabled && (
                            <strong>{__('Mode : Jouer contre l\'ordinateur', 'roi')}</strong>
                        )}
                        {!isEngineEnabled && isMovesEnabled && (
                            <strong>{__('Mode : Exercice libre', 'roi')}</strong>
                        )}
                        {!isEngineEnabled && !isMovesEnabled && (
                            <strong>{__('Mode : Démonstration (lecture seule)', 'roi')}</strong>
                        )}
                    </p>
                    <p style={{ margin: '10px 0', fontSize: '12px', color: '#999' }}>
                        {__('Position :', 'roi')} <code>{fen.substring(0, 30)}...</code>
                    </p>
                    <p style={{ margin: '10px 0', fontSize: '12px', fontStyle: 'italic' }}>
                        {__('L\'échiquier s\'affichera sur le site', 'roi')}
                    </p>
                </div>
            </div>
        </>
    );
}
