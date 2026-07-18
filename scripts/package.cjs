const fs = require( 'fs' );
const path = require( 'path' );
const { execSync } = require( 'child_process' );

// Parse version from roi.php
const mainFileContent = fs.readFileSync( 'roi.php', 'utf8' );
const versionMatch = mainFileContent.match( /Version:\s*([^\s\r\n]+)/ );
if ( ! versionMatch ) {
	console.error( 'Error: Could not find Version: in roi.php' );
	process.exit( 1 );
}
const version = versionMatch[ 1 ].trim();
console.log( `Packaging version: ${ version }` );

const pluginSlug = 'roi';
const zipName = `${ pluginSlug }-v${ version }.zip`;
const tempDir = path.resolve( 'dist-temp' );
const targetDir = path.join( tempDir, pluginSlug );

// Clean up previous files
if ( fs.existsSync( zipName ) ) {
	fs.unlinkSync( zipName );
}
if ( fs.existsSync( tempDir ) ) {
	fs.rmSync( tempDir, { recursive: true, force: true } );
}

fs.mkdirSync( targetDir, { recursive: true } );

// Check and compile Gutenberg assets
let hasSources = false;
if ( fs.existsSync( 'src' ) ) {
	const findSources = ( dir ) => {
		const files = fs.readdirSync( dir );
		for ( const file of files ) {
			const fullPath = path.join( dir, file );
			if ( fs.statSync( fullPath ).isDirectory() ) {
				if ( findSources( fullPath ) ) {
					return true;
				}
			} else if ( /\.(js|jsx|ts|tsx)$/.test( file ) ) {
				return true;
			}
		}
		return false;
	};
	hasSources = findSources( 'src' );
}

if ( hasSources ) {
	console.log( '🏗️  Compiling Gutenberg assets (Production)...' );
	try {
		execSync( 'npm run build', { stdio: 'inherit' } );
	} catch ( buildErr ) {
		console.error( '❌ Error: npm run build failed.' );
		process.exit( 1 );
	}
} else {
	console.log(
		'ℹ️  No source files to compile in src/, skipping build step.'
	);
}

// Load .distignore rules
const distIgnoreContent = fs.existsSync( '.distignore' )
	? fs.readFileSync( '.distignore', 'utf8' )
	: '';
const ignorePatterns = distIgnoreContent
	.split( /\r?\n/ )
	.map( ( line ) => line.trim() )
	.filter( ( line ) => line && ! line.startsWith( '#' ) );

// Helper to check if a file should be ignored
function shouldIgnore( relativePath ) {
	const normalizedPath = relativePath.replace( /\\/g, '/' );
	for ( const pattern of ignorePatterns ) {
		const cleanPattern = pattern.replace( /\/$/, '' );
		if (
			normalizedPath === cleanPattern ||
			normalizedPath.startsWith( cleanPattern + '/' )
		) {
			return true;
		}
	}
	// Also ignore temp directories and zips
	if (
		normalizedPath.startsWith( 'dist-temp' ) ||
		normalizedPath.endsWith( '.zip' ) ||
		normalizedPath.endsWith( '.sh' )
	) {
		return true;
	}
	return false;
}

// Copy files recursively
function copyDir( src, dest ) {
	const entries = fs.readdirSync( src, { withFileTypes: true } );
	for ( const entry of entries ) {
		const srcPath = path.join( src, entry.name );
		const relativePath = path.relative( '.', srcPath );

		if ( shouldIgnore( relativePath ) ) {
			continue;
		}

		const destPath = path.join( dest, entry.name );
		if ( entry.isDirectory() ) {
			fs.mkdirSync( destPath, { recursive: true } );
			copyDir( srcPath, destPath );
		} else {
			fs.copyFileSync( srcPath, destPath );
		}
	}
}

console.log( '📦 Preparing files in temporary directory...' );
copyDir( '.', targetDir );

// Create ZIP using adm-zip or fallback
console.log( '🤐 Creating ZIP archive...' );
let zipCreated = false;

try {
	const AdmZip = require( 'adm-zip' );
	const zip = new AdmZip();
	zip.addLocalFolder( targetDir, pluginSlug );
	zip.writeZip( zipName );
	console.log( `✓ Zip created successfully via adm-zip: ${ zipName }` );
	zipCreated = true;
} catch ( err ) {
	console.warn(
		'adm-zip not available directly, attempting fallback command...'
	);
}

if ( ! zipCreated ) {
	if ( process.platform === 'win32' ) {
		try {
			execSync(
				`powershell -Command "Compress-Archive -Path '${ targetDir }' -DestinationPath '${ zipName }' -Force"`,
				{ stdio: 'inherit' }
			);
			console.log(
				`✓ Zip created successfully via PowerShell: ${ zipName }`
			);
			zipCreated = true;
		} catch ( pwshErr ) {
			try {
				execSync(
					`tar -a -c -f "${ zipName }" -C "${ tempDir }" "${ pluginSlug }"`,
					{ stdio: 'inherit' }
				);
				console.log(
					`✓ Zip created successfully via tar: ${ zipName }`
				);
				zipCreated = true;
			} catch ( tarErr ) {
				console.error( '❌ Error: All packaging attempts failed.' );
				process.exit( 1 );
			}
		}
	} else {
		try {
			execSync(
				`cd "${ tempDir }" && zip -r "../${ zipName }" "${ pluginSlug }" > /dev/null`,
				{ stdio: 'inherit' }
			);
			console.log( `✓ Zip created successfully via zip: ${ zipName }` );
			zipCreated = true;
		} catch ( zipErr ) {
			console.error(
				'❌ Error: Failed to create zip via shell command.'
			);
			process.exit( 1 );
		}
	}
}

// Clean up temp dir
fs.rmSync( tempDir, { recursive: true, force: true } );
console.log( '✅ Package complete!' );
