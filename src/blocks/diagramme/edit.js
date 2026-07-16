import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function Edit( { attributes, setAttributes, isSelected } ) {
  const blockProps = useBlockProps();
  const RoiFenEditor = window.RoiFenEditor;

  const handleSave = ( data ) => {
    if ( typeof data === 'object' && data !== null ) {
      setAttributes( {
        fen: data.fen !== undefined ? data.fen : attributes.fen,
        orientation: data.orientation !== undefined ? data.orientation : attributes.orientation,
      } );
    } else if ( typeof data === 'string' ) {
      setAttributes( { fen: data } );
    }
  };

  if ( isSelected && RoiFenEditor ) {
    return (
      <div { ...blockProps }>
        <RoiFenEditor
          fen={ attributes.fen }
          orientation={ attributes.orientation }
          onSave={ handleSave }
        />
      </div>
    );
  }

  // Preview / Placeholder mode
  return (
    <div { ...blockProps } className="roi-bloc-diagramme-placeholder" style={ { padding: '20px', border: '1px dashed #ccc', background: '#f9f9f9', textAlign: 'center' } }>
      <h4>{ __( 'Diagramme ROI', 'roi' ) }</h4>
      <p style={ { fontSize: '12px', color: '#666', wordBreak: 'break-all' } }>
        <strong>{ __( 'FEN :', 'roi' ) }</strong> { attributes.fen }
      </p>
      <p style={ { fontSize: '12px', color: '#666' } }>
        <strong>{ __( 'Orientation :', 'roi' ) }</strong> { attributes.orientation }
      </p>
      { ! RoiFenEditor && (
        <p style={ { color: 'red', fontSize: '11px' } }>
          { __( 'Attention : window.RoiFenEditor non disponible.', 'roi' ) }
        </p>
      ) }
      <p style={ { fontSize: '11px', color: '#999', marginTop: '10px' } }>
        { __( 'Sélectionnez le bloc pour éditer le diagramme.', 'roi' ) }
      </p>
    </div>
  );
}
