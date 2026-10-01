import React from 'react';
import { useBlockProps } from '@wordpress/block-editor';
import type { DiagrammeBlockAttributes } from './edit';

interface SaveProps {
	attributes: DiagrammeBlockAttributes;
}

export default function Save({ attributes }: SaveProps): React.ReactElement {
	const blockProps = useBlockProps.save({
		className: 'roi-bloc-fen',
		'data-fen': attributes.fen,
		'data-orientation': attributes.orientation,
		'data-shapes': JSON.stringify(attributes.shapes || []),
	});

	return <div {...blockProps}></div>;
}
