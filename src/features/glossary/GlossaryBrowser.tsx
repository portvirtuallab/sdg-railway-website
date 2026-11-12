'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  sdg: string | null;
}

function normalise(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function GlossaryBrowser({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState('');
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.term.localeCompare(b.term)),
    [entries],
  );
  const results = useMemo(() => {
    const q = normalise(query.trim());
    return q ? sorted.filter((e) => normalise(`${e.term} ${e.definition}`).includes(q)) : sorted;
  }, [sorted, query]);
  const letters = [...new Set(sorted.map((e) => e.term[0]!.toUpperCase()))];
  const groups = letters
    .map((l) => ({ letter: l, items: results.filter((e) => e.term[0]!.toUpperCase() === l) }))
    .filter((g) => g.items.length);

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <label htmlFor="glossary-search" className="text-railway-blue-900 text-sm font-semibold">
          Search the glossary
        </label>
        <div className="relative mt-1">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-neutral-600"
          />
          <input
            id="glossary-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. corridor, ITU, RID"
            className="focus:border-railway-blue-700 min-h-11 w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-10 text-base outline-none"
          />
        </div>
        <p role="status" aria-live="polite" className="mt-3 text-sm text-neutral-600">
          {results.length} of {entries.length} terms
        </p>
        <nav aria-label="Glossary letters" className="mt-4 hidden lg:block">
          <ul className="flex flex-wrap gap-1.5">
            {groups.map(({ letter: l }) => (
              <li key={l}>
                <a
                  href={`#letter-${l}`}
                  className="text-railway-blue-900 hover:bg-railway-green-100 inline-flex size-11 items-center justify-center rounded-md bg-white font-semibold ring-1 ring-neutral-200"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div>
        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-neutral-600">
            No term matches “{query}”.
          </div>
        )}
        {groups.map((g) => (
          <section
            key={g.letter}
            aria-labelledby={`letter-${g.letter}`}
            className="scroll-mt-24 [&+&]:mt-8"
          >
            <h3
              id={`letter-${g.letter}`}
              className="text-railway-green-700 flex items-center gap-3 text-2xl font-bold"
            >
              {g.letter}
              <span aria-hidden="true" className="h-px flex-1 bg-neutral-200" />
            </h3>
            <dl className="mt-3 grid gap-3 md:grid-cols-2">
              {g.items.map((e) => (
                <div
                  key={e.id}
                  id={e.id}
                  className="scroll-mt-24 rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
                >
                  <dt className="text-railway-blue-900 font-semibold">{e.term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                    {e.definition}
                  </dd>
                  {e.sdg && (
                    <dd className="mt-3">
                      <span className="bg-railway-green-100 text-railway-green-700 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {e.sdg}
                      </span>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
