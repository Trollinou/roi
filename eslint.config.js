const wordpress = require('@wordpress/eslint-plugin');

module.exports = [
	{
		ignores: [
			'node_modules/**',
			'vendor/**',
			'build/**',
			'dist/**',
			'dist-temp/**',
			'scratch/**',
			'scripts/**',
			'.deps/**',
			'**/*.d.ts',
		],
	},
	...wordpress.configs.recommended,
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
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
				clearTimeout: 'readonly',
				fetch: 'readonly',
				parseInt: 'readonly',
				isNaN: 'readonly',
				jQuery: 'readonly',
				confirm: 'readonly',
				alert: 'readonly',
				process: 'readonly',
				roi_course_builder_data: 'readonly',
			},
		},
		rules: {
			// =================================================================
			// 1. RIGUEUR & QUALITÉ (Équivalent "Strict" JS/TS)
			// =================================================================
			'eqeqeq': [ 'error', 'smart' ], // Oblige === et !== (tolère == null)
			'curly': [ 'error', 'all' ], // Oblige les accolades {} même sur 1 ligne
			'prefer-const': 'error', // Impose const si la variable n'est pas réassignée
			'no-shadow': 'error', // Interdit de masquer une variable parente
			'no-console': [ 'warn', { allow: [ 'warn', 'error' ] } ],
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],

			// =================================================================
			// 2. ADAPTATIONS WORDPRESS & ARCHITECTURE (Légitimes)
			// =================================================================
			'camelcase': 'off', // Autorise le snake_case issu de PHP / WP
			'no-alert': 'off', // Autorise alert() et confirm() dans l'admin WP
			'prettier/prettier': 'off', // Ne bloque pas le linter sur du formatage pur
			'import/no-unresolved': 'off', // Délégué à TypeScript / Bundler
			'import/no-extraneous-dependencies': 'off',

			// =================================================================
			// 3. ALLÈGEMENT JSDOC (Géré par TypeScript / Noms explicites)
			// =================================================================
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-returns-type': 'off',
			'jsdoc/check-param-names': 'off',
		},
	},
];
