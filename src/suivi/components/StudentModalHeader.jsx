import { decodeEntities } from '@wordpress/html-entities';

export default function StudentModalHeader( { student, studentName, onClose } ) {
	return (
		<div
			style={ {
				padding: '16px 24px',
				borderBottom: '1px solid #e0e0e0',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				background: '#f8f9fa',
				flexShrink: 0,
			} }
		>
			<div>
				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						flexWrap: 'wrap',
						marginBottom: '4px',
					} }
				>
					<h2
						style={ {
							margin: 0,
							fontSize: '18px',
							fontWeight: '700',
							color: '#1d2327',
						} }
					>
						{ studentName }
					</h2>
					{ ( student.groups || [] ).map( ( g ) => (
						<span
							key={ g.id }
							style={ {
								fontSize: '11px',
								background: '#e0f2fe',
								color: '#0369a1',
								border: '1px solid #bae6fd',
								padding: '1px 6px',
								borderRadius: '12px',
								fontWeight: 500,
							} }
						>
							{ decodeEntities( g.name ) }
						</span>
					) ) }
				</div>
				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						flexWrap: 'wrap',
						fontSize: '12px',
						color: '#646970',
					} }
				>
					<span>
						{ student.identity_type === 'member' ? (
							<a
								href={ `post.php?post=${ student.display_id }&action=edit` }
								target="_blank"
								rel="noopener noreferrer"
								style={ {
									color: '#0073aa',
									textDecoration: 'none',
								} }
								title="Ouvrir la fiche de l'adhérent dans DAME (nouvel onglet)"
							>
								Adhérent DAME :{' '}
								<strong>#{ student.display_id }</strong> ↗
							</a>
						) : (
							<a
								href={ `user-edit.php?user_id=${
									student.display_id || student.id
								}` }
								target="_blank"
								rel="noopener noreferrer"
								style={ {
									color: '#0073aa',
									textDecoration: 'none',
								} }
								title="Ouvrir le profil utilisateur WordPress (nouvel onglet)"
							>
								Compte WordPress :{' '}
								<strong>
									#{ student.display_id || student.id }
								</strong>{' '}
								↗
							</a>
						) }
					</span>
					{ student.parent_user && (
						<a
							href={ `user-edit.php?user_id=${ student.parent_user.id }` }
							target="_blank"
							rel="noopener noreferrer"
							style={ {
								background: '#e0e7ff',
								color: '#3730a3',
								padding: '1px 6px',
								borderRadius: '3px',
								fontSize: '11px',
								fontWeight: '500',
								textDecoration: 'none',
							} }
							title="Ouvrir le profil utilisateur WordPress parent (nouvel onglet)"
						>
							Rattaché au compte parent :{' '}
							{ decodeEntities(
								student.parent_user.display_name
							) }{ ' ' }
							(#{ student.parent_user.id }) ↗
						</a>
					) }
				</div>
			</div>

			<button
				type="button"
				onClick={ onClose }
				style={ {
					background: 'none',
					border: 'none',
					fontSize: '22px',
					color: '#646970',
					cursor: 'pointer',
					padding: '4px 8px',
					lineHeight: 1,
					borderRadius: '4px',
				} }
				title="Fermer"
			>
				✕
			</button>
		</div>
	);
}
