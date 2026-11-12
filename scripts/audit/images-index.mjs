// Builds docs/audit/extracted/images.json (one row per image placement, stable IMG-nnn ids in page
// order) and docs/audit/asset-register.csv from the extracted pages.
// Usage: node scripts/audit/images-index.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const ex = path.join(root, 'docs/audit/extracted');
const pages = JSON.parse(fs.readFileSync(path.join(ex, 'all-pages.json'), 'utf8'));
const host = (u) => new URL(u, 'https://sites.google.com').hostname;
// Signed Google Sites URLs change on every fetch; identify an image by its path without the size.
const keyOf = (u) => u.replace(/=w\d+(-h\d+)?$/, '');

const rows = [];
for (const p of pages) {
  for (const im of p.images) {
    if (/creativecommons/.test(im.src)) continue;
    rows.push({
      page: p.slug,
      section: im.section,
      kind: im.kind,
      alt: im.alt,
      host: host(im.src),
      src: im.src,
    });
  }
  for (const s of p.sections) {
    for (const e of s.embeds) {
      for (const u of e.imgs || []) {
        if (!/creativecommons/.test(u))
          rows.push({
            page: p.slug,
            section: s.index,
            kind: 'embed-img',
            alt: '',
            host: host(u),
            src: u,
          });
      }
      if (e.file) {
        const code = fs.readFileSync(path.join(ex, e.file), 'utf8');
        for (const m of code.matchAll(/url\(['"]?(https?:[^'")]+)/g)) {
          rows.push({
            page: p.slug,
            section: s.index,
            kind: 'embed-bg',
            alt: '',
            host: host(m[1]),
            src: m[1],
          });
        }
      }
    }
  }
}
const ids = new Map();
let n = 0;
for (const r of rows) {
  r.key = keyOf(r.src);
  if (!ids.has(r.key)) ids.set(r.key, `IMG-${String(++n).padStart(3, '0')}`);
  r.id = ids.get(r.key);
}
for (const r of rows) r.uses = rows.filter((x) => x.key === r.key).length;
fs.writeFileSync(path.join(ex, 'images.json'), JSON.stringify(rows, null, 1));

const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const fetched = fs.existsSync(path.join(ex, 'images-fetched.json'))
  ? new Map(
      JSON.parse(fs.readFileSync(path.join(ex, 'images-fetched.json'), 'utf8')).map((f) => [
        f.id,
        f,
      ]),
    )
  : new Map();
const head = [
  'asset_id',
  'source_page',
  'source_url',
  'section_index',
  'placement',
  'host',
  'alt_text',
  'original_url',
  'dimensions',
  'local_path',
  'rights_status',
  'migration_status',
  'notes',
];
const out = [head.join(',')];
for (const r of rows) {
  const f = fetched.get(r.id);
  const note =
    r.host === 'i.postimg.cc'
      ? 'Third-party image host (postimg.cc) - fragile; request original'
      : r.section === -1
        ? 'Header/banner asset'
        : '';
  out.push(
    [
      r.id,
      r.page,
      `https://sites.google.com/escolaeuropea.eu/sdgrailway/${r.page}`,
      r.section,
      r.kind,
      r.host,
      r.alt,
      r.src,
      f?.ok ? `${f.width}x${f.height}` : 'pending',
      f?.ok ? `public/images/source/${r.id}.webp` : '',
      'owner asset - to confirm with owner',
      f?.ok ? 'downloaded (not yet placed)' : 'not migrated',
      note,
    ]
      .map(q)
      .join(','),
  );
}
fs.writeFileSync(path.join(root, 'docs/audit/asset-register.csv'), `${out.join('\n')}\n`);
console.log(`${rows.length} placements, ${ids.size} unique images`);
