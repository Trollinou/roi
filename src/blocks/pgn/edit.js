import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import RoiPgnEditor from '../../components/PgnEditor';
import { BoardCore as EgBoardCore } from 'eg-chessboard';

export default function Edit( { attributes, setAttributes, isSelected, clientId } ) {
  const previewBoardRef = useRef( null );
  const previewInstanceRef = useRef( null );
  const editorRef = useRef( null ); // Ref vers l'instance RoiPgnEditor pour redrawBoard()

  const handleMouseDownCapture = () => {
    // Forcer le recalcul des bounds Chessground AVANT que Gutenberg traite l'événement.
    // Nécessaire car la toolbar Gutenberg décale la position du bloc dans l'iFrame
    // après le premier rendu, invalidant les coordonnées mémoïsées par Chessground.
    if ( editorRef.current && typeof editorRef.current.redrawBoard === 'function' ) {
      editorRef.current.redrawBoard();
    }
    if ( window.wp?.data?.dispatch && clientId ) {
      window.wp.data.dispatch( 'core/block-editor' ).selectBlock( clientId );
    }
  };

  const handleSave = ( newPgn ) => {
    setAttributes( { pgn: newPgn } );
  };

  // Preview Board Initialization (when not selected)
  useEffect( () => {
    if ( ! isSelected && previewBoardRef.current && EgBoardCore ) {
      // Clean up previous preview if any
      if ( previewInstanceRef.current && previewInstanceRef.current.board ) {
        previewInstanceRef.current.board.destroy();
        previewInstanceRef.current = null;
      }

      const config = {
        pgn: attributes.pgn,
        orientation: 'white',
        coordinates: true,
        viewOnly: true,
        movable: {
          free: false,
          color: 'none',
        },
        draggable: {
          enabled: false,
        },
        drawable: {
          enabled: true,
        },
      };

      const boardState = {
        showThreats: false,
        freeMode: false,
        promotionDialogState: { isEnabled: false },
        historyViewerState: { isEnabled: false },
      };

      const boardAPI = new EgBoardCore(
        previewBoardRef.current,
        boardState,
        () => {},
        () => {},
        config,
        {
          whiteMode: 'disabled',
          blackMode: 'disabled',
        }
      );

      previewInstanceRef.current = boardAPI;

      if ( attributes.pgn ) {
        try {
          boardAPI.loadPgn( attributes.pgn );
        } catch ( e ) {
          console.warn( 'Error loading PGN for preview:', e );
        }
      }

      return () => {
        if ( boardAPI.board ) {
          boardAPI.board.destroy();
        }
      };
    }
  }, [ isSelected, attributes.pgn ] );

  const blockProps = useBlockProps( {
    className: isSelected ? '' : 'roi-bloc-pgn-placeholder',
    style: isSelected ? {} : { padding: '15px', border: '1px dashed #ccc', background: '#f9f9f9', textAlign: 'center', cursor: 'pointer' }
  } );

  if ( isSelected && RoiPgnEditor ) {
    return (
      <div { ...blockProps } onMouseDownCapture={ handleMouseDownCapture }>
        <RoiPgnEditor
          ref={ editorRef }
          initialPgn={ attributes.pgn }
          onSave={ handleSave }
        />
      </div>
    );
  }

  // Preview Mode
  return (
    <div { ...blockProps } onMouseDownCapture={ handleMouseDownCapture }>
      <div style={ { pointerEvents: 'none' } }>
        <h4 style={ { margin: '0 0 10px 0' } }>{ __( 'Partie PGN ROI (Prévisualisation)', 'roi' ) }</h4>
        
        { attributes.pgn ? (
          <div style={ { width: '320px', height: '320px', margin: '0 auto 10px auto', position: 'relative' } }>
            <div ref={ previewBoardRef } style={ { width: '100%', height: '100%' } } />
          </div>
        ) : (
          <p style={ { fontSize: '12px', color: '#666', fontStyle: 'italic', margin: '15px 0' } }>
            { __( 'Aucune partie chargée.', 'roi' ) }
          </p>
        ) }

        <p style={ { fontSize: '11px', color: '#888', margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' } }>
          <strong>{ __( 'PGN :', 'roi' ) }</strong> { attributes.pgn || __( 'Vide', 'roi' ) }
        </p>
        { ! RoiPgnEditor && (
          <p style={ { color: 'red', fontSize: '11px', margin: '5px 0 0 0' } }>
            { __( 'Attention : window.RoiPgnEditor non disponible.', 'roi' ) }
          </p>
        ) }
      </div>
    </div>
  );
}
