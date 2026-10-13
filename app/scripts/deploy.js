import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../dist');
const destDir = path.join(__dirname, '../../');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(destDir, dest)}`);
  }
}

/* Файлы в assets/ с хешем в имени: каждая сборка даёт новые имена, и без
   чистки в корне копились десятки устаревших бандлов. Удаляем всё, чего
   нет в свежей сборке. */
function removeStaleAssets() {
  const builtAssets = path.join(srcDir, 'assets');
  const deployedAssets = path.join(destDir, 'assets');
  if (!fs.existsSync(builtAssets) || !fs.existsSync(deployedAssets)) return;
  const fresh = new Set(fs.readdirSync(builtAssets));
  for (const name of fs.readdirSync(deployedAssets)) {
    if (fresh.has(name)) continue;
    fs.rmSync(path.join(deployedAssets, name), { recursive: true, force: true });
    console.log(`Removed stale: assets/${name}`);
  }
}

/* То же для workbox-<hash>.js рядом с sw.js */
function removeStaleWorkbox() {
  const fresh = new Set(fs.readdirSync(srcDir).filter((n) => /^workbox-.*\.js$/.test(n)));
  for (const name of fs.readdirSync(destDir)) {
    if (/^workbox-.*\.js$/.test(name) && !fresh.has(name)) {
      fs.rmSync(path.join(destDir, name));
      console.log(`Removed stale: ${name}`);
    }
  }
}

console.log('Deploying built files to the root directory...');
if (!fs.existsSync(srcDir)) {
  console.error('Error: Build directory not found! Run npm run build first.');
  process.exit(1);
}

removeStaleAssets();
removeStaleWorkbox();
copyRecursiveSync(srcDir, destDir);
console.log('Deploy finished successfully!');
