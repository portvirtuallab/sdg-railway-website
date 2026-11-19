'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { bookableTerminals } from '@/engine';
import { terminalImage } from '@/content/terminal-images';
import { useCatalogueState } from '@/features/quote/catalogue-client';
import { flag } from '@/lib/page-meta';

function normalise(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Terminals of the SDG Railway network, read from the TERMINALS tab of the Sheet. */
export function TerminalDirectory() {
  const { catalogue } = useCatalogueState();
  const [country, setCountry] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [dgOnly, setDgOnly] = useState(false);

  const terminals = bookableTerminals(catalogue);
  const countryName = (code: string) =>
    catalogue.countries.find((c) => c.code === code)?.name ?? code;
  const countries = catalogue.countries
    .filter((c) => terminals.some((t) => t.countryCode === c.code))
    .map((c) => c.code);
  const q = normalise(query.trim());
  const results = terminals
    .filter(
      (t) =>
        (country === 'ALL' || t.countryCode === country) &&
        (!dgOnly || t.dgCapable) &&
        (!q || normalise(`${t.city} ${t.name} ${countryName(t.countryCode)}`).includes(q)),
    )
    .sort((a, b) => (terminalImage(b.city) ? 1 : 0) - (terminalImage(a.city) ? 1 : 0));

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
            Dangerous goods only
          </label>
        </div>
        <fieldset>
          <legend className="text-railway-blue-900 text-sm font-semibold">Country</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {['ALL', ...countries].map((c) => {
              const count =
                c === 'ALL'
                  ? terminals.length
                  : terminals.filter((t) => t.countryCode === c).length;
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
                  {c === 'ALL' ? 'All countries' : countryName(c)}
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
          {results.map((t) => {
            const image = terminalImage(t.city);
            return (
              <li
                key={t.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md"
              >
                <div className="from-railway-blue-900 to-railway-blue-700 relative aspect-[16/10] overflow-hidden bg-linear-to-br">
                  {image ? (
                    <Img
                      id={image}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                    />
                  ) : (
                    <Icon
                      name="pin"
                      className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-white/30"
                    />
                  )}
                  <span className="text-railway-blue-900 absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow">
                    <span aria-hidden="true">{flag(t.countryCode)}</span>
                    {countryName(t.countryCode)}
                  </span>
                  {t.dgCapable && (
                    <span className="bg-notice-bg text-notice-text absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow">
                      <Icon name="hazard" className="size-3.5" /> DG
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-railway-blue-900 text-lg font-bold">{t.city}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{t.name}</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {t.type}
                    {t.notes ? ` · ${t.notes}` : ''}
                  </p>
                  <Link
                    href={`/request-a-quotation/?from=terminal:${encodeURIComponent(t.id)}#quote-form`}
                    className="text-railway-blue-700 mt-auto pt-3 text-sm font-semibold underline underline-offset-4"
                  >
                    Quote from {t.city}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
