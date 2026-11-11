// Checks that every internal link and asset reference in the static export resolves to a file.
// Usage: node scripts/check-links.mjs [outDir] [basePath]
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.argv[2] ?? 'out');
const basePath = (process.argv[3] ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

function resolves(urlPath) {
  let p = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (basePath) {
    if (!p.startsWith(`${basePath}/`) && p !== basePath) return false;
    p = p.slice(basePath.length) || '/';
  }
  const target = path.join(outDir, p);
  if (p.endsWith('/')) return fs.existsSync(path.join(target, 'index.html'));
  return (
    fs.existsSync(target) ||
    fs.existsSync(`${target}.html`) ||
    fs.existsSync(path.join(target, 'index.html'))
  );
}

const broken = [];
let checked = 0;
for (const file of htmlFiles(outDir)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    checked++;
    if (!resolves(url)) broken.push(`${path.relative(outDir, file)} -> ${url}`);
  }
}

console.log(`Checked ${checked} internal references in ${outDir}`);
if (broken.length) {
  console.error(
    `Broken internal references (${broken.length}):\n  ${[...new Set(broken)].join('\n  ')}`,
  );
  process.exit(1);
}
