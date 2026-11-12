'use client';

import { useState } from 'react';
import { COUNTRY_NAMES, flag } from '@/lib/page-meta';

export interface Corridor {
  id: string;
  country: string;
  name: string;
  network: string;
  stops: string[];
}

const ORDER = ['ES', 'FR', 'IT', 'PT', 'JO', 'EG'];

/** Corridor cards with a country filter: the accessible, text-based view of the network. */
export function CorridorExplorer({ corridors }: { corridors: Corridor[] }) {
  const [country, setCountry] = useState('ALL');
  const countries = ORDER.filter((c) => corridors.some((k) => k.country === c));
  const shown = corridors.filter((c) => country === 'ALL' || c.country === country);

  return (
    <div>
      <fieldset>
        <legend className="text-railway-blue-900 text-sm font-semibold">Filter by country</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {['ALL', ...countries].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={country === c}
              onClick={() => setCountry(c)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                country === c
                  ? 'border-railway-blue-900 bg-railway-blue-900 text-white'
                  : 'text-railway-blue-900 hover:border-railway-blue-700 border-neutral-200 bg-white'
              }`}
            >
              {c !== 'ALL' && <span aria-hidden="true">{flag(c)}</span>}
              {c === 'ALL' ? 'All corridors' : COUNTRY_NAMES[c]}
            </button>
          ))}
        </div>
      </fieldset>
      <p role="status" aria-live="polite" className="mt-5 text-sm text-neutral-600">
        Showing {shown.length} of {corridors.length} corridors
      </p>
      <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li
            key={c.id}
            className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-2xl leading-none">
                {flag(c.country)}
              </span>
              <div>
                <h3 className="text-railway-blue-900 font-bold">{c.name}</h3>
                <p className="text-sm text-neutral-600">{c.network}</p>
              </div>
            </div>
            <ol className="relative mt-5 space-y-3 pl-6" aria-label={`${c.name} stops in order`}>
              <span
                aria-hidden="true"
                className="bg-railway-green-600 absolute top-2 bottom-2 left-[0.4rem] w-0.5 rounded"
              />
              {c.stops.map((s, i) => (
                <li key={`${s}-${i}`} className="relative text-sm">
                  <span
                    aria-hidden="true"
                    className={`border-railway-green-600 absolute top-1 -left-6 size-3.5 rounded-full border-2 ${i === 0 || i === c.stops.length - 1 ? 'bg-railway-green-600' : 'bg-white'}`}
                  />
                  <span
                    className={
                      i === 0 || i === c.stops.length - 1
                        ? 'text-railway-blue-900 font-semibold'
                        : 'text-neutral-700'
                    }
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-auto pt-5 text-xs font-semibold text-neutral-600">
              {c.stops.length} stops
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
