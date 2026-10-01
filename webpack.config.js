const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	...defaultConfig,
	resolve: {
		...(defaultConfig.resolve || {}),
		extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', ...(defaultConfig.resolve?.extensions || [])],
	},
	entry: {
		'chessboard/chessboard': path.resolve(
			__dirname,
			'src/blocks/chessboard/index.tsx'
		),
		'chessboard/chessboard-view': path.resolve(
			__dirname,
			'src/blocks/chessboard/view.ts'
		),
		'chessboard/admin-fen-editor': path.resolve(
			__dirname,
			'src/admin-fen-editor.tsx'
		),
		'chessboard/admin-exercice-builder': path.resolve(
			__dirname,
			'src/admin-exercice-builder/main.ts'
		),
		'chessboard/admin-cours-builder': path.resolve(
			__dirname,
			'src/admin-cours-builder/main.ts'
		),
		'chessboard/admin-video-settings': path.resolve(
			__dirname,
			'src/admin-video-settings.ts'
		),
		'chessboard/admin-partie-viewer': path.resolve(
			__dirname,
			'src/admin-partie-viewer.ts'
		),
		'diagramme/index': path.resolve(
			__dirname,
			'src/blocks/diagramme/index.ts'
		),
		'pgn/index': path.resolve(__dirname, 'src/blocks/pgn/index.ts'),
		'suivi/index': path.resolve(__dirname, 'src/suivi/index.tsx'),
		'admin-backup': path.resolve(__dirname, 'src/admin-backup.ts'),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build'),
		filename: '[name].js',
	},
	performance: {
		hints: 'warning',
		maxEntrypointSize: 500 * 1024,
		maxAssetSize: 500 * 1024,
		assetFilter(assetFilename) {
			return (
				!assetFilename.endsWith('.wasm') &&
				!assetFilename.includes('eg-chessboard')
			);
		},
	},
	plugins: [
		...defaultConfig.plugins,
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(
						__dirname,
						'src/blocks/chessboard/style.css'
					),
					to: path.resolve(__dirname, 'build/chessboard/style.css'),
				},
				{
					from: path.resolve(
						__dirname,
						'src/blocks/chessboard/style.css'
					),
					to: path.resolve(
						__dirname,
						'build/diagramme/chessboard-style.css'
					),
				},
				{
					from: path.resolve(
						__dirname,
						'src/blocks/chessboard/style.css'
					),
					to: path.resolve(
						__dirname,
						'build/pgn/chessboard-style.css'
					),
				},
				{
					from: path.resolve(
						__dirname,
						'src/blocks/chessboard/block.json'
					),
					to: path.resolve(__dirname, 'build/chessboard/block.json'),
				},
				{
					from: path.resolve(
						__dirname,
						'src/blocks/diagramme/block.json'
					),
					to: path.resolve(__dirname, 'build/diagramme/block.json'),
				},
				{
					from: path.resolve(__dirname, 'src/blocks/pgn/block.json'),
					to: path.resolve(__dirname, 'build/pgn/block.json'),
				},
				{
					from: path.resolve(
						__dirname,
						'node_modules/eg-chessboard/dist/base.css'
					),
					to: path.resolve(
						__dirname,
						'build/chessboard/eg-chessboard.css'
					),
					transform(content) {
						const piecesPath = path.resolve(
							__dirname,
							'node_modules/eg-chessboard/dist/pieces/cburnett.css'
						);
						const piecesContent = fs.readFileSync(
							piecesPath,
							'utf8'
						);
						return content.toString() + '\n' + piecesContent;
					},
				},
			],
		}),
	],
};
