/**
 * Screenshot only §3 一周配方 from the soy milk MD → PNG
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..');
const mdPath = path.join(docsRoot, 'md', '一人份一周豆浆早餐配方.md');
const htmlPath = path.join(docsRoot, 'md', '_section3.preview.html');
const pngPath = path.join(docsRoot, 'md', '一人份一周豆浆早餐配方-一周配方.png');

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = chromeCandidates.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('Chrome/Edge not found');
  process.exit(1);
}

const fullMd = fs.readFileSync(mdPath, 'utf8');
const start = fullMd.indexOf('## 3. 一周配方');
const end = fullMd.indexOf('\n## 4. ');
if (start < 0 || end < 0) {
  console.error('Could not locate section 3');
  process.exit(1);
}
const sectionMd = fullMd.slice(start, end).trim();
const body = marked.parse(sectionMd, { gfm: true, breaks: false });

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>3. 一周配方</title>
<style>
  :root {
    --bg: #0b1220;
    --panel: #111a2b;
    --border: #1e2d45;
    --text: #e6edf7;
    --accent: #3dd6c6;
    --accent-dim: rgba(61, 214, 198, 0.12);
    --table-head: #152238;
    --code: #9ae6d4;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 15px;
    line-height: 1.65;
  }
  body {
    background-image:
      linear-gradient(rgba(61, 214, 198, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61, 214, 198, 0.04) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .wrap {
    max-width: 980px;
    margin: 0 auto;
    padding: 36px 36px 48px;
  }
  .badge {
    display: inline-block;
    margin-bottom: 16px;
    padding: 4px 10px;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: var(--accent);
    border: 1px solid rgba(61, 214, 198, 0.35);
    border-radius: 999px;
    background: var(--accent-dim);
  }
  h2 {
    font-size: 1.35rem;
    margin: 0 0 0.9rem;
    padding: 12px 14px;
    background: linear-gradient(90deg, var(--accent-dim), transparent);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--accent);
  }
  h3 {
    font-size: 1.05rem;
    margin: 1.35rem 0 0.55rem;
    color: #c8d6ea;
  }
  p { margin: 0.55rem 0; }
  blockquote {
    margin: 0.85rem 0 1rem;
    padding: 12px 16px;
    border-left: 3px solid var(--accent);
    background: var(--accent-dim);
    border-radius: 0 8px 8px 0;
  }
  blockquote p { margin: 0.25rem 0; }
  strong { color: #fff; }
  code {
    font-family: "Cascadia Code", "Consolas", monospace;
    font-size: 0.9em;
    color: var(--code);
    background: rgba(61, 214, 198, 0.1);
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid rgba(61, 214, 198, 0.2);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5rem 0 0.35rem;
    font-size: 0.92rem;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  th, td {
    border: 1px solid var(--border);
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: var(--table-head);
    color: var(--accent);
    font-weight: 600;
    white-space: nowrap;
    width: 96px;
  }
  tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
  hr { display: none; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="badge">SECTION 03 · WEEKLY FORMULA</div>
    ${body}
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.screenshot({ path: pngPath, fullPage: true, type: 'png' });
  console.log(JSON.stringify({ ok: true, pngPath, bytes: fs.statSync(pngPath).size }, null, 2));
} finally {
  await browser.close();
  fs.rmSync(htmlPath, { force: true });
}
