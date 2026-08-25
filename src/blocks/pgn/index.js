import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import '../chessboard/style.css';
import '../../components/PgnEditor/PgnEditor.css';

registerBlockType(metadata.name, {
	edit: Edit,
	save: Save,
});
