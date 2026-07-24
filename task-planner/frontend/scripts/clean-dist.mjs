import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

fs.rmSync(distDir, { recursive: true, force: true });
console.log(`[clean-dist] removed ${distDir}`);
