// Builds the site's structured content (src/data/*.json) from the audit extraction, so every value
// can be traced back to the source site. Re-run after refreshing docs/audit/extracted.
// Usage: node scripts/content/build-content.mjs
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const root = path.resolve(import.meta.dirname, '../..');
const ex = path.join(root, 'docs/audit/extracted');
const out = path.join(root, 'src/data');
fs.mkdirSync(out, { recursive: true });

const pages = JSON.parse(fs.readFileSync(path.join(ex, 'all-pages.json'), 'utf8'));
const images = JSON.parse(fs.readFileSync(path.join(ex, 'images.json'), 'utf8'));
const page = (slug) => pages.find((p) => p.slug === slug);
const embed = (name) => fs.readFileSync(path.join(ex, 'embeds', name), 'utf8');
const imgsIn = (slug, section) =>
  images.filter((r) => r.page === slug && r.section === section).map((r) => r.id);
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const write = (name, data) =>
  fs.writeFileSync(path.join(out, name), `${JSON.stringify(data, null, 2)}\n`);

/** Keeps only simple, safe formatting from embed HTML (no attributes, no scripts). */
function safeHtml($, el) {
  const ALLOWED = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br']);
  const walk = (n) => {
    if (n.type === 'text') return n.data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (n.type !== 'tag') return '';
    const inner = (n.children || []).map(walk).join('');
    if (!ALLOWED.has(n.name)) return inner;
    const tag = n.name === 'b' ? 'strong' : n.name === 'i' ? 'em' : n.name;
    return tag === 'br' ? '<br>' : `<${tag}>${inner}</${tag}>`;
  };
  return clean((el.children || []).map(walk).join('')).replace(/> </g, '><');
}

// ---------------------------------------------------------------- Terminals (Services page)
const COUNTRY_CODES = {
  FRANCE: 'FR',
  SPAIN: 'ES',
  ITALY: 'IT',
  JORDAN: 'JO',
  EGYPT: 'EG',
  PORTUGAL: 'PT',
};
const CITY_FIX = { TOLOUSE: 'TOULOUSE' };
const services = page('services');
const terminals = [];
let country = null;
for (const s of services.sections) {
  if (s.index < 10 || s.index > 28 || !s.text) continue;
  const lines = s.text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== '##');
  let ids = imgsIn('services', s.index);
  if (COUNTRY_CODES[lines[0]]) {
    country = lines.shift();
    ids = ids.slice(1); // first image of a country block is its map pin
  }
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const city = lines[i];
    const raw = lines[i + 1];
    const dg = /\[DG\]/.test(raw);
    const name = clean(raw.replace(/\[DG\]/, '').replace(/\s+—\s+[^—]+$/, ''));
    terminals.push({
      id: slugify(`${COUNTRY_CODES[country]}-${city}`),
      country: COUNTRY_CODES[country],
      countryName: country[0] + country.slice(1).toLowerCase(),
      // V-07: "TOLOUSE" is a typo in the source; display names use normal capitalisation.
      city: (CITY_FIX[city] ?? city)
        .toLowerCase()
        .replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase())
        .replace(/ (Do|Da|De|Di) /g, (m) => m.toLowerCase()),
      sourceCity: city,
      name,
      dangerousGoods: dg,
      image: ids[i / 2] ?? null,
      sourcePage: 'services',
      reviewState: 'source',
    });
  }
}
write('terminals.json', terminals);

// ---------------------------------------------------------------- Corridors (Network & Routes cards)
{
  const $ = cheerio.load(embed('network-routes--embed-01.html'));
  const corridors = $('article.card')
    .map((_, a) => ({
      id: slugify(`${$(a).attr('data-c')}-${$(a).find('.card-name').text()}`),
      country: $(a).attr('data-c'),
      name: clean($(a).find('.card-name').text()),
      network: clean($(a).find('.card-sub').text()),
      stops: $(a)
        .find('.stop-name')
        .map((__, n) => clean($(n).text()))
        .get(),
      source: 'network-routes cards',
      reviewState: 'source',
    }))
    .get();
  write('corridors.json', corridors);
}

// ---------------------------------------------------------------- Glossary (Resources)
{
  const $ = cheerio.load(embed('resources--embed-01.html'));
  const glossary = $('.accordion-item')
    .map((_, it) => {
      const content = $(it).find('.accordion-content').clone();
      const sdg = clean(content.find('.sdg-tag').text()) || null;
      content.find('.sdg-tag').remove();
      const term = clean($(it).find('.accordion-header').text());
      return { id: slugify(term), term, definition: clean(content.text()), sdg };
    })
    .get();
  write('glossary.json', glossary);
}

// ---------------------------------------------------------------- General Sales Conditions
{
  const $ = cheerio.load(embed('about-us_railway-general-sales-conditions--embed-01.html'));
  const sections = $('.accordion-item')
    .map((_, it) => ({
      title: clean($(it).find('.accordion-title').text()),
      html: safeHtml($, $(it).find('.accordion-content')[0]),
    }))
    .get();
  write('sales-conditions.json', {
    title: 'General Conditions of Sale – 2026 / 2027',
    downloadUrl:
      'https://drive.google.com/file/d/1D-3Punx4oH0hc-iJx83pYqZQfbl_ovcC/view?usp=sharing',
    sections,
  });
}

// ---------------------------------------------------------------- Home service cards
{
  const $ = cheerio.load(embed('home--embed-01.html'));
  const ids = images.filter((r) => r.page === 'home' && r.kind === 'embed-img').map((r) => r.id);
  write(
    'home-services.json',
    $('.service-card')
      .map((i, c) => ({
        title: clean($(c).find('h3').text()),
        description: clean($(c).find('.service-description').text()),
        icon: ids[i] ?? null,
      }))
      .get(),
  );
}

// ---------------------------------------------------------------- Dangerous goods resource cards
{
  const $ = cheerio.load(embed('services_dangerous-goods--embed-01.html'));
  const ids = images
    .filter((r) => r.page === 'services/dangerous-goods' && r.kind === 'embed-img')
    .map((r) => r.id);
  write(
    'dg-resources.json',
    $('.itu-card')
      .map((i, c) => {
        const body = $(c).clone();
        body.find('img, h3').remove();
        return {
          title: clean($(c).find('h3').text()),
          html: safeHtml($, body[0]),
          icon: ids[i] ?? null,
        };
      })
      .get(),
  );
}

// ---------------------------------------------------------------- Team table (About Us)
{
  const $ = cheerio.load(embed('about-us--embed-01.html'));
  write(
    'team.json',
    $('tbody tr')
      .map((_, tr) => {
        const td = $(tr)
          .find('td')
          .map((__, c) => clean($(c).text()))
          .get();
        return { department: td[0], expertise: td[1], focus: td[2] };
      })
      .get(),
  );
}

// ---------------------------------------------------------------- Locomotive models
{
  const p = page('services/railway-equipment-fleet/our-locomotive-models');
  const locos = [];
  for (const s of p.sections) {
    if (!s.text.startsWith('##')) continue;
    const lines = s.text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && l !== '##');
    const [heading, evn, ...body] = lines;
    const [name, motto] = heading.split(/\s+[–-]\s+/);
    locos.push({
      id: slugify(name),
      name: clean(name),
      motto: clean(motto ?? ''),
      evn: clean(evn),
      // V-02: "earring" is a mistranslation of the Greek "areté" in the source text.
      description: body.map((b) =>
        b
          .replace(/Greek earring/g, 'Greek areté')
          .replace(/acquisition of the earring/g, 'acquisition of areté'),
      ),
      reviewState: 'source',
    });
  }
  write('locomotives.json', locos);
}

// ---------------------------------------------------------------- Intermodal transport units
{
  const ids = images
    .filter((r) => r.page === 'services/railway-equipment-fleet' && r.kind === 'embed-img')
    .map((r) => r.id);
  const $ = cheerio.load(embed('services_railway-equipment-fleet--embed-01.html'));
  write(
    'itus.json',
    $('img')
      .map((i, im) => {
        const card = $(im).parent();
        return {
          id: slugify(clean(card.find('h3').text()) || `itu-${i + 1}`),
          name: clean(card.find('h3').text()),
          description: clean(card.find('p').text()),
          image: ids[i] ?? null,
        };
      })
      .get(),
  );
}

// ---------------------------------------------------------------- Image manifest (published WebP sizes)
{
  const fetched = JSON.parse(fs.readFileSync(path.join(ex, 'images-fetched.json'), 'utf8'));
  const manifest = {};
  for (const f of fetched) {
    if (!f.ok) continue;
    const scale = f.width > 1600 ? 1600 / f.width : 1;
    manifest[f.id] = { width: Math.round(f.width * scale), height: Math.round(f.height * scale) };
  }
  write('image-manifest.json', manifest);
}

console.log(
  [
    'terminals',
    'corridors',
    'glossary',
    'sales-conditions',
    'home-services',
    'dg-resources',
    'team',
    'locomotives',
    'itus',
  ]
    .map((n) => {
      const d = JSON.parse(fs.readFileSync(path.join(out, `${n}.json`), 'utf8'));
      return `${n}: ${Array.isArray(d) ? d.length : d.sections.length}`;
    })
    .join(' · '),
);
