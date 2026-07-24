/**
 * 生成发布包（可在 Windows 本地打包，手动上传到 Ubuntu 覆盖后重启）。
 *
 *   npm run pack:update       # 日常更新包：仅 frontend/dist + backend 源码（无 node_modules）
 *   npm run pack              # 轻量完整包（首次仍可，服务器需 npm install）
 *   npm run pack:offline      # 全离线包（含 Linux node_modules，仅首次/改依赖时用）
 *
 * 全离线原理：本机 npm install 后，用 prebuild-install 拉取 Linux 版 better-sqlite3。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const releaseDir = path.join(root, 'release', 'task-planner');
const distDir = path.join(root, 'frontend', 'dist');
const stagingDeps = path.join(root, 'release', '_linux-deps');

const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');
const updateOnly = args.has('--update');
const updateWithMedia = args.has('--with-media');
const arch = process.env.PACK_ARCH || 'x64';
const nodeTarget = process.env.PACK_NODE_TARGET || process.versions.node; // e.g. 20.18.0 / 22.22.0

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist 不存在，请先运行 npm run build');
  process.exit(1);
}

if (offline && updateOnly) {
  console.error('不能同时使用 --offline 与 --update');
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

/** Ensure shell scripts use LF so Ubuntu does not fail with "required file not found". */
function writeTextLf(filePath, text) {
  const normalized = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  fs.writeFileSync(filePath, normalized.endsWith('\n') ? normalized : `${normalized}\n`, 'utf8');
}

function copyTextLf(src, dest) {
  writeTextLf(dest, fs.readFileSync(src, 'utf8'));
}

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
}

function isElf(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  return buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46;
}

function findNativeNodes(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === '.bin') continue;
      findNativeNodes(p, acc);
    } else if (name.endsWith('.node')) {
      acc.push(p);
    }
  }
  return acc;
}

function prepareLinuxNodeModules() {
  rmDir(stagingDeps);
  fs.mkdirSync(stagingDeps, { recursive: true });
  fs.copyFileSync(path.join(root, 'backend', 'package.json'), path.join(stagingDeps, 'package.json'));
  const lock = path.join(root, 'backend', 'package-lock.json');
  if (fs.existsSync(lock)) fs.copyFileSync(lock, path.join(stagingDeps, 'package-lock.json'));

  console.log('\n安装生产依赖…');
  run('npm install --omit=dev --no-fund --no-audit', { cwd: stagingDeps });

  const sqliteDir = path.join(stagingDeps, 'node_modules', 'better-sqlite3');
  if (!fs.existsSync(sqliteDir)) {
    throw new Error('未找到 better-sqlite3，无法制作 Linux 离线包');
  }

  console.log(`\n拉取 Linux 预编译原生模块 (node ${nodeTarget}, ${arch})…`);
  run(
    `npx --yes prebuild-install --platform linux --arch ${arch} --target ${nodeTarget}`,
    { cwd: sqliteDir }
  );

  const nodes = findNativeNodes(path.join(stagingDeps, 'node_modules'));
  const elfNodes = nodes.filter((p) => isElf(p));
  if (elfNodes.length === 0) {
    throw new Error('未能安装 Linux 版 .node（仍是 Windows 二进制）。请检查网络或代理后重试。');
  }
  console.log(`已确认 Linux ELF 原生模块 ${elfNodes.length} 个：`);
  elfNodes.forEach((p) => console.log('  -', path.relative(stagingDeps, p)));

  return path.join(stagingDeps, 'node_modules');
}

function skipBackendName(name) {
  return ['node_modules', 'data', 'coverage', '.nyc_output'].includes(name);
}

function skipBackendUpdateName(name) {
  // 更新包：只要可运行源码与清单，不要测试/脚本/依赖目录
  return [
    'node_modules',
    'data',
    'coverage',
    '.nyc_output',
    'tests',
    'scripts',
  ].includes(name);
}

rmDir(releaseDir);
fs.mkdirSync(releaseDir, { recursive: true });

if (updateOnly) {
  // 日常更新：只带编译前端 + 后端源码，体积小；服务器保留 node_modules / .env / data
  copyDir(path.join(root, 'backend'), path.join(releaseDir, 'backend'), skipBackendUpdateName);
  // 默认不带大体积静态资源（很少改）；需要时加 --with-media
  const skipDistMedia = updateWithMedia
    ? () => false
    : (name) => ['ingredients', 'equipment', 'travel-spot-photos'].includes(name);
  copyDir(distDir, path.join(releaseDir, 'frontend', 'dist'), skipDistMedia);
  for (const file of ['start.sh', 'start.bat', '.env.example']) {
    const src = path.join(root, file);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(releaseDir, file);
    if (file.endsWith('.sh')) copyTextLf(src, dest);
    else fs.copyFileSync(src, dest);
  }
  writeTextLf(
    path.join(releaseDir, 'UPDATE.txt'),
    [
      '日常更新包（无 node_modules / 无 data）',
      '',
      '本包仅含：',
      '  - frontend/dist/     （已编译前端；默认不含 ingredients、equipment、travel-spot-photos）',
      '  - backend/src 等源码（无 node_modules）',
      '  - start.sh 等启动脚本',
      updateWithMedia
        ? '  - 已包含 ingredients/、equipment/、travel-spot-photos/ 静态图'
        : '  - 未含大图：改图时请用 npm run pack:update:media，或单独上传 travel-spot-photos 包',
      '',
      '服务器操作（已有完整安装，含 node_modules 与 .env）：',
      '  1. 停服务：pm2 stop task-planner  或  结束占用 PORT 的进程',
      '  2. 进入安装目录的上一级，例如：',
      '       cd /home/ubuntu/soft/person-assistant',
      '  3. 解压覆盖（勿删服务器上的 .env、data/、backend/node_modules）：',
      '       tar -xzf task-planner-update.tar.gz',
      '  4. 重启：',
      '       cd task-planner && chmod +x start.sh && ./start.sh',
      '       # 或: pm2 restart task-planner',
      '',
      '若改了 package.json 依赖，请改用 npm run pack:offline 全量包，',
      '或在服务器 backend 目录执行 npm install --omit=dev。',
      '',
      `打包时间: ${new Date().toISOString()}`,
      '',
    ].join('\n')
  );
} else {
  copyDir(path.join(root, 'backend'), path.join(releaseDir, 'backend'), skipBackendName);
  // 运行时不需要测试文件
  const testsDir = path.join(releaseDir, 'backend', 'tests');
  if (fs.existsSync(testsDir)) rmDir(testsDir);

  copyDir(distDir, path.join(releaseDir, 'frontend', 'dist'));

  fs.mkdirSync(path.join(releaseDir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(releaseDir, 'data', '.gitkeep'), '');

  for (const file of ['DEPLOY.md', 'start.sh', 'start.bat', '.env.example']) {
    const src = path.join(root, file);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(releaseDir, file);
    if (file.endsWith('.sh')) copyTextLf(src, dest);
    else fs.copyFileSync(src, dest);
  }

  // 简短服务器说明
  fs.writeFileSync(
    path.join(releaseDir, 'DEPLOY-OFFLINE.txt'),
    [
      '全离线部署（Ubuntu）',
      '1. 解压本目录到服务器目标路径（或覆盖旧目录，保留 .env 与 data/）',
      '2. cp .env.example .env 并修改 JWT_SECRET 等',
      '3. chmod +x start.sh && ./start.sh',
      '4. 或用 pm2: pm2 restart task-planner',
      '',
      `打包机 Node: ${process.version}`,
      `目标原生模块: linux-${arch} / Node ${nodeTarget}`,
      '请保证服务器 Node 主版本与上述一致（推荐 Node 20 LTS）。',
      '',
    ].join('\n')
  );

  if (offline) {
    const linuxModules = prepareLinuxNodeModules();
    console.log('\n复制 Linux node_modules 到发布包…');
    copyDir(linuxModules, path.join(releaseDir, 'backend', 'node_modules'));

    const meta = [
      'offline=1',
      'platform=linux',
      `arch=${arch}`,
      `nodeTarget=${nodeTarget}`,
      `packedFrom=${process.platform}/${os.arch()}`,
      `packedNode=${process.version}`,
      `createdAt=${new Date().toISOString()}`,
      '',
    ].join('\n');
    fs.writeFileSync(path.join(releaseDir, '.offline-pack'), meta);
    fs.writeFileSync(path.join(releaseDir, 'backend', '.offline-pack'), meta);
  }
}

function createArchive(releaseRoot, archivePath, format) {
  if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
  const parent = path.dirname(releaseRoot);
  const folderName = path.basename(releaseRoot);
  // Windows Compress-Archive writes backslash paths that break Linux unzip.
  // Prefer tar (bsdtar) which emits forward-slash entries.
  if (format === 'tar.gz') {
    run(`tar -czf "${archivePath}" "${folderName}"`, { cwd: parent });
    return;
  }
  if (process.platform === 'win32') {
    run(`tar -a -c -f "${archivePath}" "${folderName}"`, { cwd: parent });
    return;
  }
  run(`zip -r -q "${archivePath}" "${folderName}"`, { cwd: parent });
}

const archiveName = updateOnly
  ? updateWithMedia
    ? 'task-planner-update-with-media.tar.gz'
    : 'task-planner-update.tar.gz'
  : offline
    ? 'task-planner-offline-linux.tar.gz'
    : 'task-planner.zip';
const archivePath = path.join(root, 'release', archiveName);
const zipFallbackName = offline ? 'task-planner-offline-linux.zip' : null;
const zipFallbackPath = zipFallbackName ? path.join(root, 'release', zipFallbackName) : null;
const archiveFormat = updateOnly || offline ? 'tar.gz' : 'zip';

try {
  createArchive(releaseDir, archivePath, archiveFormat);
  if (zipFallbackPath) {
    createArchive(releaseDir, zipFallbackPath, 'zip');
  }
} catch (err) {
  console.warn('压缩打包失败：', err.message);
  console.warn('可手动打包 release/task-planner 目录（勿用 Compress-Archive）');
}

// 清理临时依赖目录
rmDir(stagingDeps);
rmDir(path.join(root, 'release', '_linux-deps-test'));

const modulesPath = path.join(releaseDir, 'backend', 'node_modules');
const modeLabel = updateOnly
  ? updateWithMedia
    ? '日常更新（dist+后端+静态大图）'
    : '日常更新（dist+后端源码，不含大图）'
  : offline
    ? '全离线 Linux（可在 Windows 本机打包）'
    : '轻量完整包';
console.log('\n✅ 发布包已生成：');
console.log(`   目录: ${releaseDir}`);
if (fs.existsSync(archivePath)) {
  const mb = (fs.statSync(archivePath).size / (1024 * 1024)).toFixed(1);
  console.log(`   压缩: ${archivePath} (${mb} MB)`);
}
if (zipFallbackPath && fs.existsSync(zipFallbackPath)) console.log(`   压缩: ${zipFallbackPath}`);
console.log(`   模式: ${modeLabel}`);
console.log(`   node_modules: ${fs.existsSync(modulesPath) ? '已包含 Linux 版' : '未包含（服务器沿用原有）'}`);
if (updateOnly) {
  console.log('\nUbuntu 覆盖更新：');
  console.log('  cd /path/to/parent   # 含 task-planner 目录的那一层');
  console.log(`  tar -xzf ${path.basename(archivePath)}`);
  console.log('  cd task-planner && ./start.sh   # 或 pm2 restart');
  if (!updateWithMedia) {
    console.log('提示：改了食材/器械图片时用 npm run pack:update:media');
  }
} else if (offline) {
  console.log('\nUbuntu 推荐：');
  console.log('  tar -xzf task-planner-offline-linux.tar.gz');
  console.log('  cd task-planner && chmod +x start.sh && ./start.sh');
  console.log(`注意：服务器 Node 主版本需匹配打包目标 Node ${nodeTarget.split('.')[0]}`);
}
