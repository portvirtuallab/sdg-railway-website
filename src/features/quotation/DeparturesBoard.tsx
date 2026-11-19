'use client';

import { useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import catalogue from '@/data/demo-catalogue.json';
import { buildDepartures, RAIL_SERVICES } from '@/data/departures';
import { formatDateTime } from '@/features/quote/time';

const PILL: Record<string, string> = {
  'STD-RAIL': 'bg-railway-blue-100 text-railway-blue-900',
  'EXP-RAIL': 'bg-[#fdecec] text-[#8a1a1a]',
  'GRN-RAIL': 'bg-railway-green-100 text-railway-green-700',
};

const noopSubscribe = () => () => {};
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const city = (id: string) => catalogue.terminals.find((t) => t.id === id)?.city ?? id;

export function DeparturesBoard() {
  // The board depends on today's date, so it is only rendered in the browser (null on the server).
  const todayIso = useSyncExternalStore(noopSubscribe, localToday, () => null);
  const [filter, setFilter] = useState<string>('ALL');
  const today = todayIso ? new Date(`${todayIso}T12:00:00`) : null;
  const rows = today
    ? buildDepartures(today).filter((r) => filter === 'ALL' || r.service.id === filter)
    : [];

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
      <div className="bg-railway-blue-900 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <Icon name="clock" className="text-railway-green-100 size-6" />
          <div>
            <p className="font-display font-bold">Departures – next 7 days</p>
            <p className="text-xs text-white/75">
              Generated from test catalogue {catalogue.version}, not a live schedule
            </p>
          </div>
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2 border-b border-neutral-200 p-4"
        role="group"
        aria-label="Filter by service"
      >
        {['ALL', ...RAIL_SERVICES.map((s) => s.id)].map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${filter === id ? 'border-railway-blue-900 bg-railway-blue-900 text-white' : 'text-railway-blue-900 hover:border-railway-blue-700 border-neutral-200'}`}
          >
            {id === 'ALL' ? 'All services' : RAIL_SERVICES.find((s) => s.id === id)!.name}
          </button>
        ))}
      </div>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Departures table (scrolls horizontally)"
      >
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Scenario departures for the next seven days</caption>
          <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-600 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Train
              </th>
              <th scope="col" className="px-4 py-3">
                Route
              </th>
              <th scope="col" className="px-4 py-3">
                Cut-off
              </th>
              <th scope="col" className="px-4 py-3">
                Departure
              </th>
              <th scope="col" className="px-4 py-3">
                Arrival
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {!today && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-600">
                  Loading timetable…
                </td>
              </tr>
            )}
            {today && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-600">
                  No service in the next 7 days for this selection.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={`${r.lane.id}-${r.date}`}
                className={r.date === todayIso ? 'bg-notice-bg/50' : ''}
              >
                <td className="px-4 py-3">
                  <span className="text-railway-blue-900 font-mono font-semibold">
                    {r.lane.train.id}
                  </span>
                  <span
                    className={`mt-1 block w-fit rounded-md px-2 py-0.5 text-xs font-bold ${PILL[r.service.id]}`}
                  >
                    {r.service.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-railway-blue-900 font-medium">
                    {city(r.lane.from)} → {city(r.lane.to)}
                  </span>
                  <span className="block text-xs text-neutral-600">
                    {r.lane.distanceKm.toLocaleString('en-GB')} km ·{' '}
                    {r.lane.dangerousGoods ? 'dangerous goods accepted' : 'no dangerous goods'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(r.cutOff)}</td>
                <td className="text-railway-blue-900 px-4 py-3 font-medium whitespace-nowrap">
                  {formatDateTime(r.departure)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(r.arrival)}</td>
                <td className="px-4 py-3">
                  {r.cancelled ? (
                    <span className="rounded-md bg-[#fdecec] px-2 py-0.5 text-xs font-bold text-[#8a1a1a]">
                      No service
                    </span>
                  ) : (
                    <span className="bg-railway-green-100 text-railway-green-700 rounded-md px-2 py-0.5 text-xs font-bold">
                      Scheduled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
