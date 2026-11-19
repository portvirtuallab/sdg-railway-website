/**
 * End-to-end test of the Apps Script back end (apps-script/dist) on an in-memory copy of the v7
 * Sheet: set up v8, quote, re-quote, accept, list, capacity, and parity after the set-up.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import tables from '../fixtures/sheet-v7/tables.json';
import cases from '../fixtures/sheet-v7/quote-log-replay.json';
import { buildCatalogue, priceRail, addDays, localNow, type SheetTables } from '@/engine';
import { createSpreadsheet, loadAppsScript } from './fake-apps-script';

const dist = path.resolve(import.meta.dirname, '../../apps-script/dist');
const V7_LOG_HEADERS = [
  'QuoteRef', 'Timestamp', 'OriginTerminal', 'DestTerminal', 'OriginCountry', 'DestCountry', 'Mode',
  'PathTerminals', 'DistanceKm', 'TransitMin', 'ServiceID', 'ServiceLevel', 'UTIType', 'DG',
  'ADRClass', 'Units', 'WeightKg', 'BaseCost', 'SurchargesTotal', 'Insurance', 'TotalCost',
  'BreakdownJSON', 'ContactEmail', 'Company', 'Status', 'PdfFileId',
]; // prettier-ignore

function freshSheet() {
  const t = structuredClone(tables) as Record<string, Record<string, unknown>[]>;
  t.CONFIG!.push({ Parameter: 'PdfFolderId', Value: 'folder-123', Description: 'private' });
  const ss = createSpreadsheet(t);
  const log = ss.insertSheet('QUOTE_LOG');
  log.appendRow(V7_LOG_HEADERS);
  log.appendRow([
    'RWQ00000195',
    new Date(),
    'BAR-LAMASINATA',
    'CIV-FREIGHT',
    'IT',
    'IT',
    'DOMESTIC',
  ]);
  return ss;
}

const ready = addDays(localNow(new Date()).slice(0, 10), 10);
const request = (over: Record<string, unknown> = {}) => ({
  pin: '4821',
  requester: 'Ana Ruiz',
  shipper: 'Martorell parts supplier',
  consignee: 'Atessa assembly plant',
  incoterm: 'DAP',
  origin: { kind: 'door', id: 'DOOR-MARTORELL' },
  destination: { kind: 'door', id: 'DOOR-ATESSA' },
  readyDate: ready,
  serviceId: 'STD-RAIL',
  routingMetric: 'DISTANCE',
  cargoDescription: 'Automotive parts',
  grossWeightKg: 18000,
  packages: 20,
  packageCm: null,
  utiType: 'CONTAINER-40',
  quantity: 1,
  dangerousGoods: null,
  temperatureC: null,
  insuranceValue: null,
  ...over,
});

beforeAll(() => {
  execFileSync(process.execPath, ['scripts/apps-script/build.mjs'], {
    cwd: path.resolve(import.meta.dirname, '../..'),
  });
}, 60_000);

describe('Apps Script v8 back end', () => {
  it('sets up the Sheet without deleting anything, and only once', () => {
    const ss = freshSheet();
    const before = ss.sheets.get('LINKS')!.rows.length;
    const gs = loadAppsScript(dist, ss);
    const first = gs.run('setupV8') as string;
    expect(first).toContain('SURCHARGES: header A1 set to SurchargeCode');
    expect(first).toContain('New tab TEAMS');
    expect(ss.sheets.get('SURCHARGES')!.cell(1, 1)).toBe('SurchargeCode');
    expect(ss.sheets.get('LINKS')!.rows.length).toBe(before);
    expect(ss.sheets.get('QUOTE_LOG')!.rows[0]).toContain('TeamPIN');
    expect(ss.sheets.get('SCHEDULES')!.rows[0]).toContain('SlotsPerDeparture');
    expect(gs.run('setupV8')).toContain('Nothing to add');
  });

  it('keeps v7 prices identical once the surcharge codes are restored', () => {
    const ss = freshSheet();
    const gs = loadAppsScript(dist, ss);
    gs.run('setupV8');
    const cat = buildCatalogue(gs.get('catalogue').tables as SheetTables);
    expect(
      cat.surcharges.find((s) => s.label.startsWith('Documentation processing (Italy)'))!.code,
    ).toBe('DOCS-IT');
    for (const c of cases.slice(-100)) {
      const r = priceRail(cat, {
        originTerminalId: c.origin, destTerminalId: c.dest, serviceId: c.serviceId, utiType: c.uti,
        units: c.units, weightKg: c.weightKg, dg: c.dg, adrClass: c.adr,
        metric: c.metric === 'TIME' ? 'TIME' : 'DISTANCE',
        insuredValue: c.insurance > 0 ? c.insurance / cat.config.insuranceRate : null,
      }); // prettier-ignore
      expect(r.ok && r.value.total).toBeCloseTo(c.total, 2);
    }
  });

  it('publishes the catalogue without private settings or teams', () => {
    const ss = freshSheet();
    const gs = loadAppsScript(dist, ss);
    gs.run('setupV8');
    const { tables: pub } = gs.get('catalogue');
    expect(pub.ROAD_LEGS.length).toBe(6);
    expect(pub.TEAMS).toBeUndefined();
    expect(JSON.stringify(pub.CONFIG)).not.toContain('folder-123');
  });

  it('runs the whole flow: quote, re-quote, accept, orders, list', () => {
    const ss = freshSheet();
    const gs = loadAppsScript(dist, ss);
    gs.run('setupV8');

    expect(gs.post({ action: 'quote', request: request({ pin: '1111' }) }).errors[0].field).toBe(
      'pin',
    );

    const opts = gs.post({ action: 'options', request: request() }).options;
    expect(opts.map((o: { serviceId: string }) => o.serviceId)).toEqual([
      'STD-RAIL',
      'EXP-RAIL',
      'GRN-RAIL',
    ]);

    const q1 = gs.post({ action: 'quote', request: request() });
    expect(q1.errors).toBeUndefined();
    expect(q1.quote.ref).toBe('RWQ00000196'); // continues the v7 numbering
    expect(q1.quote.route.originTerminal).toBe('BCN-MORROT');
    expect(q1.quote.route.destinationTerminal).toBe('CIV-FREIGHT');
    expect(q1.quote.lines.map((l: { id: string }) => l.id)).toContain('origin-road');
    expect(q1.pdfUrl).toContain('RWQ00000196.pdf');
    expect(gs.files[0]!.content).toContain('RWQ00000196 v1');

    const q2 = gs.post({
      action: 'quote',
      request: request({ quantity: 2 }),
      requote: { ref: 'RWQ00000196' },
    });
    expect(q2.quote.ref).toBe('RWQ00000196');
    expect(q2.quote.version).toBe(2);
    const log = ss.sheets.get('QUOTE_LOG')!.objects();
    expect(
      log.filter((r) => r.QuoteRef === 'RWQ00000196').map((r) => `${r.Version}:${r.Status}`),
    ).toEqual(['1:SUPERSEDED', '2:ISSUED']);
    expect(log.at(-1)!.TeamPIN).toBe('4821');
    expect(log.at(-1)!.Company).toBe('Futura Cargo – Group B');

    expect(
      gs.post({ action: 'accept', pin: '4821', ref: 'RWQ00000196', version: 1 }).errors[0].message,
    ).toMatch(/superseded/);
    const acc = gs.post({ action: 'accept', pin: '4821', ref: 'RWQ00000196', version: 2 });
    expect(acc.booking.ref).toBe('RWB00000001');
    expect(acc.booking.status).toBe('confirmed');
    expect(acc.handoff.readyForErp).toBe(true);
    expect(ss.sheets.get('QUOTE_LOG')!.objects().at(-1)!.BookingRef).toBe('RWB00000001');
    expect(
      gs.post({ action: 'accept', pin: '4821', ref: 'RWQ00000196', version: 2 }).errors[0].message,
    ).toMatch(/accepted/);

    expect(
      gs.post({ action: 'accept', pin: '1357', ref: 'RWQ00000196', version: 2 }).errors[0].message,
    ).toMatch(/not found/);
    expect(
      gs.post({
        action: 'orders',
        pin: '4821',
        bookingRef: 'RWB00000001',
        orders: { deliveryDriver: 'J. Soler' },
      }).ok,
    ).toBe(true);

    const mine = gs.post({ action: 'list', pin: '4821' });
    expect(
      mine.quotes.map((q: { version: number; status: string }) => `${q.version}:${q.status}`),
    ).toEqual(['1:superseded', '2:accepted']);
    expect(mine.bookings[0].terminalOrders.deliveryDriver).toBe('J. Soler');
    expect(mine.bookings[0].train.departure).toBe(acc.booking.train.departure);
    expect(gs.post({ action: 'list', pin: '1357' }).quotes).toHaveLength(0);
    expect(gs.post({ action: 'list', pin: '9000' }).quotes).toHaveLength(2);
    expect(
      ss.sheets
        .get('HISTORY')!
        .objects()
        .map((r) => r.Action),
    ).toEqual(['QUOTE', 'QUOTE', 'ACCEPT', 'ORDERS']);
  });

  it('moves the next team to a later train when a departure is full', () => {
    const ss = freshSheet();
    const gs = loadAppsScript(dist, ss);
    gs.run('setupV8');
    const sched = ss.sheets.get('SCHEDULES')!;
    const slotsCol = sched.rows[0]!.indexOf('SlotsPerDeparture') + 1;
    for (let r = 2; r <= sched.getLastRow(); r++) sched.set(r, slotsCol, 2);
    gs.run('clearServerCacheV8');

    const a = gs.post({ action: 'quote', request: request({ quantity: 2 }) }).quote;
    gs.post({ action: 'accept', pin: '4821', ref: a.ref, version: 1 });
    const b = gs.post({ action: 'quote', request: request({ pin: '1357' }) }).quote;
    expect(b.train.status).toBe('proposed');
    expect(b.train.departure > a.train.departure).toBe(true);
    expect(b.ref).not.toBe(a.ref);
  });
});
