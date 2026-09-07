import { __ } from '@wordpress/i18n';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	Modal,
	Button,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import RoiFenEditor from '../../components/FenEditor';
import { BoardCore as EgBoardCore } from 'eg-chessboard';

export default function Edit({ attributes, setAttributes }) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const previewBoardRef = useRef(null);
	const previewInstanceRef = useRef(null);

	const handleSave = (data) => {
		if (typeof data === 'object' && data !== null) {
			setAttributes({
				fen: data.fen !== undefined ? data.fen : attributes.fen,
				orientation:
					data.orientation !== undefined
						? data.orientation
						: attributes.orientation,
				shapes:
					data.shapes !== undefined ? data.shapes : attributes.shapes,
			});
		} else if (typeof data === 'string') {
			setAttributes({ fen: data });
		}
		setIsModalOpen(false);
	};

	// Preview Board Initialization
	useEffect(() => {
		if (previewBoardRef.current && EgBoardCore) {
			if (previewInstanceRef.current) {
				previewInstanceRef.current.destroy();
				previewInstanceRef.current = null;
			}

			const config = {
				mode: 'editor',
				fen: attributes.fen,
				orientation: attributes.orientation,
				coordinates: true,
				viewOnly: true,
				movable: {
					free: false,
					color: 'none',
				},
				draggable: {
					enabled: false,
				},
				drawable: {
					enabled: false,
				},
			};

			const boardState = {
				mode: 'editor',
				showThreats: false,
				promotionDialogState: { isEnabled: false },
				historyViewerState: { isEnabled: false },
			};

			const boardAPI = new EgBoardCore(
				previewBoardRef.current,
				boardState,
				() => {},
				() => {},
				config,
				{
					whiteMode: 'disabled',
					blackMode: 'disabled',
				}
			);

			previewInstanceRef.current = boardAPI;

			if (attributes.shapes && attributes.shapes.length > 0) {
				boardAPI.setShapes(attributes.shapes);
			}

			return () => {
				boardAPI?.destroy();
			};
		}
	}, [attributes.fen, attributes.orientation, attributes.shapes]);

	const blockProps = useBlockProps({
		className: 'roi-bloc-diagramme-preview',
		style: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			width: '100%',
		},
	});

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon="edit"
						label={__('Modifier le diagramme', 'roi')}
						onClick={() => setIsModalOpen(true)}
					/>
				</ToolbarGroup>
			</BlockControls>

			<div {...blockProps}>
				<div
					className="main-wrap piece-set-cburnett board-theme-brown"
					style={{
						width: '320px',
						height: '320px',
						position: 'relative',
						overflow: 'hidden',
						cursor: 'pointer',
					}}
					onClick={() => setIsModalOpen(true)}
					title={__('Cliquer pour modifier le diagramme', 'roi')}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							setIsModalOpen(true);
						}
					}}
				>
					<div
						ref={previewBoardRef}
						style={{
							width: '100%',
							height: '100%',
							position: 'relative',
						}}
					/>
				</div>

				<Button
					variant="secondary"
					onClick={() => setIsModalOpen(true)}
					style={{ marginTop: '12px' }}
				>
					{__('✏️ Modifier le diagramme', 'roi')}
				</Button>
			</div>

			{isModalOpen && (
				<Modal
					title={__('Éditeur de Position FEN', 'roi')}
					onRequestClose={() => setIsModalOpen(false)}
					className="roi-fen-editor-modal"
				>
					<RoiFenEditor
						fen={attributes.fen}
						orientation={attributes.orientation}
						initialShapes={attributes.shapes || []}
						onSave={handleSave}
					/>
				</Modal>
			)}
		</>
	);
}
