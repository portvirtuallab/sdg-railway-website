// Extract structured audit data from saved Google Sites HTML pages.
// Usage: node extract.mjs <source-html-dir> <out-dir>
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const [, , srcDir, outDir] = process.argv;
const BASE = 'https://sites.google.com/escolaeuropea.eu/sdgrailway/';
fs.mkdirSync(path.join(outDir, 'embeds'), { recursive: true });

const BLOCK = new Set([
  'p',
  'div',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'br',
  'tr',
  'section',
  'ul',
  'ol',
  'table',
  'blockquote',
]);
function textOf($, el) {
  let out = '';
  const walk = (n) => {
    if (n.type === 'text') out += n.data;
    else if (n.type === 'tag') {
      if (['script', 'style', 'noscript'].includes(n.name)) return;
      if (n.name === 'td' || n.name === 'th') out += ' | ';
      if (BLOCK.has(n.name)) out += '\n';
      if (/^h[1-6]$/.test(n.name)) out += '#'.repeat(+n.name[1]) + ' ';
      (n.children || []).forEach(walk);
      if (BLOCK.has(n.name)) out += '\n';
    }
  };
  walk(el);
  return out
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const pages = [];
for (const file of fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.html'))
  .sort()) {
  const slug = file.replace(/\.html$/, '').replace(/_/g, '/');
  const $ = cheerio.load(fs.readFileSync(path.join(srcDir, file), 'utf8'));
  const main = $('body');
  const sections = [];
  main.find('section').each((i, s) => {
    if ($(s).parents('section').length) return; // top-level sections only
    sections.push(s);
  });
  const secOut = [];
  let embedN = 0;
  const images = [];
  const seenImg = new Set();
  const addImg = (src, kind, sectionIdx, alt) => {
    if (!src) return;
    const key = src.split('=w')[0];
    if (seenImg.has(key + kind)) return;
    seenImg.add(key + kind);
    images.push({ section: sectionIdx, kind, alt: alt || '', src });
  };
  sections.forEach((s, idx) => {
    const sec = { index: idx, text: textOf($, s), embeds: [], links: [] };
    $(s)
      .find('img')
      .each((_, im) => addImg($(im).attr('src'), 'img', idx, $(im).attr('alt')));
    $(s)
      .find('[style*="background-image"]')
      .addBack('[style*="background-image"]')
      .each((_, e) => {
        const m = ($(e).attr('style') || '').match(/url\(["']?([^"')]+)/);
        if (m) addImg(m[1], 'background', idx);
      });
    $(s)
      .find('[data-code]')
      .each((_, e) => {
        embedN++;
        const code = $(e).attr('data-code');
        const name = `${file.replace(/\.html$/, '')}--embed-${String(embedN).padStart(2, '0')}.html`;
        fs.writeFileSync(path.join(outDir, 'embeds', name), code);
        const $e = cheerio.load(code);
        sec.embeds.push({
          file: `embeds/${name}`,
          bytes: code.length,
          iframes: $e('iframe')
            .map((_, f) => $e(f).attr('src'))
            .get(),
          forms: $e('form')
            .map((_, f) => ({
              action: $e(f).attr('action') || null,
              method: $e(f).attr('method') || null,
            }))
            .get(),
          inputs: $e('input,select,textarea').length,
          scripts: $e('script').length,
          imgs: $e('img')
            .map((_, f) => $e(f).attr('src'))
            .get(),
          links: $e('a[href]')
            .map((_, a) => ({ t: $e(a).text().trim().slice(0, 80), h: $e(a).attr('href') }))
            .get(),
          text: textOf($e, $e.root()[0]).slice(0, 4000),
        });
      });
    $(s)
      .find('iframe[src], [data-url]')
      .each((_, e) => {
        const u = $(e).attr('src') || $(e).attr('data-url');
        if (u && !u.includes('gstatic.com/atari') && !u.startsWith('/escolaeuropea.eu/sdgrailway'))
          sec.embeds.push({ iframe: u });
      });
    $(s)
      .find('a[href]')
      .each((_, a) => sec.links.push({ t: $(a).text().trim().slice(0, 80), h: $(a).attr('href') }));
    secOut.push(sec);
  });
  // header/banner images outside main sections
  $('header img, [role="banner"] img').each((_, im) =>
    addImg($(im).attr('src'), 'header-img', -1, $(im).attr('alt')),
  );
  $('header [style*="background-image"], [role="banner"] [style*="background-image"]').each(
    (_, e) => {
      const m = ($(e).attr('style') || '').match(/url\(["']?([^"')]+)/);
      if (m) addImg(m[1], 'header-background', -1);
    },
  );
  const page = {
    slug,
    url: BASE + slug,
    title: $('title').text().trim(),
    sections: secOut,
    images,
  };
  pages.push(page);
  fs.writeFileSync(
    path.join(outDir, `${file.replace(/\.html$/, '')}.json`),
    JSON.stringify(page, null, 2),
  );
}
fs.writeFileSync(path.join(outDir, 'all-pages.json'), JSON.stringify(pages, null, 2));
for (const p of pages) {
  const emb = p.sections.flatMap((s) => s.embeds);
  console.log(
    `${p.slug}: sections=${p.sections.length} images=${p.images.length} embeds=${emb.length} textChars=${p.sections.reduce((a, s) => a + s.text.length, 0)}`,
  );
}
