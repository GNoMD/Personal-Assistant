/**
 * Render 一人份一周豆浆早餐配方.md → PNG (full page)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..');
const mdPath = path.join(docsRoot, 'md', '一人份一周豆浆早餐配方.md');
const htmlPath = path.join(docsRoot, 'md', '一人份一周豆浆早餐配方.preview.html');
const pngPath = path.join(docsRoot, 'md', '一人份一周豆浆早餐配方.png');

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

const md = fs.readFileSync(mdPath, 'utf8');
const body = marked.parse(md, { gfm: true, breaks: false });

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>一人份一周豆浆早餐配方</title>
<style>
  :root {
    --bg: #0b1220;
    --panel: #111a2b;
    --border: #1e2d45;
    --text: #e6edf7;
    --muted: #8b9bb4;
    --accent: #3dd6c6;
    --accent-dim: rgba(61, 214, 198, 0.12);
    --warn: #f0b429;
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
    padding: 40px 36px 64px;
  }
  h1 {
    font-size: 1.85rem;
    letter-spacing: 0.02em;
    margin: 0 0 12px;
    color: #fff;
    border-left: 4px solid var(--accent);
    padding-left: 14px;
  }
  h2 {
    font-size: 1.25rem;
    margin: 2.2rem 0 0.85rem;
    padding: 10px 14px;
    background: linear-gradient(90deg, var(--accent-dim), transparent);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--accent);
  }
  h3 {
    font-size: 1.05rem;
    margin: 1.5rem 0 0.6rem;
    color: #c8d6ea;
  }
  p { margin: 0.65rem 0; color: var(--text); }
  blockquote {
    margin: 1rem 0;
    padding: 12px 16px;
    border-left: 3px solid var(--accent);
    background: var(--accent-dim);
    border-radius: 0 8px 8px 0;
    color: #d7e6f7;
  }
  blockquote p { margin: 0.35rem 0; }
  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 2rem 0;
  }
  a { color: var(--accent); text-decoration: none; }
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
  ul, ol { padding-left: 1.35rem; }
  li { margin: 0.35rem 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.85rem 0 1.2rem;
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
  }
  tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
  .badge {
    display: inline-block;
    margin-bottom: 18px;
    padding: 4px 10px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    border: 1px solid rgba(61, 214, 198, 0.35);
    border-radius: 999px;
    background: var(--accent-dim);
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="badge">SOY PROTOCOL · v1</div>
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
  console.log(JSON.stringify({ ok: true, htmlPath, pngPath }, null, 2));
} finally {
  await browser.close();
}
