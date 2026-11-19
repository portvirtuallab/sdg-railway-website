'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { addDays, localNow, type Catalogue } from '@/engine';
import { useCatalogue } from './catalogue-client';

const field =
  'min-h-11 w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-base text-neutral-900 outline-none focus:border-railway-green-600';

function PlaceOptions({ catalogue }: { catalogue: Catalogue }) {
  const countries = catalogue.countries.filter((c) => c.active);
  return (
    <>
      <optgroup label={`Door (road leg by ${catalogue.config.haulierName})`}>
        {catalogue.doors.map((d) => (
          <option key={d.id} value={`door:${d.id}`}>
            {d.name}
          </option>
        ))}
      </optgroup>
      {countries.map((c) => {
        const list = catalogue.terminals
          .filter((t) => t.active && t.countryCode === c.code)
          .sort((a, b) => a.city.localeCompare(b.city));
        return list.length ? (
          <optgroup key={c.code} label={`Terminals – ${c.name}`}>
            {list.map((t) => (
              <option key={t.id} value={`terminal:${t.id}`}>
                {t.city} – {t.name}
              </option>
            ))}
          </optgroup>
        ) : null;
      })}
    </>
  );
}

/** Quick quote search on the homepage: hands the values over to the quote form. */
export function HomeSearch() {
  const router = useRouter();
  const catalogue = useCatalogue();
  const today = localNow(new Date()).slice(0, 10);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [uti, setUti] = useState('');
  const [date, setDate] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        if (from) q.set('from', from);
        if (to) q.set('to', to);
        if (uti) q.set('uti', uti);
        if (date) q.set('date', date);
        router.push(`/request-a-quotation/?${q.toString()}#quote-form`);
      }}
      className="mt-10 grid gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_0.7fr_auto] lg:items-end"
      aria-label="Start a quote"
    >
      <div className="grid gap-1">
        <label htmlFor="hs-from" className="text-sm font-semibold text-white">
          From
        </label>
        <select
          id="hs-from"
          className={field}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          <option value="">Origin</option>
          <PlaceOptions catalogue={catalogue} />
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="hs-to" className="text-sm font-semibold text-white">
          To
        </label>
        <select id="hs-to" className={field} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Destination</option>
          <PlaceOptions catalogue={catalogue} />
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="hs-uti" className="text-sm font-semibold text-white">
          Loading unit
        </label>
        <select id="hs-uti" className={field} value={uti} onChange={(e) => setUti(e.target.value)}>
          <option value="">Any</option>
          {catalogue.utiTypes.map((u) => (
            <option key={u.code} value={u.code}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="hs-date" className="text-sm font-semibold text-white">
          Ready on
        </label>
        <input
          id="hs-date"
          type="date"
          className={field}
          min={addDays(today, 1)}
          max={addDays(today, 180)}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="bg-railway-green-700 hover:bg-railway-green-800 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 font-semibold text-white"
      >
        <Icon name="search" className="size-4" /> Get a quote
      </button>
    </form>
  );
}
