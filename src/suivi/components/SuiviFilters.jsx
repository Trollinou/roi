import { decodeEntities } from '@wordpress/html-entities';

export default function SuiviFilters( {
	onOpenAddModal,
	searchQuery,
	setSearchQuery,
	selectedLevel,
	setSelectedLevel,
	uniqueLevels,
	selectedChapter,
	setSelectedChapter,
	uniqueChapters,
	selectedGroup,
	setSelectedGroup,
	availableGroups,
} ) {
	return (
		<div
			style={ {
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
			} }
		>
			<h1 style={ { margin: 0, fontSize: '22px', fontWeight: 600 } }>
				Suivi des élèves
			</h1>

			<div
				style={ {
					display: 'flex',
					gap: '15px',
					flexWrap: 'wrap',
					alignItems: 'center',
				} }
			>
				<button
					type="button"
					onClick={ onOpenAddModal }
					style={ {
						padding: '6px 14px',
						border: '1px solid #0073aa',
						background: '#0073aa',
						color: '#fff',
						borderRadius: '4px',
						fontSize: '13px',
						fontWeight: '600',
						cursor: 'pointer',
						whiteSpace: 'nowrap',
					} }
				>
					＋ Ajouter un élève
				</button>

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
						<option key={ lvl } value={ lvl }>
							Niveau { lvl }
						</option>
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
						<option key={ chap } value={ chap }>
							{ decodeEntities( chap ) }
						</option>
					) ) }
				</select>

				{ availableGroups.length > 0 && (
					<select
						value={ selectedGroup }
						onChange={ ( e ) => setSelectedGroup( e.target.value ) }
						style={ {
							padding: '6px 12px',
							border: '1px solid #8c8f94',
							borderRadius: '4px',
							fontSize: '13px',
							background: '#fff',
						} }
					>
						<option value="all">Tous les Groupes</option>
						{ availableGroups.map( ( g ) => (
							<option key={ g.id } value={ g.id }>
								{ decodeEntities( g.name ) }
							</option>
						) ) }
					</select>
				) }
			</div>
		</div>
	);
}
