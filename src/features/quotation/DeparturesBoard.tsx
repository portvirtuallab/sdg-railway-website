'use client';

import { useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import { buildDepartures, RAIL_SERVICES, type RailService } from '@/data/departures';

const PILL: Record<RailService['id'], string> = {
  'STD-RAIL': 'bg-railway-blue-100 text-railway-blue-900',
  'EXP-RAIL': 'bg-[#fdecec] text-[#8a1a1a]',
  'GRN-RAIL': 'bg-railway-green-100 text-railway-green-700',
};

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const noopSubscribe = () => () => {};
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function DeparturesBoard() {
  // The board depends on today's date, so it is only rendered in the browser (null on the server).
  const todayIso = useSyncExternalStore(noopSubscribe, localToday, () => null);
  const [filter, setFilter] = useState<'ALL' | RailService['id']>('ALL');
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
            <p className="font-display font-bold">Departures board – next 7 days</p>
            <p className="text-xs text-white/75">
              Scenario timetable generated in your browser, not a live schedule
            </p>
          </div>
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2 border-b border-neutral-200 p-4"
        role="group"
        aria-label="Filter by service"
      >
        {(['ALL', ...RAIL_SERVICES.map((s) => s.id)] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
              filter === id
                ? 'border-railway-blue-900 bg-railway-blue-900 text-white'
                : 'text-railway-blue-900 hover:border-railway-blue-700 border-neutral-200'
            }`}
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
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Scenario departures for the next seven days</caption>
          <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-600 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Date
              </th>
              <th scope="col" className="px-4 py-3">
                Departure
              </th>
              <th scope="col" className="px-4 py-3">
                Service
              </th>
              <th scope="col" className="px-4 py-3">
                Route
              </th>
              <th scope="col" className="px-4 py-3">
                Dangerous goods
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
                  No departures for this service in the next 7 days.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr
                key={`${r.date}-${r.service.id}-${i}`}
                className={r.date === todayIso ? 'bg-notice-bg/50' : ''}
              >
                <td className="text-railway-blue-900 px-4 py-3 font-medium whitespace-nowrap">
                  {formatDate(r.date)}
                </td>
                <td className="px-4 py-3 font-mono whitespace-nowrap">
                  {r.service.time}
                  <span className="block text-xs text-neutral-600">ETA +{r.etaHours} h</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${PILL[r.service.id]}`}
                  >
                    {r.service.name}
                  </span>
                  <span className="block pt-1 text-xs text-neutral-600">{r.service.trainName}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-railway-blue-900 font-medium">{r.route.label}</span>
                  <span className="block font-mono text-xs text-neutral-600">
                    {r.route.km} km · {r.service.speedKmh} km/h
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.service.dangerousGoods ? 'Allowed' : 'Not accepted'}
                </td>
                <td className="px-4 py-3">
                  {r.cancelled ? (
                    <span className="rounded-md bg-[#fdecec] px-2 py-0.5 text-xs font-bold text-[#8a1a1a]">
                      Cancelled
                    </span>
                  ) : r.date === todayIso ? (
                    <span className="bg-notice-bg text-notice-text rounded-md px-2 py-0.5 text-xs font-bold">
                      Today
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
