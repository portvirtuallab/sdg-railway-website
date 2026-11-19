import { addDays, addHours, localNow, toMs, weekday } from './time';
import type {
  Booking,
  Catalogue,
  Lane,
  Place,
  Quote,
  QuoteError,
  QuoteLeg,
  QuoteLine,
  QuoteRequest,
  TrainProposal,
} from './types';
import { INCOTERMS } from './types';

/** ITUs booked per train departure, keyed by `${trainId}|${date}`. */
export type CapacityUsage = Record<string, number>;

const SEARCH_DAYS = 14;

export function terminalById(cat: Catalogue, id: string) {
  return cat.terminals.find((t) => t.id === id);
}
export function doorById(cat: Catalogue, id: string) {
  return cat.doors.find((d) => d.id === id);
}
export function placeName(cat: Catalogue, p: Place): string {
  if (p.kind === 'door') return doorById(cat, p.id)?.label ?? p.id;
  const t = terminalById(cat, p.id);
  return t ? `${t.city} – ${t.name}` : p.id;
}
export function teamByPin(cat: Catalogue, pin: string) {
  return cat.teams.find((t) => t.pin === pin);
}

function roadLegFor(cat: Catalogue, doorId: string, terminalId: string) {
  return cat.roadLegs.find((r) => r.door === doorId && r.terminal === terminalId);
}

/** Terminals reachable from a place: the terminal itself, or those with a road leg from the door. */
function candidateTerminals(cat: Catalogue, p: Place): string[] {
  if (p.kind === 'terminal') return [p.id];
  return cat.roadLegs.filter((r) => r.door === p.id).map((r) => r.terminal);
}

/** Finds the catalogue lane serving origin → destination. Only direct lanes are quoted. */
export function resolveLane(cat: Catalogue, origin: Place, destination: Place): Lane | null {
  const froms = candidateTerminals(cat, origin);
  const tos = candidateTerminals(cat, destination);
  const lanes = cat.lanes.filter((l) => froms.includes(l.from) && tos.includes(l.to));
  if (!lanes.length) return null;
  // Prefer the lane with the cheapest total road legs (shortest first-mile/last-mile).
  const roadCost = (l: Lane) =>
    (origin.kind === 'door' ? (roadLegFor(cat, origin.id, l.from)?.amount ?? 0) : 0) +
    (destination.kind === 'door' ? (roadLegFor(cat, destination.id, l.to)?.amount ?? 0) : 0);
  return [...lanes].sort((a, b) => roadCost(a) - roadCost(b))[0]!;
}

/** Terminal handling comes from exactly one source: terminal, then country, then default. */
export function terminalHandling(
  cat: Catalogue,
  terminalId: string,
): { amount: number; source: string } {
  const t = terminalById(cat, terminalId);
  const rules = cat.charges.terminalHandling as {
    default: number;
    byCountry: Record<string, number>;
    byTerminal: Record<string, number>;
  };
  if (rules.byTerminal[terminalId] !== undefined)
    return { amount: rules.byTerminal[terminalId]!, source: 'terminal rate' };
  if (t && rules.byCountry[t.country] !== undefined)
    return { amount: rules.byCountry[t.country]!, source: `${t.country} country rate` };
  return { amount: rules.default, source: 'default rate' };
}

export function validateRequest(cat: Catalogue, req: QuoteRequest, now: Date): QuoteError[] {
  const errs: QuoteError[] = [];
  const need = (field: QuoteError['field'], ok: unknown, message: string) => {
    if (!ok) errs.push({ field, code: 'required', message });
  };
  if (!/^\d{4}$/.test(req.pin)) need('pin', false, 'Enter your team’s 4-digit PVL PIN.');
  else if (!teamByPin(cat, req.pin))
    errs.push({
      field: 'pin',
      code: 'invalid-pin',
      message: 'This PIN does not belong to any team in this exercise. Check it with your trainer.',
    });
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
  need(
    'cargoDescription',
    req.cargoDescription.trim(),
    'Describe the cargo, for example “Automotive parts”.',
  );

  const today = localNow(now).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.readyDate))
    need('readyDate', false, 'Choose the date the cargo is ready.');
  else if (req.readyDate <= today)
    errs.push({
      field: 'readyDate',
      code: 'date-invalid',
      message: 'The ready date must be after today.',
    });
  else if (req.readyDate > cat.validTo)
    errs.push({
      field: 'readyDate',
      code: 'date-invalid',
      message: `The test catalogue ${cat.version} is valid until ${cat.validTo}. Choose an earlier date.`,
    });

  const itu = cat.itus.find((u) => u.code === req.ituCode);
  if (!itu) need('ituCode', false, 'Choose a loading unit (ITU).');
  if (!Number.isInteger(req.quantity) || req.quantity < 1 || req.quantity > 10)
    errs.push({
      field: 'quantity',
      code: 'required',
      message: 'Enter between 1 and 10 loading units.',
    });
  if (!(req.grossWeightKg > 0))
    need('grossWeightKg', false, 'Enter the total gross weight in kilograms.');
  if (!Number.isInteger(req.packages) || req.packages < 1)
    need('packages', false, 'Enter the number of packages (at least 1).');

  if (itu && req.quantity >= 1) {
    if (req.grossWeightKg > itu.maxGrossKg * req.quantity)
      errs.push({
        field: 'grossWeightKg',
        code: 'weight-exceeded',
        message: `${req.quantity} × ${itu.name} carry at most ${(itu.maxGrossKg * req.quantity).toLocaleString('en-GB')} kg gross. Reduce the weight or add units.`,
      });
    if (req.packageCm && req.packages >= 1) {
      const m3 =
        (req.packageCm.length * req.packageCm.width * req.packageCm.height * req.packages) / 1e6;
      if (m3 > itu.volumeM3 * req.quantity)
        errs.push({
          field: 'packageCm',
          code: 'volume-exceeded',
          message: `The packages take about ${m3.toFixed(1)} m³, more than the ${itu.volumeM3 * req.quantity} m³ available in ${req.quantity} × ${itu.name}.`,
        });
    }
    if (
      'reefer' in itu &&
      itu.reefer &&
      (req.temperatureC === null || Number.isNaN(req.temperatureC))
    )
      errs.push({
        field: 'temperatureC',
        code: 'temperature-required',
        message: 'Enter the set temperature for the reefer container.',
      });
  }
  if (req.dangerousGoods) {
    if (!req.dangerousGoods.ridClass)
      need('dangerousGoods', false, 'Choose the RID class of the dangerous goods.');
    else if (req.dangerousGoods.unNumber && !/^\d{4}$/.test(req.dangerousGoods.unNumber))
      errs.push({
        field: 'dangerousGoods',
        code: 'required',
        message: 'A UN number has 4 digits, for example 1203.',
      });
  }
  if (errs.length) return errs;

  // Route and compatibility checks (only once the request itself is complete).
  const lane = resolveLane(cat, req.origin, req.destination);
  if (!lane) {
    errs.push({
      field: 'route',
      code: 'route-not-covered',
      message: `SDG Railway has no approved service from ${placeName(cat, req.origin)} to ${placeName(cat, req.destination)} in catalogue ${cat.version}. See Network and trains for the covered lanes.`,
    });
    return errs;
  }
  if (!lane.acceptedItus.includes(req.ituCode))
    errs.push({
      field: 'ituCode',
      code: 'itu-incompatible',
      message: `The ${itu!.name} is not accepted on the ${lane.id} lane. Accepted units: ${lane.acceptedItus.join(', ')}.`,
    });
  if (req.dangerousGoods) {
    const ot = terminalById(cat, lane.from)!,
      dt = terminalById(cat, lane.to)!;
    if (!lane.dangerousGoods)
      errs.push({
        field: 'dangerousGoods',
        code: 'dangerous-goods-not-accepted',
        message: `The ${lane.id} lane does not accept dangerous goods.`,
      });
    else if (!ot.dgCapable || !dt.dgCapable)
      errs.push({
        field: 'dangerousGoods',
        code: 'dangerous-goods-not-accepted',
        message: `${!ot.dgCapable ? ot.city : dt.city} terminal does not handle dangerous goods.`,
      });
  }
  return errs;
}

function isOperating(cat: Catalogue, lane: Lane, date: string): boolean {
  const service = cat.services.find((s) => s.id === lane.serviceId)!;
  return (
    lane.train.days.includes(weekday(date)) &&
    !service.blockedDates.includes(date) &&
    !cat.globalBlockedDates.includes(date) &&
    date >= cat.validFrom &&
    date <= cat.validTo
  );
}

export function capacityKey(trainId: string, date: string): string {
  return `${trainId}|${date}`;
}

/** First departure after the unit can reach the origin terminal, before cut-off and with free slots. */
export function findTrain(
  cat: Catalogue,
  lane: Lane,
  readyAtTerminal: string,
  quantity: number,
  usage: CapacityUsage,
): TrainProposal {
  const service = cat.services.find((s) => s.id === lane.serviceId)!;
  const base = { trainId: lane.train.id, serviceName: service.name };
  let fullSeen = false;
  for (let i = 0; i <= SEARCH_DAYS; i++) {
    const date = addDays(readyAtTerminal.slice(0, 10), i);
    if (date > cat.validTo)
      return {
        ...base,
        status: 'pending',
        departure: null,
        cutOff: null,
        arrival: null,
        reason: `No timetable beyond ${cat.validTo} in catalogue ${cat.version}.`,
      };
    if (!isOperating(cat, lane, date)) continue;
    const departure = `${date}T${lane.train.departure}`;
    const cutOff = addHours(departure, -cat.cutOffHoursBeforeDeparture);
    if (toMs(cutOff) < toMs(readyAtTerminal)) continue;
    const used = usage[capacityKey(lane.train.id, date)] ?? 0;
    if (used + quantity > lane.train.slotsPerDeparture) {
      fullSeen = true;
      continue;
    }
    return {
      ...base,
      status: 'proposed',
      departure,
      cutOff,
      arrival: addHours(departure, lane.transitHours),
      reason: null,
    };
  }
  return {
    ...base,
    status: 'pending',
    departure: null,
    cutOff: null,
    arrival: null,
    reason: fullSeen
      ? 'No free capacity on the departures of the next 14 days.'
      : 'No departure within 14 days of the ready date.',
  };
}

/** Builds the quotation. Throws if the request is invalid: call validateRequest first. */
export function buildQuote(
  cat: Catalogue,
  req: QuoteRequest,
  opts: { ref: string; version: number; now: Date; usage: CapacityUsage },
): Quote {
  const errors = validateRequest(cat, req, opts.now);
  if (errors.length) throw new Error(errors.map((e) => e.message).join(' '));
  const lane = resolveLane(cat, req.origin, req.destination)!;
  const itu = cat.itus.find((u) => u.code === req.ituCode)!;
  const service = cat.services.find((s) => s.id === lane.serviceId)!;
  const ot = terminalById(cat, lane.from)!;
  const dt = terminalById(cat, lane.to)!;
  const q = req.quantity;
  const originRoad = req.origin.kind === 'door' ? roadLegFor(cat, req.origin.id, lane.from)! : null;
  const destRoad =
    req.destination.kind === 'door' ? roadLegFor(cat, req.destination.id, lane.to)! : null;

  const lines: QuoteLine[] = [];
  const add = (l: Omit<QuoteLine, 'amount'>) =>
    lines.push({ ...l, amount: round2(l.unitPrice * l.quantity) });
  if (originRoad)
    add({
      id: 'origin-road',
      leg: 'origin-road',
      label: 'Origin road haulage',
      detail: `${cat.haulier}: ${placeName(cat, req.origin)} → ${ot.city} terminal`,
      quantity: q,
      unitPrice: originRoad.amount,
    });
  const oh = terminalHandling(cat, ot.id);
  add({
    id: 'origin-terminal',
    leg: 'origin-terminal',
    label: 'Origin terminal handling',
    detail: `${ot.name}, ${ot.city} (${oh.source})`,
    quantity: q,
    unitPrice: oh.amount,
  });
  add({
    id: 'rail',
    leg: 'rail',
    label: 'Rail leg (terminal to terminal)',
    detail: `${service.name}, ${ot.city} → ${dt.city}, ${itu.code}`,
    quantity: q,
    unitPrice: (lane.railRates as unknown as Record<string, number>)[itu.code]!,
  });
  const dh = terminalHandling(cat, dt.id);
  add({
    id: 'destination-terminal',
    leg: 'destination-terminal',
    label: 'Destination terminal handling',
    detail: `${dt.name}, ${dt.city} (${dh.source})`,
    quantity: q,
    unitPrice: dh.amount,
  });
  if (destRoad)
    add({
      id: 'destination-road',
      leg: 'destination-road',
      label: 'Final road haulage',
      detail: `${cat.haulier}: ${dt.city} terminal → ${placeName(cat, req.destination)}`,
      quantity: q,
      unitPrice: destRoad.amount,
    });
  if (req.dangerousGoods)
    add({
      id: 'dg',
      leg: 'extra',
      label: 'Dangerous goods handling',
      detail: `RID class ${req.dangerousGoods.ridClass}${req.dangerousGoods.unNumber ? `, UN ${req.dangerousGoods.unNumber}` : ''}`,
      quantity: q,
      unitPrice: cat.charges.dangerousGoodsPerItu,
    });
  if ('reefer' in itu && itu.reefer)
    add({
      id: 'reefer',
      leg: 'extra',
      label: 'Reefer power and monitoring',
      detail: `Set point ${req.temperatureC} °C`,
      quantity: q,
      unitPrice: cat.charges.reeferPowerPerItu,
    });
  if (req.insuranceValue && req.insuranceValue >= cat.charges.insuranceMinValue)
    add({
      id: 'insurance',
      leg: 'extra',
      label: 'Cargo insurance',
      detail: `${cat.charges.insuranceRate * 100}% of declared value ${req.insuranceValue.toLocaleString('en-GB')} ${cat.currency}`,
      quantity: 1,
      unitPrice: round2(req.insuranceValue * cat.charges.insuranceRate),
    });
  add({
    id: 'management',
    leg: 'extra',
    label: 'Management and documentation',
    detail: 'SDG Railway coordination as intermodal carrier and MTO',
    quantity: 1,
    unitPrice: cat.charges.managementFee,
  });

  const priced = lines.filter((l) => l.amount > 0);
  const total = round2(priced.reduce((a, l) => a + l.amount, 0));

  const readyAt = `${req.readyDate}T08:00`;
  const readyAtTerminal = originRoad ? addHours(readyAt, originRoad.hours) : readyAt;
  const train = findTrain(cat, lane, readyAtTerminal, q, opts.usage);
  const deliveryEstimate = train.arrival
    ? destRoad
      ? addHours(train.arrival, destRoad.hours)
      : train.arrival
    : null;

  const legs: QuoteLeg[] = [
    {
      kind: 'origin-road',
      from: placeName(cat, req.origin),
      to: `${ot.city} terminal`,
      provider: originRoad ? cat.haulier : 'Arranged by the forwarder',
      scope: originRoad ? 'included' : 'excluded',
      note: originRoad
        ? `About ${originRoad.hours} h by road`
        : 'Terminal-to-terminal: delivery to the origin terminal is not included',
    },
    {
      kind: 'origin-terminal',
      from: ot.city,
      to: ot.city,
      provider: ot.name,
      scope: 'included',
      note: `Gate in before cut-off ${train.cutOff ? train.cutOff.slice(11) : '(pending)'}`,
    },
    {
      kind: 'rail',
      from: ot.city,
      to: dt.city,
      provider: `${service.name} – train ${lane.train.id}`,
      scope: train.status === 'proposed' ? 'included' : 'pending',
      note: `${lane.distanceKm.toLocaleString('en-GB')} km, about ${lane.transitHours} h terminal to terminal. Capacity booked by SDG Railway acting as MTO.`,
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
      provider: destRoad ? cat.haulier : 'Arranged by the forwarder',
      scope: destRoad ? 'included' : 'excluded',
      note: destRoad
        ? `About ${destRoad.hours} h by road`
        : 'Terminal-to-terminal: collection from the destination terminal is not included',
    },
  ];

  const inclusions = legs.filter((l) => l.scope === 'included').map((l) => legLabel(l.kind));
  if (req.dangerousGoods) inclusions.push('Dangerous goods handling (RID)');
  if ('reefer' in itu && itu.reefer) inclusions.push('Reefer power and monitoring');
  if (priced.some((l) => l.id === 'insurance'))
    inclusions.push('Cargo insurance on the declared value');
  const exclusions = [
    ...legs.filter((l) => l.scope === 'excluded').map((l) => legLabel(l.kind)),
    'Customs formalities and duties',
    'Taxes (VAT)',
    'Waiting time, storage and demurrage beyond the free time',
    ...(priced.some((l) => l.id === 'insurance') ? [] : ['Cargo insurance']),
  ];
  const issuedAt = localNow(opts.now);
  const expiryDate = minDate(addDays(issuedAt.slice(0, 10), cat.quoteValidityDays), cat.validTo);

  return {
    ref: opts.ref,
    version: opts.version,
    status: 'issued',
    issuedAt,
    expiresAt: `${expiryDate}T23:59`,
    catalogueVersion: cat.version,
    team: teamByPin(cat, req.pin)!.team,
    request: req,
    laneId: lane.id,
    route: { originTerminal: ot.id, destinationTerminal: dt.id, distanceKm: lane.distanceKm },
    legs,
    lines: priced,
    total,
    currency: cat.currency,
    inclusions,
    exclusions,
    conditions: [
      `Prices per ${itu.name} and per leg, in ${cat.currency}, from test catalogue ${cat.version} (DEMO, not a commercial tariff).`,
      `Valid until ${expiryDate}. A quote is not a booking: capacity is confirmed only when the quote is accepted.`,
      'Subject to the SDG Railway General Sales Conditions (academic document).',
      `Gate in at the origin terminal before the cut-off, ${cat.cutOffHoursBeforeDeparture} h before departure.`,
    ],
    train,
    deliveryEstimate,
  };
}

export function legLabel(kind: QuoteLeg['kind']): string {
  return {
    'origin-road': 'Origin road haulage',
    'origin-terminal': 'Origin terminal handling',
    rail: 'Rail leg',
    'destination-terminal': 'Destination terminal handling',
    'destination-road': 'Final road haulage',
  }[kind];
}

export function effectiveStatus(quote: Quote, now: Date): Quote['status'] {
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
  const lane = cat.lanes.find((l) => l.id === quote.laneId)!;
  let train = quote.train;
  if (train.status === 'proposed') {
    const used = opts.usage[capacityKey(train.trainId, train.departure!.slice(0, 10))] ?? 0;
    if (used + quote.request.quantity > lane.train.slotsPerDeparture)
      train = {
        ...train,
        status: 'pending',
        departure: null,
        cutOff: null,
        arrival: null,
        reason:
          'The proposed departure filled up before acceptance. SDG Railway will confirm another train.',
      };
  }
  return {
    ref: opts.bookingRef,
    quoteRef: quote.ref,
    quoteVersion: quote.version,
    status: train.status === 'proposed' ? 'confirmed' : 'pending-train',
    createdAt: localNow(opts.now),
    train,
    terminalOrders: {
      deliveryDriver: '',
      deliveryVehicle: '',
      collectionDriver: '',
      collectionVehicle: '',
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function minDate(a: string, b: string): string {
  return a < b ? a : b;
}
