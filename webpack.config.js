const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

module.exports = {
	...defaultConfig,
	entry: {
		chessboard: path.resolve(
			__dirname,
			'src/blocks/chessboard/index.jsx'
		),
		'chessboard-view': path.resolve(
			__dirname,
			'src/blocks/chessboard/view.jsx'
		),
		'admin-fen-editor': path.resolve(
			__dirname,
			'src/admin-fen-editor.js'
		),
		'admin-exercice-builder': path.resolve(
			__dirname,
			'src/admin-exercice-builder/main.js'
		),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build/chessboard' ),
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
