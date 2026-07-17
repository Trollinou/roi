import { useBlockProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const blockProps = useBlockProps.save( {
		className: 'roi-bloc-pgn',
		'data-pgn': attributes.pgn,
	} );

	return <div { ...blockProps }></div>;
}
