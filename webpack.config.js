const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

module.exports = {
	...defaultConfig,
	entry: {
		'chessboard/chessboard': path.resolve(
			__dirname,
			'src/blocks/chessboard/index.jsx'
		),
		'chessboard/chessboard-view': path.resolve(
			__dirname,
			'src/blocks/chessboard/view.jsx'
		),
		'chessboard/admin-fen-editor': path.resolve(
			__dirname,
			'src/admin-fen-editor.js'
		),
		'chessboard/admin-exercice-builder': path.resolve(
			__dirname,
			'src/admin-exercice-builder/main.js'
		),
		'chessboard/admin-cours-builder': path.resolve(
			__dirname,
			'src/admin-cours-builder/main.js'
		),
		'diagramme/index': path.resolve(
			__dirname,
			'src/blocks/diagramme/index.js'
		),
		'pgn/index': path.resolve( __dirname, 'src/blocks/pgn/index.js' ),
		'suivi/index': path.resolve( __dirname, 'src/suivi/index.js' ),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build' ),
		filename: '[name].js',
	},
	performance: {
		hints: 'warning',
		maxEntrypointSize: 350 * 1024,
		maxAssetSize: 350 * 1024,
		assetFilter( assetFilename ) {
			return ! assetFilename.endsWith( '.wasm' );
		},
	},
	plugins: [
		...defaultConfig.plugins,
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: path.resolve(
						__dirname,
						'src/blocks/chessboard/style.css'
					),
					to: path.resolve( __dirname, 'build/chessboard/style.css' ),
				},
				{
					from: path.resolve(
						__dirname,
						'src/blocks/chessboard/block.json'
					),
					to: path.resolve(
						__dirname,
						'build/chessboard/block.json'
					),
				},
				{
					from: path.resolve(
						__dirname,
						'src/blocks/diagramme/block.json'
					),
					to: path.resolve( __dirname, 'build/diagramme/block.json' ),
				},
				{
					from: path.resolve(
						__dirname,
						'src/blocks/pgn/block.json'
					),
					to: path.resolve( __dirname, 'build/pgn/block.json' ),
				},
				{
					from: path.resolve(
						__dirname,
						'node_modules/eg-chessboard/dist/eg-chessboard.css'
					),
					to: path.resolve(
						__dirname,
						'build/chessboard/eg-chessboard.css'
					),
				},
				{
					from: path.resolve(
						__dirname,
						'node_modules/eg-chessboard/dist/stockfish.js'
					),
					to: path.resolve( __dirname, 'assets/js/stockfish.js' ),
				},
				{
					from: path.resolve(
						__dirname,
						'node_modules/eg-chessboard/dist/stockfish.wasm'
					),
					to: path.resolve( __dirname, 'assets/js/stockfish.wasm' ),
				},
			],
		} ),
	],
};
