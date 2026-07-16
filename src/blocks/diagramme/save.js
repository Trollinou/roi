import { useBlockProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
  const blockProps = useBlockProps.save({
    className: 'roi-bloc-fen',
    'data-fen': attributes.fen,
    'data-orientation': attributes.orientation,
  });

  return <div { ...blockProps }></div>;
}
