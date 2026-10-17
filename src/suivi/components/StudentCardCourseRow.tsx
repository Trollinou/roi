import React from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import type { CoursItem } from '../../types/api/parcours';
import type { ActionPayload } from './StudentCard';

export interface StudentCardCourseRowProps {
  course: CoursItem;
  studentId: string;
  validesSet: Set<number>;
  resettingAction: ActionPayload | null;
  validatingAction: ActionPayload | null;
  handleValidateCourse: (_studentId: string, _courseId: number, _courseTitle: string) => void;
  handleResetCourse: (_studentId: string, _courseId: number, _courseTitle: string) => void;
}

export default function StudentCardCourseRow({
  course,
  studentId,
  validesSet,
  resettingAction,
  validatingAction,
  handleValidateCourse,
  handleResetCourse,
}: StudentCardCourseRowProps): React.JSX.Element {
  const playlist = course.playlist || [];
  const totalElements = playlist.length;

  let validatedCount = 0;
  playlist.forEach((item) => {
    if (item && item.id && validesSet.has(Number(item.id))) {
      validatedCount++;
    }
  });

  const percentage =
    totalElements > 0
      ? Math.round((validatedCount / totalElements) * 100)
      : 0;
  const isResettingThisCourse =
    resettingAction !== null &&
    resettingAction.type === 'course' &&
    resettingAction.studentId === studentId &&
    resettingAction.id === course.id;
  const isValidatingThisCourse =
    validatingAction !== null &&
    validatingAction.type === 'course' &&
    validatingAction.studentId === studentId &&
    validatingAction.id === course.id;

  return (
    <div className="roi-course-row">
      {/* Course Row */}
      <div className="roi-course-row__top">
        <span
          className="roi-course-row__title"
          title={decodeEntities(course.titre)}
        >
          {decodeEntities(course.titre)}
        </span>

        <div className="roi-course-row__actions">
          <span className="roi-course-row__count">
            {validatedCount} / {totalElements}
          </span>

          {validatedCount < totalElements && (
            <button
              type="button"
              onClick={() =>
                handleValidateCourse(studentId, course.id, course.titre)
              }
              disabled={Boolean(isValidatingThisCourse || isResettingThisCourse)}
              title="Valider tous les exercices restants de ce cours (Club)"
              className="roi-course-row__icon-btn roi-course-row__icon-btn--validate"
            >
              {isValidatingThisCourse ? '...' : '✓'}
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              handleResetCourse(studentId, course.id, course.titre)
            }
            disabled={Boolean(
              isResettingThisCourse ||
              isValidatingThisCourse ||
              validatedCount === 0
            )}
            title="Réinitialiser la progression de ce cours"
            className={`roi-course-row__icon-btn roi-course-row__icon-btn--reset ${
              validatedCount === 0 ? 'roi-course-row__icon-btn--disabled' : ''
            }`}
          >
            {isResettingThisCourse ? '...' : '↺'}
          </button>
        </div>
      </div>

      {/* Progress Bar Row */}
      <div className="roi-course-row__progress-wrap">
        <progress
          className="roi-course-row__progress-native"
          value={percentage}
          max={100}
        />
        <span className="roi-course-row__percent">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

