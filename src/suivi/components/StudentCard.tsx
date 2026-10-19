import React from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import { CHAPTER_ORDER_MAP } from '../utils/suiviHelpers';
import StudentCardCourseRow from './StudentCardCourseRow';
import type { StudentProgress } from '../../types/api/progression';
import type { CoursItem } from '../../types/api/parcours';

export interface ActionPayload {
  type: 'course' | 'element';
  studentId: string;
  id: number;
}

export interface StudentCardProps {
  student: StudentProgress;
  courses: CoursItem[];
  selectedLevel: string;
  selectedChapter: string;
  expandedLevels: Record<string, boolean>;
  expandedChapters: Record<string, boolean>;
  toggleLevelExpanded: (_studentId: string, _level: number) => void;
  toggleChapterExpanded: (_studentId: string, _level: number, _chapter: string) => void;
  onSelectStudent: (_studentId: string) => void;
  handleValidateCourse: (_studentId: string, _courseId: number, _courseTitle: string) => void;
  handleResetCourse: (_studentId: string, _courseId: number, _courseTitle: string) => void;
  resettingAction: ActionPayload | null;
  validatingAction: ActionPayload | null;
}

export default function StudentCard({
  student,
  courses,
  selectedLevel,
  selectedChapter,
  expandedLevels,
  expandedChapters,
  toggleLevelExpanded,
  toggleChapterExpanded,
  onSelectStudent,
  handleValidateCourse,
  handleResetCourse,
  resettingAction,
  validatingAction,
}: StudentCardProps): React.JSX.Element {
  const validesSet = new Set<number>(student.elements_valides || []);
  const rawStudentName =
    student.prenom || student.nom
      ? `${student.prenom || ''} ${student.nom || ''}`.trim()
      : student.display_name || `Élève #${student.id}`;
  const studentName = decodeEntities(rawStudentName);

  // Filter courses for this student
  const filteredCourses = courses.filter((course) => {
    if (
      selectedLevel !== 'all' &&
      Number(course.niveau) !== Number(selectedLevel)
    ) {
      return false;
    }
    if (
      selectedChapter !== 'all' &&
      course.chapitre_nom !== selectedChapter
    ) {
      return false;
    }
    return (course.playlist || []).length > 0;
  });

  // Group courses by Level, then by Chapter
  const groupedData: Record<number, Record<string, CoursItem[]>> = {};
  filteredCourses.forEach((course) => {
    const lvl = course.niveau || 1;
    const chap = course.chapitre_nom || 'Sans Chapitre';

    if (!groupedData[lvl]) {
      groupedData[lvl] = {};
    }
    if (!groupedData[lvl][chap]) {
      groupedData[lvl][chap] = [];
    }
    groupedData[lvl][chap].push(course);
  });

  const studentLevels = Object.keys(groupedData)
    .map(Number)
    .sort((a, b) => a - b);

  const isMember = student.identity_type === 'member';

  return (
    <div className="roi-student-card">
      {/* CARD HEADER */}
      <div
        role="button"
        tabIndex={0}
        className="roi-student-card__header"
        onClick={() => onSelectStudent(student.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectStudent(student.id);
          }
        }}
        title="Cliquer pour afficher la vue détaillée de l'élève"
      >
        <div className="roi-student-card__identity">
          <div className="roi-student-card__title-row">
            <h3 className="roi-student-card__name">
              {studentName}
            </h3>
            {(student.groups || []).map((g) => (
              <span
                key={g.id}
                className="roi-student-card__group-badge"
              >
                {decodeEntities(g.name)}
              </span>
            ))}
            {(student.assigned_course_ids || []).length > 0 && (
              <span
                className="roi-student-card__assigned-badge"
                title="Cet élève a des cours assignés"
              >
                📌 {(student.assigned_course_ids || []).length}{' '}
                assigné
                {(student.assigned_course_ids || []).length > 1 ? 's' : ''}
              </span>
            )}
            <span className="roi-student-card__details-hint">
              🔍 Détails
            </span>
          </div>
          {student.parent_user && (
            <span className="roi-student-card__parent">
              Rattaché à :{' '}
              <a
                href={`user-edit.php?user_id=${student.parent_user.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="roi-student-card__parent-link"
                title="Ouvrir le profil WordPress parent (nouvel onglet)"
              >
                {decodeEntities(student.parent_user.display_name)}{' '}
                (#{student.parent_user.id}) ↗
              </a>
            </span>
          )}
        </div>
        <a
          href={
            isMember
              ? `post.php?post=${student.display_id}&action=edit`
              : `user-edit.php?user_id=${student.display_id || student.id}`
          }
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`roi-student-card__ext-link ${
            isMember ? 'roi-student-card__ext-link--member' : ''
          }`}
          title={
            isMember
              ? 'Voir la fiche adhérent DAME (nouvel onglet)'
              : 'Voir le compte utilisateur WP (nouvel onglet)'
          }
        >
          {isMember
            ? `Adhérent #${student.display_id} ↗`
            : `Compte WP #${student.display_id || student.id} ↗`}
        </a>
      </div>

      {/* CARD CONTENT - LEVEL ACCORDIONS */}
      <div className="roi-student-card__body">
        {studentLevels.length === 0 ? (
          <div className="roi-student-card__empty">
            Aucun cours ne correspond aux filtres.
          </div>
        ) : (
          studentLevels.map((level) => {
            const chapters = groupedData[level];
            const isLevelExpanded =
              expandedLevels[`${student.id}_${level}`] !== false;

            const sortedChapters = Object.keys(chapters).sort((a, b) => {
              const orderA = CHAPTER_ORDER_MAP[a] ?? 99;
              const orderB = CHAPTER_ORDER_MAP[b] ?? 99;
              return orderA - orderB;
            });

            return (
              <div
                key={level}
                className="roi-student-card__level"
              >
                {/* Level Header */}
                <button
                  type="button"
                  onClick={() => toggleLevelExpanded(student.id, level)}
                  className={`roi-student-card__level-btn ${
                    isLevelExpanded ? 'roi-student-card__level-btn--expanded' : ''
                  }`}
                >
                  <span>Niveau {level}</span>
                  <span className="roi-student-card__level-toggle">
                    {isLevelExpanded ? '▲ Cacher' : '▼ Afficher'}
                  </span>
                </button>

                {/* Chapters (Nested Accordions) */}
                {isLevelExpanded && (
                  <div className="roi-student-card__chapters">
                    {sortedChapters.map((chapter) => {
                      const chapterCourses = chapters[chapter];
                      const isChapterExpanded =
                        expandedChapters[`${student.id}_${level}_${chapter}`] !== false;
                      const firstCourse = chapterCourses[0] || ({} as Partial<CoursItem>);
                      const colorSlug = firstCourse.chapitre_couleur || 'tertiary';

                      const sortedCourses = [...chapterCourses].sort(
                        (a, b) => (a.ordre || 0) - (b.ordre || 0)
                      );

                      return (
                        <div
                          key={chapter}
                          className={`roi-student-card__chapter roi-chapter-color--${colorSlug}`}
                        >
                          {/* Chapter Header */}
                          <button
                            type="button"
                            onClick={() =>
                              toggleChapterExpanded(
                                student.id,
                                level,
                                chapter
                              )
                            }
                            className="roi-student-card__chapter-btn"
                          >
                            <span>{decodeEntities(chapter)}</span>
                            <span className="roi-student-card__chapter-caret">
                              {isChapterExpanded ? '▲' : '▼'}
                            </span>
                          </button>

                          {/* Courses list within chapter */}
                          {isChapterExpanded && (
                            <div className="roi-student-card__courses">
                              {sortedCourses.map((course) => (
                                <StudentCardCourseRow
                                  key={course.id}
                                  course={course}
                                  studentId={student.id}
                                  validesSet={validesSet}
                                  resettingAction={resettingAction}
                                  validatingAction={validatingAction}
                                  handleValidateCourse={handleValidateCourse}
                                  handleResetCourse={handleResetCourse}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
