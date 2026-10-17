import React from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import { CHAPTER_ORDER_MAP } from '../utils/suiviHelpers';
import StudentDetailCourseCard from './StudentDetailCourseCard';
import type { GroupStatItem } from './StudentDetailItemRow';
import type { CoursItem } from '../../types/api/parcours';
import type { StudentProgress, ProgressionDetail } from '../../types/api/progression';
import type { ActionPayload } from './StudentCard';

export interface StudentModalCurriculumProps {
	coursesByLevel: Record<number, Record<string, CoursItem[]>>;
	sortedLevels: number[];
	expandedLevels: Record<number | string, boolean>;
	toggleLevel: ( _level: number ) => void;
	expandedChapters: Record<string, boolean>;
	toggleChapter: ( _level: number, _chapter: string ) => void;
	expandedCourses: Record<number | string, boolean>;
	toggleCourse: ( _courseId: number ) => void;
	student: StudentProgress;
	validesSet: Set<number>;
	detailsMap: Record<number | string, ProgressionDetail>;
	groupStats?: Record<string | number, GroupStatItem>;
	filterType: 'all' | 'validated' | 'pending';
	assigningCourseId: number | null;
	handleToggleCourseAssignment: ( _courseId: number, _isCurrentlyAssigned: boolean ) => void;
	onValidateCourse: ( _studentId: string, _courseId: number, _courseTitle: string ) => void;
	onResetCourse: ( _studentId: string, _courseId: number, _courseTitle: string ) => void;
	onValidateElement: ( _studentId: string, _elementId: number, _elementTitle?: string ) => void;
	onResetElement: ( _studentId: string, _elementId: number, _elementTitle?: string ) => void;
	resettingAction: ActionPayload | null;
	validatingAction: ActionPayload | null;
}

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
}: StudentModalCurriculumProps ): React.JSX.Element {
	return (
		<div className="roi-student-modal-curriculum">
			<div className="roi-student-modal-curriculum__levels">
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
							className="roi-student-modal-curriculum__level"
						>
							<button
								type="button"
								onClick={ () => toggleLevel( level ) }
								className={ `roi-student-modal-curriculum__level-btn${
									isLevelExpanded
										? ' roi-student-modal-curriculum__level-btn--expanded'
										: ''
								}` }
							>
								<span>Niveau { level }</span>
								<span className="roi-student-modal-curriculum__level-toggle">
									{ isLevelExpanded
										? '▲ Cacher'
										: '▼ Afficher' }
								</span>
							</button>

							{ isLevelExpanded && (
								<div className="roi-student-modal-curriculum__chapters">
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

										return (
											<div
												key={ chapter }
												className={ `roi-student-modal-curriculum__chapter roi-chapter-color--${ colorSlug }` }
											>
												<button
													type="button"
													onClick={ () =>
														toggleChapter(
															level,
															chapter
														)
													}
													className="roi-student-modal-curriculum__chapter-btn"
												>
													<span>
														{ decodeEntities(
															chapter
														) }
													</span>
													<span className="roi-student-modal-curriculum__chapter-toggle">
														{ isChapterExpanded
															? '▲'
															: '▼' }
													</span>
												</button>

												{ isChapterExpanded && (
													<div className="roi-student-modal-curriculum__courses">
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
