import { useBlockProps } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import RoiFenEditor from '../../components/FenEditor';
import { BoardCore as EgBoardCore } from 'eg-chessboard';

export default function Edit( {
	attributes,
	setAttributes,
	isSelected,
	clientId,
} ) {
	const previewBoardRef = useRef( null );
	const previewInstanceRef = useRef( null );
	const editorRef = useRef( null ); // Ref vers l'instance RoiFenEditor pour redrawBoard()

	const handleMouseDownCapture = () => {
		// Forcer le recalcul des bounds Chessground AVANT que Gutenberg traite l'événement.
		// Nécessaire car la toolbar Gutenberg décale la position du bloc dans l'iFrame
		// après le premier rendu, invalidant les coordonnées mémoïsées par Chessground.
		if (
			editorRef.current &&
			typeof editorRef.current.redrawBoard === 'function'
		) {
			editorRef.current.redrawBoard();
		}
		if ( window.wp?.data?.dispatch && clientId ) {
			window.wp.data
				.dispatch( 'core/block-editor' )
				.selectBlock( clientId );
		}
	};

	const handleSave = ( data ) => {
		if ( typeof data === 'object' && data !== null ) {
			setAttributes( {
				fen: data.fen !== undefined ? data.fen : attributes.fen,
				orientation:
					data.orientation !== undefined
						? data.orientation
						: attributes.orientation,
				shapes:
					data.shapes !== undefined ? data.shapes : attributes.shapes,
			} );
		} else if ( typeof data === 'string' ) {
			setAttributes( { fen: data } );
		}

		// Sortir du mode édition en désélectionnant le bloc dans Gutenberg
		if ( window.wp?.data?.dispatch ) {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		}
	};

	// Preview Board Initialization (when not selected)
	useEffect( () => {
		if ( ! isSelected && previewBoardRef.current && EgBoardCore ) {
			// Clean up previous preview if any
			if ( previewInstanceRef.current ) {
				previewInstanceRef.current.destroy();
				previewInstanceRef.current = null;
			}

			const config = {
				fen: attributes.fen,
				orientation: attributes.orientation,
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

			if ( attributes.shapes && attributes.shapes.length > 0 ) {
				boardAPI.setShapes( attributes.shapes );
			}

			return () => {
				boardAPI?.destroy();
			};
		}
	}, [
		isSelected,
		attributes.fen,
		attributes.orientation,
		attributes.shapes,
	] );

	const blockProps = useBlockProps( {
		className: isSelected ? '' : 'roi-bloc-diagramme-preview',
		style: isSelected
			? {}
			: {
					cursor: 'pointer',
					background: 'transparent',
					display: 'flex',
					justifyContent: 'center',
			  },
	} );

	if ( isSelected && RoiFenEditor ) {
		return (
			<div
				{ ...blockProps }
				onMouseDownCapture={ handleMouseDownCapture }
			>
				<RoiFenEditor
					ref={ editorRef }
					fen={ attributes.fen }
					orientation={ attributes.orientation }
					initialShapes={ attributes.shapes || [] }
					onSave={ handleSave }
				/>
			</div>
		);
	}

	// Preview Mode - Only displays the board, clean and centered
	return (
		<div { ...blockProps } onMouseDownCapture={ handleMouseDownCapture }>
			<div
				style={ {
					pointerEvents: 'none',
					display: 'flex',
					justifyContent: 'center',
					width: '100%',
				} }
			>
				<div
					style={ {
						width: '320px',
						height: '320px',
						position: 'relative',
					} }
				>
					<div
						ref={ previewBoardRef }
						style={ { width: '100%', height: '100%' } }
					/>
				</div>
			</div>
		</div>
	);
}
