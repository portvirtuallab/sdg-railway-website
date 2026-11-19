import catalogue from '@/data/demo-catalogue.json';
import { addHours, weekday } from '@/features/quote/time';

/**
 * Scenario departures generated from the DEMO test catalogue (lanes and timetables taken from the
 * source site's Departures Board). Not a live schedule (verification log V-11).
 */
export const RAIL_SERVICES = catalogue.services;
export type RailService = (typeof catalogue.services)[number];
export type CatalogueLane = (typeof catalogue.lanes)[number];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface Departure {
  date: string;
  weekday: (typeof DAYS)[number];
  lane: CatalogueLane;
  service: RailService;
  departure: string;
  cutOff: string;
  arrival: string;
  cancelled: boolean;
}

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Departures of every lane over the next `days` days, including cancelled (blocked) ones. */
export function buildDepartures(from: Date, days = 7): Departure[] {
  const out: Departure[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(from);
    date.setDate(from.getDate() + d);
    const ds = iso(date);
    if (ds < catalogue.validFrom || ds > catalogue.validTo) continue;
    for (const lane of catalogue.lanes) {
      if (!lane.train.days.includes(weekday(ds))) continue;
      const service = catalogue.services.find((s) => s.id === lane.serviceId)!;
      const departure = `${ds}T${lane.train.departure}`;
      out.push({
        date: ds,
        weekday: DAYS[weekday(ds)]!,
        lane,
        service,
        departure,
        cutOff: addHours(departure, -catalogue.cutOffHoursBeforeDeparture),
        arrival: addHours(departure, lane.transitHours),
        cancelled: catalogue.globalBlockedDates.includes(ds) || service.blockedDates.includes(ds),
      });
    }
  }
  return out.sort((a, b) => (a.departure < b.departure ? -1 : a.departure > b.departure ? 1 : 0));
}
