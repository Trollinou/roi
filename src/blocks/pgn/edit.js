import { __ } from '@wordpress/i18n';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	Modal,
	Button,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import RoiPgnEditor from '../../components/PgnEditor';
import '../../components/PgnEditor/PgnEditor.css';
import { BoardCore as EgBoardCore } from 'eg-chessboard';

export default function Edit({ attributes, setAttributes }) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const previewBoardRef = useRef(null);
	const previewInstanceRef = useRef(null);

	const handleSave = (newPgn) => {
		setAttributes({ pgn: newPgn });
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
				mode: 'study',
				pgn: attributes.pgn,
				orientation: 'white',
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
				mode: 'study',
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

			if (attributes.pgn) {
				try {
					boardAPI.loadPgn(attributes.pgn);
				} catch (e) {
					console.warn('Error loading PGN for preview:', e);
				}
			}

			return () => {
				boardAPI?.destroy();
			};
		}
	}, [attributes.pgn]);

	const blockProps = useBlockProps({
		className: 'roi-bloc-pgn-preview',
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
						label={__('Modifier la partie PGN', 'roi')}
						onClick={() => setIsModalOpen(true)}
					/>
				</ToolbarGroup>
			</BlockControls>

			<div {...blockProps}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						width: '100%',
					}}
				>
					{attributes.pgn ? (
						<>
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
								title={__(
									'Cliquer pour modifier la partie PGN',
									'roi'
								)}
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

							{/* Boutons de navigation */}
							<div
								className="pgn-navigation-bar"
								style={{
									width: '320px',
									marginTop: '10px',
									display: 'grid',
									gridTemplateColumns: 'repeat(4, 1fr)',
									gap: '6px',
									position: 'relative',
									zIndex: 20,
								}}
							>
								<button
									type="button"
									className="pgn-nav-btn"
									title="Début"
									onClick={(e) => {
										e.stopPropagation();
										previewInstanceRef.current?.viewStart();
									}}
									style={{
										cursor: 'pointer',
										color: '#495057',
										borderColor: '#ced4da',
										background: '#ffffff',
										position: 'relative',
										zIndex: 21,
										pointerEvents: 'auto',
									}}
								>
									|&lt;
								</button>
								<button
									type="button"
									className="pgn-nav-btn"
									title="Précédent"
									onClick={(e) => {
										e.stopPropagation();
										previewInstanceRef.current?.viewPrevious();
									}}
									style={{
										cursor: 'pointer',
										color: '#495057',
										borderColor: '#ced4da',
										background: '#ffffff',
										position: 'relative',
										zIndex: 21,
										pointerEvents: 'auto',
									}}
								>
									&lt;
								</button>
								<button
									type="button"
									className="pgn-nav-btn"
									title="Suivant"
									onClick={(e) => {
										e.stopPropagation();
										previewInstanceRef.current?.viewNext();
									}}
									style={{
										cursor: 'pointer',
										color: '#495057',
										borderColor: '#ced4da',
										background: '#ffffff',
										position: 'relative',
										zIndex: 21,
										pointerEvents: 'auto',
									}}
								>
									&gt;
								</button>
								<button
									type="button"
									className="pgn-nav-btn"
									title="Fin"
									onClick={(e) => {
										e.stopPropagation();
										previewInstanceRef.current?.stopViewingHistory();
									}}
									style={{
										cursor: 'pointer',
										color: '#495057',
										borderColor: '#ced4da',
										background: '#ffffff',
										position: 'relative',
										zIndex: 21,
										pointerEvents: 'auto',
									}}
								>
									&gt;|
								</button>
							</div>
						</>
					) : (
						<p
							style={{
								fontSize: '12px',
								color: '#666',
								fontStyle: 'italic',
								margin: '15px 0',
							}}
						>
							{__('Aucune partie chargée.', 'roi')}
						</p>
					)}

					<Button
						variant="secondary"
						onClick={() => setIsModalOpen(true)}
						style={{ marginTop: '12px' }}
					>
						{__('✏️ Modifier la partie PGN', 'roi')}
					</Button>
				</div>
			</div>

			{isModalOpen && (
				<Modal
					title={__('Éditeur de Séquence PGN', 'roi')}
					onRequestClose={() => setIsModalOpen(false)}
					className="roi-pgn-editor-modal"
				>
					<RoiPgnEditor
						initialPgn={attributes.pgn}
						onSave={handleSave}
					/>
				</Modal>
			)}
		</>
	);
}
