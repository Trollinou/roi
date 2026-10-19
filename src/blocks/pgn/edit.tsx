import React from 'react';
import { __ } from '@wordpress/i18n';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	Modal,
	Button,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import RoiPgnEditor from '../../components/PgnEditor';
import '../../components/PgnEditor/PgnEditor.scss';
import RoiChessboard from '../../components/Chessboard';
import type { PgnString } from '../../types';

export interface PgnBlockAttributes {
	pgn?: PgnString;
}

interface EditProps {
	attributes: PgnBlockAttributes;
	setAttributes: (_attrs: Partial<PgnBlockAttributes>) => void;
}

export default function Edit({ attributes, setAttributes }: EditProps): React.ReactElement {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const boardRef = useRef<any>(null);

	const handleSave = (newPgn: PgnString) => {
		setAttributes({ pgn: newPgn });
		setIsModalOpen(false);
	};

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
								className="roi-pgn-preview-wrap"
								style={{
									width: '320px',
									maxWidth: '100%',
									cursor: 'pointer',
								}}
								onClick={() => setIsModalOpen(true)}
								title={__(
									'Cliquer pour modifier la partie PGN',
									'roi'
								)}
								role="button"
								tabIndex={0}
								onKeyDown={(e: React.KeyboardEvent) => {
									if (e.key === 'Enter' || e.key === ' ') {
										setIsModalOpen(true);
									}
								}}
							>
								<RoiChessboard
									pgn={attributes.pgn}
									coordinates={true}
									viewOnly={true}
									mode="study"
									onBoardCreated={(api) => {
										boardRef.current = api;
									}}
									boardConfig={{
										draggable: { enabled: false },
										movable: { free: false },
										drawable: { enabled: false },
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
										boardRef.current?.viewStart();
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
										boardRef.current?.viewPrevious();
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
										boardRef.current?.viewNext();
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
										boardRef.current?.stopViewingHistory();
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
