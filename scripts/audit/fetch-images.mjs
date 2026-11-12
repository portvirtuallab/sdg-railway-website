// Downloads every image listed in docs/audit/extracted/images.json, keeps the original in
// docs/audit/source-images/, writes an optimised WebP (max 1600 px wide) to public/images/source/
// and records dimensions and status in docs/audit/extracted/images-fetched.json.
//
// Google Sites image URLs are signed and expire within minutes, so for each page the script
// re-downloads the page, re-extracts it (same extractor, same order) and fetches its images at
// once. Images hosted elsewhere (e.g. postimg.cc) are fetched from their stored URL.
// Usage: node scripts/audit/fetch-images.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const ex = path.join(root, 'docs/audit/extracted');
const rows = JSON.parse(fs.readFileSync(path.join(ex, 'images.json'), 'utf8'));
const pages = JSON.parse(fs.readFileSync(path.join(ex, 'all-pages.json'), 'utf8'));
const rawDir = path.join(root, 'docs/audit/source-images');
const outDir = path.join(root, 'public/images/source');
fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const BASE = 'https://sites.google.com/escolaeuropea.eu/sdgrailway/';
const UA = { 'User-Agent': 'Mozilla/5.0' };
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const PAGE_KINDS = new Set(['img', 'background', 'header-img', 'header-background']);

const done = new Map();
// Results of an earlier run: images already converted are not downloaded again.
const fetchedFile = path.join(ex, 'images-fetched.json');
const previous = new Map(
  fs.existsSync(fetchedFile)
    ? JSON.parse(fs.readFileSync(fetchedFile, 'utf8')).map((r) => [r.id, r])
    : [],
);

async function save(id, url) {
  if (done.get(id)?.ok) return;
  const webp = path.join(outDir, `${id}.webp`);
  if (fs.existsSync(webp) && previous.get(id)?.ok) {
    done.set(id, previous.get(id));
    return;
  }
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = (res.headers.get('content-type') || '').split(';')[0];
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(rawDir, `${id}.${EXT[type] || 'bin'}`), buf);
    const meta = await sharp(buf).metadata();
    await sharp(buf)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 78, alphaQuality: 90 })
      .toFile(path.join(outDir, `${id}.webp`));
    done.set(id, {
      id,
      ok: true,
      type,
      width: meta.width,
      height: meta.height,
      hasAlpha: !!meta.hasAlpha,
      bytes: buf.length,
    });
  } catch (e) {
    done.set(id, { id, ok: false, error: String(e.message || e) });
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdg-fetch-'));
for (const p of pages) {
  const file = `${p.slug.replace(/\//g, '_')}.html`;
  const pageDir = path.join(tmp, p.slug.replace(/\//g, '_'));
  fs.mkdirSync(path.join(pageDir, 'in'), { recursive: true });
  const html = await (await fetch(BASE + p.slug, { headers: UA })).text();
  fs.writeFileSync(path.join(pageDir, 'in', file), html);
  execFileSync(
    process.execPath,
    [
      path.join(import.meta.dirname, 'extract.mjs'),
      path.join(pageDir, 'in'),
      path.join(pageDir, 'out'),
    ],
    { stdio: 'ignore' },
  );
  const fresh = JSON.parse(
    fs.readFileSync(path.join(pageDir, 'out', file.replace(/\.html$/, '.json')), 'utf8'),
  ).images.filter((im) => !/creativecommons/.test(im.src));
  const stored = rows.filter((r) => r.page === p.slug && PAGE_KINDS.has(r.kind));
  if (fresh.length !== stored.length)
    console.warn(
      `${p.slug}: image count changed (${stored.length} → ${fresh.length}); aligning by position`,
    );
  for (let i = 0; i < Math.min(fresh.length, stored.length); i++)
    await save(stored[i].id, fresh[i].src);
}
for (const r of rows.filter((x) => !PAGE_KINDS.has(x.kind))) await save(r.id, r.src);
fs.rmSync(tmp, { recursive: true, force: true });

const results = [...done.values()].sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(path.join(ex, 'images-fetched.json'), JSON.stringify(results, null, 1));
console.log(`fetched ${results.filter((r) => r.ok).length}/${results.length}`);
for (const r of results.filter((x) => !x.ok)) console.log('FAILED', r.id, r.error);
