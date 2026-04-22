/**
 * @file This file is the main entry point for the Chessboard Gutenberg block.
 * It handles the registration of the block with WordPress.
 * @author Your Name
 * @version 1.0.0
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit';

/**
 * Registers the 'roi/chessboard' block.
 *
 * The `edit` property is set to the Edit component, which defines the block's appearance
 * and behavior in the editor. The `save` property is set to return null because this
 * is a dynamic block, and its content is rendered on the server-side via PHP.
 */
registerBlockType( metadata.name, {
	edit: Edit,
	save: () => {
		return null;
	},
} );
