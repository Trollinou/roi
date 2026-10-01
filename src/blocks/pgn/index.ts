import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import '../../components/PgnEditor/PgnEditor.css';

registerBlockType(metadata.name, {
	edit: Edit,
	save: Save,
});
