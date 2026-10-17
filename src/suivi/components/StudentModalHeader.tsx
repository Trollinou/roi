import React from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import type { StudentProgress } from '../../types/api/progression';

export interface StudentModalHeaderProps {
	student: StudentProgress;
	studentName: string;
	onClose: () => void;
}

export default function StudentModalHeader( {
	student,
	studentName,
	onClose,
}: StudentModalHeaderProps ): React.JSX.Element {
	return (
		<div className="roi-student-modal-header">
			<div>
				<div className="roi-student-modal-header__top">
					<h2 className="roi-student-modal-header__title">
						{ studentName }
					</h2>
					{ ( student.groups || [] ).map( ( g ) => (
						<span
							key={ g.id }
							className="roi-student-modal-header__group-badge"
						>
							{ decodeEntities( g.name ) }
						</span>
					) ) }
				</div>
				<div className="roi-student-modal-header__meta">
					<span>
						{ student.identity_type === 'member' ? (
							<a
								href={ `post.php?post=${ student.display_id }&action=edit` }
								target="_blank"
								rel="noopener noreferrer"
								className="roi-student-modal-header__link"
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
								className="roi-student-modal-header__link"
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
							className="roi-student-modal-header__parent-link"
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
				className="roi-student-modal-header__close-btn"
				title="Fermer"
			>
				✕
			</button>
		</div>
	);
}
