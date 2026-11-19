'use client';

import { useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import { addHours, departuresBetween, formatDateTime, localNow } from '@/engine';
import { useCatalogueState } from '@/features/quote/catalogue-client';

const PILLS = [
  'bg-railway-blue-100 text-railway-blue-900',
  'bg-[#fdecec] text-[#8a1a1a]',
  'bg-railway-green-100 text-railway-green-700',
  'bg-notice-bg text-notice-text',
];

const noopSubscribe = () => () => {};
const localToday = () => localNow(new Date()).slice(0, 10);

/** Departures of every service over the next 7 days, from the SCHEDULES tab of the Sheet. */
export function DeparturesBoard() {
  // The board depends on today's date, so it is only rendered in the browser (null on the server).
  const today = useSyncExternalStore(noopSubscribe, localToday, () => null);
  const { catalogue, source } = useCatalogueState();
  const [filter, setFilter] = useState<string>('ALL');
  const services = catalogue.services.filter((s) => s.active);
  const pill = (id: string) => PILLS[services.findIndex((s) => s.id === id) % PILLS.length];
  const rows = today
    ? departuresBetween(catalogue, today, 7).filter(
        (r) => filter === 'ALL' || r.serviceId === filter,
      )
    : [];
  const route = (key: string) =>
    key === '*' || key === ''
      ? 'All routes'
      : key
          .split('→')
          .map((c) =>
            c === '*' ? 'any country' : (catalogue.countries.find((x) => x.code === c)?.name ?? c),
          )
          .join(' → ');

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
      <div className="bg-railway-blue-900 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <Icon name="clock" className="text-railway-green-100 size-6" />
          <div>
            <p className="font-display font-bold">Departures – next 7 days</p>
            <p className="text-xs text-white/75">
              Timetable of each service from the SDG Railway Sheet
              {source === 'live' ? ' (live)' : ''}. Each departure leaves from every terminal on the
              route; a quote proposes the exact train.
            </p>
          </div>
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2 border-b border-neutral-200 p-4"
        role="group"
        aria-label="Filter by service"
      >
        {['ALL', ...services.map((s) => s.id)].map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${filter === id ? 'border-railway-blue-900 bg-railway-blue-900 text-white' : 'text-railway-blue-900 hover:border-railway-blue-700 border-neutral-200'}`}
          >
            {id === 'ALL' ? 'All services' : services.find((s) => s.id === id)!.name}
          </button>
        ))}
      </div>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Departures table (scrolls horizontally)"
      >
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Departures for the next seven days</caption>
          <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-600 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Service
              </th>
              <th scope="col" className="px-4 py-3">
                Applies to
              </th>
              <th scope="col" className="px-4 py-3">
                Gate-in cut-off
              </th>
              <th scope="col" className="px-4 py-3">
                Departure
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {!today && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-600">
                  Loading timetable…
                </td>
              </tr>
            )}
            {today && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-600">
                  No service in the next 7 days for this selection.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const dep = `${r.date}T${r.departureTime}`;
              return (
                <tr
                  key={`${r.serviceId}-${r.routeKey}-${r.date}`}
                  className={r.date === today ? 'bg-notice-bg/50' : ''}
                >
                  <td className="px-4 py-3">
                    <span
                      className={`block w-fit rounded-md px-2 py-0.5 text-xs font-bold ${pill(r.serviceId)}`}
                    >
                      {r.serviceName}
                    </span>
                  </td>
                  <td className="text-railway-blue-900 px-4 py-3 font-medium">
                    {route(r.routeKey)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTime(addHours(dep, -catalogue.config.cutOffHours))}
                  </td>
                  <td className="text-railway-blue-900 px-4 py-3 font-medium whitespace-nowrap">
                    {formatDateTime(dep)}
                  </td>
                  <td className="px-4 py-3">
                    {r.blocked ? (
                      <span className="rounded-md bg-[#fdecec] px-2 py-0.5 text-xs font-bold text-[#8a1a1a]">
                        No service – {r.reason}
                      </span>
                    ) : (
                      <span className="bg-railway-green-100 text-railway-green-700 rounded-md px-2 py-0.5 text-xs font-bold">
                        Scheduled
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
