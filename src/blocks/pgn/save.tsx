import React from 'react';
import { useBlockProps } from '@wordpress/block-editor';
import type { PgnBlockAttributes } from './edit';

interface SaveProps {
	attributes: PgnBlockAttributes;
}

export default function Save({ attributes }: SaveProps): React.ReactElement {
	const blockProps = useBlockProps.save({
		className: 'roi-bloc-pgn',
		'data-pgn': attributes.pgn,
	});

	return <div {...blockProps}></div>;
}
