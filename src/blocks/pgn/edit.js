import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function Edit( { attributes, setAttributes, isSelected } ) {
  const blockProps = useBlockProps();
  const RoiPgnEditor = window.RoiPgnEditor;

  const handleSave = ( newPgn ) => {
    setAttributes( { pgn: newPgn } );
  };

  if ( isSelected && RoiPgnEditor ) {
    return (
      <div { ...blockProps }>
        <RoiPgnEditor
          initialPgn={ attributes.pgn }
          onSave={ handleSave }
        />
      </div>
    );
  }

  // Preview / Placeholder mode
  return (
    <div { ...blockProps } className="roi-bloc-pgn-placeholder" style={ { padding: '20px', border: '1px dashed #ccc', background: '#f9f9f9', textAlign: 'center' } }>
      <h4>{ __( 'Partie PGN ROI', 'roi' ) }</h4>
      <p style={ { fontSize: '12px', color: '#666', wordBreak: 'break-all', maxHeight: '100px', overflow: 'hidden', textOverflow: 'ellipsis' } }>
        <strong>{ __( 'PGN :', 'roi' ) }</strong> { attributes.pgn || __( 'Aucune partie chargée.', 'roi' ) }
      </p>
      { ! RoiPgnEditor && (
        <p style={ { color: 'red', fontSize: '11px' } }>
          { __( 'Attention : window.RoiPgnEditor non disponible.', 'roi' ) }
        </p>
      ) }
      <p style={ { fontSize: '11px', color: '#999', marginTop: '10px' } }>
        { __( 'Sélectionnez le bloc pour charger/éditer le PGN.', 'roi' ) }
      </p>
    </div>
  );
}
