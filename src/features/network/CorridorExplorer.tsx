'use client';

import { useState } from 'react';
import type { Catalogue } from '@/engine';
import { useCatalogueState } from '@/features/quote/catalogue-client';
import { flag } from '@/lib/page-meta';

interface Corridor {
  tag: string;
  countries: string[];
  /** Stops in order when the corridor is a single line, otherwise null. */
  stops: string[] | null;
  segments: { from: string; to: string; km: number }[];
  km: number;
}

/** Corridors are the active LINKS of the Sheet grouped by CorridorTag. */
function corridorsOf(cat: Catalogue): Corridor[] {
  const term = new Map(cat.terminals.map((t) => [t.id, t]));
  const groups = new Map<string, typeof cat.links>();
  for (const l of cat.links) {
    if (!l.active || !term.get(l.from)?.active || !term.get(l.to)?.active) continue;
    const tag = l.corridorTag || 'Other links';
    groups.set(tag, [...(groups.get(tag) ?? []), l]);
  }
  const city = (id: string) => term.get(id)?.city ?? id;
  return [...groups.entries()].map(([tag, links]) => {
    const degree = new Map<string, string[]>();
    for (const l of links) {
      degree.set(l.from, [...(degree.get(l.from) ?? []), l.to]);
      degree.set(l.to, [...(degree.get(l.to) ?? []), l.from]);
    }
    let stops: string[] | null = null;
    const ends = [...degree].filter(([, n]) => n.length === 1).map(([id]) => id);
    const isLine = ends.length === 2 && [...degree.values()].every((n) => n.length <= 2);
    if (isLine) {
      const order = [ends[0]!];
      while (order.length < degree.size) {
        const next = degree.get(order.at(-1)!)!.find((n) => !order.includes(n));
        if (!next) break;
        order.push(next);
      }
      stops = order.map(city);
    }
    const countries = [
      ...new Set(
        links.flatMap((l) => [term.get(l.from)!.countryCode, term.get(l.to)!.countryCode]),
      ),
    ];
    return {
      tag,
      countries,
      stops,
      segments: links.map((l) => ({ from: city(l.from), to: city(l.to), km: l.distanceKm })),
      km: links.reduce((a, l) => a + l.distanceKm, 0),
    };
  });
}

/** Corridor cards with a country filter: the accessible, text-based view of the network. */
export function CorridorExplorer() {
  const { catalogue } = useCatalogueState();
  const [country, setCountry] = useState('ALL');
  const corridors = corridorsOf(catalogue);
  const name = (code: string) => catalogue.countries.find((c) => c.code === code)?.name ?? code;
  const countries = catalogue.countries
    .map((c) => c.code)
    .filter((c) => corridors.some((k) => k.countries.includes(c)));
  const shown = corridors.filter((c) => country === 'ALL' || c.countries.includes(country));

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
              {c === 'ALL' ? 'All corridors' : name(c)}
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
            key={c.tag}
            className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-2xl leading-none">
                {c.countries.map(flag).join('')}
              </span>
              <div>
                <h3 className="text-railway-blue-900 font-mono font-bold">{c.tag}</h3>
                <p className="text-sm text-neutral-600">{c.countries.map(name).join(' · ')}</p>
              </div>
            </div>
            {c.stops ? (
              <ol className="relative mt-5 space-y-3 pl-6" aria-label={`${c.tag} stops in order`}>
                <span
                  aria-hidden="true"
                  className="bg-railway-green-600 absolute top-2 bottom-2 left-[0.4rem] w-0.5 rounded"
                />
                {c.stops.map((s, i) => (
                  <li key={`${s}-${i}`} className="relative text-sm">
                    <span
                      aria-hidden="true"
                      className={`border-railway-green-600 absolute top-1 -left-6 size-3.5 rounded-full border-2 ${i === 0 || i === c.stops!.length - 1 ? 'bg-railway-green-600' : 'bg-white'}`}
                    />
                    <span
                      className={
                        i === 0 || i === c.stops!.length - 1
                          ? 'text-railway-blue-900 font-semibold'
                          : 'text-neutral-700'
                      }
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="mt-5 space-y-2 text-sm" aria-label={`${c.tag} links`}>
                {c.segments.map((s) => (
                  <li key={`${s.from}-${s.to}`} className="text-neutral-700">
                    <span className="text-railway-blue-900 font-semibold">{s.from}</span> –{' '}
                    <span className="text-railway-blue-900 font-semibold">{s.to}</span>{' '}
                    <span className="text-neutral-600">· {s.km.toLocaleString('en-GB')} km</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-auto pt-5 text-xs font-semibold text-neutral-600">
              {c.segments.length} link{c.segments.length > 1 ? 's' : ''} ·{' '}
              {c.km.toLocaleString('en-GB')} km of track
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
