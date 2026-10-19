import React from 'react';
import { __ } from '@wordpress/i18n';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	Modal,
	Button,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import RoiFenEditor from '../../components/FenEditor';
import RoiChessboard from '../../components/Chessboard';
import type { Shape, Color } from '../../types';

export interface DiagrammeBlockAttributes {
	fen?: string;
	orientation?: Color;
	shapes?: Shape[];
}

interface EditProps {
	attributes: DiagrammeBlockAttributes;
	setAttributes: (_attrs: Partial<DiagrammeBlockAttributes>) => void;
}

export default function Edit({ attributes, setAttributes }: EditProps): React.ReactElement {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleSave = (data: any) => {
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
					className="roi-diagramme-preview-wrap"
					style={{
						width: '320px',
						maxWidth: '100%',
						cursor: 'pointer',
					}}
					onClick={() => setIsModalOpen(true)}
					title={__('Cliquer pour modifier le diagramme', 'roi')}
					role="button"
					tabIndex={0}
					onKeyDown={(e: React.KeyboardEvent) => {
						if (e.key === 'Enter' || e.key === ' ') {
							setIsModalOpen(true);
						}
					}}
				>
					<RoiChessboard
						fen={attributes.fen}
						orientation={attributes.orientation || 'white'}
						shapes={attributes.shapes}
						coordinates={true}
						viewOnly={true}
						mode="editor"
						boardConfig={{
							draggable: { enabled: false },
							movable: { free: false },
							drawable: { enabled: false },
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
