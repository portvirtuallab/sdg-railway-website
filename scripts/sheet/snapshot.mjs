/**
 * Writes src/data/sheet-snapshot.json: the public tabs of the SDG Railway Sheet, used by the
 * website for the first render, for static pages and when the live service cannot be reached.
 * The live data always comes from the Apps Script web app at runtime.
 *
 *   node scripts/sheet/snapshot.mjs --url <web app URL>     from the live Sheet (normal use)
 *   node scripts/sheet/snapshot.mjs --from <tables.json>    from an exported v7 Sheet + v8 seed
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'src/data/sheet-snapshot.json');
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : null;
};

let tables;
let source;
const url = arg('--url') ?? process.env.NEXT_PUBLIC_QUOTE_API_URL;
const from = arg('--from');
if (from) {
  tables = withSeed(JSON.parse(fs.readFileSync(path.resolve(from), 'utf8')));
  source = `${path.relative(root, path.resolve(from)).replace(/\\/g, '/')} + apps-script/seed/v8-seed.json`;
} else if (url) {
  const res = await fetch(`${url}?action=catalogue`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Web app answered ${res.status}`);
  const body = await res.json();
  if (!body.tables) throw new Error(body.fatal ?? 'No tables in the answer');
  tables = body.tables;
  source = 'live Sheet (Apps Script web app)';
} else {
  console.error('Give --url <web app URL> or --from <tables.json>');
  process.exit(1);
}

fs.writeFileSync(
  out,
  JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), source, tables }, null, 1) +
    '\n',
);
console.log(
  `src/data/sheet-snapshot.json from ${source}: ` +
    Object.entries(tables)
      .map(([k, v]) => `${k} ${v.length}`)
      .join(', '),
);

/** Same additions as Setup.gs, for a snapshot made from a v7 export. */
function withSeed(t) {
  const seed = JSON.parse(
    fs.readFileSync(path.join(root, 'apps-script/seed/v8-seed.json'), 'utf8'),
  );
  const tables = structuredClone(t);
  tables.SURCHARGES = tables.SURCHARGES.map(({ '': code, ...rest }) =>
    code === undefined ? rest : { SurchargeCode: code, ...rest },
  );
  const have = new Set(tables.CONFIG.map((r) => r.Parameter));
  for (const [Parameter, Value, Description] of seed.config)
    if (!have.has(Parameter)) tables.CONFIG.push({ Parameter, Value, Description });
  tables.CONFIG = tables.CONFIG.filter(
    (r) => !['PdfFolderId', 'SpreadsheetId'].includes(r.Parameter),
  );
  for (const [tab, cols] of Object.entries(seed.addColumns)) {
    if (!tables[tab]) continue;
    for (const r of tables[tab]) for (const c of cols) r[c] ??= '';
  }
  for (const [tab, spec] of Object.entries(seed.fillColumns)) {
    for (const r of tables[tab] ?? []) Object.assign(r, spec.rows[r[spec.key]] ?? {});
  }
  const legs = seed.newTabs.ROAD_LEGS;
  tables.ROAD_LEGS = legs.rows.map((row) =>
    Object.fromEntries(legs.headers.map((h, i) => [h, row[i]])),
  );
  delete tables.QUOTE_LOG;
  return tables;
}
