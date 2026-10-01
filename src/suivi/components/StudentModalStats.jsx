import { formatDuration } from '../utils/suiviHelpers.js';

export default function StudentModalStats( {
	overallPercentage,
	totalValidatedCount,
	totalElementsInCurriculum,
	totalTimeSpentSeconds,
	filterType,
	setFilterType,
} ) {
	return (
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
			<div
				style={ {
					background: '#f0f6fc',
					padding: '12px 16px',
					borderRadius: '6px',
					borderLeft: '4px solid #0073aa',
				} }
			>
				<div
					style={ {
						fontSize: '11px',
						textTransform: 'uppercase',
						color: '#646970',
						fontWeight: '600',
					} }
				>
					Progression Globale
				</div>
				<div
					style={ {
						fontSize: '20px',
						fontWeight: '700',
						color: '#0073aa',
						marginTop: '2px',
					} }
				>
					{ overallPercentage }%
				</div>
				<div
					style={ {
						fontSize: '12px',
						color: '#646970',
						marginTop: '2px',
					} }
				>
					{ totalValidatedCount } / { totalElementsInCurriculum }{ ' ' }
					éléments validés
				</div>
			</div>

			<div
				style={ {
					background: '#f0fdf4',
					padding: '12px 16px',
					borderRadius: '6px',
					borderLeft: '4px solid #00a32a',
				} }
			>
				<div
					style={ {
						fontSize: '11px',
						textTransform: 'uppercase',
						color: '#646970',
						fontWeight: '600',
					} }
				>
					Temps Total Passé
				</div>
				<div
					style={ {
						fontSize: '20px',
						fontWeight: '700',
						color: '#00a32a',
						marginTop: '2px',
					} }
				>
					{ formatDuration( totalTimeSpentSeconds ) }
				</div>
				<div
					style={ {
						fontSize: '12px',
						color: '#646970',
						marginTop: '2px',
					} }
				>
					Sur les exercices complétés
				</div>
			</div>

			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
				} }
			>
				<div
					style={ {
						fontSize: '12px',
						fontWeight: '600',
						color: '#444',
						marginBottom: '6px',
					} }
				>
					Filtrer les éléments :
				</div>
				<div style={ { display: 'flex', gap: '6px' } }>
					<button
						type="button"
						onClick={ () => setFilterType( 'all' ) }
						style={ {
							padding: '4px 10px',
							fontSize: '11px',
							borderRadius: '4px',
							border:
								filterType === 'all'
									? '1px solid #0073aa'
									: '1px solid #c3c4c7',
							background:
								filterType === 'all' ? '#0073aa' : '#fff',
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
							border:
								filterType === 'validated'
									? '1px solid #00a32a'
									: '1px solid #c3c4c7',
							background:
								filterType === 'validated' ? '#00a32a' : '#fff',
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
							border:
								filterType === 'pending'
									? '1px solid #d94f00'
									: '1px solid #c3c4c7',
							background:
								filterType === 'pending' ? '#d94f00' : '#fff',
							color: filterType === 'pending' ? '#fff' : '#444',
							cursor: 'pointer',
						} }
					>
						À faire ({ ' ' }
						{ totalElementsInCurriculum - totalValidatedCount } )
					</button>
				</div>
			</div>
		</div>
	);
}
