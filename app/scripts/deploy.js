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

console.log('Deploying built files to the root directory...');
if (!fs.existsSync(srcDir)) {
  console.error('Error: Build directory not found! Run npm run build first.');
  process.exit(1);
}

copyRecursiveSync(srcDir, destDir);
console.log('Deploy finished successfully!');
