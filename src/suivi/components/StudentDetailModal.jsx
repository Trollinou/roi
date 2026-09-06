import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

const CHAPTER_COLOR_MAP = {
	primary: '#0073aa',
	warning: '#d94f00',
	danger: '#d63638',
	success: '#00a32a',
	tertiary: '#8224e3',
};

const CHAPTER_ORDER_MAP = {
	'Matérialité': 1,
	'Activité des Pièces': 2,
	'Sécurité du Roi': 3,
	'Structure de Pions': 4,
	'Combination': 5,
};

function formatDuration( seconds ) {
	if ( typeof seconds !== 'number' || isNaN( seconds ) || seconds <= 0 ) {
		return '-';
	}
	const hrs = Math.floor( seconds / 3600 );
	const mins = Math.floor( ( seconds % 3600 ) / 60 );
	const secs = seconds % 60;

	if ( hrs > 0 ) {
		return `${ hrs }h ${ mins > 0 ? `${ mins }m ` : '' }${ secs > 0 ? `${ secs }s` : '' }`.trim();
	}
	if ( mins > 0 ) {
		return `${ mins } min ${ secs > 0 ? `${ secs }s` : '' }`.trim();
	}
	return `${ secs }s`;
}

function formatDate( dateString ) {
	if ( ! dateString ) return '-';
	try {
		const date = new Date( dateString.replace( ' ', 'T' ) );
		if ( isNaN( date.getTime() ) ) {
			return dateString;
		}
		return date.toLocaleDateString( 'fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		} );
	} catch ( _e ) {
		return dateString;
	}
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
} ) {
	const [ expandedLevels, setExpandedLevels ] = useState( {} );
	const [ expandedChapters, setExpandedChapters ] = useState( {} );
	const [ expandedCourses, setExpandedCourses ] = useState( {} );
	const [ filterType, setFilterType ] = useState( 'all' ); // 'all', 'validated', 'pending'
	const [ removing, setRemoving ] = useState( false );

	const handleRemoveFromTracking = async () => {
		if ( ! student ) return;
		const nomAffiche = student.display_name || 'cet élève';
		if ( ! window.confirm( `Êtes-vous sûr de vouloir retirer ${ nomAffiche } de la liste de suivi ?\n\nSa progression sera retirée du tableau de bord.` ) ) {
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
			alert( 'Erreur réseau lors du retrait de l\'élève.' );
		} finally {
			setRemoving( false );
		}
	};

	if ( ! student ) return null;

	const validesSet = new Set( student.elements_valides || [] );
	const detailsMap = student.details || {};

	const rawStudentName = student.prenom || student.nom
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

	const overallPercentage = totalElementsInCurriculum > 0
		? Math.round( ( totalValidatedCount / totalElementsInCurriculum ) * 100 )
		: 0;

	// Group courses by level and chapter
	const coursesByLevel = {};
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

	const toggleLevel = ( level ) => {
		setExpandedLevels( ( prev ) => ( {
			...prev,
			[ level ]: prev[ level ] === false ? true : ! ( prev[ level ] ?? true ),
		} ) );
	};

	const toggleChapter = ( level, chapter ) => {
		const key = `${ level }_${ chapter }`;
		setExpandedChapters( ( prev ) => ( {
			...prev,
			[ key ]: prev[ key ] === false ? true : ! ( prev[ key ] ?? true ),
		} ) );
	};

	const toggleCourse = ( courseId ) => {
		setExpandedCourses( ( prev ) => ( {
			...prev,
			[ courseId ]: prev[ courseId ] === false ? true : ! ( prev[ courseId ] ?? true ),
		} ) );
	};

	const sortedLevels = Object.keys( coursesByLevel ).map( Number ).sort( ( a, b ) => a - b );

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
						<h2 style={ { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1d2327' } }>
							{ studentName }
						</h2>
						<div style={ { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#646970' } }>
							<span>
								{ student.identity_type === 'member' ? (
									<a
										href={ `post.php?post=${ student.display_id }&action=edit` }
										target="_blank"
										rel="noopener noreferrer"
										style={ { color: '#0073aa', textDecoration: 'none' } }
										title="Ouvrir la fiche de l'adhérent dans DAME (nouvel onglet)"
									>
										Adhérent DAME : <strong>#{ student.display_id }</strong> ↗
									</a>
								) : (
									<a
										href={ `user-edit.php?user_id=${ student.display_id || student.id }` }
										target="_blank"
										rel="noopener noreferrer"
										style={ { color: '#0073aa', textDecoration: 'none' } }
										title="Ouvrir le profil utilisateur WordPress (nouvel onglet)"
									>
										Compte WordPress : <strong>#{ student.display_id || student.id }</strong> ↗
									</a>
								) }
							</span>
							{ student.parent_user && (
								<a
									href={ `user-edit.php?user_id=${ student.parent_user.id }` }
									target="_blank"
									rel="noopener noreferrer"
									style={ { background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: '500', textDecoration: 'none' } }
									title="Ouvrir le profil utilisateur WordPress parent (nouvel onglet)"
								>
									Rattaché au compte parent : { decodeEntities( student.parent_user.display_name ) } (#{ student.parent_user.id }) ↗
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

				{ /* SUMMARY STATS BAR */ }
				<div
					style={ {
						padding: '16px 24px',
						background: '#fff',
						borderBottom: '1px solid #e5e5e5',
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
						gap: '16px',
						flexShrink: 0,
					} }
				>
					<div style={ { background: '#f0f6fc', padding: '12px 16px', borderRadius: '6px', borderLeft: '4px solid #0073aa' } }>
						<div style={ { fontSize: '11px', textTransform: 'uppercase', color: '#646970', fontWeight: '600' } }>Progression Globale</div>
						<div style={ { fontSize: '20px', fontWeight: '700', color: '#0073aa', marginTop: '2px' } }>
							{ overallPercentage }%
						</div>
						<div style={ { fontSize: '12px', color: '#646970', marginTop: '2px' } }>
							{ totalValidatedCount } / { totalElementsInCurriculum } éléments validés
						</div>
					</div>

					<div style={ { background: '#f0fdf4', padding: '12px 16px', borderRadius: '6px', borderLeft: '4px solid #00a32a' } }>
						<div style={ { fontSize: '11px', textTransform: 'uppercase', color: '#646970', fontWeight: '600' } }>Temps Total Passé</div>
						<div style={ { fontSize: '20px', fontWeight: '700', color: '#00a32a', marginTop: '2px' } }>
							{ formatDuration( totalTimeSpentSeconds ) }
						</div>
						<div style={ { fontSize: '12px', color: '#646970', marginTop: '2px' } }>
							Sur les exercices complétés
						</div>
					</div>

					<div style={ { display: 'flex', flexDirection: 'column', justifyContent: 'center' } }>
						<div style={ { fontSize: '12px', fontWeight: '600', color: '#444', marginBottom: '6px' } }>Filtrer les éléments :</div>
						<div style={ { display: 'flex', gap: '6px' } }>
							<button
								type="button"
								onClick={ () => setFilterType( 'all' ) }
								style={ {
									padding: '4px 10px',
									fontSize: '11px',
									borderRadius: '4px',
									border: filterType === 'all' ? '1px solid #0073aa' : '1px solid #c3c4c7',
									background: filterType === 'all' ? '#0073aa' : '#fff',
									color: filterType === 'all' ? '#fff' : '#444',
									cursor: 'pointer',
								} }
							>
								Tous
							</button>
							<button
								type="button"
								onClick={ () => setFilterType( 'validated' ) }
								style={ {
									padding: '4px 10px',
									fontSize: '11px',
									borderRadius: '4px',
									border: filterType === 'validated' ? '1px solid #00a32a' : '1px solid #c3c4c7',
									background: filterType === 'validated' ? '#00a32a' : '#fff',
									color: filterType === 'validated' ? '#fff' : '#444',
									cursor: 'pointer',
								} }
							>
								Validés ({ totalValidatedCount })
							</button>
							<button
								type="button"
								onClick={ () => setFilterType( 'pending' ) }
								style={ {
									padding: '4px 10px',
									fontSize: '11px',
									borderRadius: '4px',
									border: filterType === 'pending' ? '1px solid #d94f00' : '1px solid #c3c4c7',
									background: filterType === 'pending' ? '#d94f00' : '#fff',
									color: filterType === 'pending' ? '#fff' : '#444',
									cursor: 'pointer',
								} }
							>
								À faire ({ totalElementsInCurriculum - totalValidatedCount })
							</button>
						</div>
					</div>
				</div>

				{ /* BODY CONTENT (SCROLLABLE) */ }
				<div
					style={ {
						flex: '1 1 auto',
						minHeight: 0,
						maxHeight: '100%',
						overflowY: 'auto',
						overflowX: 'hidden',
						padding: '20px 24px',
						boxSizing: 'border-box',
					} }
				>
					<div style={ { display: 'flex', flexDirection: 'column', gap: '16px' } }>
						{ sortedLevels.map( ( level ) => {
							const chapters = coursesByLevel[ level ];
							const isLevelExpanded = expandedLevels[ level ] !== false; // Default expanded
							const sortedChapters = Object.keys( chapters ).sort( ( a, b ) => {
								const orderA = CHAPTER_ORDER_MAP[ a ] ?? 99;
								const orderB = CHAPTER_ORDER_MAP[ b ] ?? 99;
								return orderA - orderB;
							} );

							return (
								<div key={ level } style={ { border: '1px solid #dcdcde', borderRadius: '6px', overflow: 'hidden' } }>
									<button
										type="button"
										onClick={ () => toggleLevel( level ) }
										style={ {
											width: '100%',
											background: '#f0f0f1',
											padding: '10px 16px',
											fontWeight: '700',
											fontSize: '14px',
											color: '#1d2327',
											border: 'none',
											borderBottom: isLevelExpanded ? '1px solid #dcdcde' : 'none',
											cursor: 'pointer',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											textAlign: 'left',
										} }
									>
										<span>Niveau { level }</span>
										<span style={ { fontSize: '11px', color: '#646970' } }>
											{ isLevelExpanded ? '▲ Cacher' : '▼ Afficher' }
										</span>
									</button>

									{ isLevelExpanded && (
										<div style={ { padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' } }>
											{ sortedChapters.map( ( chapter ) => {
												const chapterCourses = chapters[ chapter ];
												const isChapterExpanded = expandedChapters[ `${ level }_${ chapter }` ] !== false; // Default expanded
												const firstCourse = chapterCourses[ 0 ] || {};
												const colorSlug = firstCourse.chapitre_couleur || 'tertiary';
												const chapterColor = CHAPTER_COLOR_MAP[ colorSlug ] || colorSlug || '#8224e3';

												return (
													<div key={ chapter } style={ { border: `1px solid ${ chapterColor }30`, borderRadius: '6px', overflow: 'hidden' } }>
														<button
															type="button"
															onClick={ () => toggleChapter( level, chapter ) }
															style={ {
																width: '100%',
																background: chapterColor,
																color: '#fff',
																padding: '8px 12px',
																fontSize: '11px',
																fontWeight: '700',
																textTransform: 'uppercase',
																letterSpacing: '0.5px',
																border: 'none',
																cursor: 'pointer',
																display: 'flex',
																justifyContent: 'space-between',
																alignItems: 'center',
																textAlign: 'left',
															} }
														>
															<span>{ decodeEntities( chapter ) }</span>
															<span style={ { fontSize: '10px', opacity: 0.8 } }>
																{ isChapterExpanded ? '▲' : '▼' }
															</span>
														</button>

														{ isChapterExpanded && (
															<div style={ { padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fafafa' } }>
																{ chapterCourses.map( ( course ) => {
																	const playlist = course.playlist || [];
																	const isExpanded = expandedCourses[ course.id ] !== false; // default expanded

																	// Filter items if needed
																	const displayedItems = playlist.filter( ( item ) => {
																		const isValidated = validesSet.has( Number( item.id ) );
																		if ( filterType === 'validated' ) return isValidated;
																		if ( filterType === 'pending' ) return ! isValidated;
																		return true;
																	} );

																	const courseValidatedCount = playlist.filter( ( item ) => validesSet.has( Number( item.id ) ) ).length;
																	const coursePercentage = playlist.length > 0 ? Math.round( ( courseValidatedCount / playlist.length ) * 100 ) : 0;
																	const isResettingCourse = resettingAction && resettingAction.type === 'course' && resettingAction.id === course.id;
																	const isValidatingCourse = validatingAction && validatingAction.type === 'course' && validatingAction.id === course.id;

																	if ( displayedItems.length === 0 && filterType !== 'all' ) {
																		return null;
																	}

																	return (
																		<div key={ course.id } style={ { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '5px', overflow: 'hidden' } }>
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
																				<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
																					<span style={ { fontSize: '12px', color: '#888' } }>{ isExpanded ? '▲' : '▼' }</span>
																					<span style={ { fontWeight: '600', fontSize: '13px', color: '#1d2327' } }>
																						{ decodeEntities( course.titre ) }
																					</span>
																					<span style={ { fontSize: '11px', color: '#646970', background: '#f0f0f1', padding: '2px 6px', borderRadius: '3px' } }>
																						{ courseValidatedCount }/{ playlist.length } ({ coursePercentage }%)
																					</span>
																				</div>

																				<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
																					{ courseValidatedCount < playlist.length && (
																						<button
																							type="button"
																							onClick={ ( e ) => {
																								e.stopPropagation();
																								onValidateCourse( student.id, course.id, course.titre );
																							} }
																							disabled={ isValidatingCourse || isResettingCourse }
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
																								e.currentTarget.style.backgroundColor = '#dcfce7';
																							} }
																							onMouseOut={ ( e ) => {
																								e.currentTarget.style.backgroundColor = '#f0fdf4';
																							} }
																						>
																							{ isValidatingCourse ? 'Validation...' : '✓ Valider le cours' }
																						</button>
																					) }

																					<button
																						type="button"
																						onClick={ ( e ) => {
																							e.stopPropagation();
																							onResetCourse( student.id, course.id, course.titre );
																						} }
																						disabled={ courseValidatedCount === 0 || isResettingCourse || isValidatingCourse }
																						title="Réinitialiser tout le cours"
																						style={ {
																							padding: '4px 8px',
																							fontSize: '11px',
																							color: courseValidatedCount === 0 ? '#a7aaad' : '#d63638',
																							border: '1px solid currentColor',
																							borderRadius: '3px',
																							background: 'none',
																							cursor: courseValidatedCount === 0 ? 'default' : 'pointer',
																						} }
																					>
																						{ isResettingCourse ? 'Réinitialisation...' : '↺ Réinitialiser le cours' }
																					</button>
																				</div>
																			</div>

																			{ /* Item details list */ }
																			{ isExpanded && (
																				<div style={ { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' } }>
																					{ displayedItems.map( ( item, idx ) => {
																						const isValidated = validesSet.has( Number( item.id ) );
																						const detail = detailsMap[ item.id ] || {};
																						const itemTimeSpent = detail.time_spent;
																						const stat = groupStats && groupStats[ item.id ];
																						const avgTimeSpent = stat ? stat.avg_time_spent : null;
																						const isResettingItem = resettingAction && resettingAction.type === 'element' && resettingAction.id === item.id;
																						const isValidatingItem = validatingAction && validatingAction.type === 'element' && validatingAction.id === item.id;

																						// Determine speed badge
																						let comparisonBadge = null;
																						if ( isValidated && typeof itemTimeSpent === 'number' && typeof avgTimeSpent === 'number' && avgTimeSpent > 0 ) {
																							if ( itemTimeSpent <= avgTimeSpent * 0.8 ) {
																								comparisonBadge = (
																									<span style={ { fontSize: '10px', background: '#e6f6e6', color: '#007017', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' } } title="Temps inférieur à la moyenne du groupe">
																										⚡ Rapide
																									</span>
																								);
																							} else if ( itemTimeSpent >= avgTimeSpent * 1.3 ) {
																								comparisonBadge = (
																									<span style={ { fontSize: '10px', background: '#fff3e0', color: '#d94f00', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' } } title="Temps supérieur à la moyenne du groupe">
																										⏱ Plus long
																									</span>
																								);
																							} else {
																								comparisonBadge = (
																									<span style={ { fontSize: '10px', background: '#f0f6fc', color: '#0073aa', padding: '2px 6px', borderRadius: '3px', fontWeight: '500' } }>
																										Moyenne
																									</span>
																								);
																							}
																						}

																						return (
																							<div
																								key={ item.id || idx }
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
																								<div style={ { display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' } }>
																									<span
																										style={ {
																											fontSize: '10px',
																											padding: '2px 6px',
																											borderRadius: '3px',
																											fontWeight: '600',
																											textTransform: 'uppercase',
																											flexShrink: 0,
																											background: item.type === 'roi_lecon' ? '#e7f3ff' : '#f4ebff',
																											color: item.type === 'roi_lecon' ? '#0073aa' : '#8224e3',
																										} }
																									>
																										{ item.type === 'roi_lecon' ? 'Leçon' : 'Exercice' }
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
																										title={ decodeEntities( item.titre || `Élément #${ item.id }` ) }
																									>
																										{ decodeEntities( item.titre || `Élément #${ item.id }` ) }
																									</span>
																								</div>

																								{ /* Col 2: Validation status & date */ }
																								<div style={ { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '12px' } }>
																									{ isValidated ? (
																										<>
																											<span style={ { color: '#00a32a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' } }>
																												✓ Validé
																												{ detail.source === 'club' && (
																													<span style={ { fontSize: '10px', background: '#e6f6e6', color: '#007017', padding: '1px 5px', borderRadius: '3px', fontWeight: 'normal' } } title="Effectué lors de l'entraînement au club">
																														Club
																													</span>
																												) }
																											</span>
																											{ detail.date && (
																												<span style={ { fontSize: '11px', color: '#8c8f94' } }>
																													{ formatDate( detail.date ) }
																												</span>
																											) }
																										</>
																									) : (
																										<span style={ { color: '#8c8f94', fontStyle: 'italic' } }>
																											⏳ Non complété
																										</span>
																									) }
																								</div>

																								{ /* Col 3: Time stats & comparison */ }
																								<div style={ { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' } }>
																									{ isValidated && typeof itemTimeSpent === 'number' && itemTimeSpent > 0 ? (
																										<>
																											<span style={ { fontWeight: '600', color: '#2c3338', whiteSpace: 'nowrap' } } title="Temps passé par l'élève">
																												⏱ { formatDuration( itemTimeSpent ) }
																											</span>
																											{ typeof avgTimeSpent === 'number' && avgTimeSpent > 0 && (
																												<span style={ { fontSize: '11px', color: '#8c8f94', whiteSpace: 'nowrap' } } title={ `Moyenne calculée sur ${ stat?.count || 1 } élève(s)` }>
																													(Moy: { formatDuration( avgTimeSpent ) })
																												</span>
																											) }
																											{ comparisonBadge }
																										</>
																									) : isValidated ? (
																										<span style={ { color: '#a7aaad', fontSize: '12px' } } title="Temps non enregistré">-</span>
																									) : null }
																								</div>

																								{ /* Col 4: Action Button */ }
																								<div style={ { display: 'flex', justifyContent: 'flex-end' } }>
																									{ isValidated ? (
																										<button
																											type="button"
																											onClick={ () => onResetElement( student.id, item.id, item.titre ) }
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
																											onClick={ () => onValidateElement( student.id, item.id, item.titre ) }
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
											} ) }
										</div>
									)}
								</div>
							);
						} ) }
					</div>
				</div>

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
						{ removing ? 'Retrait en cours...' : '🗑 Retirer de la liste de suivi' }
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
