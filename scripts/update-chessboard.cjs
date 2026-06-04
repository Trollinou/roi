const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../gutemberg-chessboard');
const destDir = path.resolve(__dirname, '../includes/chess/dist');

function updateChessboard() {
  console.log('Starting Gutenberg Chessboard update in ROI plugin...');

  // 1. Check if gutemberg-chessboard repository exists as a sibling
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: Sibling directory 'gutemberg-chessboard' not found at: ${srcDir}`);
    process.exit(1);
  }

  const srcDist = path.join(srcDir, 'dist');
  if (!fs.existsSync(srcDist)) {
    console.error(`Error: Compiled 'dist' directory not found in: ${srcDir}. Make sure you built gutemberg-chessboard first.`);
    process.exit(1);
  }

  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 2. Read package.json of gutemberg-chessboard to get the current version
  const srcPackageJsonPath = path.join(srcDir, 'package.json');
  if (!fs.existsSync(srcPackageJsonPath)) {
    console.error(`Error: package.json not found in ${srcDir}`);
    process.exit(1);
  }
  const packageJson = JSON.parse(fs.readFileSync(srcPackageJsonPath, 'utf8'));
  const version = packageJson.version || '1.0.5';
  console.log(`Detected Gutenberg Chessboard version: ${version}`);

  // 3. Copy compiled assets
  const filesToCopy = [
    'gutemberg-chessboard.js',
    'gutemberg-chessboard-view.js',
    'style.css',
    'stockfish.js',
    'stockfish.wasm'
  ];

  filesToCopy.forEach(file => {
    const srcFile = path.join(srcDist, file);
    const destFile = path.join(destDir, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`✓ Copied ${file}`);
    } else {
      console.warn(`⚠ Warning: File ${file} not found in ${srcDist}`);
    }
  });

  // 4. Generate/Update block.json with ROI-specific settings
  const srcBlockJsonPath = path.join(srcDir, 'src/block.json');
  if (!fs.existsSync(srcBlockJsonPath)) {
    console.error(`Error: block.json template not found in ${srcDir}/src/`);
    process.exit(1);
  }

  const blockJson = JSON.parse(fs.readFileSync(srcBlockJsonPath, 'utf8'));
  
  // Apply customizations for ROI
  blockJson.version = version;
  blockJson.title = "Échiquier";
  blockJson.description = "Insérer un échiquier interactif tactilisé avec Chessground";
  blockJson.textdomain = "roi";
  blockJson.editorScript = "file:./gutemberg-chessboard.js";
  blockJson.editorStyle = "file:./style.css";
  blockJson.style = "file:./style.css";
  blockJson.viewScript = "file:./gutemberg-chessboard-view.js";

  const destBlockJsonPath = path.join(destDir, 'block.json');
  fs.writeFileSync(destBlockJsonPath, JSON.stringify(blockJson, null, 2), 'utf8');
  console.log('✓ Generated block.json');

  // 5. Generate PHP asset files
  const editorAssetContent = `<?php
return array(
    'dependencies' => array(
        'wp-blocks',
        'wp-element',
        'wp-components',
        'wp-block-editor',
        'wp-i18n',
    ),
    'version'      => '${version}',
);
`;
  fs.writeFileSync(path.join(destDir, 'gutemberg-chessboard.asset.php'), editorAssetContent, 'utf8');
  console.log('✓ Generated gutemberg-chessboard.asset.php');

  const viewAssetContent = `<?php
return array(
    'dependencies' => array(
        'wp-element',
    ),
    'version'      => '${version}',
);
`;
  fs.writeFileSync(path.join(destDir, 'gutemberg-chessboard-view.asset.php'), viewAssetContent, 'utf8');
  console.log('✓ Generated gutemberg-chessboard-view.asset.php');

  console.log('Update complete!');
}

updateChessboard();
