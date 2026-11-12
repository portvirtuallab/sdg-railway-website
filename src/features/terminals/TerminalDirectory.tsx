'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { COUNTRY_NAMES, flag } from '@/lib/page-meta';

export interface Terminal {
  id: string;
  country: string;
  city: string;
  name: string;
  dangerousGoods: boolean;
  image: string | null;
}

const ORDER = ['ES', 'FR', 'IT', 'PT', 'JO', 'EG'];

function normalise(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function TerminalDirectory({ terminals }: { terminals: Terminal[] }) {
  const [country, setCountry] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [dgOnly, setDgOnly] = useState(false);

  const countries = ORDER.filter((c) => terminals.some((t) => t.country === c));
  const q = normalise(query.trim());
  const results = terminals.filter(
    (t) =>
      (country === 'ALL' || t.country === country) &&
      (!dgOnly || t.dangerousGoods) &&
      (!q || normalise(`${t.city} ${t.name} ${COUNTRY_NAMES[t.country]}`).includes(q)),
  );

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label
              htmlFor="terminal-search"
              className="text-railway-blue-900 text-sm font-semibold"
            >
              Search terminals
            </label>
            <div className="relative mt-1">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-neutral-600"
              />
              <input
                id="terminal-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City or terminal name, e.g. Verona"
                className="focus:border-railway-blue-700 min-h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pr-3 pl-10 text-base outline-none focus:bg-white"
              />
            </div>
          </div>
          <label className="text-railway-blue-900 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={dgOnly}
              onChange={(e) => setDgOnly(e.target.checked)}
              className="accent-railway-green-700 size-4"
            />
            Dangerous goods marked only
          </label>
        </div>
        <fieldset>
          <legend className="text-railway-blue-900 text-sm font-semibold">Country</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {['ALL', ...countries].map((c) => {
              const count =
                c === 'ALL' ? terminals.length : terminals.filter((t) => t.country === c).length;
              const selected = country === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCountry(c)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                    selected
                      ? 'border-railway-blue-900 bg-railway-blue-900 text-white'
                      : 'text-railway-blue-900 hover:border-railway-blue-700 border-neutral-200 bg-white'
                  }`}
                >
                  {c !== 'ALL' && <span aria-hidden="true">{flag(c)}</span>}
                  {c === 'ALL' ? 'All countries' : COUNTRY_NAMES[c]}
                  <span
                    className={`rounded-full px-1.5 text-xs ${selected ? 'bg-white/20' : 'bg-neutral-50 text-neutral-600'}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <p role="status" aria-live="polite" className="mt-5 text-sm text-neutral-600">
        Showing {results.length} of {terminals.length} terminals
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-neutral-600">
          No terminal matches your search. Try another city or choose “All countries”.
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <li
              key={t.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200">
                {t.image && (
                  <Img
                    id={t.image}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                  />
                )}
                <span className="text-railway-blue-900 absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow">
                  <span aria-hidden="true">{flag(t.country)}</span>
                  {COUNTRY_NAMES[t.country]}
                </span>
                {t.dangerousGoods && (
                  <span className="bg-notice-bg text-notice-text absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow">
                    <Icon name="hazard" className="size-3.5" /> DG
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-railway-blue-900 text-lg font-bold">{t.city}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{t.name}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
