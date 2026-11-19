/**
 * Rail routing and pricing, ported one-to-one from the v7 Apps Script (Code.gs):
 * findPath_, dijkstra_, computeTransitMin_, findTariff_, calculateBaseFreight_,
 * buildSurchargeContext_, calculateSurcharges_, evaluateRule_, calculateInsurance_.
 * tests/unit/engine-parity.test.ts replays the logged quotes to keep the results identical.
 */
import type { Catalogue, Link, Service, Surcharge, Tariff, Terminal } from './catalogue';
import { toNumber } from './catalogue';

export interface PathResult {
  pathIds: string[];
  edges: Link[];
  distanceKm: number;
  countries: string[];
  borderCrossings: number;
  corridorTags: string[];
  mode: 'DOMESTIC' | 'INTERNATIONAL';
}

function borderKey(a: string, b: string): string {
  const x = a.trim().toUpperCase();
  const y = b.trim().toUpperCase();
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

export function findPath(
  cat: Catalogue,
  originId: string,
  destId: string,
  opts: { metric: 'DISTANCE' | 'TIME'; requireDG: boolean },
): PathResult | null {
  const byId = new Map(cat.terminals.map((t) => [t.id, t]));
  const origin = byId.get(originId);
  const dest = byId.get(destId);
  if (!origin || !dest || !origin.active || !dest.active) return null;
  if (opts.requireDG && (!origin.dgCapable || !dest.dgCapable)) return null;

  const borders = new Set(cat.connections.map((c) => borderKey(c.from, c.to)));
  const graph = new Map<string, Link[]>();
  for (const l of cat.links) {
    if (!l.active) continue;
    const a = byId.get(l.from);
    const b = byId.get(l.to);
    if (!a || !b || !a.active || !b.active) continue;
    if (opts.requireDG && (!a.dgCapable || !b.dgCapable)) continue;
    if (a.countryCode && b.countryCode && a.countryCode !== b.countryCode) {
      if (!borders.has(borderKey(a.countryCode, b.countryCode))) continue;
    }
    if (!graph.has(l.from)) graph.set(l.from, []);
    if (!graph.has(l.to)) graph.set(l.to, []);
    graph.get(l.from)!.push(l);
    graph.get(l.to)!.push({ ...l, from: l.to, to: l.from });
  }
  if (!graph.has(originId) || !graph.has(destId)) return null;

  const weight = (e: Link) =>
    opts.metric === 'TIME'
      ? e.timeMin > 0
        ? e.timeMin
        : (e.distanceKm / Math.max(1, cat.config.defaultSpeedKmH)) * 60
      : e.distanceKm;

  // Dijkstra with the same tie-breaking as the original (stable sort of a plain array queue).
  const dist = new Map<string, number>([[originId, 0]]);
  const prev = new Map<string, string>();
  const prevEdge = new Map<string, Link>();
  const visited = new Set<string>();
  const pq: { id: string; d: number }[] = [{ id: originId, d: 0 }];
  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const u = pq.shift()!.id;
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === destId) break;
    for (const e of graph.get(u) ?? []) {
      if (visited.has(e.to)) continue;
      const alt = (dist.get(u) ?? Infinity) + Math.max(0, toNumber(weight(e), 0));
      if (alt < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, alt);
        prev.set(e.to, u);
        prevEdge.set(e.to, e);
        pq.push({ id: e.to, d: alt });
      }
    }
  }
  if (!dist.has(destId)) return null;

  const pathIds: string[] = [];
  const edges: Link[] = [];
  for (let cur: string | undefined = destId; cur !== undefined; cur = prev.get(cur)) {
    pathIds.push(cur);
    const e = prevEdge.get(cur);
    if (e) edges.push(e);
  }
  pathIds.reverse();
  edges.reverse();

  const countries: string[] = [];
  let borderCrossings = 0;
  let prevCountry: string | null = null;
  for (const id of pathIds) {
    const c = byId.get(id)?.countryCode ?? '';
    if (!c) continue;
    if (!countries.includes(c)) countries.push(c);
    if (prevCountry && prevCountry !== c) borderCrossings++;
    prevCountry = c;
  }

  return {
    pathIds,
    edges,
    distanceKm: edges.reduce((a, e) => a + e.distanceKm, 0),
    countries,
    borderCrossings,
    corridorTags: [...new Set(edges.map((e) => e.corridorTag.trim()).filter(Boolean))],
    mode: countries.length > 1 ? 'INTERNATIONAL' : 'DOMESTIC',
  };
}

export function transitMinutes(edges: Link[], speedKmH: number): number {
  const speed = Math.max(1, speedKmH);
  return Math.round(
    edges.reduce((a, e) => a + (e.timeMin > 0 ? e.timeMin : (e.distanceKm / speed) * 60), 0),
  );
}

export function findTariff(cat: Catalogue, serviceId: string, utiType: string): Tariff | null {
  const rows = cat.tariffs.filter((t) => t.active);
  return (
    rows.find((t) => t.serviceId === serviceId && t.utiType === utiType) ??
    rows.find((t) => t.serviceId.toUpperCase() === 'ANY' && t.utiType === utiType) ??
    rows.find((t) => t.serviceId === serviceId && t.utiType.toUpperCase() === 'ANY') ??
    null
  );
}

export function baseFreight(tariff: Tariff, distanceKm: number, units: number): number {
  const one = Math.max(tariff.fixedFee + distanceKm * tariff.ratePerKm, tariff.minCharge);
  return tariff.applyPer === 'shipment' ? one : one * Math.max(1, units);
}

export type RuleContext = Record<string, string | number | string[]>;

export function evaluateCondition(cond: string, ctx: RuleContext): boolean {
  let op: string | null = null;
  let key = '';
  let value = '';
  for (const o of ['!=', '>=', '<=', '^=', '>', '<', '~', '=']) {
    const i = cond.indexOf(o);
    if (i > 0) {
      op = o;
      key = cond.slice(0, i).trim().toUpperCase();
      value = cond.slice(i + o.length).trim();
      break;
    }
  }
  if (!op || !key) return false;
  if (key === 'COUNTRY') key = 'COUNTRIES';
  if (key === 'CORRIDOR_TAG') key = 'CORRIDOR_TAGS';
  const v = ctx[key];
  const list = Array.isArray(v) ? v.map((x) => String(x).toUpperCase()) : null;
  const s = v === undefined || v === null ? '' : String(v).toUpperCase();
  const val = value.toUpperCase();
  if (op === '~') return list ? list.some((x) => x.includes(val)) : s.includes(val);
  if (op === '^=') return s.startsWith(val);
  if (op === '=' || op === '!=') {
    const eq = list ? list.includes(val) : s === val;
    return op === '=' ? eq : !eq;
  }
  const a = toNumber(v, NaN);
  const b = toNumber(value, NaN);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : a < b;
}

export function evaluateRule(rule: string, ctx: RuleContext): boolean {
  return rule
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .every((c) => evaluateCondition(c, ctx));
}

export interface SurchargeLine {
  code: string;
  label: string;
  amount: number;
  amountType: string;
  rule: string;
  applyPer: string;
}

/** Families where only the first matching row applies (the -DEFAULT row goes last). */
const FIRST_MATCH = ['DOCS-', 'TERM-TAX-O-', 'TERM-TAX-D-', 'RAIL-HDL-O-', 'RAIL-HDL-D-'];

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function applySurcharges(
  rows: Surcharge[],
  ctx: RuleContext,
): { lines: SurchargeLine[]; total: number } {
  const lines: SurchargeLine[] = [];
  const matched = new Set<string>();
  let total = 0;
  for (const r of rows) {
    if (!r.active || !r.rule) continue;
    const family = FIRST_MATCH.find((p) => r.code.startsWith(p)) ?? null;
    if (family && matched.has(family)) continue;
    if (!evaluateRule(r.rule, ctx)) continue;
    if (family) matched.add(family);
    let amount =
      r.amountType === 'percent' ? (toNumber(ctx.BASE_FREIGHT, 0) * r.amount) / 100 : r.amount;
    if (r.applyPer === 'unit') amount *= Math.max(1, toNumber(ctx.UNITS, 1));
    lines.push({
      code: r.code,
      label: r.label,
      amount: roundMoney(amount),
      amountType: r.amountType,
      rule: r.rule,
      applyPer: r.applyPer,
    });
    total += amount;
  }
  return { lines, total: roundMoney(total) };
}

export interface RailPricingInput {
  originTerminalId: string;
  destTerminalId: string;
  serviceId: string;
  utiType: string;
  units: number;
  weightKg: number;
  dg: boolean;
  adrClass: string;
  metric?: 'DISTANCE' | 'TIME';
  /** Declared goods value when insurance is requested, otherwise null. */
  insuredValue: number | null;
}

export interface RailPricing {
  path: PathResult;
  service: Service;
  tariff: Tariff;
  origin: Terminal;
  destination: Terminal;
  transitMin: number;
  baseFreight: number;
  surcharges: SurchargeLine[];
  surchargesTotal: number;
  insurance: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

export type RailError =
  'no-route' | 'service-unavailable' | 'service-no-dg' | 'no-tariff' | 'insurance-below-minimum';

/** Same steps and order as apiGenerateQuote in v7 (date check is in schedule.ts). */
export function priceRail(
  cat: Catalogue,
  input: RailPricingInput,
): { ok: true; value: RailPricing } | { ok: false; error: RailError } {
  const metric = input.metric ?? cat.config.defaultRoutingMetric;
  const path = findPath(cat, input.originTerminalId, input.destTerminalId, {
    metric,
    requireDG: input.dg,
  });
  if (!path) return { ok: false, error: 'no-route' };
  const service = cat.services.find((s) => s.id === input.serviceId && s.active);
  if (!service) return { ok: false, error: 'service-unavailable' };
  if (input.dg && !service.dgAllowed) return { ok: false, error: 'service-no-dg' };
  const tariff = findTariff(cat, input.serviceId, input.utiType);
  if (!tariff) return { ok: false, error: 'no-tariff' };

  const transitMin = transitMinutes(path.edges, service.speedKmH);
  const units = Math.max(1, Math.round(input.units));
  const base = baseFreight(tariff, path.distanceKm, units);
  const ctx: RuleContext = {
    MODE: path.mode,
    ORIGIN_COUNTRY: (path.countries[0] ?? '').toUpperCase(),
    DEST_COUNTRY: (path.countries[path.countries.length - 1] ?? '').toUpperCase(),
    COUNTRIES: path.countries,
    BORDER_CROSSINGS: path.borderCrossings,
    SERVICE_ID: service.id,
    SERVICE_LEVEL: service.level.toUpperCase(),
    UTI: input.utiType,
    DG: input.dg ? 'YES' : 'NO',
    ADR_CLASS: input.dg ? input.adrClass : '',
    DISTANCE_KM: path.distanceKm,
    TRANSIT_MIN: transitMin,
    UNITS: units,
    WEIGHT_KG: input.weightKg,
    CORRIDOR_TAGS: path.corridorTags.map((t) => t.toUpperCase()),
    BASE_FREIGHT: base,
    CURRENCY: cat.config.currency,
  };
  const s = applySurcharges(cat.surcharges, ctx);

  let insurance = 0;
  if (input.insuredValue !== null) {
    if (!input.insuredValue || input.insuredValue < cat.config.minInsuranceValue)
      return { ok: false, error: 'insurance-below-minimum' };
    if (cat.config.insuranceRate > 0) insurance = input.insuredValue * cat.config.insuranceRate;
  }
  const subtotal = base + s.total + insurance;
  const vatAmount = cat.config.vatRate > 0 ? subtotal * cat.config.vatRate : 0;
  const byId = (id: string) => cat.terminals.find((t) => t.id === id)!;
  return {
    ok: true,
    value: {
      path,
      service,
      tariff,
      origin: byId(input.originTerminalId),
      destination: byId(input.destTerminalId),
      transitMin,
      baseFreight: base,
      surcharges: s.lines,
      surchargesTotal: s.total,
      insurance,
      subtotal,
      vatRate: cat.config.vatRate,
      vatAmount,
      total: subtotal + vatAmount,
    },
  };
}
