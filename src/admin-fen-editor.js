import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel as EditorPluginDocumentSettingPanel } from '@wordpress/editor';
import { PluginDocumentSettingPanel as EditPostPluginDocumentSettingPanel } from '@wordpress/edit-post';
import { SelectControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BoardCore, getFinalFenFromPgn } from 'eg-chessboard';
import RoiFenEditor from './components/FenEditor';
import RoiPgnEditor from './components/PgnEditor';
import './components/FenEditor/FenEditor.css';
import './components/PgnEditor/PgnEditor.css';
import './blocks/chessboard/style.css';

const PluginDocumentSettingPanel =
	EditorPluginDocumentSettingPanel || EditPostPluginDocumentSettingPanel;

window.RoiFenEditor = RoiFenEditor;
window.RoiPgnEditor = RoiPgnEditor;
window.EgBoardCore = BoardCore;
window.getFinalFenFromPgn = getFinalFenFromPgn;

// Gutenberg Native Panel for 'roi_lecon' configuration
const LeconSettingsPanel = () => {
	const postType = useSelect((select) =>
		select('core/editor')
			? select('core/editor').getCurrentPostType()
			: null
	);

	const niveau = useSelect((select) => {
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

	const dispatchObj = useDispatch('core/editor');
	const editPost = dispatchObj ? dispatchObj.editPost : null;

	if (postType !== 'roi_lecon' || !editPost) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			name="roi-lecon-settings-panel"
			className="roi-lecon-settings-panel"
			title={__('Niveau de la Leçon', 'roi')}
			icon="welcome-learn-more"
			isOpened={true}
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
				onChange={(value) => {
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

// Enforce single selection for 'roi_chapitre' taxonomy in Gutenberg Block Editor & validation locking
if (typeof window !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => {
		if (window.wp && window.wp.data && window.wp.data.subscribe) {
			let lastChapters = null;
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
						(id) => !previous.includes(id)
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
