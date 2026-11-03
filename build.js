const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy assets
const assetsDir = path.join(__dirname, 'assets');
const publicAssetsDir = path.join(publicDir, 'assets');
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, publicAssetsDir, { recursive: true });
}

// Copy core web files
const files = ['index.html', 'style.css', 'game.js'];
for (const file of files) {
  const src = path.join(__dirname, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

console.log('Static assets successfully compiled into public/ directory!');
