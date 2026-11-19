/**
 * Door-to-door intermodal quotation built on the Sheet data:
 * Play Haulier road leg (ROAD_LEGS) → rail (rail.ts: LINKS, TARIFFS, SURCHARGES) → road leg,
 * with the first train that has room (schedule.ts: SCHEDULES).
 */
import type { Catalogue, RoadLeg, Terminal } from './catalogue';
import { priceRail, roundMoney, type RailPricing, type SurchargeLine } from './rail';
import { findDeparture, type CapacityUsage, type TrainProposal } from './schedule';
import { addDays, addHours, localNow } from './time';

export const INCOTERMS = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] as const;
export type Incoterm = (typeof INCOTERMS)[number];

export type Place = { kind: 'door'; id: string } | { kind: 'terminal'; id: string };

export interface QuoteRequest {
  pin: string;
  requester: string;
  shipper: string;
  consignee: string;
  incoterm: Incoterm | '';
  origin: Place;
  destination: Place;
  /** Date the loading unit is ready at the origin (YYYY-MM-DD). */
  readyDate: string;
  serviceId: string;
  routingMetric: 'DISTANCE' | 'TIME';
  cargoDescription: string;
  grossWeightKg: number;
  packages: number;
  /** Optional package dimensions in cm, used to estimate the volume. */
  packageCm: { length: number; width: number; height: number } | null;
  utiType: string;
  quantity: number;
  dangerousGoods: { adrClass: string; unNumber: string } | null;
  temperatureC: number | null;
  insuranceValue: number | null;
}

export type ErrorCode =
  | 'required'
  | 'route-not-covered'
  | 'service-unavailable'
  | 'weight-exceeded'
  | 'volume-exceeded'
  | 'dangerous-goods-not-accepted'
  | 'temperature-required'
  | 'insurance-below-minimum'
  | 'date-invalid';

export interface QuoteError {
  field: keyof QuoteRequest | 'route';
  code: ErrorCode;
  message: string;
}

export type LegKind =
  'origin-road' | 'origin-terminal' | 'rail' | 'destination-terminal' | 'destination-road';
export type Scope = 'included' | 'excluded' | 'pending';

export interface QuoteLeg {
  kind: LegKind;
  from: string;
  to: string;
  provider: string;
  scope: Scope;
  note: string;
}

export interface QuoteLine {
  id: string;
  leg: LegKind | 'extra';
  label: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type QuoteStatus = 'issued' | 'accepted' | 'expired' | 'superseded';

export interface Quote {
  ref: string;
  version: number;
  status: QuoteStatus;
  issuedAt: string;
  expiresAt: string;
  team: string;
  request: QuoteRequest;
  route: {
    originTerminal: string;
    destinationTerminal: string;
    pathIds: string[];
    countries: string[];
    mode: 'DOMESTIC' | 'INTERNATIONAL';
    borderCrossings: number;
    distanceKm: number;
    transitMin: number;
  };
  service: { id: string; name: string; level: string };
  legs: QuoteLeg[];
  lines: QuoteLine[];
  /** Rail figures as the v7 log stores them (base freight, Sheet surcharges, insurance). */
  rail: { baseFreight: number; surchargesTotal: number; insurance: number; vatAmount: number };
  roadTotal: number;
  total: number;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  conditions: string[];
  train: TrainProposal;
  /** Estimated delivery at the destination (door or terminal), or null while the train is pending. */
  deliveryEstimate: string | null;
}

export interface TerminalOrders {
  deliveryDriver: string;
  deliveryVehicle: string;
  collectionDriver: string;
  collectionVehicle: string;
}

export interface Booking {
  ref: string;
  quoteRef: string;
  quoteVersion: number;
  status: 'confirmed' | 'pending-train';
  createdAt: string;
  train: TrainProposal;
  terminalOrders: TerminalOrders;
}

// ---------------------------------------------------------------- lookups

export function terminalById(cat: Catalogue, id: string): Terminal | undefined {
  return cat.terminals.find((t) => t.id === id);
}

export function placeName(cat: Catalogue, p: Place): string {
  if (p.kind === 'door') return cat.doors.find((d) => d.id === p.id)?.name ?? p.id;
  const t = terminalById(cat, p.id);
  return t ? `${t.city} – ${t.name}` : p.id;
}

function roadLeg(cat: Catalogue, placeId: string, terminalId: string): RoadLeg | undefined {
  return cat.roadLegs.find((r) => r.active && r.placeId === placeId && r.terminalId === terminalId);
}

function candidateTerminals(cat: Catalogue, p: Place): string[] {
  if (p.kind === 'terminal') return [p.id];
  return cat.roadLegs.filter((r) => r.active && r.placeId === p.id).map((r) => r.terminalId);
}

// ---------------------------------------------------------------- validation

export function validateRequest(cat: Catalogue, req: QuoteRequest, now: Date): QuoteError[] {
  const errs: QuoteError[] = [];
  const need = (field: QuoteError['field'], ok: unknown, message: string) => {
    if (!ok) errs.push({ field, code: 'required', message });
  };
  need('pin', /^\d{4}$/.test(req.pin), 'Enter your team’s 4-digit PVL PIN.');
  need('requester', req.requester.trim(), 'Enter the name of the person requesting the quote.');
  need('shipper', req.shipper.trim(), 'Enter the shipper (from your Click & Cargo case).');
  need('consignee', req.consignee.trim(), 'Enter the consignee (from your Click & Cargo case).');
  need(
    'incoterm',
    (INCOTERMS as readonly string[]).includes(req.incoterm),
    'Choose the Incoterm of the case.',
  );
  need('origin', req.origin.id, 'Choose where the cargo is collected.');
  need('destination', req.destination.id, 'Choose where the cargo is delivered.');
  if (req.origin.id && req.origin.kind === req.destination.kind && req.origin.id === req.destination.id)
    errs.push({ field: 'destination', code: 'required', message: 'Origin and destination must be different.' });
  need('cargoDescription', req.cargoDescription.trim(), 'Describe the cargo, for example “Automotive parts”.');

  const today = localNow(now).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.readyDate))
    need('readyDate', false, 'Choose the date the cargo is ready.');
  else if (req.readyDate <= today)
    errs.push({ field: 'readyDate', code: 'date-invalid', message: 'The ready date must be after today.' });
  else if (req.readyDate > addDays(today, 180))
    errs.push({ field: 'readyDate', code: 'date-invalid', message: 'Quotes are given for cargo ready within the next 6 months.' });

  const service = cat.services.find((s) => s.id === req.serviceId && s.active);
  if (!service) need('serviceId', false, 'Choose a rail service.');

  const uti = cat.utiTypes.find((u) => u.code === req.utiType);
  if (!uti) need('utiType', false, 'Choose a loading unit (UTI).');
  if (!Number.isInteger(req.quantity) || req.quantity < 1 || req.quantity > 20)
    errs.push({ field: 'quantity', code: 'required', message: 'Enter between 1 and 20 loading units.' });
  if (!(req.grossWeightKg > 0)) need('grossWeightKg', false, 'Enter the total gross weight in kilograms.');
  if (!Number.isInteger(req.packages) || req.packages < 1)
    need('packages', false, 'Enter the number of packages (at least 1).');

  if (uti && req.quantity >= 1) {
    if (uti.maxGrossKg && req.grossWeightKg > uti.maxGrossKg * req.quantity)
      errs.push({
        field: 'grossWeightKg',
        code: 'weight-exceeded',
        message: `${req.quantity} × ${uti.name} carry at most ${(uti.maxGrossKg * req.quantity).toLocaleString('en-GB')} kg. Reduce the weight or add units.`,
      });
    if (uti.volumeM3 && req.packageCm && req.packages >= 1) {
      const m3 = (req.packageCm.length * req.packageCm.width * req.packageCm.height * req.packages) / 1e6;
      if (m3 > uti.volumeM3 * req.quantity)
        errs.push({
          field: 'packageCm',
          code: 'volume-exceeded',
          message: `The packages take about ${m3.toFixed(1)} m³, more than the ${uti.volumeM3 * req.quantity} m³ available in ${req.quantity} × ${uti.name}.`,
        });
    }
    if (uti.reefer && (req.temperatureC === null || Number.isNaN(req.temperatureC)))
      errs.push({ field: 'temperatureC', code: 'temperature-required', message: 'Enter the set temperature for the reefer unit.' });
  }
  if (req.dangerousGoods) {
    if (!req.dangerousGoods.adrClass)
      need('dangerousGoods', false, 'Choose the ADR/RID class of the dangerous goods.');
    else if (req.dangerousGoods.unNumber && !/^\d{4}$/.test(req.dangerousGoods.unNumber))
      errs.push({ field: 'dangerousGoods', code: 'required', message: 'A UN number has 4 digits, for example 1203.' });
    if (service && !service.dgAllowed)
      errs.push({ field: 'serviceId', code: 'dangerous-goods-not-accepted', message: `${service.name} does not accept dangerous goods. Choose another service.` });
  }
  if (req.insuranceValue !== null && !(req.insuranceValue >= cat.config.minInsuranceValue))
    errs.push({
      field: 'insuranceValue',
      code: 'insurance-below-minimum',
      message: `Insurance needs a declared value of at least ${cat.config.minInsuranceValue} ${cat.config.currency}.`,
    });
  return errs;
} // prettier-ignore

// ---------------------------------------------------------------- pricing

interface Priced {
  rail: RailPricing;
  originRoad: RoadLeg | null;
  destRoad: RoadLeg | null;
  roadTotal: number;
  total: number;
}

/** Cheapest combination of terminals (only differs when a door is served from several). */
function priceRoute(cat: Catalogue, req: QuoteRequest): Priced | QuoteError {
  let best: Priced | null = null;
  let lastError: string | null = null;
  for (const from of candidateTerminals(cat, req.origin)) {
    for (const to of candidateTerminals(cat, req.destination)) {
      if (from === to) continue;
      const r = priceRail(cat, {
        originTerminalId: from,
        destTerminalId: to,
        serviceId: req.serviceId,
        utiType: req.utiType,
        units: req.quantity,
        weightKg: req.grossWeightKg,
        dg: req.dangerousGoods !== null,
        adrClass: req.dangerousGoods?.adrClass ?? '',
        metric: req.routingMetric,
        insuredValue: req.insuranceValue,
      });
      if (!r.ok) {
        lastError = r.error;
        continue;
      }
      const originRoad = req.origin.kind === 'door' ? roadLeg(cat, req.origin.id, from)! : null;
      const destRoad = req.destination.kind === 'door' ? roadLeg(cat, req.destination.id, to)! : null;
      const roadTotal = ((originRoad?.price ?? 0) + (destRoad?.price ?? 0)) * req.quantity;
      const total = r.value.total + roadTotal;
      if (!best || total < best.total) best = { rail: r.value, originRoad, destRoad, roadTotal, total };
    }
  }
  if (best) return best;
  const from = placeName(cat, req.origin);
  const to = placeName(cat, req.destination);
  if (lastError === 'no-tariff')
    return { field: 'utiType', code: 'service-unavailable', message: `There is no tariff for this loading unit on the chosen service.` };
  if (lastError === 'service-no-dg')
    return { field: 'serviceId', code: 'dangerous-goods-not-accepted', message: 'This service does not accept dangerous goods.' };
  return {
    field: 'route',
    code: 'route-not-covered',
    message: req.dangerousGoods
      ? `There is no rail route from ${from} to ${to} through terminals that handle dangerous goods.`
      : `SDG Railway has no rail route from ${from} to ${to}. See Network and trains for the terminals connected.`,
  };
} // prettier-ignore

/**
 * Rail route the quotation would use, for the form preview before the unit and service are chosen
 * (same terminal choice as the quote: the cheapest combination).
 */
export function previewRoute(cat: Catalogue, req: QuoteRequest): RailPricing['path'] | null {
  const serviceId = req.serviceId || cat.services.find((s) => s.active)?.id || '';
  const utiType =
    req.utiType || cat.tariffs.find((t) => t.active && t.serviceId === serviceId)?.utiType || '';
  const r = priceRoute(cat, {
    ...req,
    serviceId,
    utiType,
    quantity: Math.max(1, req.quantity || 1),
    insuranceValue: null,
  });
  return 'code' in r ? null : r.rail.path;
}

function surchargeLeg(s: SurchargeLine): QuoteLine['leg'] {
  const terminalCharge = /terminal|handling/i.test(s.label);
  if (/DEST_COUNTRY/i.test(s.rule) && terminalCharge) return 'destination-terminal';
  if (/ORIGIN_COUNTRY/i.test(s.rule) && terminalCharge) return 'origin-terminal';
  return 'extra';
}

export interface ServiceOption {
  serviceId: string;
  serviceName: string;
  level: string;
  dgAllowed: boolean;
  total: number | null;
  transitMin: number | null;
  train: TrainProposal | null;
  error: string | null;
}

/** Price and first train for every active service, so the team can compare before quoting. */
export function serviceOptions(
  cat: Catalogue,
  req: QuoteRequest,
  usage: CapacityUsage,
): ServiceOption[] {
  return cat.services
    .filter((s) => s.active)
    .map((s) => {
      const r = { ...req, serviceId: s.id };
      const base = { serviceId: s.id, serviceName: s.name, level: s.level, dgAllowed: s.dgAllowed };
      if (req.dangerousGoods && !s.dgAllowed)
        return { ...base, total: null, transitMin: null, train: null, error: 'No dangerous goods' };
      const p = priceRoute(cat, r);
      if ('code' in p)
        return { ...base, total: null, transitMin: null, train: null, error: p.message };
      return {
        ...base,
        total: roundMoney(p.total),
        transitMin: p.rail.transitMin,
        train: trainFor(cat, r, p, usage),
        error: null,
      };
    });
}

function trainFor(cat: Catalogue, req: QuoteRequest, p: Priced, usage: CapacityUsage) {
  const readyAt = `${req.readyDate}T08:00`;
  return findDeparture(cat, {
    serviceId: req.serviceId,
    originTerminalId: p.rail.origin.id,
    originCountry: p.rail.origin.countryCode,
    destCountry: p.rail.destination.countryCode,
    readyAtTerminal: p.originRoad ? addHours(readyAt, p.originRoad.hours) : readyAt,
    transitMin: p.rail.transitMin,
    quantity: req.quantity,
    usage,
  });
}

/** Builds the quotation, or returns the reasons it cannot be quoted. */
export function buildQuote(
  cat: Catalogue,
  req: QuoteRequest,
  opts: { ref: string; version: number; now: Date; usage: CapacityUsage; team: string },
): { ok: true; quote: Quote } | { ok: false; errors: QuoteError[] } {
  const errors = validateRequest(cat, req, opts.now);
  if (errors.length) return { ok: false, errors };
  const p = priceRoute(cat, req);
  if ('code' in p) return { ok: false, errors: [p] };

  const { rail, originRoad, destRoad } = p;
  const ot = rail.origin;
  const dt = rail.destination;
  const uti = cat.utiTypes.find((u) => u.code === req.utiType)!;
  const q = req.quantity;
  const cur = cat.config.currency;
  const haulier = cat.config.haulierName;

  const lines: QuoteLine[] = [];
  const add = (l: Omit<QuoteLine, 'amount'> & { amount?: number }) =>
    lines.push({ ...l, amount: roundMoney(l.amount ?? l.unitPrice * l.quantity) });
  if (originRoad)
    add({
      id: 'origin-road',
      leg: 'origin-road',
      label: 'Origin road haulage',
      detail: `${haulier}: ${originRoad.placeName} → ${ot.city} terminal, ${originRoad.distanceKm} km`,
      quantity: q,
      unitPrice: originRoad.price,
    });
  add({
    id: 'rail',
    leg: 'rail',
    label: 'Rail freight (terminal to terminal)',
    detail: `${rail.service.name}, ${ot.city} → ${dt.city}, ${rail.path.distanceKm.toLocaleString('en-GB')} km, ${uti.name}`,
    quantity: q,
    unitPrice: roundMoney(rail.baseFreight / q),
    amount: rail.baseFreight,
  });
  rail.surcharges.forEach((s, i) =>
    add({
      id: `sur-${s.code || i}`,
      leg: surchargeLeg(s),
      label: s.label,
      detail: s.amountType === 'percent' ? `${s.rule.replace(/;/g, ', ')} (percentage of rail freight)` : s.rule.replace(/;/g, ', '),
      quantity: 1,
      unitPrice: s.amount,
    }),
  );
  if (destRoad)
    add({
      id: 'destination-road',
      leg: 'destination-road',
      label: 'Final road haulage',
      detail: `${haulier}: ${dt.city} terminal → ${destRoad.placeName}, ${destRoad.distanceKm} km`,
      quantity: q,
      unitPrice: destRoad.price,
    });
  if (rail.insurance > 0)
    add({
      id: 'insurance',
      leg: 'extra',
      label: 'Cargo insurance',
      detail: `${roundMoney(cat.config.insuranceRate * 100)}% of declared value ${req.insuranceValue!.toLocaleString('en-GB')} ${cur}`,
      quantity: 1,
      unitPrice: rail.insurance,
    });
  if (rail.vatAmount > 0)
    add({ id: 'vat', leg: 'extra', label: `VAT (${Math.round(rail.vatRate * 100)}%)`, detail: 'On rail freight, surcharges and insurance', quantity: 1, unitPrice: rail.vatAmount });

  const total = roundMoney(rail.total + p.roadTotal);
  const train = trainFor(cat, req, p, opts.usage);
  const deliveryEstimate = train.arrival
    ? destRoad
      ? addHours(train.arrival, destRoad.hours)
      : train.arrival
    : null;
  const pathNames = rail.path.pathIds.map((id) => terminalById(cat, id)?.city ?? id);

  const legs: QuoteLeg[] = [
    {
      kind: 'origin-road',
      from: placeName(cat, req.origin),
      to: `${ot.city} terminal`,
      provider: originRoad ? haulier : 'Arranged by the forwarder',
      scope: originRoad ? 'included' : 'excluded',
      note: originRoad ? `About ${originRoad.hours} h by road` : 'Terminal-to-terminal: delivery to the origin terminal is not included',
    },
    {
      kind: 'origin-terminal',
      from: ot.city,
      to: ot.city,
      provider: ot.name,
      scope: 'included',
      note: `Gate in before the cut-off ${train.cutOff ? train.cutOff.slice(11) : '(pending)'}`,
    },
    {
      kind: 'rail',
      from: ot.city,
      to: dt.city,
      provider: `${rail.service.name}${train.status === 'proposed' ? ` – departure ${train.departure!.replace('T', ' ')}` : ''}`,
      scope: train.status === 'proposed' ? 'included' : 'pending',
      note: `${pathNames.join(' → ')}. ${rail.path.distanceKm.toLocaleString('en-GB')} km, about ${Math.round(rail.transitMin / 6) / 10} h terminal to terminal.`,
    },
    {
      kind: 'destination-terminal',
      from: dt.city,
      to: dt.city,
      provider: dt.name,
      scope: 'included',
      note: 'Unloading and gate out',
    },
    {
      kind: 'destination-road',
      from: `${dt.city} terminal`,
      to: placeName(cat, req.destination),
      provider: destRoad ? haulier : 'Arranged by the forwarder',
      scope: destRoad ? 'included' : 'excluded',
      note: destRoad ? `About ${destRoad.hours} h by road` : 'Terminal-to-terminal: collection from the destination terminal is not included',
    },
  ];

  const inclusions = legs.filter((l) => l.scope === 'included').map((l) => legLabel(l.kind));
  if (req.dangerousGoods) inclusions.push('Dangerous goods handling (ADR/RID)');
  if (uti.reefer) inclusions.push('Reefer unit');
  if (rail.insurance > 0) inclusions.push('Cargo insurance on the declared value');
  const exclusions = [
    ...legs.filter((l) => l.scope === 'excluded').map((l) => legLabel(l.kind)),
    'Customs formalities and duties',
    ...(rail.vatAmount > 0 ? [] : ['Taxes (VAT)']),
    'Waiting time, storage and demurrage beyond the free time',
    ...(rail.insurance > 0 ? [] : ['Cargo insurance']),
  ];
  const issuedAt = localNow(opts.now);
  const expiry = addDays(issuedAt.slice(0, 10), cat.config.quotationValidityDays);

  return {
    ok: true,
    quote: {
      ref: opts.ref,
      version: opts.version,
      status: 'issued',
      issuedAt,
      expiresAt: `${expiry}T23:59`,
      team: opts.team,
      request: req,
      route: {
        originTerminal: ot.id,
        destinationTerminal: dt.id,
        pathIds: rail.path.pathIds,
        countries: rail.path.countries,
        mode: rail.path.mode,
        borderCrossings: rail.path.borderCrossings,
        distanceKm: rail.path.distanceKm,
        transitMin: rail.transitMin,
      },
      service: { id: rail.service.id, name: rail.service.name, level: rail.service.level },
      legs,
      lines,
      rail: {
        baseFreight: rail.baseFreight,
        surchargesTotal: rail.surchargesTotal,
        insurance: rail.insurance,
        vatAmount: rail.vatAmount,
      },
      roadTotal: p.roadTotal,
      total,
      currency: cur,
      inclusions,
      exclusions,
      conditions: [
        `Prices in ${cur} from the SDG Railway tariff (TARIFFS and SURCHARGES), ${rail.service.name}, ${uti.name}.`,
        `Valid until ${expiry}. A quote is not a booking: capacity is confirmed only when the quote is accepted.`,
        'Subject to the SDG Railway General Sales Conditions (academic document).',
        `Gate in at the origin terminal before the cut-off, ${cat.config.cutOffHours} h before departure.`,
      ],
      train,
      deliveryEstimate,
    },
  };
} // prettier-ignore

export function legLabel(kind: LegKind): string {
  return {
    'origin-road': 'Origin road haulage',
    'origin-terminal': 'Origin terminal handling',
    rail: 'Rail leg',
    'destination-terminal': 'Destination terminal handling',
    'destination-road': 'Final road haulage',
  }[kind];
}

export function effectiveStatus(quote: Quote, now: Date): QuoteStatus {
  if (quote.status === 'issued' && localNow(now) > quote.expiresAt) return 'expired';
  return quote.status;
}

/** Accepting a quote creates a booking. The train is confirmed only if capacity is still free. */
export function acceptQuote(
  cat: Catalogue,
  quote: Quote,
  opts: { bookingRef: string; now: Date; usage: CapacityUsage },
): Booking {
  const status = effectiveStatus(quote, opts.now);
  if (status !== 'issued')
    throw new Error(`Quote ${quote.ref} v${quote.version} is ${status} and cannot be accepted.`);
  let train = quote.train;
  if (train.status === 'proposed') {
    const ot = terminalById(cat, quote.route.originTerminal);
    const dt = terminalById(cat, quote.route.destinationTerminal);
    const fresh = findDeparture(cat, {
      serviceId: quote.service.id,
      originTerminalId: quote.route.originTerminal,
      originCountry: ot?.countryCode ?? '',
      destCountry: dt?.countryCode ?? '',
      readyAtTerminal: train.cutOff!,
      transitMin: quote.route.transitMin,
      quantity: quote.request.quantity,
      usage: opts.usage,
    });
    if (fresh.trainId !== train.trainId)
      train = {
        ...train,
        status: 'pending',
        departure: null,
        cutOff: null,
        arrival: null,
        slotsLeft: 0,
        reason: 'The proposed departure filled up before acceptance. SDG Railway will confirm another train.',
      };
  }
  return {
    ref: opts.bookingRef,
    quoteRef: quote.ref,
    quoteVersion: quote.version,
    status: train.status === 'proposed' ? 'confirmed' : 'pending-train',
    createdAt: localNow(opts.now),
    train,
    terminalOrders: { deliveryDriver: '', deliveryVehicle: '', collectionDriver: '', collectionVehicle: '' },
  };
} // prettier-ignore
