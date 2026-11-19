import { describe, expect, it } from 'vitest';
import catalogue from '@/data/demo-catalogue.json';
import {
  acceptQuote,
  buildQuote,
  capacityKey,
  effectiveStatus,
  resolveLane,
  terminalHandling,
  validateRequest,
} from '@/features/quote/engine';
import { buildHandoff } from '@/features/quote/handoff';
import type { QuoteRequest } from '@/features/quote/types';

const cat = catalogue;
const NOW = new Date(2026, 10, 19, 10, 0); // Thu 19 Nov 2026, 10:00

/** The brief's teaching case: Toledo → Barcelona Morrot → Civitavecchia → Atessa, one 45 ft ITU. */
const toledoAtessa = (over: Partial<QuoteRequest> = {}): QuoteRequest => ({
  pin: '4821',
  requester: 'Alex Martín',
  shipper: 'Toledo automotive parts manufacturer',
  consignee: 'Atessa assembly plant',
  incoterm: 'DAP',
  origin: { kind: 'door', id: 'door-toledo' },
  destination: { kind: 'door', id: 'door-atessa' },
  readyDate: '2026-11-23',
  cargoDescription: 'Automotive parts',
  grossWeightKg: 18000,
  packages: 24,
  packageCm: { length: 120, width: 100, height: 160 },
  ituCode: '45HC',
  quantity: 1,
  dangerousGoods: null,
  temperatureC: null,
  insuranceValue: null,
  ...over,
});
const quote = (req: QuoteRequest, usage = {}) =>
  buildQuote(cat, req, { ref: 'RWQ-2026-00001', version: 1, now: NOW, usage });

describe('worked example (brief §5)', () => {
  const q = quote(toledoAtessa());

  it('reproduces the illustrative arithmetic: €890 integrated cost', () => {
    expect(q.lines.map((l) => [l.id, l.amount])).toEqual([
      ['origin-road', 180],
      ['origin-terminal', 45],
      ['rail', 420],
      ['destination-terminal', 45],
      ['destination-road', 160],
      ['management', 40],
    ]);
    expect(q.total).toBe(890);
  });

  it('routes via Barcelona Morrot and Civitavecchia on the teaching lane', () => {
    expect(q.laneId).toBe('BCN-CIV');
    expect(q.route).toMatchObject({
      originTerminal: 'es-barcelona',
      destinationTerminal: 'it-civitavecchia',
    });
    expect(q.legs.map((l) => l.scope)).toEqual([
      'included',
      'included',
      'included',
      'included',
      'included',
    ]);
  });

  it('proposes the first train after the road leg, before cut-off', () => {
    // Ready Mon 23 Nov 08:00 + 24 h road = Tue 24 Nov 08:00 at the terminal; train Tue 20:00, cut-off 08:00.
    expect(q.train).toMatchObject({
      status: 'proposed',
      trainId: 'SDG 41501',
      departure: '2026-11-24T20:00',
      cutOff: '2026-11-24T08:00',
      arrival: '2026-11-25T16:00',
    });
    expect(q.deliveryEstimate).toBe('2026-11-26T16:00');
  });

  it('has an RWQ reference, a version and an expiry within the catalogue validity', () => {
    expect(q.ref).toMatch(/^RWQ-/);
    expect(q.version).toBe(1);
    expect(q.expiresAt).toBe('2026-12-03T23:59');
  });
});

describe('prices', () => {
  it('total always equals the line items, with no duplicate or empty charges', () => {
    for (const req of [
      toledoAtessa(),
      toledoAtessa({ quantity: 3, insuranceValue: 50000 }),
      toledoAtessa({ ituCode: '40RF', temperatureC: 4 }),
    ]) {
      const q = quote(req);
      expect(new Set(q.lines.map((l) => l.id)).size).toBe(q.lines.length);
      expect(q.lines.every((l) => l.amount > 0)).toBe(true);
      expect(q.total).toBeCloseTo(
        q.lines.reduce((a, l) => a + l.amount, 0),
        2,
      );
    }
  });

  it('takes terminal handling from exactly one source (country rate replaces the default)', () => {
    expect(terminalHandling(cat, 'es-madrid')).toEqual({ amount: 45, source: 'default rate' });
    expect(terminalHandling(cat, 'pt-poceirao')).toEqual({ amount: 50, source: 'PT country rate' });
    const q = quote(
      toledoAtessa({
        origin: { kind: 'door', id: 'door-toledo' },
        destination: { kind: 'door', id: 'door-setubal' },
        ituCode: '40DV',
        readyDate: '2026-11-23',
      }),
    );
    expect(q.laneId).toBe('MAD-POC');
    expect(q.lines.filter((l) => l.leg === 'destination-terminal')).toHaveLength(1);
    expect(q.lines.find((l) => l.leg === 'destination-terminal')?.unitPrice).toBe(50);
  });

  it('marks road legs excluded for terminal-to-terminal and charges no road haulage', () => {
    const q = quote(
      toledoAtessa({
        origin: { kind: 'terminal', id: 'es-barcelona' },
        destination: { kind: 'terminal', id: 'it-civitavecchia' },
      }),
    );
    expect(q.legs.find((l) => l.kind === 'origin-road')?.scope).toBe('excluded');
    expect(q.legs.find((l) => l.kind === 'destination-road')?.scope).toBe('excluded');
    expect(q.lines.some((l) => l.leg === 'origin-road' || l.leg === 'destination-road')).toBe(
      false,
    );
    expect(q.exclusions).toContain('Origin road haulage');
    expect(q.total).toBe(45 + 420 + 45 + 40);
  });
});

describe('validation errors never produce a false offer', () => {
  const codes = (req: QuoteRequest) => validateRequest(cat, req, NOW).map((e) => e.code);

  it('rejects an invalid PIN', () => {
    expect(codes(toledoAtessa({ pin: '0000' }))).toContain('invalid-pin');
  });
  it('rejects an uncovered route', () => {
    expect(codes(toledoAtessa({ destination: { kind: 'door', id: 'door-corbas' } }))).toEqual([
      'route-not-covered',
    ]);
    expect(
      resolveLane(cat, { kind: 'door', id: 'door-toledo' }, { kind: 'door', id: 'door-corbas' }),
    ).toBeNull();
  });
  it('rejects an incompatible ITU', () => {
    expect(codes(toledoAtessa({ ituCode: 'TRLR', grossWeightKg: 20000 }))).toEqual([
      'itu-incompatible',
    ]);
  });
  it('rejects dangerous goods on a lane or terminal that does not accept them', () => {
    expect(
      codes(
        toledoAtessa({
          origin: { kind: 'terminal', id: 'es-barcelona' },
          destination: { kind: 'terminal', id: 'it-verona' },
          dangerousGoods: { ridClass: '3', unNumber: '1203' },
        }),
      ),
    ).toEqual(['dangerous-goods-not-accepted']);
  });
  it('rejects weight above the ITU limit and a missing reefer temperature', () => {
    expect(codes(toledoAtessa({ grossWeightKg: 999999 }))).toContain('weight-exceeded');
    expect(codes(toledoAtessa({ ituCode: '40RF' }))).toContain('temperature-required');
  });
  it('rejects past dates and dates beyond the catalogue', () => {
    expect(codes(toledoAtessa({ readyDate: '2026-11-19' }))).toContain('date-invalid');
    expect(codes(toledoAtessa({ readyDate: '2027-06-01' }))).toContain('date-invalid');
  });
  it('throws instead of pricing an invalid request', () => {
    expect(() => quote(toledoAtessa({ pin: '0000' }))).toThrow();
  });
});

describe('quote, acceptance and booking', () => {
  it('keeps the quote and booking references distinct and linked', () => {
    const q = quote(toledoAtessa());
    const b = acceptQuote(cat, q, { bookingRef: 'RWB-2026-00001', now: NOW, usage: {} });
    expect(b).toMatchObject({
      ref: 'RWB-2026-00001',
      quoteRef: q.ref,
      quoteVersion: 1,
      status: 'confirmed',
    });
    expect(b.ref).not.toBe(q.ref);
    expect(b.train.trainId).toBe('SDG 41501');
  });

  it('shows a pending train when capacity is full, and blocks the ERP handoff', () => {
    const q = quote(toledoAtessa());
    const full = { [capacityKey('SDG 41501', '2026-11-24')]: 12 };
    const b = acceptQuote(cat, q, { bookingRef: 'RWB-2026-00002', now: NOW, usage: full });
    expect(b.status).toBe('pending-train');
    expect(b.train.departure).toBeNull();
    const h = buildHandoff(cat, q, b);
    expect(h.readyForErp).toBe(false);
    expect(h.blockedReason).toMatch(/pending/);
  });

  it('proposes the next departure with free slots when one is full', () => {
    const q = quote(toledoAtessa(), { [capacityKey('SDG 41501', '2026-11-24')]: 12 });
    expect(q.train.departure).toBe('2026-11-27T20:00');
  });

  it('cannot accept an expired quote', () => {
    const q = quote(toledoAtessa());
    const later = new Date(2026, 11, 10, 9, 0);
    expect(effectiveStatus(q, later)).toBe('expired');
    expect(() => acceptQuote(cat, q, { bookingRef: 'RWB-X', now: later, usage: {} })).toThrow(
      /expired/,
    );
  });

  it('exports a complete Click & Cargo handoff once the train is confirmed', () => {
    const q = quote(toledoAtessa());
    const b = acceptQuote(cat, q, { bookingRef: 'RWB-2026-00003', now: NOW, usage: {} });
    const h = buildHandoff(cat, q, b);
    expect(h).toMatchObject({
      readyForErp: true,
      references: { quote: q.ref, quoteVersion: 1, booking: 'RWB-2026-00003' },
      parties: {
        customer: 'Futura Cargo – Group B',
        intermodalCarrier: 'SDG Railway',
        roadHaulier: 'Play Haulier',
      },
      train: { id: 'SDG 41501', status: 'proposed', departure: '2026-11-24T20:00' },
      total: 890,
    });
  });
});
