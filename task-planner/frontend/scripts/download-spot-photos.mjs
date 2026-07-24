/**
 * 从必应图片搜索解析候选实拍 URL，并下载到本地。
 * 每个景点默认下载 3 张；已有图会跳过并只补齐缺口。
 *
 * 用法：
 *   node scripts/download-spot-photos.mjs
 *   node scripts/download-spot-photos.mjs --limit=50
 *   node scripts/download-spot-photos.mjs --only=日光岩
 *   node scripts/download-spot-photos.mjs --per=3 --concurrency=4
 *   node scripts/download-spot-photos.mjs --incomplete --per=3
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rich from '../src/data/travelSpotsRich.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const photoDir = path.join(root, 'public/travel-spot-photos');
const mapPath = path.join(root, 'src/data/travelSpotPhotoMap.json');
const mapJsPath = path.join(root, 'src/data/travelSpotPhotoMap.js');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const CONCURRENCY = Number(args.concurrency || 4);
const LIMIT = args.limit ? Number(args.limit) : 0;
const ONLY = args.only ? String(args.only) : '';
const FORCE = Boolean(args.force);
const PROVINCE = args.province ? String(args.province) : '';
const INCOMPLETE_ONLY = Boolean(args.incomplete);
const PER_SPOT = Math.max(1, Math.min(6, Number(args.per || 3)));

fs.mkdirSync(photoDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeBingUrl(raw) {
  return String(raw || '')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/\\\u002f/gi, '/');
}

function extractMurls(html) {
  const out = [];
  const patterns = [
    /"murl"\s*:\s*"(https?:[^"]+)"/g,
    /murl&quot;:&quot;(https?:[^&]+)&quot;/g,
    /&quot;murl&quot;:&quot;(https?:[^&]+)&quot;/g,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const url = decodeBingUrl(m[1]);
      if (/^https?:\/\//i.test(url) && !out.includes(url)) out.push(url);
    }
  }
  return out;
}

async function searchBingImages(query, first = 1) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&qft=+filterui:photo-photo&form=HDRSC2&first=${first}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`bing ${res.status}`);
  const html = await res.text();
  return extractMurls(html);
}

async function searchBingImagesLoose(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`bing ${res.status}`);
  return extractMurls(await res.text());
}

function isProbablyImageUrl(url) {
  const u = url.toLowerCase();
  if (u.includes('svg') || u.includes('logo') || u.includes('avatar')) return false;
  if (u.includes('data:')) return false;
  return (
    /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)
    || u.includes('images')
    || u.includes('photo')
    || u.includes('img')
  );
}

async function downloadToFile(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: 'https://www.bing.com/',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('image') && !/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) {
    throw new Error(`not image: ${ctype}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4_000) throw new Error(`too small ${buf.length}`);
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  const isWebp = buf.toString('ascii', 0, 4) === 'RIFF';
  if (!isJpeg && !isPng && !isWebp) throw new Error('bad magic');
  const ext = isPng ? '.png' : isWebp ? '.webp' : '.jpg';
  const finalPath = destPath.replace(/\.(jpg|jpeg|png|webp)$/i, ext);
  fs.writeFileSync(finalPath, buf);
  return finalPath;
}

function queryForSpot(spot, provinceName) {
  const cityHint = spot.area && spot.area !== provinceName ? spot.area : '';
  return [spot.name, provinceName, cityHint, '景点'].filter(Boolean).join(' ');
}

function queryVariants(spot, provinceName) {
  const cityHint = spot.area && spot.area !== provinceName ? spot.area : '';
  const base = [spot.name, provinceName, cityHint].filter(Boolean);
  return [
    [...base, '景点'].join(' '),
    [...base, '旅游', '实景'].join(' '),
    [...base, '风景'].join(' '),
    [spot.name, cityHint || provinceName, '照片'].filter(Boolean).join(' '),
    [spot.name, cityHint || provinceName, '景区'].filter(Boolean).join(' '),
    `${spot.name} ${cityHint || provinceName}`,
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);
}

function publicPathFromAbs(absPath) {
  const rel = path.relative(path.join(root, 'public'), absPath).replace(/\\/g, '/');
  return `/${rel}`;
}

function absFromPublic(localPath) {
  return path.join(root, 'public', String(localPath || '').replace(/^\//, ''));
}

function normalizeEntryPaths(entry) {
  if (!entry) return [];
  const list = [];
  if (Array.isArray(entry.localPaths)) {
    for (const p of entry.localPaths) if (p && !list.includes(p)) list.push(p);
  }
  if (entry.localPath && !list.includes(entry.localPath)) list.unshift(entry.localPath);
  return list.filter((p) => fs.existsSync(absFromPublic(p)));
}

function writeMap(map) {
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');
  fs.writeFileSync(
    mapJsPath,
    `/* auto-generated by download-spot-photos.mjs */\nexport default ${JSON.stringify(map)};\n`,
    'utf8'
  );
}

async function fetchOne(spot, provinceName, map) {
  const existing = map[spot.id] || {};
  let kept = FORCE ? [] : normalizeEntryPaths(existing);
  const keptSources = new Set(
    FORCE
      ? []
      : [
          ...(Array.isArray(existing.sourceUrls) ? existing.sourceUrls : []),
          existing.sourceUrl,
        ].filter(Boolean)
  );

  if (kept.length >= PER_SPOT) {
    map[spot.id] = {
      ...existing,
      name: spot.name,
      provinceId: spot.provinceId,
      localPath: kept[0],
      localPaths: kept.slice(0, PER_SPOT),
      sourceUrls: Array.isArray(existing.sourceUrls)
        ? existing.sourceUrls.slice(0, PER_SPOT)
        : existing.sourceUrl
          ? [existing.sourceUrl]
          : [],
      updatedAt: existing.updatedAt || new Date().toISOString(),
    };
    delete map[spot.id].error;
    return { spot, status: 'skip', count: kept.length, localPaths: kept };
  }

  const queries = queryVariants(spot, provinceName);
  const candidates = [];
  const pushUrls = (found) => {
    for (const url of found) {
      if (!isProbablyImageUrl(url)) continue;
      if (keptSources.has(url)) continue;
      if (candidates.includes(url)) continue;
      candidates.push(url);
      if (candidates.length >= 36) break;
    }
  };
  for (const query of queries) {
    if (candidates.length >= 36) break;
    try {
      pushUrls(await searchBingImages(query, 1));
      if (candidates.length < 12) pushUrls(await searchBingImages(query, 35));
      if (candidates.length < 8) pushUrls(await searchBingImagesLoose(query));
      await sleep(180 + Math.random() * 220);
    } catch {
      // try next query
    }
  }
  if (!candidates.length && kept.length === 0) throw new Error('no candidates');

  const sourceUrls = Array.isArray(existing.sourceUrls)
    ? [...existing.sourceUrls]
    : existing.sourceUrl
      ? [existing.sourceUrl]
      : [];
  let lastErr = null;
  let added = 0;
  const query = queries[0];

  for (const url of candidates) {
    if (kept.length >= PER_SPOT) break;
    const index = kept.length + 1;
    const destBase = path.join(photoDir, `${spot.id}-${index}.jpg`);
    try {
      const saved = await downloadToFile(url, destBase);
      const localPath = publicPathFromAbs(saved);
      if (!kept.includes(localPath)) {
        kept.push(localPath);
        sourceUrls.push(url);
        keptSources.add(url);
        added += 1;
      }
      await sleep(120 + Math.random() * 180);
    } catch (err) {
      lastErr = err;
    }
  }

  if (kept.length === 0) throw lastErr || new Error('all downloads failed');

  map[spot.id] = {
    name: spot.name,
    provinceId: spot.provinceId,
    query,
    sourceUrl: sourceUrls[0] || existing.sourceUrl || '',
    sourceUrls: sourceUrls.slice(0, PER_SPOT),
    localPath: kept[0],
    localPaths: kept.slice(0, PER_SPOT),
    updatedAt: new Date().toISOString(),
  };
  delete map[spot.id].error;

  return {
    spot,
    status: added > 0 ? 'ok' : 'partial',
    count: kept.length,
    added,
    localPaths: kept,
  };
}

async function mapPool(items, concurrency, worker) {
  const results = [];
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i;
      i += 1;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => run()));
  return results;
}

async function main() {
  const provinceNames = Object.fromEntries(
    (rich.provinces || []).map((p) => [p.id, p.name])
  );
  let spots = rich.spots || [];
  if (PROVINCE) spots = spots.filter((s) => s.provinceId === PROVINCE);
  if (ONLY) spots = spots.filter((s) => s.name.includes(ONLY));
  if (LIMIT > 0) spots = spots.slice(0, LIMIT);

  /** @type {Record<string, any>} */
  const map = fs.existsSync(mapPath)
    ? JSON.parse(fs.readFileSync(mapPath, 'utf8'))
    : {};

  if (INCOMPLETE_ONLY) {
    spots = spots.filter((spot) => normalizeEntryPaths(map[spot.id]).length < PER_SPOT);
  }

  console.log(
    `spots to process: ${spots.length}; per=${PER_SPOT}; concurrency=${CONCURRENCY}`
    + (INCOMPLETE_ONLY ? '; incomplete-only' : '')
  );
  let ok = 0;
  let skip = 0;
  let partial = 0;
  let fail = 0;

  await mapPool(spots, CONCURRENCY, async (spot, idx) => {
    const provinceName = provinceNames[spot.provinceId] || '';
    try {
      const result = await fetchOne(spot, provinceName, map);
      if (result.status === 'skip') skip += 1;
      else if (result.status === 'partial') partial += 1;
      else ok += 1;
      if ((idx + 1) % 20 === 0 || result.status !== 'skip') {
        console.log(
          `[${idx + 1}/${spots.length}] ${result.status} ${spot.name} ${result.count || 0}/${PER_SPOT}`
        );
      }
      if ((idx + 1) % 10 === 0) writeMap(map);
      await sleep(result.status === 'skip' ? 40 : 220 + Math.random() * 360);
    } catch (err) {
      fail += 1;
      console.warn(`[${idx + 1}/${spots.length}] FAIL ${spot.name}: ${err.message}`);
      map[spot.id] = {
        ...(map[spot.id] || {}),
        name: spot.name,
        provinceId: spot.provinceId,
        error: String(err.message || err),
        updatedAt: new Date().toISOString(),
      };
      await sleep(500);
    }
  });

  writeMap(map);
  console.log(`done ok=${ok} skip=${skip} partial=${partial} fail=${fail} map=${mapPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
