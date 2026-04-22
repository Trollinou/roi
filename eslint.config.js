const wordpress = require( '@wordpress/eslint-plugin' );

module.exports = [
	{
		ignores: [
			'node_modules/**',
			'vendor/**',
			'build/**',
			'dist/**',
			'jules-scratch/**',
			'assets/js/*.min.js',
			'includes/lib/**',
		],
	},
	...wordpress.configs.recommended,
	{
		languageOptions: {
			globals: {
				// On déclare les outils globaux de WordPress et du navigateur
				jQuery: 'readonly',
				ajaxurl: 'readonly',
				confirm: 'readonly',
				alert: 'readonly',
				history: 'readonly',
				console: 'readonly',
				document: 'readonly',
				window: 'readonly',
				fetch: 'readonly',
				FormData: 'readonly',
				URLSearchParams: 'readonly',
				Option: 'readonly',
				Worker: 'readonly',
				ResizeObserver: 'readonly',
				// On autorise vos objets de données localisés (les variables PHP passées au JS)
				roiChessEditor: 'readonly',
				chessEngineData: 'readonly',
				roi_course_builder_data: 'readonly',
				roi_exercices_ajax: 'readonly',
				roi_ajax: 'readonly',
				roi_single_exercice_ajax: 'readonly',
			},
		},
		settings: {
			'import/resolver': {
				node: {},
			},
			'import/ignore': [ '@wordpress/' ],
		},
		rules: {
			// On désactive les règles trop restrictives pour ce projet
			'camelcase': 'off',          // Autorise les variables avec des _ (snake_case)
			'no-alert': 'off',          // Autorise alert() et confirm()
			'no-console': [ 'warn', { allow: [ 'warn', 'error' ] } ],       // Avertit pour log() mais autorise warn() et error()
			'eqeqeq': 'warn',           // Avertit au lieu de bloquer pour les == au lieu de ===
			'no-unused-vars': 'warn',   // Avertit pour les variables non utilisées au lieu de bloquer
			'import/no-unresolved': 'off', // Les packages @wordpress sont fournis par WP au runtime
		},
	},
];