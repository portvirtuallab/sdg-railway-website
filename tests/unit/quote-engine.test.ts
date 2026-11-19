import snapshot from '@/data/sheet-snapshot.json';
import {
  acceptQuote,
  addHours,
  buildCatalogue,
  buildHandoff,
  buildQuote,
  capacityKey,
  checkDate,
  serviceOptions,
  validateRequest,
  type QuoteRequest,
  type SheetTables,
} from '@/engine';

const tables = snapshot.tables as unknown as SheetTables;
const cat = buildCatalogue(tables);
const NOW = new Date(2026, 10, 19, 10, 0); // Thu 19 Nov 2026

const base: QuoteRequest = {
  pin: '4821',
  requester: 'Futura Cargo operations desk',
  shipper: 'Toledo automotive parts manufacturer',
  consignee: 'Atessa assembly plant',
  incoterm: 'DAP',
  origin: { kind: 'door', id: 'DOOR-TOLEDO' },
  destination: { kind: 'door', id: 'DOOR-ATESSA' },
  readyDate: '2026-11-24',
  serviceId: 'STD-RAIL',
  routingMetric: 'DISTANCE',
  cargoDescription: 'Automotive parts',
  grossWeightKg: 18000,
  packages: 24,
  packageCm: { length: 120, width: 100, height: 160 },
  utiType: 'CONTAINER-40',
  quantity: 1,
  dangerousGoods: null,
  temperatureC: null,
  insuranceValue: null,
};
const quote = (over: Partial<QuoteRequest> = {}, usage = {}) =>
  buildQuote(
    cat,
    { ...base, ...over },
    { ref: 'RWQ00000001', version: 1, now: NOW, usage, team: 'Team' },
  );
const ok = (r: ReturnType<typeof quote>) => {
  if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(' '));
  return r.quote;
};

describe('door-to-door quotation (worked example)', () => {
  const q = ok(quote());

  it('adds the Play Haulier legs to the rail price of the Sheet', () => {
    expect(q.lines.find((l) => l.id === 'origin-road')).toMatchObject({ amount: 180 });
    expect(q.lines.find((l) => l.id === 'destination-road')).toMatchObject({ amount: 160 });
    expect(q.roadTotal).toBe(340);
    expect(q.total).toBeCloseTo(q.rail.baseFreight + q.rail.surchargesTotal + 340, 2);
    const sum = q.lines.reduce((a, l) => a + l.amount, 0);
    expect(sum).toBeCloseTo(q.total, 2);
  });

  it('routes Barcelona → Civitavecchia through the LINKS graph', () => {
    expect(q.route.originTerminal).toBe('BCN-MORROT');
    expect(q.route.destinationTerminal).toBe('CIV-FREIGHT');
    expect(q.route.mode).toBe('INTERNATIONAL');
    expect(q.route.countries).toEqual(['ES', 'FR', 'IT']);
  });

  it('proposes the first Standard departure after the road leg and cut-off', () => {
    // Ready Tue 24 at 08:00 + 24 h road → at Barcelona Wed 25 08:00; cut-off 12 h before.
    expect(q.train).toMatchObject({ status: 'proposed', departure: '2026-11-26T08:00', cutOff: '2026-11-25T20:00' });
    expect(q.deliveryEstimate).toBe(addHours(q.train.arrival!, 24));
  });

  it('puts terminal charges on the terminal legs', () => {
    expect(q.lines.find((l) => l.label.startsWith('Terminal taxes origin'))!.leg).toBe('origin-terminal');
    expect(q.lines.find((l) => l.label.startsWith('Rail handling destination'))!.leg).toBe('destination-terminal');
    expect(q.lines.find((l) => l.label.startsWith('Documentation'))!.leg).toBe('extra');
  });
}); // prettier-ignore

describe('terminal-to-terminal and coverage', () => {
  it('excludes the road legs when the team uses the terminals', () => {
    const q = ok(quote({ origin: { kind: 'terminal', id: 'BAR-LAMASINATA' }, destination: { kind: 'terminal', id: 'CIV-FREIGHT' }, serviceId: 'GRN-RAIL' }));
    expect(q.roadTotal).toBe(0);
    expect(q.legs.find((l) => l.kind === 'origin-road')!.scope).toBe('excluded');
    expect(q.total).toBeCloseTo(778.9, 2); // same as RWQ00000195 in the v7 log
  });

  it('refuses a route between separate networks', () => {
    const r = quote({ origin: { kind: 'terminal', id: 'BCN-MORROT' }, destination: { kind: 'terminal', id: 'CAI-TEBBIN' } });
    expect(!r.ok && r.errors[0]!.code).toBe('route-not-covered');
  });
}); // prettier-ignore

describe('dangerous goods', () => {
  const dg = { dangerousGoods: { adrClass: '3', unNumber: '1203' } };

  it('is refused on services without dangerous goods', () => {
    const errs = validateRequest(cat, { ...base, ...dg, serviceId: 'EXP-RAIL' }, NOW);
    expect(errs.map((e) => e.code)).toContain('dangerous-goods-not-accepted');
  });

  it('only routes through terminals that handle dangerous goods and adds the class surcharge', () => {
    const q = ok(quote(dg));
    for (const id of q.route.pathIds) expect(cat.terminals.find((t) => t.id === id)!.dgCapable, id).toBe(true);
    expect(q.lines.map((l) => l.label)).toContain('ADR Class 3 supplement');
  });

  it('marks the other services as not available in the comparison', () => {
    const opts = serviceOptions(cat, { ...base, ...dg }, {});
    expect(opts.find((o) => o.serviceId === 'STD-RAIL')!.total).not.toBeNull();
    expect(opts.find((o) => o.serviceId === 'EXP-RAIL')!.error).toMatch(/dangerous/i);
  });
}); // prettier-ignore

describe('validation', () => {
  const codes = (over: Partial<QuoteRequest>) => validateRequest(cat, { ...base, ...over }, NOW).map((e) => `${e.field}:${e.code}`);
  it('checks the case data', () => {
    expect(codes({ pin: '12' })).toContain('pin:required');
    expect(codes({ incoterm: '' })).toContain('incoterm:required');
    expect(codes({ readyDate: '2026-11-19' })).toContain('readyDate:date-invalid');
  });
  it('checks weight, reefer temperature and insurance against the Sheet', () => {
    expect(codes({ grossWeightKg: 30000 })).toContain('grossWeightKg:weight-exceeded'); // 26 700 kg max
    expect(codes({ utiType: 'REEFER-40' })).toContain('temperatureC:temperature-required');
    expect(codes({ insuranceValue: 50 })).toContain('insuranceValue:insurance-below-minimum');
    expect(codes({})).toEqual([]);
  });
}); // prettier-ignore

describe('capacity, booking and handoff', () => {
  const first = ok(quote());
  const full = { [first.train.trainId]: cat.config.defaultSlotsPerDeparture };

  it('moves to the next departure when the proposed one is full', () => {
    const q = ok(quote({}, full));
    expect(q.train.status).toBe('proposed');
    expect(q.train.departure! > first.train.departure!).toBe(true);
  });

  it('confirms the booking while there is room, otherwise leaves the train pending', () => {
    const b = acceptQuote(cat, first, { bookingRef: 'RWB00000001', now: NOW, usage: {} });
    expect(b).toMatchObject({ status: 'confirmed', quoteRef: 'RWQ00000001' });
    const late = acceptQuote(cat, first, { bookingRef: 'RWB00000002', now: NOW, usage: full });
    expect(late.status).toBe('pending-train');
  });

  it('blocks the ERP handoff until the train is confirmed', () => {
    expect(buildHandoff(cat, first, null).readyForErp).toBe(false);
    const b = acceptQuote(cat, first, { bookingRef: 'RWB00000001', now: NOW, usage: {} });
    const h = buildHandoff(cat, { ...first, status: 'accepted' }, b);
    expect(h).toMatchObject({ readyForErp: true, references: { booking: 'RWB00000001' }, cargo: { uti: 'CONTAINER-40' } });
    expect(h.route.path[0]).toBe('BCN-MORROT');
  });

  it('uses the capacity key service | origin terminal | date', () => {
    expect(first.train.trainId).toBe(capacityKey('STD-RAIL', 'BCN-MORROT', '2026-11-26'));
  });
}); // prettier-ignore

describe('route-specific timetables (SCHEDULES "SERVICE:ES→IT")', () => {
  it('prefers the most specific row', () => {
    const t = structuredClone(tables);
    t.SCHEDULES!.push({ ServiceID: 'STD-RAIL:ES→IT', DepartureDays: 'Fri', DepartureTime: '06:30', BlockedDates: '', Notes: 'Iberia–Italy shuttle' });
    const c = buildCatalogue(t);
    expect(checkDate(c, 'STD-RAIL', '2026-11-26', 'ES', 'IT')).toMatchObject({ available: false, reason: 'Operates: Fri' });
    expect(checkDate(c, 'STD-RAIL', '2026-11-27', 'ES', 'IT')).toMatchObject({ available: true, departureTime: '06:30' });
    expect(checkDate(c, 'STD-RAIL', '2026-11-26', 'ES', 'FR').available).toBe(true);
  });
}); // prettier-ignore
