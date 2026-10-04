import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import '../../components/FenEditor/FenEditor.scss';

registerBlockType(metadata.name, {
	edit: Edit,
	save: Save,
});
