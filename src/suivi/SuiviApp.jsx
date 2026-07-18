import { useEffect, useState } from '@wordpress/element';

const CHAPTER_ORDER_MAP = {
	'Matérialité': 1,
	'Activité des Pièces': 2,
	'Sécurité du Roi': 3,
	'Structure de Pions': 4,
	'Combination': 5,
};

const CHAPTER_COLOR_MAP = {
	primary: '#0073aa',
	warning: '#d94f00',
	danger: '#d63638',
	success: '#00a32a',
	tertiary: '#8224e3',
};


export default function SuiviApp() {
	const [ students, setStudents ] = useState( [] );
	const [ courses, setCourses ] = useState( [] );
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const [ selectedLevel, setSelectedLevel ] = useState( 'all' );
	const [ selectedChapter, setSelectedChapter ] = useState( 'all' );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ resettingCourse, setResettingCourse ] = useState( null ); // { studentId, courseId }
	const [ expandedLevels, setExpandedLevels ] = useState( {} ); // { studentId_level: bool }
	const [ expandedChapters, setExpandedChapters ] = useState( {} ); // { studentId_level_chapter: bool }

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
					throw new Error( 'Erreur de chargement des progressions.' );
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
				setStudents( progressionData || [] );
				setCourses( parcoursData || [] );
				setLoading( false );
			} )
			.catch( ( err ) => {
				setError( err.message );
				setLoading( false );
			} );
	};

	useEffect( () => {
		fetchData();
	}, [] );

	const handleResetProgression = async ( studentId, courseId ) => {
		if ( ! window.confirm( 'Voulez-vous vraiment réinitialiser la progression de ce cours pour cet élève ? L\'élève devra refaire toutes les leçons et exercices associés.' ) ) {
			return;
		}

		const config = window.roiSuiviConfig || {};
		const apiUrl = config.apiUrl || '';
		const nonce = config.nonce || '';

		setResettingCourse( { studentId, courseId } );

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
				alert( resJson.message || 'Une erreur est survenue lors de la réinitialisation.' );
			}
		} catch ( err ) {
			console.error( 'Reset error', err );
			alert( 'Erreur réseau ou permission refusée.' );
		} finally {
			setResettingCourse( null );
		}
	};

	const toggleLevelExpanded = ( studentId, level ) => {
		const key = `${ studentId }_${ level }`;
		setExpandedLevels( ( prev ) => ( {
			...prev,
			[ key ]: ! prev[ key ],
		} ) );
	};

	const toggleChapterExpanded = ( studentId, level, chapter ) => {
		const key = `${ studentId }_${ level }_${ chapter }`;
		setExpandedChapters( ( prev ) => ( {
			...prev,
			[ key ]: ! prev[ key ],
		} ) );
	};

	if ( loading ) {
		return (
			<div className="roi-suivi-loading" style={ { padding: '20px', fontSize: '16px', color: '#666' } }>
				Chargement des progressions en cours...
			</div>
		);
	}

	if ( error ) {
		return (
			<div className="notice notice-error" style={ { margin: '20px 0', padding: '10px' } }>
				<p><strong>Erreur :</strong> { error }</p>
			</div>
		);
	}

	const uniqueLevels = [ ...new Set( courses.map( ( c ) => c.niveau ) ) ].sort( ( a, b ) => a - b );
	const uniqueChapters = [ ...new Set( courses.map( ( c ) => c.chapitre_nom ).filter( Boolean ) ) ];

	const filteredStudents = students.filter( ( student ) => {
		const fullName = `${ student.prenom || '' } ${ student.nom || '' } ${ student.display_name || '' }`.toLowerCase();
		return fullName.includes( searchQuery.toLowerCase() );
	} );

	return (
		<div className="roi-suivi-app" style={ { fontFamily: 'sans-serif', color: '#1d2327', maxWidth: '1200px', margin: '20px 0' } }>
			
			{ /* TOP CONTROLS & FILTERS */ }
			<div style={ {
				background: '#fff',
				border: '1px solid #c3c4c7',
				borderRadius: '6px',
				padding: '15px 20px',
				marginBottom: '20px',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				flexWrap: 'wrap',
				gap: '15px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
			} }>
				<h1 style={ { margin: 0, fontSize: '22px', fontWeight: 600 } }>Suivi des élèves</h1>
				
				<div style={ { display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' } }>
					<input
						type="search"
						placeholder="Rechercher un élève..."
						value={ searchQuery }
						onChange={ ( e ) => setSearchQuery( e.target.value ) }
						style={ {
							padding: '6px 12px',
							width: '220px',
							border: '1px solid #8c8f94',
							borderRadius: '4px',
							fontSize: '13px',
						} }
					/>

					<select
						value={ selectedLevel }
						onChange={ ( e ) => setSelectedLevel( e.target.value ) }
						style={ {
							padding: '6px 12px',
							border: '1px solid #8c8f94',
							borderRadius: '4px',
							fontSize: '13px',
							background: '#fff',
						} }
					>
						<option value="all">Tous les Niveaux</option>
						{ uniqueLevels.map( ( lvl ) => (
							<option key={ lvl } value={ lvl }>Niveau { lvl }</option>
						) ) }
					</select>

					<select
						value={ selectedChapter }
						onChange={ ( e ) => setSelectedChapter( e.target.value ) }
						style={ {
							padding: '6px 12px',
							border: '1px solid #8c8f94',
							borderRadius: '4px',
							fontSize: '13px',
							background: '#fff',
						} }
					>
						<option value="all">Tous les Chapitres</option>
						{ uniqueChapters.map( ( chap ) => (
							<option key={ chap } value={ chap }>{ chap }</option>
						) ) }
					</select>
				</div>
			</div>

			{ filteredStudents.length === 0 ? (
				<div style={ { background: '#fff', padding: '40px', textAlign: 'center', border: '1px solid #c3c4c7', borderRadius: '6px', color: '#646970' } }>
					Aucun élève trouvé.
				</div>
			) : (
				<div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' } }>
					{ filteredStudents.map( ( student ) => {
						const validesSet = new Set( student.elements_valides || [] );
						const studentName = student.prenom || student.nom
							? `${ student.prenom || '' } ${ student.nom || '' }`.trim()
							: student.display_name || `Élève #${ student.id }`;

						// Filter courses for this student
						const filteredCourses = courses.filter( ( course ) => {
							if ( selectedLevel !== 'all' && Number( course.niveau ) !== Number( selectedLevel ) ) {
								return false;
							}
							if ( selectedChapter !== 'all' && course.chapitre_nom !== selectedChapter ) {
								return false;
							}
							return ( course.playlist || [] ).length > 0;
						} );

						// Group courses by Level, then by Chapter
						const groupedData = {};
						filteredCourses.forEach( ( course ) => {
							const lvl = course.niveau || 1;
							const chap = course.chapitre_nom || 'Sans Chapitre';

							if ( ! groupedData[ lvl ] ) {
								groupedData[ lvl ] = {};
							}
							if ( ! groupedData[ lvl ][ chap ] ) {
								groupedData[ lvl ][ chap ] = [];
							}
							groupedData[ lvl ][ chap ].push( course );
						} );

						const studentLevels = Object.keys( groupedData ).map( Number ).sort( ( a, b ) => a - b );

						return (
							<div
								key={ student.id }
								style={ {
									background: '#fff',
									border: '1px solid #c3c4c7',
									borderRadius: '6px',
									boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
									padding: '20px',
									display: 'flex',
									flexDirection: 'column',
									gap: '15px',
								} }
							>
								{ /* CARD HEADER */ }
								<div style={ { borderBottom: '1px solid #f0f0f1', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }>
									<h3 style={ { margin: 0, fontSize: '17px', fontWeight: 600, color: '#1d2327' } }>
										{ studentName }
									</h3>
									<span style={ { fontSize: '10px', color: '#646970', background: '#f0f0f1', padding: '2px 6px', borderRadius: '3px', fontWeight: '500' } }>
										ID: { student.display_id || student.id }
									</span>
								</div>

								{ /* CARD CONTENT - LEVEL ACCORDIONS */ }
								<div style={ { display: 'flex', flexDirection: 'column', gap: '10px' } }>
									{ studentLevels.length === 0 ? (
										<div style={ { fontSize: '13px', color: '#8c8f94', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' } }>
											Aucun cours ne correspond aux filtres.
										</div>
									) : (
										studentLevels.map( ( level ) => {
											const chapters = groupedData[ level ];
											const isLevelExpanded = expandedLevels[ `${ student.id }_${ level }` ] !== false; // Default expanded

											// Sort chapters according to predefined order
											const sortedChapters = Object.keys( chapters ).sort( ( a, b ) => {
												const orderA = CHAPTER_ORDER_MAP[ a ] ?? 99;
												const orderB = CHAPTER_ORDER_MAP[ b ] ?? 99;
												return orderA - orderB;
											} );

											return (
												<div key={ level } style={ { border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' } }>
													{ /* Level Header */ }
													<button
														type="button"
														onClick={ () => toggleLevelExpanded( student.id, level ) }
														style={ {
															width: '100%',
															background: '#f8f9fa',
															border: 'none',
															borderBottom: isLevelExpanded ? '1px solid #e0e0e0' : 'none',
															padding: '8px 12px',
															textAlign: 'left',
															fontWeight: '600',
															fontSize: '13px',
															color: '#444',
															cursor: 'pointer',
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'center',
														} }
													>
														<span>Niveau { level }</span>
														<span style={ { fontSize: '10px', color: '#888' } }>{ isLevelExpanded ? '▲ Cacher' : '▼ Afficher' }</span>
													</button>

													{ /* Chapters (Nested Accordions) */ }
													{ isLevelExpanded && (
														<div style={ { padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff' } }>
															{ sortedChapters.map( ( chapter ) => {
																const chapterCourses = chapters[ chapter ];
																const isChapterExpanded = expandedChapters[ `${ student.id }_${ level }_${ chapter }` ] !== false; // Default expanded
																const firstCourse = chapterCourses[ 0 ] || {};
																const colorSlug = firstCourse.chapitre_couleur || 'tertiary';
																const chapterColor = CHAPTER_COLOR_MAP[ colorSlug ] || colorSlug || '#8224e3';

																// Sort courses within chapter by order field
																const sortedCourses = [ ...chapterCourses ].sort( ( a, b ) => ( a.ordre || 0 ) - ( b.ordre || 0 ) );

																return (
																	<div key={ chapter } style={ { border: `1px solid ${ chapterColor }25`, borderRadius: '4px', overflow: 'hidden' } }>
																		{ /* Chapter Header */ }
																		<button
																			type="button"
																			onClick={ () => toggleChapterExpanded( student.id, level, chapter ) }
																			style={ {
																				width: '100%',
																				background: chapterColor,
																				border: 'none',
																				borderBottom: 'none',
																				padding: '8px 12px',
																				textAlign: 'left',
																				fontWeight: '600',
																				fontSize: '11px',
																				textTransform: 'uppercase',
																				color: '#fff',
																				letterSpacing: '0.5px',
																				cursor: 'pointer',
																				display: 'flex',
																				justifyContent: 'space-between',
																				alignItems: 'center',
																			} }
																		>
																			<span>{ chapter }</span>
																			<span style={ { fontSize: '9px', opacity: 0.8 } }>{ isChapterExpanded ? '▲' : '▼' }</span>
																		</button>

																		{ /* Courses list within chapter */ }
																		{ isChapterExpanded && (
																			<div style={ { padding: '10px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff' } }>
																				{ sortedCourses.map( ( course ) => {
																					const playlist = course.playlist || [];
																					const totalElements = playlist.length;

																					// Count valid items
																					let validatedCount = 0;
																					playlist.forEach( ( item ) => {
																						if ( item && item.id && validesSet.has( Number( item.id ) ) ) {
																							validatedCount++;
																						}
																					} );

																					const percentage = Math.round( ( validatedCount / totalElements ) * 100 );
																					const isResetting = resettingCourse && resettingCourse.studentId === student.id && resettingCourse.courseId === course.id;

																					return (
																						<div key={ course.id } style={ { display: 'flex', flexDirection: 'column', gap: '4px' } }>
																							{ /* Course Row */ }
																							<div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' } }>
																								<span style={ { fontWeight: '600', fontSize: '13px', color: '#1d2327', maxWidth: '75%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } } title={ course.titre }>
																									{ course.titre }
																								</span>

																								<div style={ { display: 'flex', alignItems: 'center', gap: '6px' } }>
																									<span style={ { color: '#646970', fontSize: '11px', fontWeight: '500' } }>
																										{ validatedCount }/{ totalElements }
																									</span>
																									
																									<button
																										type="button"
																										onClick={ () => handleResetProgression( student.id, course.id ) }
																										disabled={ isResetting || validatedCount === 0 }
																										title="Réinitialiser la progression de ce cours"
																										style={ {
																											background: 'none',
																											border: 'none',
																											color: validatedCount === 0 ? '#ccd0d4' : '#d63638',
																											cursor: validatedCount === 0 ? 'default' : 'pointer',
																											fontSize: '14px',
																											padding: '2px 4px',
																											lineHeight: 1,
																											borderRadius: '3px',
																										} }
																										onMouseOver={ ( e ) => {
																											if ( validatedCount > 0 ) {
																												e.currentTarget.style.backgroundColor = '#fbeaea';
																											}
																										} }
																										onMouseOut={ ( e ) => {
																											e.currentTarget.style.backgroundColor = 'transparent';
																										} }
																									>
																										{ isResetting ? '...' : '↺' }
																									</button>
																								</div>
																							</div>

																							{ /* Progress Bar Row */ }
																							<div style={ { display: 'flex', alignItems: 'center', gap: '10px' } }>
																								<div
																									style={ {
																										flexGrow: 1,
																										height: '6px',
																										background: '#f0f0f1',
																										borderRadius: '3px',
																										overflow: 'hidden',
																									} }
																								>
																									<div
																										style={ {
																											width: `${ percentage }%`,
																											height: '100%',
																											background: '#00a32a',
																										} }
																									/>
																								</div>
																								<span style={ { fontSize: '10px', fontWeight: '600', color: '#444', minWidth: '28px', textAlign: 'right' } }>
																									{ percentage }%
																								</span>
																							</div>
																						</div>
																					);
																				} ) }
																			</div>
																		)}
																	</div>
																);
															} ) }
														</div>
													)}
												</div>
											);
										} )
									) }
								</div>

							</div>
						);
					} ) }
				</div>
			)}
		</div>
	);
}
