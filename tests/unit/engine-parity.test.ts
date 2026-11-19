/**
 * Replays the quotes logged by the v7 Apps Script (QUOTE_LOG, anonymised) against the shared
 * engine and the current Sheet data. Quotes made before a tariff, link or surcharge was edited
 * cannot match; every quote since the data was last changed must match to the cent.
 */
import tables from '../fixtures/sheet-v7/tables.json';
import cases from '../fixtures/sheet-v7/quote-log-replay.json';
import { buildCatalogue, type SheetTables } from '@/engine/catalogue';
import { priceRail } from '@/engine/rail';

const cat = buildCatalogue(tables as unknown as SheetTables);

function replay(c: (typeof cases)[number]) {
  const insuredValue = c.insurance > 0 ? c.insurance / cat.config.insuranceRate : null;
  const r = priceRail(cat, {
    originTerminalId: c.origin,
    destTerminalId: c.dest,
    serviceId: c.serviceId,
    utiType: c.uti,
    units: c.units,
    weightKg: c.weightKg,
    dg: c.dg,
    adrClass: c.adr,
    metric: c.metric === 'TIME' ? 'TIME' : 'DISTANCE',
    insuredValue,
  });
  return r.ok ? r.value : null;
}

const results = cases.map((c) => ({ c, r: replay(c) }));
const matches = (x: (typeof results)[number]) =>
  x.r !== null && Math.abs(x.r.total - x.c.total) < 0.005;

describe('engine parity with the v7 Apps Script', () => {
  it('matches every quote logged since the data last changed', () => {
    // Index of the last mismatch: everything after it was priced with today's data.
    const lastMismatch = results.findLastIndex((x) => !matches(x));
    const recent = results.slice(lastMismatch + 1);
    // 100 quotes from RWQ00000103 (13 May 2026) on; older ones used the previous tariff table.
    expect(recent.length).toBeGreaterThanOrEqual(100);
    for (const x of recent) {
      expect(x.r!.path.pathIds.join(' > ')).toBe(x.c.path);
      expect(x.r!.total).toBeCloseTo(x.c.total, 2);
    }
  });
});
