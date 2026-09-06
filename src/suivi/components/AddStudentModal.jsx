import { useState, useEffect } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

export default function AddStudentModal( {
	isOpen,
	onClose,
	onStudentAdded,
	apiUrl,
	nonce,
} ) {
	const [ candidates, setCandidates ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const [ addingId, setAddingId ] = useState( null );

	useEffect( () => {
		if ( ! isOpen ) return;

		setLoading( true );
		setError( null );
		fetch( `${ apiUrl }/progression/candidats`, {
			headers: { 'X-WP-Nonce': nonce },
		} )
			.then( ( res ) => {
				if ( ! res.ok ) {
					throw new Error( 'Erreur lors du chargement des adhérents.' );
				}
				return res.json();
			} )
			.then( ( data ) => {
				setCandidates( data || [] );
				setLoading( false );
			} )
			.catch( ( err ) => {
				setError( err.message );
				setLoading( false );
			} );
	}, [ isOpen, apiUrl, nonce ] );

	if ( ! isOpen ) return null;

	const filteredCandidates = candidates.filter( ( cand ) => {
		const name = `${ cand.prenom || '' } ${ cand.nom || '' } ${ cand.display_name || '' } ${ cand.email || '' }`.toLowerCase();
		return name.includes( searchQuery.toLowerCase() );
	} );

	const handleAdd = async ( adherentId ) => {
		setAddingId( adherentId );
		try {
			const res = await fetch( `${ apiUrl }/progression/ajouter-eleve`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( { adherent_id: adherentId } ),
			} );

			const resJson = await res.json();
			if ( res.ok && resJson.success && resJson.student ) {
				onStudentAdded( resJson.student );
				onClose();
			} else {
				alert( resJson.message || 'Impossible d\'ajouter cet élève.' );
			}
		} catch ( err ) {
			console.error( err );
			alert( 'Erreur réseau lors de l\'ajout de l\'élève.' );
		} finally {
			setAddingId( null );
		}
	};

	return (
		<div
			className="roi-add-student-modal-overlay"
			style={ {
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.65)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 100000,
				padding: '20px',
				boxSizing: 'border-box',
			} }
			onClick={ onClose }
		>
			<div
				className="roi-add-student-modal"
				style={ {
					background: '#fff',
					borderRadius: '8px',
					width: '100%',
					maxWidth: '600px',
					maxHeight: '80vh',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
					overflow: 'hidden',
					boxSizing: 'border-box',
				} }
				onClick={ ( e ) => e.stopPropagation() }
			>
				{ /* HEADER */ }
				<div
					style={ {
						padding: '16px 20px',
						borderBottom: '1px solid #e0e0e0',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						background: '#f8f9fa',
					} }
				>
					<h2 style={ { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1d2327' } }>
						Ajouter un élève au suivi
					</h2>
					<button
						type="button"
						onClick={ onClose }
						style={ {
							background: 'none',
							border: 'none',
							fontSize: '20px',
							color: '#646970',
							cursor: 'pointer',
							padding: '4px',
						} }
					>
						✕
					</button>
				</div>

				{ /* SEARCH BAR */ }
				<div style={ { padding: '16px 20px', borderBottom: '1px solid #f0f0f1', background: '#fff' } }>
					<input
						type="search"
						placeholder="Rechercher un adhérent par nom, prénom ou email..."
						value={ searchQuery }
						onChange={ ( e ) => setSearchQuery( e.target.value ) }
						style={ {
							width: '100%',
							padding: '8px 12px',
							border: '1px solid #8c8f94',
							borderRadius: '4px',
							fontSize: '13px',
							boxSizing: 'border-box',
						} }
						autoFocus
					/>
				</div>

				{ /* CANDIDATES LIST */ }
				<div
					style={ {
						flex: '1 1 auto',
						overflowY: 'auto',
						padding: '10px 20px',
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
					} }
				>
					{ loading && (
						<div style={ { padding: '30px', textAlign: 'center', color: '#646970' } }>
							Chargement des adhérents du club...
						</div>
					) }

					{ error && (
						<div className="notice notice-error" style={ { padding: '10px', margin: '10px 0' } }>
							<p>{ error }</p>
						</div>
					) }

					{ ! loading && ! error && filteredCandidates.length === 0 && (
						<div style={ { padding: '30px', textAlign: 'center', color: '#646970' } }>
							{ searchQuery
								? 'Aucun adhérent ne correspond à cette recherche.'
								: 'Tous les adhérents du club sont déjà suivis.' }
						</div>
					) }

					{ ! loading &&
						filteredCandidates.map( ( cand ) => {
							const isAdding = addingId === cand.id;
							return (
								<div
									key={ cand.id }
									style={ {
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '10px 14px',
										background: '#f8f9fa',
										border: '1px solid #e0e0e0',
										borderRadius: '4px',
										gap: '12px',
									} }
								>
									<div>
										<div style={ { fontWeight: '600', fontSize: '14px', color: '#1d2327' } }>
											{ decodeEntities( cand.display_name ) }
										</div>
										<div style={ { fontSize: '11px', color: '#646970', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '6px' } }>
											<span>Adhérent #{ cand.id }</span>
											{ cand.birth_date ? (
												<span>• Né(e) le { cand.birth_date.split( '-' ).reverse().join( '/' ) }</span>
											) : null }
											{ cand.legal_rep ? (
												<span>• Resp : <strong>{ decodeEntities( cand.legal_rep ) }</strong></span>
											) : null }
											{ cand.email ? <span>• { cand.email }</span> : null }
										</div>
									</div>

									<button
										type="button"
										onClick={ () => handleAdd( cand.id ) }
										disabled={ isAdding || addingId !== null }
										style={ {
											padding: '5px 12px',
											fontSize: '12px',
											fontWeight: '600',
											background: '#0073aa',
											color: '#fff',
											border: 'none',
											borderRadius: '3px',
											cursor: isAdding ? 'default' : 'pointer',
											whiteSpace: 'nowrap',
										} }
									>
										{ isAdding ? 'Ajout...' : '＋ Ajouter au suivi' }
									</button>
								</div>
							);
						} ) }
				</div>

				{ /* FOOTER */ }
				<div
					style={ {
						padding: '12px 20px',
						borderTop: '1px solid #e0e0e0',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						background: '#f8f9fa',
					} }
				>
					<a
						href="post-new.php?post_type=adherent"
						target="_blank"
						rel="noopener noreferrer"
						style={ { fontSize: '12px', color: '#0073aa', textDecoration: 'none' } }
					>
						＋ Créer un nouvel adhérent dans DAME ↗
					</a>

					<button
						type="button"
						onClick={ onClose }
						className="button button-secondary"
						style={ { padding: '5px 14px', fontSize: '12px' } }
					>
						Fermer
					</button>
				</div>
			</div>
		</div>
	);
}
