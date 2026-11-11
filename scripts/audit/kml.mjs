// Parse a Google My Maps KML into JSON. Usage: node kml.mjs <in.kml> <out.json>
import fs from 'node:fs';
import * as cheerio from 'cheerio';
const [, , inp, out] = process.argv;
const $ = cheerio.load(fs.readFileSync(inp, 'utf8'), { xml: true });
const clean = (s) =>
  (s || '')
    .replace(/<br\s*\/?>/g, ' / ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const folders = [];
$('Folder').each((_, f) => {
  const placemarks = [];
  $(f)
    .children('Placemark')
    .each((__, p) => {
      const $p = $(p);
      const point = $p.find('Point coordinates').text().trim();
      const line = $p.find('LineString coordinates').text().trim();
      placemarks.push({
        name: clean($p.children('name').text()),
        description: clean($p.children('description').text()),
        style: $p.children('styleUrl').text(),
        geometry: point ? 'point' : line ? 'line' : 'none',
        coordinates: point
          ? point.split(',').slice(0, 2).map(Number)
          : line
            ? line.split(/\s+/).map((c) => c.split(',').slice(0, 2).map(Number))
            : null,
        data: $p
          .find('ExtendedData Data')
          .map((___, d) => ({ name: $(d).attr('name'), value: clean($(d).find('value').text()) }))
          .get(),
      });
    });
  folders.push({ name: clean($(f).children('name').text()), placemarks });
});
const doc = {
  name: clean($('Document > name').first().text()),
  description: clean($('Document > description').first().text()),
  folders,
};
fs.writeFileSync(out, JSON.stringify(doc, null, 2));
for (const f of folders) {
  console.log(`# ${f.name} (${f.placemarks.length})`);
  for (const p of f.placemarks)
    console.log(
      `  [${p.geometry}${p.geometry === 'line' ? ' ' + p.coordinates.length + 'pts' : p.coordinates ? ' ' + p.coordinates.join(',') : ''}] ${p.name} :: ${p.description.slice(0, 140)} ${p.data.length ? JSON.stringify(p.data).slice(0, 140) : ''}`,
    );
}
