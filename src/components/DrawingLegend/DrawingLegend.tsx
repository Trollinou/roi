import React from 'react';

export interface DrawingLegendProps {
  className?: string;
}

/**
 * DrawingLegend - Encart "Aide au dessin" (annotations avec pastilles de couleur).
 *
 * Composant fonctionnel pur sans état (Dumb Component), partagé entre les éditeurs FEN et PGN.
 */
export function DrawingLegend({ className = 'drawing-legend' }: DrawingLegendProps): React.JSX.Element {
  return (
    <div className={className}>
      <div className="legend-title">✍️ Annotations (comme Lichess)</div>
      <div className="legend-grid">
        <div className="legend-item">
          <span className="legend-color-dot" style={{ backgroundColor: '#15ba3a' }} />
          <span><strong>Vert</strong> : Clic droit</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot" style={{ backgroundColor: '#e22222' }} />
          <span><strong>Rouge</strong> : Shift + Clic dr.</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot" style={{ backgroundColor: '#2072e2' }} />
          <span><strong>Bleu</strong> : Alt + Clic dr.</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot" style={{ backgroundColor: '#e8c005' }} />
          <span><strong>Jaune</strong> : Shift + Alt + Clic dr.</span>
        </div>
      </div>
    </div>
  );
}

export default DrawingLegend;
