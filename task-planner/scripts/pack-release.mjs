import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const releaseDir = path.join(root, 'release', 'task-planner');
const distDir = path.join(root, 'frontend', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist 不存在，请先运行 npm run build');
  process.exit(1);
}

function copyDir(src, dest, skip = () => false) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (skip(name)) continue;
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d, skip);
    else fs.copyFileSync(s, d);
  }
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

rmDir(releaseDir);
fs.mkdirSync(releaseDir, { recursive: true });

// backend source (no node_modules)
copyDir(
  path.join(root, 'backend'),
  path.join(releaseDir, 'backend'),
  (name) => ['node_modules', 'data'].includes(name)
);

// frontend build output
copyDir(distDir, path.join(releaseDir, 'frontend', 'dist'));

// writable data directory
fs.mkdirSync(path.join(releaseDir, 'data'), { recursive: true });
fs.writeFileSync(path.join(releaseDir, 'data', '.gitkeep'), '');

// deploy docs & start scripts
for (const file of ['DEPLOY.md', 'start.sh', 'start.bat', '.env.example']) {
  fs.copyFileSync(path.join(root, file), path.join(releaseDir, file));
}

const zipPath = path.join(root, 'release', 'task-planner.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

try {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${releaseDir}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: 'inherit' }
  );
} catch {
  console.warn('ZIP 打包跳过（可手动压缩 release/task-planner 目录）');
}

console.log('\n✅ 发布包已生成：');
console.log(`   目录: ${releaseDir}`);
if (fs.existsSync(zipPath)) console.log(`   压缩: ${zipPath}`);
