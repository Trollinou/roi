import React from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import StudentDetailItemRow, { type GroupStatItem } from './StudentDetailItemRow';
import type { CoursItem } from '../../types/api/parcours';
import type { StudentProgress, ProgressionDetail } from '../../types/api/progression';
import type { ActionPayload } from './StudentCard';

export interface StudentDetailCourseCardProps {
	course: CoursItem;
	student: StudentProgress;
	validesSet: Set<number>;
	detailsMap: Record<number | string, ProgressionDetail>;
	groupStats?: Record<string | number, GroupStatItem>;
	filterType: 'all' | 'validated' | 'pending';
	isExpanded: boolean;
	toggleCourse: ( courseId: number ) => void;
	assigningCourseId: number | null;
	handleToggleCourseAssignment: ( courseId: number, isCurrentlyAssigned: boolean ) => void;
	onValidateCourse: ( studentId: string, courseId: number, courseTitle: string ) => void;
	onResetCourse: ( studentId: string, courseId: number, courseTitle: string ) => void;
	onValidateElement: ( studentId: string, elementId: number, elementTitle?: string ) => void;
	onResetElement: ( studentId: string, elementId: number, elementTitle?: string ) => void;
	resettingAction: ActionPayload | null;
	validatingAction: ActionPayload | null;
}

export default function StudentDetailCourseCard( {
	course,
	student,
	validesSet,
	detailsMap,
	groupStats,
	filterType,
	isExpanded,
	toggleCourse,
	assigningCourseId,
	handleToggleCourseAssignment,
	onValidateCourse,
	onResetCourse,
	onValidateElement,
	onResetElement,
	resettingAction,
	validatingAction,
}: StudentDetailCourseCardProps ): React.JSX.Element | null {
	const playlist = course.playlist || [];

	const displayedItems = playlist.filter( ( item ) => {
		const isValidated = validesSet.has( Number( item.id ) );
		if ( filterType === 'validated' ) return isValidated;
		if ( filterType === 'pending' ) return ! isValidated;
		return true;
	} );

	const courseValidatedCount = playlist.filter( ( item ) =>
		validesSet.has( Number( item.id ) )
	).length;
	const coursePercentage =
		playlist.length > 0
			? Math.round( ( courseValidatedCount / playlist.length ) * 100 )
			: 0;

	const isResettingCourse =
		resettingAction &&
		resettingAction.type === 'course' &&
		resettingAction.id === course.id;
	const isValidatingCourse =
		validatingAction &&
		validatingAction.type === 'course' &&
		validatingAction.id === course.id;

	if ( displayedItems.length === 0 && filterType !== 'all' ) {
		return null;
	}

	const isAssigned = ( student.assigned_course_ids || [] ).includes(
		course.id
	);

	return (
		<div
			style={ {
				background: '#fff',
				border: '1px solid #e0e0e0',
				borderRadius: '5px',
				overflow: 'hidden',
			} }
		>
			{ /* Course Header */ }
			<div
				style={ {
					padding: '10px 14px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					background: '#fff',
					borderBottom: isExpanded ? '1px solid #f0f0f1' : 'none',
					cursor: 'pointer',
				} }
				onClick={ () => toggleCourse( course.id ) }
			>
				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						flexWrap: 'wrap',
					} }
				>
					<span style={ { fontSize: '12px', color: '#888' } }>
						{ isExpanded ? '▲' : '▼' }
					</span>
					<span
						style={ {
							fontWeight: '600',
							fontSize: '13px',
							color: '#1d2327',
						} }
					>
						{ decodeEntities( course.titre ) }
					</span>
					{ ( course.is_assigned || isAssigned ) && (
						<span
							style={ {
								fontSize: '10px',
								background: '#fef3c7',
								color: '#92400e',
								border: '1px solid #fde68a',
								padding: '1px 6px',
								borderRadius: '3px',
								fontWeight: '600',
							} }
						>
							📌 Assigné
						</span>
					) }
					<span
						style={ {
							fontSize: '11px',
							color: '#646970',
							background: '#f0f0f1',
							padding: '2px 6px',
							borderRadius: '3px',
						} }
					>
						{ courseValidatedCount }/{ playlist.length } (
						{ coursePercentage }%)
					</span>
				</div>

				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					} }
				>
					{ student.identity_type === 'member' && (
						<button
							type="button"
							onClick={ ( e ) => {
								e.stopPropagation();
								handleToggleCourseAssignment(
									course.id,
									isAssigned
								);
							} }
							disabled={ assigningCourseId === course.id }
							title={
								isAssigned
									? 'Retirer ce cours des assignations de cet élève'
									: 'Assigner ce cours à cet élève'
							}
							style={ {
								padding: '4px 8px',
								fontSize: '11px',
								fontWeight: '600',
								borderRadius: '3px',
								border: isAssigned
									? '1px solid #f59e0b'
									: '1px solid #c3c4c7',
								background: isAssigned ? '#fffbeb' : '#fff',
								color: isAssigned ? '#b45309' : '#50575e',
								cursor: 'pointer',
							} }
						>
							{ assigningCourseId === course.id
								? '...'
								: isAssigned
								? '📌 Désassigner'
								: '＋ Assigner' }
						</button>
					) }
					{ courseValidatedCount < playlist.length && (
						<button
							type="button"
							onClick={ ( e ) => {
								e.stopPropagation();
								onValidateCourse(
									student.id,
									course.id,
									course.titre
								);
							} }
							disabled={ Boolean( isValidatingCourse || isResettingCourse ) }
							title="Valider tous les exercices restants de ce cours (Club)"
							style={ {
								padding: '4px 10px',
								fontSize: '11px',
								fontWeight: '600',
								color: '#00a32a',
								border: '1px solid #b8e6b8',
								borderRadius: '3px',
								background: '#f0fdf4',
								cursor: 'pointer',
							} }
							onMouseOver={ ( e ) => {
								e.currentTarget.style.backgroundColor =
									'#dcfce7';
							} }
							onMouseOut={ ( e ) => {
								e.currentTarget.style.backgroundColor =
									'#f0fdf4';
							} }
						>
							{ isValidatingCourse
								? 'Validation...'
								: '✓ Valider le cours' }
						</button>
					) }

					<button
						type="button"
						onClick={ ( e ) => {
							e.stopPropagation();
							onResetCourse(
								student.id,
								course.id,
								course.titre
							);
						} }
						disabled={
							Boolean(
								courseValidatedCount === 0 ||
								isResettingCourse ||
								isValidatingCourse
							)
						}
						title="Réinitialiser tout le cours"
						style={ {
							padding: '4px 8px',
							fontSize: '11px',
							color:
								courseValidatedCount === 0
									? '#a7aaad'
									: '#d63638',
							border: '1px solid currentColor',
							borderRadius: '3px',
							background: 'none',
							cursor:
								courseValidatedCount === 0
									? 'default'
									: 'pointer',
						} }
					>
						{ isResettingCourse
							? 'Réinitialisation...'
							: '↺ Réinitialiser le cours' }
					</button>
				</div>
			</div>

			{ /* Item details list */ }
			{ isExpanded && (
				<div
					style={ {
						padding: '8px 12px',
						display: 'flex',
						flexDirection: 'column',
						gap: '6px',
					} }
				>
					{ displayedItems.map( ( item, idx ) => {
						const isValidated = validesSet.has(
							Number( item.id )
						);
						const detail = detailsMap[ item.id ] || { date: '' };
						const stat = groupStats && groupStats[ item.id ];
						const isResettingItem =
							resettingAction !== null &&
							resettingAction.type === 'element' &&
							resettingAction.id === item.id;
						const isValidatingItem =
							validatingAction !== null &&
							validatingAction.type === 'element' &&
							validatingAction.id === item.id;

						return (
							<StudentDetailItemRow
								key={ item.id || idx }
								item={ item }
								isValidated={ isValidated }
								detail={ detail }
								stat={ stat }
								isResettingItem={ Boolean( isResettingItem ) }
								isValidatingItem={ Boolean( isValidatingItem ) }
								onResetElement={ onResetElement }
								onValidateElement={ onValidateElement }
								studentId={ student.id }
							/>
						);
					} ) }
				</div>
			) }
		</div>
	);
}
