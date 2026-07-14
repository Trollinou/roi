const wordpress = require( '@wordpress/eslint-plugin' );

module.exports = [
	{
		ignores: [
			'node_modules/**',
			'vendor/**',
			'build/**',
			'dist/**',
			'scratch/**',
			'scripts/**',
			'assets/js/stockfish.js',
			'assets/js/stockfish.wasm',
		],
	},
	...wordpress.configs.recommended,
	{
		languageOptions: {
			globals: {
				wp: 'readonly',
				RoiFenEditor: 'readonly',
				RoiPgnEditor: 'readonly',
				EgBoardCore: 'readonly',
				Chess: 'readonly',
				console: 'readonly',
				document: 'readonly',
				window: 'readonly',
				clearInterval: 'readonly',
				setInterval: 'readonly',
				setTimeout: 'readonly',
				parseInt: 'readonly',
				isNaN: 'readonly',
				jQuery: 'readonly',
				confirm: 'readonly',
				alert: 'readonly',
				process: 'readonly',
			},
		},
		rules: {
			'no-console': [ 'warn', { allow: [ 'warn', 'error' ] } ],
			'no-unused-vars': 'warn',
			'eqeqeq': 'warn',
		},
	},
];
