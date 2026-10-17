import React from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import type { StudentGroupTaxonomy, StudentGroupSummary } from '../../types/api/progression';

export interface SuiviFiltersProps {
  onOpenAddModal: () => void;
  searchQuery: string;
  setSearchQuery: (_query: string) => void;
  selectedLevel: string;
  setSelectedLevel: (_level: string) => void;
  uniqueLevels: number[];
  selectedChapter: string;
  setSelectedChapter: (_chapter: string) => void;
  uniqueChapters: string[];
  selectedGroup: string;
  setSelectedGroup: (_group: string) => void;
  availableGroups: (StudentGroupTaxonomy | StudentGroupSummary)[];
}

export default function SuiviFilters({
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
}: SuiviFiltersProps): React.JSX.Element {
  return (
    <div className="roi-suivi-filters">
      <h1 className="roi-suivi-filters__title">Suivi des élèves</h1>

      <div className="roi-suivi-filters__controls">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="roi-suivi-filters__add-btn"
        >
          ＋ Ajouter un élève
        </button>

        <input
          type="search"
          placeholder="Rechercher un élève..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="roi-suivi-filters__search"
        />

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="roi-suivi-filters__select"
        >
          <option value="all">Tous les Niveaux</option>
          {uniqueLevels.map((lvl) => (
            <option key={lvl} value={lvl}>
              Niveau {lvl}
            </option>
          ))}
        </select>

        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className="roi-suivi-filters__select"
        >
          <option value="all">Tous les Chapitres</option>
          {uniqueChapters.map((chap) => (
            <option key={chap} value={chap}>
              {decodeEntities(chap)}
            </option>
          ))}
        </select>

        {availableGroups.length > 0 && (
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="roi-suivi-filters__select"
          >
            <option value="all">Tous les Groupes</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {decodeEntities(g.name)}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
