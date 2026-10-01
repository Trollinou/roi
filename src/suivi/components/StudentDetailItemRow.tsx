import React from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import { formatDuration, formatDate } from '../utils/suiviHelpers';
import type { PlaylistItem } from '../../types/api/parcours';
import type { ProgressionDetail } from '../../types/api/progression';

export interface GroupStatItem {
	avg_time_spent: number;
	count: number;
	total_time?: number;
}

export interface StudentDetailItemRowProps {
	item: PlaylistItem;
	isValidated: boolean;
	detail?: ProgressionDetail;
	stat?: GroupStatItem | null;
	isResettingItem?: boolean;
	isValidatingItem?: boolean;
	onResetElement: ( studentId: string, itemId: number, itemTitle?: string ) => void;
	onValidateElement: ( studentId: string, itemId: number, itemTitle?: string ) => void;
	studentId: string;
}

export default function StudentDetailItemRow( {
	item,
	isValidated,
	detail = { date: '' },
	stat = null,
	isResettingItem = false,
	isValidatingItem = false,
	onResetElement,
	onValidateElement,
	studentId,
}: StudentDetailItemRowProps ): React.JSX.Element {
	const itemTimeSpent = detail.time_spent;
	const avgTimeSpent = stat ? stat.avg_time_spent : null;

	let comparisonBadge: React.JSX.Element | null = null;
	if (
		isValidated &&
		typeof itemTimeSpent === 'number' &&
		typeof avgTimeSpent === 'number' &&
		avgTimeSpent > 0
	) {
		if ( itemTimeSpent <= avgTimeSpent * 0.8 ) {
			comparisonBadge = (
				<span
					style={ {
						fontSize: '10px',
						background: '#e6f6e6',
						color: '#007017',
						padding: '2px 6px',
						borderRadius: '3px',
						fontWeight: '600',
					} }
					title="Temps inférieur à la moyenne du groupe"
				>
					⚡ Rapide
				</span>
			);
		} else if ( itemTimeSpent >= avgTimeSpent * 1.3 ) {
			comparisonBadge = (
				<span
					style={ {
						fontSize: '10px',
						background: '#fff3e0',
						color: '#d94f00',
						padding: '2px 6px',
						borderRadius: '3px',
						fontWeight: '600',
					} }
					title="Temps supérieur à la moyenne du groupe"
				>
					⏱ Plus long
				</span>
			);
		} else {
			comparisonBadge = (
				<span
					style={ {
						fontSize: '10px',
						background: '#f0f6fc',
						color: '#0073aa',
						padding: '2px 6px',
						borderRadius: '3px',
						fontWeight: '500',
					} }
				>
					Moyenne
				</span>
			);
		}
	}

	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'minmax(200px, 1fr) 130px 200px 95px',
				alignItems: 'center',
				padding: '8px 12px',
				borderRadius: '4px',
				background: isValidated ? '#fbfdfb' : '#fff',
				border: isValidated ? '1px solid #d1eed1' : '1px solid #f0f0f1',
				gap: '12px',
			} }
		>
			{ /* Col 1: Type + Title */ }
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					overflow: 'hidden',
				} }
			>
				<span
					style={ {
						fontSize: '10px',
						padding: '2px 6px',
						borderRadius: '3px',
						fontWeight: '600',
						textTransform: 'uppercase',
						flexShrink: 0,
						background:
							item.type === 'roi_lecon'
								? '#e7f3ff'
								: item.type === 'roi_video'
								? '#ffebee'
								: '#f4ebff',
						color:
							item.type === 'roi_lecon'
								? '#0073aa'
								: item.type === 'roi_video'
								? '#c62828'
								: '#8224e3',
					} }
				>
					{ item.type === 'roi_lecon'
						? 'Leçon'
						: item.type === 'roi_video'
						? 'Vidéo'
						: 'Exercice' }
				</span>
				<span
					style={ {
						fontSize: '13px',
						fontWeight: '500',
						color: '#1d2327',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					} }
					title={ decodeEntities(
						item.titre || `Élément #${ item.id }`
					) }
				>
					{ decodeEntities( item.titre || `Élément #${ item.id }` ) }
				</span>
			</div>

			{ /* Col 2: Validation status & date */ }
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					fontSize: '12px',
				} }
			>
				{ isValidated ? (
					<>
						<span
							style={ {
								color: '#00a32a',
								fontWeight: '600',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
							} }
						>
							✓ Validé
							{ detail.source === 'club' && (
								<span
									style={ {
										fontSize: '10px',
										background: '#e6f6e6',
										color: '#007017',
										padding: '1px 5px',
										borderRadius: '3px',
										fontWeight: 'normal',
									} }
									title="Effectué lors de l'entraînement au club"
								>
									Club
								</span>
							) }
						</span>
						{ detail.date && (
							<span
								style={ { fontSize: '11px', color: '#8c8f94' } }
							>
								{ formatDate( detail.date ) }
							</span>
						) }
					</>
				) : (
					<span
						style={ { color: '#8c8f94', fontStyle: 'italic' } }
					>
						⏳ Non complété
					</span>
				) }
			</div>

			{ /* Col 3: Time stats & comparison */ }
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: '6px',
					fontSize: '12px',
				} }
			>
				{ isValidated &&
				typeof itemTimeSpent === 'number' &&
				itemTimeSpent > 0 ? (
					<>
						<span
							style={ {
								fontWeight: '600',
								color: '#2c3338',
								whiteSpace: 'nowrap',
							} }
							title="Temps passé par l'élève"
						>
							⏱ { formatDuration( itemTimeSpent ) }
						</span>
						{ typeof avgTimeSpent === 'number' &&
							avgTimeSpent > 0 && (
								<span
									style={ {
										fontSize: '11px',
										color: '#8c8f94',
										whiteSpace: 'nowrap',
									} }
									title={ `Moyenne calculée sur ${
										stat?.count || 1
									} élève(s)` }
								>
									(Moy: { formatDuration( avgTimeSpent ) })
								</span>
							) }
						{ comparisonBadge }
					</>
				) : isValidated ? (
					<span
						style={ { color: '#a7aaad', fontSize: '12px' } }
						title="Temps non enregistré"
					>
						-
					</span>
				) : null }
			</div>

			{ /* Col 4: Action Button */ }
			<div style={ { display: 'flex', justifyContent: 'flex-end' } }>
				{ isValidated ? (
					<button
						type="button"
						onClick={ () =>
							onResetElement(
								studentId,
								item.id,
								item.titre
							)
						}
						disabled={ isResettingItem }
						title="Réinitialiser uniquement cet exercice pour forcer l'élève à le refaire"
						style={ {
							padding: '3px 8px',
							fontSize: '11px',
							color: '#d63638',
							border: '1px solid #f0b8b8',
							borderRadius: '3px',
							background: '#fff',
							cursor: 'pointer',
							whiteSpace: 'nowrap',
						} }
						onMouseOver={ ( e ) => {
							e.currentTarget.style.backgroundColor = '#fbeaea';
						} }
						onMouseOut={ ( e ) => {
							e.currentTarget.style.backgroundColor = '#fff';
						} }
					>
						{ isResettingItem ? '...' : '↺ Réinitialiser' }
					</button>
				) : (
					<button
						type="button"
						onClick={ () =>
							onValidateElement(
								studentId,
								item.id,
								item.titre
							)
						}
						disabled={ isValidatingItem || isResettingItem }
						title="Noter la réalisation de cet exercice au club"
						style={ {
							padding: '3px 10px',
							fontSize: '11px',
							fontWeight: '600',
							color: '#00a32a',
							border: '1px solid #b8e6b8',
							borderRadius: '3px',
							background: '#f0fdf4',
							cursor: 'pointer',
							whiteSpace: 'nowrap',
						} }
						onMouseOver={ ( e ) => {
							e.currentTarget.style.backgroundColor = '#dcfce7';
						} }
						onMouseOut={ ( e ) => {
							e.currentTarget.style.backgroundColor = '#f0fdf4';
						} }
					>
						{ isValidatingItem ? '...' : 'Effectuer' }
					</button>
				) }
			</div>
		</div>
	);
}
