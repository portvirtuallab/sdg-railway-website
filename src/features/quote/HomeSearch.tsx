'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import catalogue from '@/data/demo-catalogue.json';

const field =
  'min-h-11 w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-base text-neutral-900 outline-none focus:border-railway-green-600';

function PlaceOptions() {
  return (
    <>
      <optgroup label="Door (road leg by Play Haulier)">
        {catalogue.doors.map((d) => (
          <option key={d.id} value={`door:${d.id}`}>
            {d.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="Terminal">
        {catalogue.terminals.map((t) => (
          <option key={t.id} value={`terminal:${t.id}`}>
            {t.city} terminal
          </option>
        ))}
      </optgroup>
    </>
  );
}

/** Quick quote search on the homepage: hands the values over to the quote form. */
export function HomeSearch() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [itu, setItu] = useState('');
  const [date, setDate] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        if (from) q.set('from', from);
        if (to) q.set('to', to);
        if (itu) q.set('itu', itu);
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
          <PlaceOptions />
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="hs-to" className="text-sm font-semibold text-white">
          To
        </label>
        <select id="hs-to" className={field} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Destination</option>
          <PlaceOptions />
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="hs-itu" className="text-sm font-semibold text-white">
          Loading unit
        </label>
        <select id="hs-itu" className={field} value={itu} onChange={(e) => setItu(e.target.value)}>
          <option value="">Any</option>
          {catalogue.itus.map((u) => (
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
          min={catalogue.validFrom}
          max={catalogue.validTo}
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
