const { spawnSync } = require( 'child_process' );
const path = require( 'path' );
const fs = require( 'fs' );

const possiblePaths = [
	path.resolve( __dirname, '../node_modules/.bin/vitest' ),
	path.resolve( __dirname, '../../eg-chessboard/node_modules/.bin/vitest' ),
	path.resolve( __dirname, '../.deps/eg-chessboard/node_modules/.bin/vitest' ),
];

let vitestBin = possiblePaths.find( ( p ) => fs.existsSync( p ) );

if ( ! vitestBin ) {
	console.error( 'Error: vitest binary not found in node_modules or eg-chessboard.' );
	process.exit( 1 );
}

if ( process.platform === 'win32' && fs.existsSync( vitestBin + '.cmd' ) ) {
	vitestBin = vitestBin + '.cmd';
}

const args = [ 'run', ...process.argv.slice( 2 ) ];
const env = {
	...process.env,
	NODE_PATH: [
		path.resolve( __dirname, '../node_modules' ),
		path.resolve( __dirname, '../../eg-chessboard/node_modules' ),
		process.env.NODE_PATH || '',
	].filter( Boolean ).join( path.delimiter ),
};
const result = spawnSync( vitestBin, args, {
	stdio: 'inherit',
	env,
	shell: process.platform === 'win32',
} );
process.exit( result.status ?? 1 );
