import React, { useState } from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import StudentModalHeader from './StudentModalHeader';
import StudentModalStats from './StudentModalStats';
import StudentModalCurriculum from './StudentModalCurriculum';
import type { GroupStatItem } from './StudentDetailItemRow';
import type { ActionPayload } from './StudentCard';
import type { CoursItem } from '../../types/api/parcours';
import type { StudentProgress } from '../../types/api/progression';

export interface StudentDetailModalProps {
	student?: StudentProgress | null;
	courses: CoursItem[];
	groupStats?: Record<string | number, GroupStatItem>;
	onClose: () => void;
	onResetElement: ( studentId: string, elementId: number, elementName?: string ) => void;
	onResetCourse: ( studentId: string, courseId: number, courseName?: string ) => void;
	resettingAction: ActionPayload | null;
	onValidateElement: ( studentId: string, elementId: number, elementName?: string ) => void;
	onValidateCourse: ( studentId: string, courseId: number, courseName?: string ) => void;
	validatingAction: ActionPayload | null;
	apiUrl: string;
	nonce: string;
	onStudentRemoved?: ( studentId: string ) => void;
	onCourseAssigned?: () => void;
}

export default function StudentDetailModal( {
	student,
	courses,
	groupStats,
	onClose,
	onResetElement,
	onResetCourse,
	resettingAction,
	onValidateElement,
	onValidateCourse,
	validatingAction,
	apiUrl,
	nonce,
	onStudentRemoved,
	onCourseAssigned,
}: StudentDetailModalProps ): React.JSX.Element | null {
	const [ expandedLevels, setExpandedLevels ] = useState<Record<number | string, boolean>>( {} );
	const [ expandedChapters, setExpandedChapters ] = useState<Record<string, boolean>>( {} );
	const [ expandedCourses, setExpandedCourses ] = useState<Record<number | string, boolean>>( {} );
	const [ filterType, setFilterType ] = useState<'all' | 'validated' | 'pending'>( 'all' );
	const [ removing, setRemoving ] = useState<boolean>( false );
	const [ assigningCourseId, setAssigningCourseId ] = useState<number | null>( null );

	const handleToggleCourseAssignment = async (
		courseId: number,
		isCurrentlyAssigned: boolean
	) => {
		if ( ! student || student.identity_type !== 'member' ) return;
		setAssigningCourseId( courseId );
		try {
			const res = await fetch( `${ apiUrl }/progression/assigner-cours`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( {
					adherent_id: student.display_id,
					cours_id: courseId,
					action: isCurrentlyAssigned ? 'unassign' : 'assign',
				} ),
			} );
			const json = await res.json();
			if ( res.ok && json.success ) {
				if ( onCourseAssigned ) {
					onCourseAssigned();
				}
			} else {
				alert(
					json.message || "Erreur lors de l'assignation du cours."
				);
			}
		} catch ( err ) {
			console.error( 'Assign course error', err );
			alert( 'Erreur réseau ou permission refusée.' );
		} finally {
			setAssigningCourseId( null );
		}
	};

	const handleRemoveFromTracking = async () => {
		if ( ! student ) return;
		const nomAffiche = student.display_name || 'cet élève';
		if (
			! window.confirm(
				`Êtes-vous sûr de vouloir retirer ${ nomAffiche } de la liste de suivi ?\n\nSa progression sera retirée du tableau de bord.`
			)
		) {
			return;
		}
		setRemoving( true );
		try {
			const res = await fetch( `${ apiUrl }/progression/retirer-eleve`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( { student_id: student.id } ),
			} );
			const json = await res.json();
			if ( res.ok && json.success ) {
				if ( onStudentRemoved ) {
					onStudentRemoved( student.id );
				}
				onClose();
			} else {
				alert( json.message || 'Impossible de retirer cet élève.' );
			}
		} catch ( err ) {
			console.error( err );
			alert( "Erreur réseau lors du retrait de l'élève." );
		} finally {
			setRemoving( false );
		}
	};

	if ( ! student ) return null;

	const validesSet = new Set<number>( student.elements_valides || [] );
	const detailsMap = student.details || {};

	const rawStudentName =
		student.prenom || student.nom
			? `${ student.prenom || '' } ${ student.nom || '' }`.trim()
			: student.display_name || `Élève #${ student.id }`;
	const studentName = decodeEntities( rawStudentName );

	// Calculate totals
	let totalElementsInCurriculum = 0;
	let totalValidatedCount = 0;
	let totalTimeSpentSeconds = 0;

	courses.forEach( ( course ) => {
		( course.playlist || [] ).forEach( ( item ) => {
			totalElementsInCurriculum++;
			if ( validesSet.has( Number( item.id ) ) ) {
				totalValidatedCount++;
				const itemDetail = detailsMap[ item.id ];
				if ( itemDetail && typeof itemDetail.time_spent === 'number' ) {
					totalTimeSpentSeconds += itemDetail.time_spent;
				}
			}
		} );
	} );

	const overallPercentage =
		totalElementsInCurriculum > 0
			? Math.round(
					( totalValidatedCount / totalElementsInCurriculum ) * 100
			  )
			: 0;

	// Group courses by level and chapter
	const coursesByLevel: Record<number, Record<string, CoursItem[]>> = {};
	courses.forEach( ( course ) => {
		const lvl = course.niveau || 1;
		const chap = course.chapitre_nom || 'Général';
		if ( ! coursesByLevel[ lvl ] ) {
			coursesByLevel[ lvl ] = {};
		}
		if ( ! coursesByLevel[ lvl ][ chap ] ) {
			coursesByLevel[ lvl ][ chap ] = [];
		}
		coursesByLevel[ lvl ][ chap ].push( course );
	} );

	const toggleLevel = ( level: number ) => {
		setExpandedLevels( ( prev ) => ( {
			...prev,
			[ level ]:
				prev[ level ] === false ? true : ! ( prev[ level ] ?? true ),
		} ) );
	};

	const toggleChapter = ( level: number, chapter: string ) => {
		const key = `${ level }_${ chapter }`;
		setExpandedChapters( ( prev ) => ( {
			...prev,
			[ key ]: prev[ key ] === false ? true : ! ( prev[ key ] ?? true ),
		} ) );
	};

	const toggleCourse = ( courseId: number ) => {
		setExpandedCourses( ( prev ) => ( {
			...prev,
			[ courseId ]:
				prev[ courseId ] === false
					? true
					: ! ( prev[ courseId ] ?? true ),
		} ) );
	};

	const sortedLevels = Object.keys( coursesByLevel )
		.map( Number )
		.sort( ( a, b ) => a - b );

	return (
		<div
			className="roi-student-detail-modal-overlay"
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
				padding: '30px 20px',
				boxSizing: 'border-box',
			} }
			onClick={ onClose }
		>
			<div
				className="roi-student-detail-modal"
				style={ {
					background: '#fff',
					borderRadius: '8px',
					width: '100%',
					maxWidth: '900px',
					height: '85vh',
					maxHeight: '850px',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
					overflow: 'hidden',
					position: 'relative',
					boxSizing: 'border-box',
				} }
				onClick={ ( e ) => e.stopPropagation() }
			>
				{ /* HEADER */ }
				<StudentModalHeader
					student={ student }
					studentName={ studentName }
					onClose={ onClose }
				/>

				{ /* SUMMARY STATS BAR */ }
				<StudentModalStats
					overallPercentage={ overallPercentage }
					totalValidatedCount={ totalValidatedCount }
					totalElementsInCurriculum={ totalElementsInCurriculum }
					totalTimeSpentSeconds={ totalTimeSpentSeconds }
					filterType={ filterType }
					setFilterType={ setFilterType }
				/>

				{ /* BODY CONTENT (SCROLLABLE) */ }
				<StudentModalCurriculum
					coursesByLevel={ coursesByLevel }
					sortedLevels={ sortedLevels }
					expandedLevels={ expandedLevels }
					toggleLevel={ toggleLevel }
					expandedChapters={ expandedChapters }
					toggleChapter={ toggleChapter }
					expandedCourses={ expandedCourses }
					toggleCourse={ toggleCourse }
					student={ student }
					validesSet={ validesSet }
					detailsMap={ detailsMap }
					groupStats={ groupStats }
					filterType={ filterType }
					assigningCourseId={ assigningCourseId }
					handleToggleCourseAssignment={
						handleToggleCourseAssignment
					}
					onValidateCourse={ onValidateCourse }
					onResetCourse={ onResetCourse }
					onValidateElement={ onValidateElement }
					onResetElement={ onResetElement }
					resettingAction={ resettingAction }
					validatingAction={ validatingAction }
				/>

				{ /* FOOTER */ }
				<div
					style={ {
						padding: '12px 24px',
						borderTop: '1px solid #e0e0e0',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						background: '#f8f9fa',
						flexShrink: 0,
					} }
				>
					<button
						type="button"
						onClick={ handleRemoveFromTracking }
						disabled={ removing }
						style={ {
							background: '#fff',
							border: '1px solid #d63638',
							color: '#d63638',
							padding: '6px 14px',
							fontSize: '13px',
							borderRadius: '4px',
							cursor: removing ? 'default' : 'pointer',
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
						} }
					>
						{ removing
							? 'Retrait en cours...'
							: '🗑 Retirer de la liste de suivi' }
					</button>

					<button
						type="button"
						onClick={ onClose }
						className="button button-secondary"
						style={ { padding: '6px 16px', fontSize: '13px' } }
					>
						Fermer
					</button>
				</div>
			</div>
		</div>
	);
}
