import { resolve } from 'path';

export default {
	test: {
		environment: 'happy-dom',
		globals: true,
		include: ['tests/**/*.{test,spec}.{ts,tsx}'],
	},
	resolve: {
		alias: {
			'@': resolve(import.meta.dirname, 'src'),
		},
	},
};
