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
	onResetElement: ( _studentId: string, _itemId: number, _itemTitle?: string ) => void;
	onValidateElement: ( _studentId: string, _itemId: number, _itemTitle?: string ) => void;
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
					className="roi-detail-item-row__badge roi-detail-item-row__badge--fast"
					title="Temps inférieur à la moyenne du groupe"
				>
					⚡ Rapide
				</span>
			);
		} else if ( itemTimeSpent >= avgTimeSpent * 1.3 ) {
			comparisonBadge = (
				<span
					className="roi-detail-item-row__badge roi-detail-item-row__badge--slow"
					title="Temps supérieur à la moyenne du groupe"
				>
					⏱ Plus long
				</span>
			);
		} else {
			comparisonBadge = (
				<span className="roi-detail-item-row__badge roi-detail-item-row__badge--avg">
					Moyenne
				</span>
			);
		}
	}

	let typeModifier = 'exercice';
	let typeLabel = 'Exercice';

	if ( item.type === 'roi_lecon' ) {
		typeModifier = 'lecon';
		typeLabel = 'Leçon';
	} else if ( item.type === 'roi_video' ) {
		typeModifier = 'video';
		typeLabel = 'Vidéo';
	}

	const renderTimeStats = () => {
		if ( ! isValidated ) {
			return null;
		}
		if ( typeof itemTimeSpent === 'number' && itemTimeSpent > 0 ) {
			return (
				<>
					<span
						className="roi-detail-item-row__time-value"
						title="Temps passé par l'élève"
					>
						⏱ { formatDuration( itemTimeSpent ) }
					</span>
					{ typeof avgTimeSpent === 'number' && avgTimeSpent > 0 && (
						<span
							className="roi-detail-item-row__time-avg"
							title={ `Moyenne calculée sur ${ stat?.count || 1 } élève(s)` }
						>
							(Moy: { formatDuration( avgTimeSpent ) })
						</span>
					) }
					{ comparisonBadge }
				</>
			);
		}
		return (
			<span
				className="roi-detail-item-row__time-none"
				title="Temps non enregistré"
			>
				-
			</span>
		);
	};

	return (
		<div
			className={ `roi-detail-item-row${
				isValidated ? ' roi-detail-item-row--validated' : ''
			}` }
		>
			{ /* Col 1: Type + Title */ }
			<div className="roi-detail-item-row__col-title">
				<span
					className={ `roi-detail-item-row__type-badge roi-detail-item-row__type-badge--${ typeModifier }` }
				>
					{ typeLabel }
				</span>
				<span
					className="roi-detail-item-row__title"
					title={ decodeEntities(
						item.titre || `Élément #${ item.id }`
					) }
				>
					{ decodeEntities( item.titre || `Élément #${ item.id }` ) }
				</span>
			</div>

			{ /* Col 2: Validation status & date */ }
			<div className="roi-detail-item-row__col-status">
				{ isValidated ? (
					<>
						<span className="roi-detail-item-row__status-valid">
							✓ Validé
							{ detail.source === 'club' && (
								<span
									className="roi-detail-item-row__club-badge"
									title="Effectué lors de l'entraînement au club"
								>
									Club
								</span>
							) }
						</span>
						{ detail.date && (
							<span className="roi-detail-item-row__date">
								{ formatDate( detail.date ) }
							</span>
						) }
					</>
				) : (
					<span className="roi-detail-item-row__status-pending">
						⏳ Non complété
					</span>
				) }
			</div>

			{ /* Col 3: Time stats & comparison */ }
			<div className="roi-detail-item-row__col-time">
				{ renderTimeStats() }
			</div>

			{ /* Col 4: Action Button */ }
			<div className="roi-detail-item-row__col-action">
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
						className="roi-detail-item-row__reset-btn"
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
						className="roi-detail-item-row__validate-btn"
					>
						{ isValidatingItem ? '...' : 'Effectuer' }
					</button>
				) }
			</div>
		</div>
	);
}
