// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const rootDir = path.resolve(__dirname, '../..');

describe('Gutenberg apiVersion 3 & Iframe Compatibility', () => {
	beforeAll(() => {
		const requiredCss = [
			path.join(rootDir, 'build/chessboard/style.css'),
			path.join(rootDir, 'build/diagramme/chessboard-style.css'),
			path.join(rootDir, 'build/pgn/chessboard-style.css'),
		];
		if (requiredCss.some((filePath) => !fs.existsSync(filePath))) {
			execSync('node scripts/build-css.js', {
				cwd: rootDir,
				stdio: 'ignore',
			});
		}
	});

	it.each(['chessboard', 'diagramme', 'pgn'])(
		'declares apiVersion 3 with style and editorStyle in src/blocks/%s/block.json',
		(blockName) => {
			const blockJsonPath = path.join(rootDir, 'src/blocks', blockName, 'block.json');
			const metadata = JSON.parse(fs.readFileSync(blockJsonPath, 'utf8')) as {
				apiVersion?: number;
				style?: string | string[];
				editorStyle?: string | string[];
			};

			expect(metadata.apiVersion).toBe(3);
			expect(metadata.style).toBeTruthy();
			expect(metadata.editorStyle).toBeTruthy();
		}
	);

	it.each([
		'build/chessboard/style.css',
		'build/diagramme/chessboard-style.css',
		'build/pgn/chessboard-style.css',
	])('includes eg-chessboard base and cburnett piece rules in %s', (relCssPath) => {
		const cssPath = path.join(rootDir, relCssPath);
		expect(fs.existsSync(cssPath)).toBe(true);

		const css = fs.readFileSync(cssPath, 'utf8');
		expect(css).toContain('.cg-wrap');
		expect(css).toContain('cg-board');
		expect(css).toContain('.piece-set-cburnett');
	});

	it('does not contain the legacy manual iframe event-relay hack in useChessBoard.ts', () => {
		const hookPath = path.join(rootDir, 'src/hooks/useChessBoard.ts');
		const content = fs.readFileSync(hookPath, 'utf8');
		expect(content).not.toContain('__isForwarded');
	});
});
