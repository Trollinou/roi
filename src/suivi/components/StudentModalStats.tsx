import React from 'react';
import { formatDuration } from '../utils/suiviHelpers';

export interface StudentModalStatsProps {
	overallPercentage: number;
	totalValidatedCount: number;
	totalElementsInCurriculum: number;
	totalTimeSpentSeconds: number;
	filterType: 'all' | 'validated' | 'pending';
	setFilterType: ( _filter: 'all' | 'validated' | 'pending' ) => void;
}

export default function StudentModalStats( {
	overallPercentage,
	totalValidatedCount,
	totalElementsInCurriculum,
	totalTimeSpentSeconds,
	filterType,
	setFilterType,
}: StudentModalStatsProps ): React.JSX.Element {
	return (
		<div className="roi-student-modal-stats">
			<div className="roi-student-modal-stats__box roi-student-modal-stats__box--progress">
				<div className="roi-student-modal-stats__label">
					Progression Globale
				</div>
				<div className="roi-student-modal-stats__value roi-student-modal-stats__value--progress">
					{ overallPercentage }%
				</div>
				<div className="roi-student-modal-stats__sub">
					{ totalValidatedCount } / { totalElementsInCurriculum }{ ' ' }
					éléments validés
				</div>
			</div>

			<div className="roi-student-modal-stats__box roi-student-modal-stats__box--time">
				<div className="roi-student-modal-stats__label">
					Temps Total Passé
				</div>
				<div className="roi-student-modal-stats__value roi-student-modal-stats__value--time">
					{ formatDuration( totalTimeSpentSeconds ) }
				</div>
				<div className="roi-student-modal-stats__sub">
					Sur les exercices complétés
				</div>
			</div>

			<div className="roi-student-modal-stats__filters">
				<div className="roi-student-modal-stats__filters-label">
					Filtrer les éléments :
				</div>
				<div className="roi-student-modal-stats__filters-group">
					<button
						type="button"
						onClick={ () => setFilterType( 'all' ) }
						className={ `roi-student-modal-stats__filter-btn${
							filterType === 'all'
								? ' roi-student-modal-stats__filter-btn--active-all'
								: ''
						}` }
					>
						Tous
					</button>
					<button
						type="button"
						onClick={ () => setFilterType( 'validated' ) }
						className={ `roi-student-modal-stats__filter-btn${
							filterType === 'validated'
								? ' roi-student-modal-stats__filter-btn--active-validated'
								: ''
						}` }
					>
						Validés ({ totalValidatedCount })
					</button>
					<button
						type="button"
						onClick={ () => setFilterType( 'pending' ) }
						className={ `roi-student-modal-stats__filter-btn${
							filterType === 'pending'
								? ' roi-student-modal-stats__filter-btn--active-pending'
								: ''
						}` }
					>
						À faire ({ ' ' }
						{ totalElementsInCurriculum - totalValidatedCount } )
					</button>
				</div>
			</div>
		</div>
	);
}
