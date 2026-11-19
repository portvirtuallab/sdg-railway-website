/**
 * Train departures from the SCHEDULES tab (same rules as Schedulesystem.gs v2.1) plus capacity:
 * the optional SlotsPerDeparture column, or CONFIG DefaultSlotsPerDeparture.
 *
 * A train is one departure of a service from an origin terminal on a date.
 */
import type { Catalogue, Schedule } from './catalogue';
import { addDays, addHours, dayName, toMs, weekday } from './time';

/** Units already booked per train, keyed by capacityKey(). */
export type CapacityUsage = Record<string, number>;

export function capacityKey(serviceId: string, originTerminalId: string, date: string): string {
  return `${serviceId}|${originTerminalId}|${date}`;
}

/** Most specific schedule row: ES→FR, then *→FR, then ES→*, then the service default. */
export function resolveSchedule(
  cat: Catalogue,
  serviceId: string,
  originCountry: string,
  destCountry: string,
): Schedule | null {
  const rows = cat.schedules[serviceId.toUpperCase()];
  if (!rows?.length) return null;
  const o = originCountry.toUpperCase();
  const d = destCountry.toUpperCase();
  for (const key of [`${o}→${d}`, `*→${d}`, `${o}→*`, '*', '']) {
    const row = rows.find((r) => r.route === key);
    if (row) return row;
  }
  return null;
}

export interface DateCheck {
  available: boolean;
  departureTime: string;
  reason: string;
}

/** Same answer as isDateAvailable_ in Schedulesystem.gs. */
export function checkDate(
  cat: Catalogue,
  serviceId: string,
  date: string,
  originCountry: string,
  destCountry: string,
): DateCheck {
  if (cat.globalBlockedDates.includes(date))
    return { available: false, departureTime: '', reason: 'Public holiday / global closure' };
  const s = resolveSchedule(cat, serviceId, originCountry, destCountry);
  if (!s) return { available: true, departureTime: '08:00', reason: '' };
  if (s.blockedDates.includes(date))
    return { available: false, departureTime: '', reason: s.notes || 'Unavailable' };
  if (!s.departureDays.includes(weekday(date)))
    return {
      available: false,
      departureTime: '',
      reason: `Operates: ${s.departureDays.map(dayName).join(', ')}`,
    };
  return { available: true, departureTime: s.departureTime, reason: '' };
}

export function slotsPerDeparture(
  cat: Catalogue,
  serviceId: string,
  originCountry: string,
  destCountry: string,
): number {
  return (
    resolveSchedule(cat, serviceId, originCountry, destCountry)?.slotsPerDeparture ??
    cat.config.defaultSlotsPerDeparture
  );
}

export interface TrainProposal {
  status: 'proposed' | 'pending';
  trainId: string;
  serviceId: string;
  serviceName: string;
  originTerminalId: string;
  /** Local date-times, YYYY-MM-DDTHH:mm. Null while the train is pending. */
  departure: string | null;
  cutOff: string | null;
  arrival: string | null;
  slotsLeft: number | null;
  reason: string | null;
}

/**
 * First departure the unit can make: operating day, not blocked, gate-in before the cut-off and
 * enough free slots. Searches CONFIG TrainSearchDays (default 14) days.
 */
export function findDeparture(
  cat: Catalogue,
  args: {
    serviceId: string;
    originTerminalId: string;
    originCountry: string;
    destCountry: string;
    readyAtTerminal: string;
    transitMin: number;
    quantity: number;
    usage: CapacityUsage;
  },
): TrainProposal {
  const service = cat.services.find((s) => s.id === args.serviceId);
  const slots = slotsPerDeparture(cat, args.serviceId, args.originCountry, args.destCountry);
  const base = {
    serviceId: args.serviceId,
    serviceName: service?.name ?? args.serviceId,
    originTerminalId: args.originTerminalId,
  };
  let fullSeen = false;
  for (let i = 0; i <= cat.config.searchDays; i++) {
    const date = addDays(args.readyAtTerminal.slice(0, 10), i);
    const check = checkDate(cat, args.serviceId, date, args.originCountry, args.destCountry);
    if (!check.available) continue;
    const departure = `${date}T${check.departureTime}`;
    const cutOff = addHours(departure, -cat.config.cutOffHours);
    if (toMs(cutOff) < toMs(args.readyAtTerminal)) continue;
    const key = capacityKey(args.serviceId, args.originTerminalId, date);
    const used = args.usage[key] ?? 0;
    if (used + args.quantity > slots) {
      fullSeen = true;
      continue;
    }
    return {
      ...base,
      status: 'proposed',
      trainId: key,
      departure,
      cutOff,
      arrival: addHours(departure, args.transitMin / 60),
      slotsLeft: slots - used,
      reason: null,
    };
  }
  return {
    ...base,
    status: 'pending',
    trainId: '',
    departure: null,
    cutOff: null,
    arrival: null,
    slotsLeft: null,
    reason: fullSeen
      ? `No free capacity on the departures of the next ${cat.config.searchDays} days.`
      : `No departure within ${cat.config.searchDays} days of the ready date.`,
  };
}

export interface Departure {
  date: string;
  serviceId: string;
  serviceName: string;
  departureTime: string;
  routeKey: string;
  blocked: boolean;
  reason: string;
}

/** Departures of every service (default timetable) for a board, including blocked days. */
export function departuresBetween(cat: Catalogue, from: string, days: number): Departure[] {
  const out: Departure[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    for (const s of cat.services.filter((x) => x.active)) {
      for (const row of cat.schedules[s.id.toUpperCase()] ?? []) {
        if (!row.departureDays.includes(weekday(date))) continue;
        const blocked = cat.globalBlockedDates.includes(date) || row.blockedDates.includes(date);
        out.push({
          date,
          serviceId: s.id,
          serviceName: s.name,
          departureTime: row.departureTime,
          routeKey: row.route,
          blocked,
          reason: blocked
            ? cat.globalBlockedDates.includes(date)
              ? 'Public holiday'
              : row.notes || 'Blocked'
            : '',
        });
      }
    }
  }
  return out.sort((a, b) =>
    `${a.date}T${a.departureTime}` < `${b.date}T${b.departureTime}` ? -1 : 1,
  );
}
