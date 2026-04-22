const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        ...defaultConfig.entry(),
        'chessboard-app': './assets/js/chessboard-app.js',
    },
    plugins: [
        ...defaultConfig.plugins,
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'node_modules/cm-chessboard/assets',
                    to: 'cm-chessboard-assets',
                },
            ],
        }),
    ],
};
