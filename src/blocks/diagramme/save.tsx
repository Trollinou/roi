import React from 'react';
import { useBlockProps } from '@wordpress/block-editor';
import type { DiagrammeBlockAttributes } from './edit';

interface SaveProps {
	attributes: DiagrammeBlockAttributes;
}

export default function Save({ attributes }: SaveProps): React.ReactElement {
	const fen = attributes.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	const orientation = attributes.orientation || 'white';
	const shapes = attributes.shapes || [];

	const blockProps = useBlockProps.save({
		className: 'roi-bloc-diagramme chessboard-block',
		'data-wp-interactive': 'roi/diagramme',
		'data-wp-context': JSON.stringify({
			fen,
			orientation,
			shapes,
		}),
		'data-fen': fen,
		'data-orientation': orientation,
		'data-shapes': JSON.stringify(shapes),
	});

	return (
		<div {...blockProps}>
			<section className="main-wrap">
				<div className="main-board">
					<div className="diagramme-mount-element" data-wp-init="callbacks.mountDiagramme"></div>
				</div>
			</section>
		</div>
	);
}
