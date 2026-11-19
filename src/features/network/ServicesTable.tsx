'use client';

import { bookableTerminals, dayName, type Catalogue } from '@/engine';
import { useCatalogueState } from '@/features/quote/catalogue-client';

function routeLabel(cat: Catalogue, key: string): string {
  if (key === '*' || key === '') return 'All routes';
  return key
    .split('→')
    .map((c) => (c === '*' ? 'any' : (cat.countries.find((x) => x.code === c)?.name ?? c)))
    .join(' → ');
}

/** Rail services with their timetable rules (SERVICES and SCHEDULES tabs of the Sheet). */
export function ServicesTable() {
  const { catalogue: cat } = useCatalogueState();
  const services = cat.services.filter((s) => s.active);
  return (
    <div
      className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
      tabIndex={0}
      role="region"
      aria-label="Rail services"
    >
      <table className="w-full min-w-[52rem] text-left text-sm">
        <caption className="sr-only">
          Rail services with timetable, capacity and restrictions
        </caption>
        <thead className="bg-railway-blue-900 text-white">
          <tr>
            <th scope="col" className="px-4 py-3">
              Service
            </th>
            <th scope="col" className="px-4 py-3">
              Departures
            </th>
            <th scope="col" className="px-4 py-3">
              Average speed
            </th>
            <th scope="col" className="px-4 py-3">
              Units per departure
            </th>
            <th scope="col" className="px-4 py-3">
              Dangerous goods
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {services.map((s) => {
            const rows = cat.schedules[s.id.toUpperCase()] ?? [];
            return (
              <tr key={s.id}>
                <th scope="row" className="px-4 py-3 align-top">
                  <span className="text-railway-blue-900 font-semibold">{s.name}</span>
                  <span className="block text-xs font-normal text-neutral-600">
                    {s.level} · {s.description}
                  </span>
                </th>
                <td className="px-4 py-3 align-top">
                  {rows.length ? (
                    <ul className="space-y-1">
                      {rows.map((r) => (
                        <li key={r.route}>
                          <span className="text-railway-blue-900 font-medium">
                            {r.departureDays.length === 7
                              ? 'Daily'
                              : r.departureDays.map(dayName).join(', ')}{' '}
                            at {r.departureTime}
                          </span>
                          <span className="block text-xs text-neutral-600">
                            {routeLabel(cat, r.route)}
                            {r.notes ? ` · ${r.notes}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'Daily at 08:00'
                  )}
                </td>
                <td className="px-4 py-3 align-top tabular-nums">{s.speedKmH} km/h</td>
                <td className="px-4 py-3 align-top tabular-nums">
                  {rows.find((r) => r.slotsPerDeparture)?.slotsPerDeparture ??
                    cat.config.defaultSlotsPerDeparture}
                </td>
                <td className="px-4 py-3 align-top">
                  {s.dgAllowed ? 'Accepted (DG terminals only)' : 'Not accepted'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Live figures of the network for page heroes. */
export function NetworkStats({ light = true }: { light?: boolean }) {
  const { catalogue: cat } = useCatalogueState();
  const terminals = bookableTerminals(cat);
  const items: [number, string][] = [
    [terminals.length, 'Terminals'],
    [new Set(terminals.map((t) => t.countryCode)).size, 'Countries'],
    [cat.links.filter((l) => l.active).length, 'Rail links'],
    [cat.services.filter((s) => s.active).length, 'Rail services'],
  ];
  return (
    <dl
      className={`mt-10 grid max-w-2xl grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-4 ${light ? 'border-white/20' : 'border-neutral-200'}`}
    >
      {items.map(([n, l]) => (
        <div key={l}>
          <dt className={`text-sm ${light ? 'text-white/75' : 'text-neutral-600'}`}>{l}</dt>
          <dd className="font-display text-3xl font-bold">{n}</dd>
        </div>
      ))}
    </dl>
  );
}
