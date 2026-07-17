/**
 * Modals management for FEN and PGN editors.
 */

export function openFenEditor( initialData, onSaveCallback ) {
	const modalOverlay = document.getElementById( 'roi_fen_modal_overlay' );
	const reactRoot = document.getElementById( 'roi_fen_react_root' );

	if ( ! modalOverlay || ! reactRoot ) {
		return;
	}

	const modalCloseBtn = document.getElementById( 'roi_fen_modal_close' );
	const cleanedFen =
		typeof initialData === 'string'
			? initialData.trim()
			: initialData?.fen ||
			  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	const initialShapes =
		typeof initialData === 'object' && initialData.shapes
			? initialData.shapes
			: [];

	// Afficher la modale
	modalOverlay.style.display = 'flex';

	const cleanClose = () => {
		if ( window.wp && window.wp.element ) {
			window.wp.element.unmountComponentAtNode( reactRoot );
		}
		modalOverlay.style.display = 'none';
		if ( modalCloseBtn ) {
			modalCloseBtn.removeEventListener( 'click', cleanClose );
		}
		modalOverlay.removeEventListener( 'click', handleOverlayClick );
	};

	const handleOverlayClick = ( e ) => {
		if ( e.target === modalOverlay ) {
			cleanClose();
		}
	};

	if ( modalCloseBtn ) {
		modalCloseBtn.addEventListener( 'click', cleanClose );
	}
	modalOverlay.addEventListener( 'click', handleOverlayClick );

	// Monter le composant React
	if ( window.RoiFenEditor && window.wp && window.wp.element ) {
		const editorComponent =
			window.RoiFenEditor.default || window.RoiFenEditor;
		const element = window.wp.element.createElement( editorComponent, {
			initialFen: cleanedFen,
			initialShapes,
			onSave( result ) {
				onSaveCallback( result );
				cleanClose();
			},
		} );
		window.wp.element.render( element, reactRoot );
	}
}

export function openPgnEditor( initialPgn, onSaveCallback ) {
	const pgnModalOverlay = document.getElementById( 'roi_pgn_modal_overlay' );
	const pgnReactRoot = document.getElementById( 'roi_pgn_react_root' );

	if ( ! pgnModalOverlay || ! pgnReactRoot ) {
		return;
	}

	const pgnModalCloseBtn = document.getElementById( 'roi_pgn_modal_close' );
	const cleanedPgn = initialPgn.trim();

	// Afficher la modale
	pgnModalOverlay.style.display = 'flex';

	const cleanClose = () => {
		if ( window.wp && window.wp.element ) {
			window.wp.element.unmountComponentAtNode( pgnReactRoot );
		}
		pgnModalOverlay.style.display = 'none';
		if ( pgnModalCloseBtn ) {
			pgnModalCloseBtn.removeEventListener( 'click', cleanClose );
		}
		pgnModalOverlay.removeEventListener( 'click', handleOverlayClick );
	};

	const handleOverlayClick = ( e ) => {
		if ( e.target === pgnModalOverlay ) {
			cleanClose();
		}
	};

	if ( pgnModalCloseBtn ) {
		pgnModalCloseBtn.addEventListener( 'click', cleanClose );
	}
	pgnModalOverlay.addEventListener( 'click', handleOverlayClick );

	// Monter le composant React
	if ( window.RoiPgnEditor && window.wp && window.wp.element ) {
		const editorComponent =
			window.RoiPgnEditor.default || window.RoiPgnEditor;
		const element = window.wp.element.createElement( editorComponent, {
			initialPgn: cleanedPgn,
			onSave( nouveauPgn, finalFen ) {
				onSaveCallback( nouveauPgn, finalFen );
				cleanClose();
			},
		} );
		window.wp.element.render( element, pgnReactRoot );
	}
}
