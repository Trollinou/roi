import React, { useEffect, useState, useMemo } from 'react';
import StudentDetailModal from './components/StudentDetailModal';
import AddStudentModal from './components/AddStudentModal';
import SuiviFilters from './components/SuiviFilters';
import StudentCard, { type ActionPayload } from './components/StudentCard';
import type { GroupStatItem } from './components/StudentDetailItemRow';
import { normalizeText } from './utils/suiviHelpers';
import type { CoursItem } from '../types/api/parcours';
import type { StudentProgress, StudentGroupSummary } from '../types/api/progression';

export default function SuiviApp(): React.JSX.Element {
	const [ students, setStudents ] = useState<StudentProgress[]>( [] );
	const [ courses, setCourses ] = useState<CoursItem[]>( [] );
	const [ searchQuery, setSearchQuery ] = useState<string>( '' );
	const [ selectedLevel, setSelectedLevel ] = useState<string>( 'all' );
	const [ selectedChapter, setSelectedChapter ] = useState<string>( 'all' );
	const [ selectedGroup, setSelectedGroup ] = useState<string>( 'all' );
	const [ loading, setLoading ] = useState<boolean>( true );
	const [ error, setError ] = useState<string | null>( null );
	const [ resettingAction, setResettingAction ] = useState<ActionPayload | null>( null );
	const [ validatingAction, setValidatingAction ] = useState<ActionPayload | null>( null );
	const [ selectedStudentId, setSelectedStudentId ] = useState<string | null>( null );
	const [ expandedLevels, setExpandedLevels ] = useState<Record<string, boolean>>( {} );
	const [ expandedChapters, setExpandedChapters ] = useState<Record<string, boolean>>( {} );
	const [ isAddModalOpen, setIsAddModalOpen ] = useState<boolean>( false );

	const fetchData = () => {
		const config = window.roiSuiviConfig || {};
		const apiUrl = config.apiUrl || '';
		const nonce = config.nonce || '';

		if ( ! apiUrl ) {
			setError( 'Configuration API manquante.' );
			setLoading( false );
			return;
		}

		Promise.all( [
			fetch( `${ apiUrl }/progression/groupe`, {
				headers: { 'X-WP-Nonce': nonce },
			} ).then( ( res ) => {
				if ( ! res.ok ) {
					throw new Error(
						'Erreur de chargement des progressions.'
					);
				}
				return res.json();
			} ),
			fetch( `${ apiUrl }/parcours`, {
				headers: { 'X-WP-Nonce': nonce },
			} ).then( ( res ) => {
				if ( ! res.ok ) {
					throw new Error( 'Erreur de chargement du parcours.' );
				}
				return res.json();
			} ),
		] )
			.then( ( [ progressionData, parcoursData ] ) => {
				setStudents( ( progressionData as StudentProgress[] ) || [] );
				setCourses( ( parcoursData as CoursItem[] ) || [] );
				setLoading( false );
			} )
			.catch( ( err: Error ) => {
				setError( err.message );
				setLoading( false );
			} );
	};

	useEffect( () => {
		fetchData();
	}, [] );

	const groupStats = useMemo<Record<string, GroupStatItem>>( () => {
		const stats: Record<string, { total_time: number; count: number; avg_time_spent: number }> = {};
		students.forEach( ( st ) => {
			const details = st.details || {};
			Object.keys( details ).forEach( ( elemId ) => {
				const d = details[ Number( elemId ) ];
				if (
					d &&
					typeof d.time_spent === 'number' &&
					d.time_spent > 0
				) {
					if ( ! stats[ elemId ] ) {
						stats[ elemId ] = {
							total_time: 0,
							count: 0,
							avg_time_spent: 0,
						};
					}
					stats[ elemId ].total_time += d.time_spent;
					stats[ elemId ].count += 1;
				}
			} );
		} );

		Object.keys( stats ).forEach( ( elemId ) => {
			const item = stats[ elemId ];
			item.avg_time_spent = Math.round( item.total_time / item.count );
		} );

		return stats;
	}, [ students ] );

	const availableGroups = useMemo<StudentGroupSummary[]>( () => {
		const map = new Map<number, StudentGroupSummary>();
		students.forEach( ( s ) => {
			( s.groups || [] ).forEach( ( g ) => {
				if ( g && g.id && ! map.has( g.id ) ) {
					map.set( g.id, g );
				}
			} );
		} );
		return Array.from( map.values() ).sort( ( a, b ) =>
			a.name.localeCompare( b.name )
		);
	}, [ students ] );

	const handleResetCourse = async ( studentId: string, courseId: number, courseName?: string ) => {
		const label = courseName ? `du cours "${ courseName }"` : 'de ce cours';
		if (
			! window.confirm(
				`Voulez-vous vraiment réinitialiser la progression ${ label } pour cet élève ? L'élève devra refaire toutes les leçons et exercices associés.`
			)
		) {
			return;
		}

		const config = window.roiSuiviConfig || {};
		const apiUrl = config.apiUrl || '';
		const nonce = config.nonce || '';

		setResettingAction( { type: 'course', studentId, id: courseId } );

		try {
			const response = await fetch( `${ apiUrl }/progression/reset`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( {
					student_id: studentId,
					course_id: courseId,
				} ),
			} );

			const resJson = await response.json();
			if ( response.ok && resJson.success ) {
				fetchData();
			} else {
				alert(
					resJson.message ||
						'Une erreur est survenue lors de la réinitialisation.'
				);
			}
		} catch ( err ) {
			console.error( 'Reset error', err );
			alert( 'Erreur réseau ou permission refusée.' );
		} finally {
			setResettingAction( null );
		}
	};

	const handleResetElement = async ( studentId: string, elementId: number, elementName?: string ) => {
		const label = elementName ? `"${ elementName }"` : 'cet élément';
		if (
			! window.confirm(
				`Voulez-vous vraiment réinitialiser ${ label } pour cet élève ?`
			)
		) {
			return;
		}

		const config = window.roiSuiviConfig || {};
		const apiUrl = config.apiUrl || '';
		const nonce = config.nonce || '';

		setResettingAction( { type: 'element', studentId, id: elementId } );

		try {
			const response = await fetch( `${ apiUrl }/progression/reset`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( {
					student_id: studentId,
					element_id: elementId,
				} ),
			} );

			const resJson = await response.json();
			if ( response.ok && resJson.success ) {
				fetchData();
			} else {
				alert(
					resJson.message ||
						'Une erreur est survenue lors de la réinitialisation.'
				);
			}
		} catch ( err ) {
			console.error( 'Reset element error', err );
			alert( 'Erreur réseau ou permission refusée.' );
		} finally {
			setResettingAction( null );
		}
	};

	const handleValidateCourse = async ( studentId: string, courseId: number, courseName?: string ) => {
		const label = courseName ? `du cours "${ courseName }"` : 'de ce cours';
		if (
			! window.confirm(
				`Valider tous les exercices restants ${ label } pour cet élève (effectués au club) ?`
			)
		) {
			return;
		}

		const config = window.roiSuiviConfig || {};
		const apiUrl = config.apiUrl || '';
		const nonce = config.nonce || '';

		setValidatingAction( { type: 'course', studentId, id: courseId } );

		try {
			const response = await fetch( `${ apiUrl }/progression`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( {
					student_id: studentId,
					course_id: courseId,
				} ),
			} );

			const resJson = await response.json();
			if ( response.ok && resJson.success ) {
				fetchData();
			} else {
				alert(
					resJson.message ||
						'Une erreur est survenue lors de la validation.'
				);
			}
		} catch ( err ) {
			console.error( 'Validate course error', err );
			alert( 'Erreur réseau ou permission refusée.' );
		} finally {
			setValidatingAction( null );
		}
	};

	const handleValidateElement = async (
		studentId: string,
		elementId: number
	) => {
		const config = window.roiSuiviConfig || {};
		const apiUrl = config.apiUrl || '';
		const nonce = config.nonce || '';

		setValidatingAction( { type: 'element', studentId, id: elementId } );

		try {
			const response = await fetch( `${ apiUrl }/progression`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( {
					student_id: studentId,
					element_id: elementId,
				} ),
			} );

			const resJson = await response.json();
			if ( response.ok && resJson.success ) {
				fetchData();
			} else {
				alert(
					resJson.message ||
						'Une erreur est survenue lors de la validation.'
				);
			}
		} catch ( err ) {
			console.error( 'Validate element error', err );
			alert( 'Erreur réseau ou permission refusée.' );
		} finally {
			setValidatingAction( null );
		}
	};

	const handleStudentAdded = ( newStudent?: StudentProgress ) => {
		fetchData();
		if ( newStudent && newStudent.id ) {
			setSelectedStudentId( newStudent.id );
		}
	};

	const handleStudentRemoved = ( studentId: string ) => {
		setStudents( ( prev ) => prev.filter( ( s ) => s.id !== studentId ) );
		setSelectedStudentId( null );
	};

	const toggleLevelExpanded = ( studentId: string, level: number ) => {
		const key = `${ studentId }_${ level }`;
		setExpandedLevels( ( prev ) => ( {
			...prev,
			[ key ]: ! prev[ key ],
		} ) );
	};

	const toggleChapterExpanded = ( studentId: string, level: number, chapter: string ) => {
		const key = `${ studentId }_${ level }_${ chapter }`;
		setExpandedChapters( ( prev ) => ( {
			...prev,
			[ key ]: ! prev[ key ],
		} ) );
	};

	if ( loading ) {
		return (
			<div
				className="roi-suivi-loading"
				style={ { padding: '20px', fontSize: '16px', color: '#666' } }
			>
				Chargement des progressions en cours...
			</div>
		);
	}

	if ( error ) {
		return (
			<div
				className="notice notice-error"
				style={ { margin: '20px 0', padding: '10px' } }
			>
				<p>
					<strong>Erreur :</strong> { error }
				</p>
			</div>
		);
	}

	const uniqueLevels = [
		...new Set( courses.map( ( c ) => c.niveau ) ),
	].sort( ( a, b ) => a - b );
	const uniqueChapters = [
		...new Set(
			courses.map( ( c ) => c.chapitre_nom ).filter( Boolean )
		),
	];

	const filteredStudents = students.filter( ( student ) => {
		const fullName = normalizeText(
			`${ student.prenom || '' } ${ student.nom || '' } ${
				student.display_name || ''
			}`
		);
		const matchesSearch = fullName.includes( normalizeText( searchQuery ) );
		const matchesGroup =
			selectedGroup === 'all' ||
			( student.groups || [] ).some(
				( g ) => String( g.id ) === String( selectedGroup )
			);
		return matchesSearch && matchesGroup;
	} );

	return (
		<div
			className="roi-suivi-app"
			style={ {
				fontFamily: 'sans-serif',
				color: '#1d2327',
				maxWidth: '1200px',
				margin: '20px 0',
			} }
		>
			{ /* TOP CONTROLS & FILTERS */ }
			<SuiviFilters
				onOpenAddModal={ () => setIsAddModalOpen( true ) }
				searchQuery={ searchQuery }
				setSearchQuery={ setSearchQuery }
				selectedLevel={ selectedLevel }
				setSelectedLevel={ setSelectedLevel }
				uniqueLevels={ uniqueLevels }
				selectedChapter={ selectedChapter }
				setSelectedChapter={ setSelectedChapter }
				uniqueChapters={ uniqueChapters }
				selectedGroup={ selectedGroup }
				setSelectedGroup={ setSelectedGroup }
				availableGroups={ availableGroups }
			/>

			{ filteredStudents.length === 0 ? (
				<div
					style={ {
						background: '#fff',
						padding: '40px',
						textAlign: 'center',
						border: '1px solid #c3c4c7',
						borderRadius: '6px',
						color: '#646970',
					} }
				>
					Aucun élève trouvé.
				</div>
			) : (
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns:
							'repeat(auto-fill, minmax(360px, 1fr))',
						gap: '20px',
					} }
				>
					{ filteredStudents.map( ( student ) => (
						<StudentCard
							key={ student.id }
							student={ student }
							courses={ courses }
							selectedLevel={ selectedLevel }
							selectedChapter={ selectedChapter }
							expandedLevels={ expandedLevels }
							expandedChapters={ expandedChapters }
							toggleLevelExpanded={ toggleLevelExpanded }
							toggleChapterExpanded={ toggleChapterExpanded }
							onSelectStudent={ setSelectedStudentId }
							handleValidateCourse={ handleValidateCourse }
							handleResetCourse={ handleResetCourse }
							resettingAction={ resettingAction }
							validatingAction={ validatingAction }
						/>
					) ) }
				</div>
			) }

			{ /* DETAILED STUDENT MODAL */ }
			{ selectedStudentId && (
				<StudentDetailModal
					student={ students.find(
						( s ) => s.id === selectedStudentId
					) }
					courses={ courses }
					groupStats={ groupStats }
					onClose={ () => setSelectedStudentId( null ) }
					onResetElement={ handleResetElement }
					onResetCourse={ handleResetCourse }
					resettingAction={ resettingAction }
					onValidateElement={ handleValidateElement }
					onValidateCourse={ handleValidateCourse }
					validatingAction={ validatingAction }
					apiUrl={
						( window.roiSuiviConfig &&
							window.roiSuiviConfig.apiUrl ) ||
						''
					}
					nonce={
						( window.roiSuiviConfig &&
							window.roiSuiviConfig.nonce ) ||
						''
					}
					onStudentRemoved={ handleStudentRemoved }
					onCourseAssigned={ fetchData }
				/>
			) }

			{ /* ADD STUDENT MODAL */ }
			<AddStudentModal
				isOpen={ isAddModalOpen }
				onClose={ () => setIsAddModalOpen( false ) }
				onStudentAdded={ handleStudentAdded }
				apiUrl={
					( window.roiSuiviConfig && window.roiSuiviConfig.apiUrl ) ||
					''
				}
				nonce={
					( window.roiSuiviConfig && window.roiSuiviConfig.nonce ) ||
					''
				}
			/>
		</div>
	);
}
