const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const sourceDir = path.resolve(process.cwd(), 'includes/chess/blocks/chessboard/src');
const buildDir = path.resolve(process.cwd(), 'includes/chess/blocks/chessboard/build');

module.exports = {
    ...defaultConfig,
    entry: {
        'index': path.join(sourceDir, 'index.js'),
    },
    output: {
        ...defaultConfig.output,
        path: buildDir,
        filename: '[name].js',
    },
    plugins: [
        ...defaultConfig.plugins,
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(sourceDir, 'block.json'),
                    to: path.join(buildDir, 'block.json'),
                },
                {
                    from: path.join(sourceDir, 'editor.css'),
                    to: path.join(buildDir, 'editor.css'),
                },
            ],
        }),
    ],
};
