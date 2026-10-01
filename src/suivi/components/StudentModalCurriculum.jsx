import { decodeEntities } from '@wordpress/html-entities';
import { CHAPTER_COLOR_MAP, CHAPTER_ORDER_MAP } from '../utils/suiviHelpers.js';
import StudentDetailCourseCard from './StudentDetailCourseCard.jsx';

export default function StudentModalCurriculum( {
	coursesByLevel,
	sortedLevels,
	expandedLevels,
	toggleLevel,
	expandedChapters,
	toggleChapter,
	expandedCourses,
	toggleCourse,
	student,
	validesSet,
	detailsMap,
	groupStats,
	filterType,
	assigningCourseId,
	handleToggleCourseAssignment,
	onValidateCourse,
	onResetCourse,
	onValidateElement,
	onResetElement,
	resettingAction,
	validatingAction,
} ) {
	return (
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
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: '16px',
				} }
			>
				{ sortedLevels.map( ( level ) => {
					const chapters = coursesByLevel[ level ];
					const isLevelExpanded = expandedLevels[ level ] !== false;
					const sortedChapters = Object.keys( chapters ).sort(
						( a, b ) => {
							const orderA = CHAPTER_ORDER_MAP[ a ] ?? 99;
							const orderB = CHAPTER_ORDER_MAP[ b ] ?? 99;
							return orderA - orderB;
						}
					);

					return (
						<div
							key={ level }
							style={ {
								border: '1px solid #dcdcde',
								borderRadius: '6px',
								overflow: 'hidden',
							} }
						>
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
									borderBottom: isLevelExpanded
										? '1px solid #dcdcde'
										: 'none',
									cursor: 'pointer',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									textAlign: 'left',
								} }
							>
								<span>Niveau { level }</span>
								<span
									style={ {
										fontSize: '11px',
										color: '#646970',
									} }
								>
									{ isLevelExpanded
										? '▲ Cacher'
										: '▼ Afficher' }
								</span>
							</button>

							{ isLevelExpanded && (
								<div
									style={ {
										padding: '12px',
										display: 'flex',
										flexDirection: 'column',
										gap: '14px',
									} }
								>
									{ sortedChapters.map( ( chapter ) => {
										const chapterCourses =
											chapters[ chapter ];
										const isChapterExpanded =
											expandedChapters[
												`${ level }_${ chapter }`
											] !== false;
										const firstCourse =
											chapterCourses[ 0 ] || {};
										const colorSlug =
											firstCourse.chapitre_couleur ||
											'tertiary';
										const chapterColor =
											CHAPTER_COLOR_MAP[ colorSlug ] ||
											colorSlug ||
											'#8224e3';

										return (
											<div
												key={ chapter }
												style={ {
													border: `1px solid ${ chapterColor }30`,
													borderRadius: '6px',
													overflow: 'hidden',
												} }
											>
												<button
													type="button"
													onClick={ () =>
														toggleChapter(
															level,
															chapter
														)
													}
													style={ {
														width: '100%',
														background:
															chapterColor,
														color: '#fff',
														padding: '8px 12px',
														fontSize: '11px',
														fontWeight: '700',
														textTransform:
															'uppercase',
														letterSpacing: '0.5px',
														border: 'none',
														cursor: 'pointer',
														display: 'flex',
														justifyContent:
															'space-between',
														alignItems: 'center',
														textAlign: 'left',
													} }
												>
													<span>
														{ decodeEntities(
															chapter
														) }
													</span>
													<span
														style={ {
															fontSize: '10px',
															opacity: 0.8,
														} }
													>
														{ isChapterExpanded
															? '▲'
															: '▼' }
													</span>
												</button>

												{ isChapterExpanded && (
													<div
														style={ {
															padding: '10px',
															display: 'flex',
															flexDirection:
																'column',
															gap: '10px',
															background:
																'#fafafa',
														} }
													>
														{ chapterCourses.map(
															( course ) => (
																<StudentDetailCourseCard
																	key={
																		course.id
																	}
																	course={
																		course
																	}
																	student={
																		student
																	}
																	validesSet={
																		validesSet
																	}
																	detailsMap={
																		detailsMap
																	}
																	groupStats={
																		groupStats
																	}
																	filterType={
																		filterType
																	}
																	isExpanded={
																		expandedCourses[
																			course
																				.id
																		] !==
																		false
																	}
																	toggleCourse={
																		toggleCourse
																	}
																	assigningCourseId={
																		assigningCourseId
																	}
																	handleToggleCourseAssignment={
																		handleToggleCourseAssignment
																	}
																	onValidateCourse={
																		onValidateCourse
																	}
																	onResetCourse={
																		onResetCourse
																	}
																	onValidateElement={
																		onValidateElement
																	}
																	onResetElement={
																		onResetElement
																	}
																	resettingAction={
																		resettingAction
																	}
																	validatingAction={
																		validatingAction
																	}
																/>
															)
														) }
													</div>
												) }
											</div>
										);
									} ) }
								</div>
							) }
						</div>
					);
				} ) }
			</div>
		</div>
	);
}
