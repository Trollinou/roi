const fs = require('fs');
const path = require('path');
const sass = require('sass');
const rtlcss = require('rtlcss');

const rootDir = path.resolve(__dirname, '..');
const scssDir = path.join(rootDir, 'src/scss');
const assetsCssDir = path.join(rootDir, 'assets/css');
const buildDir = path.join(rootDir, 'build');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function compileFile(srcPath, outPath, outRtlPath) {
    ensureDir(path.dirname(outPath));
    const result = sass.compile(srcPath, {
        style: 'compressed',
        sourceMap: false,
    });

    fs.writeFileSync(outPath, result.css);
    const relOut = path.relative(rootDir, outPath);
    console.log(`  ✓ Built ${relOut}`);

    if (outRtlPath) {
        ensureDir(path.dirname(outRtlPath));
        const rtlResult = rtlcss.process(result.css);
        fs.writeFileSync(outRtlPath, rtlResult);
        const relRtl = path.relative(rootDir, outRtlPath);
        console.log(`  ✓ Built ${relRtl}`);
    }
}

function buildCss() {
    const startTime = Date.now();
    ensureDir(assetsCssDir);

    console.log('🎨 Compiling SCSS stylesheets with Sass & RTL...');

    // 1. Compile src/scss/*.scss -> assets/css/
    if (fs.existsSync(scssDir)) {
        const scssEntries = fs
            .readdirSync(scssDir, { withFileTypes: true })
            .filter(
                dirent =>
                    dirent.isFile() &&
                    dirent.name.endsWith('.scss') &&
                    !dirent.name.startsWith('_')
            )
            .map(dirent => dirent.name);

        for (const file of scssEntries) {
            const srcFile = path.join(scssDir, file);
            const baseName = file.replace(/\.scss$/, '');
            const outFile = path.join(assetsCssDir, `${baseName}.css`);
            const outRtlFile = path.join(assetsCssDir, `${baseName}-rtl.css`);
            compileFile(srcFile, outFile, outRtlFile);
        }
    }

    // 2. Compile block SCSS (e.g. src/blocks/chessboard/style.scss -> build/chessboard/, diagramme/, pgn/)
    const chessboardScss = path.join(rootDir, 'src/blocks/chessboard/style.scss');
    if (fs.existsSync(chessboardScss)) {
        const targets = [
            {
                out: path.join(buildDir, 'chessboard/style.css'),
                rtl: path.join(buildDir, 'chessboard/style-rtl.css'),
            },
            {
                out: path.join(buildDir, 'chessboard/style-chessboard.css'),
                rtl: path.join(buildDir, 'chessboard/style-chessboard-rtl.css'),
            },
            {
                out: path.join(buildDir, 'diagramme/chessboard-style.css'),
                rtl: path.join(buildDir, 'diagramme/chessboard-style-rtl.css'),
            },
            {
                out: path.join(buildDir, 'pgn/chessboard-style.css'),
                rtl: path.join(buildDir, 'pgn/chessboard-style-rtl.css'),
            },
        ];

        for (const target of targets) {
            compileFile(chessboardScss, target.out, target.rtl);
        }
    }

    const elapsed = Date.now() - startTime;
    console.log(`✨ CSS Build completed successfully in ${elapsed}ms.`);
}

buildCss();
