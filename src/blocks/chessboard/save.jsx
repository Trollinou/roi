import React from 'react';
import { useBlockProps } from '@wordpress/block-editor';

export default function Save({ attributes }) {
  const showBar = attributes.useStockfish && attributes.showEvaluationBar;
  const blockProps = useBlockProps.save({
    className: `chessboard-block ${
      showBar ? 'has-evaluation-bar' : ''
    }`,
    'data-fen': attributes.fen,
    'data-orientation': attributes.orientation,
    'data-coordinates': attributes.coordinates,
    'data-view-only': attributes.viewOnly,
    'data-player-color': attributes.playerColor,
    'data-show-threats': attributes.showThreats,
    'data-use-stockfish': attributes.useStockfish,
    'data-stockfish-elo': attributes.stockfishElo,
    'data-show-evaluation-bar': attributes.showEvaluationBar,
    'data-free-mode': attributes.freeMode,
    'data-clock-preset': attributes.clockPreset || 'none',
    'data-show-material-indicator': attributes.showMaterialIndicator !== false,
  });

  return (
    <div {...blockProps}>
      <section className={`main-wrap ${showBar ? 'has-evaluation-bar' : ''}`}>
        <div
          className="captured-clock-top captured-bar"
          style={{
            display:
              attributes.showMaterialIndicator !== false ||
              (attributes.clockPreset && attributes.clockPreset !== 'none')
                ? 'flex'
                : 'none',
          }}
        >
          <div
            className="material-wrapper opponent-material"
            style={{ display: attributes.showMaterialIndicator !== false ? 'block' : 'none' }}
          ></div>
          <div className="player-info">Adversaire</div>
          <span className="captured-pieces-clock-opp captured-pieces"></span>
          <div
            className="game-clock opponent-clock"
            style={{
              display:
                attributes.clockPreset && attributes.clockPreset !== 'none'
                  ? 'block'
                  : 'none',
            }}
          >
            --:--
          </div>
        </div>
        <div className="main-board">
          <div className="chessboard-mount-element"></div>
          {showBar && (
            <div className="evaluation-bar">
              <div
                className="evaluation-bar-fill"
                style={{
                  marginTop: attributes.orientation === 'white' ? 'auto' : '0',
                  marginBottom:
                    attributes.orientation === 'white' ? '0' : 'auto',
                }}
              ></div>
            </div>
          )}
          {!attributes.viewOnly && attributes.useStockfish && (
            <div className="chess-config-dialog">
              <div className="config-dialog-content">
                <div className="color-selector">
                  <button
                    type="button"
                    className={`color-btn white${(attributes.playerColor === 'white' || !attributes.playerColor) ? ' active' : ''}`}
                    data-color="white"
                  >
                    Blancs
                  </button>
                  <button
                    type="button"
                    className={`color-btn random${attributes.playerColor === 'both' ? ' active' : ''}`}
                    data-color="random"
                  >
                    Aléatoire
                  </button>
                  <button
                    type="button"
                    className={`color-btn black${attributes.playerColor === 'black' ? ' active' : ''}`}
                    data-color="black"
                  >
                    Noirs
                  </button>
                </div>
                
                {/* Sélecteur de cadence (Pendule) */}
                <div className="cadence-selector">
                  <label>Cadence :</label>
                  <select className="cadence-select">
                    <option value="none" selected={attributes.clockPreset === 'none' || !attributes.clockPreset}>Sans pendule</option>
                    <option value="1+0" selected={attributes.clockPreset === '1+0'}>1 min (Bullet)</option>
                    <option value="3+2" selected={attributes.clockPreset === '3+2'}>3 min + 2 s (Blitz)</option>
                    <option value="5+0" selected={attributes.clockPreset === '5+0'}>5 min KO (Blitz)</option>
                    <option value="10+5" selected={attributes.clockPreset === '10+5'}>10 min + 5 s (Rapide)</option>
                    <option value="15+10" selected={attributes.clockPreset === '15+10'}>15 min + 10 s (Rapide)</option>
                  </select>
                </div>

                <div className="difficulty-selector" style={{ marginTop: '12px' }}>
                  <label>
                    Difficulté :{' '}
                    <span className="elo-value">
                      {attributes.stockfishElo || 1500}
                    </span>{' '}
                    ELO
                  </label>
                  <input
                    type="range"
                    className="elo-slider"
                    min="1320"
                    max="2800"
                    defaultValue={attributes.stockfishElo || 1500}
                  />
                </div>
                <button type="button" className="start-btn">
                  Commencer
                </button>
              </div>
            </div>
          )}
        </div>
        <div
          className="captured-clock-bottom captured-bar"
          style={{
            display:
              attributes.showMaterialIndicator !== false ||
              (attributes.clockPreset && attributes.clockPreset !== 'none')
                ? 'flex'
                : 'none',
          }}
        >
          <div
            className="material-wrapper player-material"
            style={{ display: attributes.showMaterialIndicator !== false ? 'block' : 'none' }}
          ></div>
          <div className="player-info">Toi</div>
          <span className="captured-pieces-clock-player captured-pieces"></span>
          <div
            className="game-clock player-clock"
            style={{
              display:
                attributes.clockPreset && attributes.clockPreset !== 'none'
                  ? 'block'
                  : 'none',
            }}
          >
            --:--
          </div>
        </div>
        {!attributes.viewOnly && (
          <>
            <div className="chess-status">À vous de jouer</div>
            {!attributes.freeMode && (
              <div className="chess-controls">
                <button type="button" className="control-btn new-game">
                  Nouvelle partie
                </button>
                <button type="button" className="control-btn flip-board">
                  Retourner
                </button>
                <button type="button" className="control-btn undo-move">
                  Annuler
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
