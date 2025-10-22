const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        index: path.resolve(__dirname, 'includes/chess/blocks/chessboard/src/index.js'),
    },
    output: {
        ...defaultConfig.output,
        filename: 'chessboard-block.js',
        path: path.resolve(__dirname, 'includes/chess/blocks/chessboard/build'),
    },
};
