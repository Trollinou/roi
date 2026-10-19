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
	toggleCourse: ( _courseId: number ) => void;
	assigningCourseId: number | null;
	handleToggleCourseAssignment: ( _courseId: number, _isCurrentlyAssigned: boolean ) => void;
	onValidateCourse: ( _studentId: string, _courseId: number, _courseTitle: string ) => void;
	onResetCourse: ( _studentId: string, _courseId: number, _courseTitle: string ) => void;
	onValidateElement: ( _studentId: string, _elementId: number, _elementTitle?: string ) => void;
	onResetElement: ( _studentId: string, _elementId: number, _elementTitle?: string ) => void;
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
		if ( filterType === 'validated' ) {return isValidated;}
		if ( filterType === 'pending' ) {return ! isValidated;}
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
	let assignText = isAssigned ? '📌 Désassigner' : '＋ Assigner';
	if ( assigningCourseId === course.id ) {
		assignText = '...';
	}

	return (
		<div className="roi-detail-course-card">
			{ /* Course Header */ }
			<div
				role="button"
				tabIndex={ 0 }
				className={ `roi-detail-course-card__header${
					isExpanded ? ' roi-detail-course-card__header--expanded' : ''
				}` }
				onClick={ () => toggleCourse( course.id ) }
				onKeyDown={ ( e ) => {
					if ( e.key === 'Enter' || e.key === ' ' ) {
						e.preventDefault();
						toggleCourse( course.id );
					}
				} }
			>
				<div className="roi-detail-course-card__info">
					<span className="roi-detail-course-card__toggle">
						{ isExpanded ? '▲' : '▼' }
					</span>
					<span className="roi-detail-course-card__title">
						{ decodeEntities( course.titre ) }
					</span>
					{ ( course.is_assigned || isAssigned ) && (
						<span className="roi-detail-course-card__assigned-badge">
							📌 Assigné
						</span>
					) }
					<span className="roi-detail-course-card__stats-badge">
						{ courseValidatedCount }/{ playlist.length } (
						{ coursePercentage }%)
					</span>
				</div>

				<div className="roi-detail-course-card__actions">
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
							className={ `roi-detail-course-card__assign-btn${
								isAssigned
									? ' roi-detail-course-card__assign-btn--assigned'
									: ''
							}` }
						>
							{ assignText }
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
							className="roi-detail-course-card__validate-btn"
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
						className="roi-detail-course-card__reset-btn"
					>
						{ isResettingCourse
							? 'Réinitialisation...'
							: '↺ Réinitialiser le cours' }
					</button>
				</div>
			</div>

			{ /* Item details list */ }
			{ isExpanded && (
				<div className="roi-detail-course-card__items">
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
