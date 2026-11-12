/**
 * Scenario timetable copied from the "Departures Board" embed on the source Request a quotation
 * page (docs/audit/extracted/embeds/request-a-quotation--embed-02.html). It is generated in the
 * browser and is NOT a live schedule (verification log V-11). Train names come from the
 * quotation simulator client code.
 */
export interface RailService {
  id: 'STD-RAIL' | 'EXP-RAIL' | 'GRN-RAIL';
  name: string;
  trainName: string;
  speedKmh: number;
  dangerousGoods: boolean;
  days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  time: string;
  blocked: string[];
}

export interface ServiceRoute {
  from: string;
  to: string;
  label: string;
  km: number;
}

export const RAIL_SERVICES: RailService[] = [
  {
    id: 'STD-RAIL',
    name: 'Standard Rail',
    trainName: 'Iberian Freight Express',
    speedKmh: 80,
    dangerousGoods: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    time: '08:00',
    blocked: ['2026-07-14', '2026-07-15', '2026-08-03', '2026-08-04', '2026-08-05'],
  },
  {
    id: 'EXP-RAIL',
    name: 'Express Rail',
    trainName: 'Eurostar Cargo Rapid',
    speedKmh: 100,
    dangerousGoods: false,
    days: ['Mon', 'Wed', 'Fri', 'Sat'],
    time: '14:00',
    blocked: ['2026-06-29', '2026-06-30', '2026-11-02', '2026-11-03'],
  },
  {
    id: 'GRN-RAIL',
    name: 'Green Rail',
    trainName: 'EcoRail Green Line',
    speedKmh: 70,
    dangerousGoods: false,
    days: ['Mon', 'Wed'],
    time: '10:00',
    blocked: ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10'],
  },
];

export const GLOBAL_BLOCKED = [
  '2026-01-01',
  '2026-01-06',
  '2026-04-03',
  '2026-04-06',
  '2026-05-01',
  '2026-07-04',
  '2026-08-15',
  '2026-10-12',
  '2026-11-01',
  '2026-12-08',
  '2026-12-25',
  '2026-12-26',
];

export const SERVICE_ROUTES: Record<RailService['id'], ServiceRoute[]> = {
  'STD-RAIL': [
    { from: 'BCN-MORROT', to: 'ZAR-PLAZA', label: 'Barcelona → Zaragoza', km: 315 },
    { from: 'ZAR-PLAZA', to: 'MAD-ABRONIGAL', label: 'Zaragoza → Madrid', km: 315 },
    { from: 'PERP-STCHARLES', to: 'LYO-VENISSIEUX', label: 'Perpignan → Lyon', km: 480 },
    { from: 'RTM-MAASVLAKTE', to: 'ANT-COMBINANT', label: 'Rotterdam → Antwerp', km: 110 },
    { from: 'PAR-VALENTON', to: 'ANT-COMBINANT', label: 'Paris → Antwerp', km: 300 },
  ],
  'EXP-RAIL': [
    { from: 'BCN-MORROT', to: 'VER-QUADRANTE', label: 'Barcelona → Verona', km: 1150 },
    { from: 'LYO-VENISSIEUX', to: 'PAR-VALENTON', label: 'Lyon → Paris', km: 460 },
    { from: 'ANT-COMBINANT', to: 'RTM-MAASVLAKTE', label: 'Antwerp → Rotterdam', km: 110 },
  ],
  'GRN-RAIL': [
    { from: 'MAD-ABRONIGAL', to: 'LIS-POCEIRAO', label: 'Madrid → Lisbon area', km: 620 },
    { from: 'BCN-MORROT', to: 'PERP-STCHARLES', label: 'Barcelona → Perpignan', km: 200 },
  ],
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface Departure {
  date: string;
  weekday: (typeof DAYS)[number];
  service: RailService;
  route: ServiceRoute;
  etaHours: number;
  cancelled: boolean;
}

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Same rules as the source board: operating days, blocked dates and rotating route legs. */
export function buildDepartures(from: Date, days = 7): Departure[] {
  const out: Departure[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(from);
    date.setDate(from.getDate() + d);
    const ds = iso(date);
    const weekday = DAYS[date.getDay()]!;
    let rotation = d;
    for (const service of RAIL_SERVICES) {
      if (!service.days.includes(weekday as RailService['days'][number])) continue;
      const routes = SERVICE_ROUTES[service.id];
      const route = routes[rotation++ % routes.length]!;
      out.push({
        date: ds,
        weekday,
        service,
        route,
        etaHours: Math.round((route.km / service.speedKmh) * 10) / 10,
        cancelled: GLOBAL_BLOCKED.includes(ds) || service.blocked.includes(ds),
      });
    }
  }
  return out;
}
