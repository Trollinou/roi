import React from 'react';
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel as EditorPluginDocumentSettingPanel } from '@wordpress/editor';
import { PluginDocumentSettingPanel as EditPostPluginDocumentSettingPanel } from '@wordpress/edit-post';
import { SelectControl, RadioControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { BoardCore, getFinalFenFromPgn } from 'eg-chessboard';
import 'eg-chessboard/base.css';
import 'eg-chessboard/pieces/cburnett.css';
import RoiFenEditor from './components/FenEditor';
import RoiPgnEditor from './components/PgnEditor';
import './components/FenEditor/FenEditor.scss';
import './components/PgnEditor/PgnEditor.scss';
import './blocks/chessboard/style.scss';

const PluginDocumentSettingPanel =
	EditorPluginDocumentSettingPanel || EditPostPluginDocumentSettingPanel;



window.RoiFenEditor = RoiFenEditor;
window.RoiPgnEditor = RoiPgnEditor;
window.EgBoardCore = BoardCore;
window.getFinalFenFromPgn = getFinalFenFromPgn;

// Gutenberg Native Panel for 'roi_lecon' configuration
const LeconSettingsPanel: React.FC = () => {
	const postType = useSelect((select: any) =>
		select('core/editor')
			? select('core/editor').getCurrentPostType()
			: null
	);

	const niveau = useSelect((select: any) => {
		const editor = select('core/editor');
		if (!editor) {
			return '1';
		}
		const editedMeta = editor.getEditedPostAttribute('meta');
		if (
			editedMeta &&
			editedMeta._roi_lecon_niveau !== undefined &&
			editedMeta._roi_lecon_niveau !== null &&
			editedMeta._roi_lecon_niveau !== ''
		) {
			return String(editedMeta._roi_lecon_niveau);
		}
		const currentMeta = editor.getCurrentPostAttribute('meta');
		if (
			currentMeta &&
			currentMeta._roi_lecon_niveau !== undefined &&
			currentMeta._roi_lecon_niveau !== null &&
			currentMeta._roi_lecon_niveau !== ''
		) {
			return String(currentMeta._roi_lecon_niveau);
		}
		return '1';
	}, []);

	const { isPanelOpened, isChapitreOpened } = useSelect((select: any) => {
		const editor = select('core/editor');
		const editPostStore = select('core/edit-post');
		const checkOpened = (panelName: string): boolean => {
			if (editor && typeof editor.isEditorPanelOpened === 'function') {
				return Boolean(editor.isEditorPanelOpened(panelName));
			}
			if (
				editPostStore &&
				typeof editPostStore.isEditorPanelOpened === 'function'
			) {
				return Boolean(editPostStore.isEditorPanelOpened(panelName));
			}
			return true;
		};
		return {
			isPanelOpened: checkOpened(
				'roi-lecon-settings/roi-lecon-settings-panel'
			),
			isChapitreOpened: checkOpened('taxonomy-panel-roi_chapitre'),
		};
	}, []);

	const editorDispatch = useDispatch('core/editor') as
		| {
				editPost?: (_data: any) => void;
				toggleEditorPanelOpened?: (_panelName: string) => void;
		  }
		| undefined;
	const editPostDispatch = useDispatch('core/edit-post') as
		| {
				toggleEditorPanelOpened?: (_panelName: string) => void;
		  }
		| undefined;
	const editPost = editorDispatch ? editorDispatch.editPost : null;

	React.useEffect(() => {
		if (postType !== 'roi_lecon') {
			return;
		}
		const togglePanel =
			editorDispatch?.toggleEditorPanelOpened ||
			editPostDispatch?.toggleEditorPanelOpened;
		if (typeof togglePanel !== 'function') {
			return;
		}
		if (!isPanelOpened) {
			togglePanel('roi-lecon-settings/roi-lecon-settings-panel');
		}
		if (!isChapitreOpened) {
			togglePanel('taxonomy-panel-roi_chapitre');
		}
	}, [
		postType,
		isPanelOpened,
		isChapitreOpened,
		editorDispatch,
		editPostDispatch,
	]);

	if (postType !== 'roi_lecon' || !editPost) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			name="roi-lecon-settings-panel"
			className="roi-lecon-settings-panel"
			title={__('Niveau de la Leçon', 'roi')}
			icon="welcome-learn-more"
		>
			<SelectControl
				__next40pxDefaultSize={true}
				__nextHasNoMarginBottom={true}
				value={niveau}
				options={[
					{ label: '1', value: '1' },
					{ label: '2', value: '2' },
					{ label: '3', value: '3' },
					{ label: '4', value: '4' },
				]}
				onChange={(value: string) => {
					editPost({
						meta: {
							_roi_lecon_niveau: parseInt(value, 10),
						},
					});
				}}
			/>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('roi-lecon-settings', {
	render: LeconSettingsPanel,
});

const CHAPITRE_ORDER = [
	'Matérialité',
	'Activité des Pièces',
	'Sécurité du Roi',
	'Structure de Pions',
	'Combination',
];

interface ChapitreTerm {
	id: number;
	name: string;
}

/**
 * Custom radio selector for 'roi_chapitre' in Gutenberg sidebar.
 * Preserves the canonical chapter order without moving checked items to the top.
 */
const RoiChapitreSelector: React.FC = () => {
	const terms = useSelect(
		(select: any): ChapitreTerm[] | null =>
			select('core').getEntityRecords('taxonomy', 'roi_chapitre', {
				per_page: -1,
				hide_empty: false,
				context: 'view',
			}),
		[]
	);

	const selectedTermIds = useSelect((select: any): number[] => {
		const editor = select('core/editor');
		const value = editor
			? editor.getEditedPostAttribute('roi_chapitre')
			: null;
		return Array.isArray(value) ? value : [];
	}, []);

	const editorDispatch = useDispatch('core/editor') as
		| { editPost?: (_data: any) => void }
		| undefined;

	const sortedTerms = React.useMemo(() => {
		if (!Array.isArray(terms)) {
			return [];
		}
		return [...terms].sort((a, b) => {
			const indexA = CHAPITRE_ORDER.indexOf(decodeEntities(a.name));
			const indexB = CHAPITRE_ORDER.indexOf(decodeEntities(b.name));
			const posA = indexA === -1 ? 99 : indexA;
			const posB = indexB === -1 ? 99 : indexB;
			return posA - posB;
		});
	}, [terms]);

	if (!Array.isArray(terms)) {
		return <p>{__('Chargement des chapitres…', 'roi')}</p>;
	}

	const selectedValue =
		selectedTermIds.length > 0 ? String(selectedTermIds[0]) : '';

	return (
		<RadioControl
			selected={selectedValue}
			options={sortedTerms.map((term) => ({
				label: decodeEntities(term.name),
				value: String(term.id),
			}))}
			onChange={(value: string) => {
				if (editorDispatch?.editPost) {
					editorDispatch.editPost({
						roi_chapitre: [parseInt(value, 10)],
					});
				}
			}}
		/>
	);
};

addFilter(
	'editor.PostTaxonomyType',
	'roi/chapitre-radio-selector',
	(OriginalComponent: React.ComponentType<any>) => {
		return (props: any) => {
			if (props?.slug !== 'roi_chapitre') {
				return <OriginalComponent {...props} />;
			}
			return <RoiChapitreSelector />;
		};
	}
);

// Enforce single selection for 'roi_chapitre' taxonomy in Gutenberg Block Editor & validation locking
if (typeof window !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => {
		if (window.wp && window.wp.data && window.wp.data.subscribe) {
			let lastChapters: number[] | null = null;
			let isSelfDispatching = false;
			const { subscribe, select, dispatch } = window.wp.data;

			// Explicitly purge any legacy lock keys and notices leftover in Gutenberg Redux state
			if (
				dispatch('core/editor') &&
				dispatch('core/editor').unlockPostSaving
			) {
				dispatch('core/editor').unlockPostSaving(
					'roi_lecon_missing_fields'
				);
			}
			if (
				dispatch('core/notices') &&
				dispatch('core/notices').removeNotice
			) {
				dispatch('core/notices').removeNotice(
					'roi_lecon_missing_fields_notice'
				);
			}

			subscribe(() => {
				if (isSelfDispatching) {
					return;
				}

				const editor = select('core/editor');
				if (!editor) {
					return;
				}

				// Single choice enforcement for 'roi_chapitre'
				const chapitres = editor.getEditedPostAttribute('roi_chapitre');
				if (Array.isArray(chapitres) && chapitres.length > 1) {
					const previous = lastChapters || [];
					const newlyAdded = chapitres.filter(
						(id: number) => !previous.includes(id)
					);
					const selectedId =
						newlyAdded.length > 0
							? newlyAdded[newlyAdded.length - 1]
							: chapitres[chapitres.length - 1];

					lastChapters = [selectedId];

					isSelfDispatching = true;
					try {
						dispatch('core/editor').editPost({
							roi_chapitre: [selectedId],
						});
					} finally {
						isSelfDispatching = false;
					}
				} else if (Array.isArray(chapitres)) {
					lastChapters = chapitres;
				}
			});
		}
	});
}
