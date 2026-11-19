'use client';

import Link from 'next/link';
import { Callout } from '@/components/ui/layout';
import { bookableTerminals } from '@/engine';
import { backend } from './backend';
import { useCatalogueState } from './catalogue-client';

/** What can be quoted and where quotes are kept, from the Sheet (live when available). */
export function QuoteInfo() {
  const { catalogue: cat, source } = useCatalogueState();
  const terminals = bookableTerminals(cat);
  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <p className="font-display text-railway-blue-900 text-3xl font-bold">
            {terminals.length}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            terminals in {new Set(terminals.map((t) => t.countryCode)).size} countries. The rail
            route between any two connected terminals is found automatically.{' '}
            <Link href="/network-routes/#terminals" className="text-railway-blue-700 underline">
              See the terminals
            </Link>
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <p className="font-display text-railway-blue-900 text-3xl font-bold">
            {cat.services.filter((s) => s.active).length}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            rail services to compare:{' '}
            {cat.services
              .filter((s) => s.active)
              .map((s) => s.name)
              .join(', ')}
            .{' '}
            <Link href="/network-routes/#trains" className="text-railway-blue-700 underline">
              Timetable
            </Link>
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <p className="font-display text-railway-blue-900 text-3xl font-bold">
            {cat.doors.length}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            door areas with {cat.config.haulierName} road legs:{' '}
            {cat.doors.map((d) => d.name).join('; ')}.
          </p>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Callout title="Simulated prices">
          Prices, routes and trains come from the SDG Railway Sheet maintained by the trainers
          {source === 'live' ? ' (read live)' : ''}. They are for teaching only and are not a
          commercial tariff.
        </Callout>
        <Callout title="Where your quotes are kept" tone="info">
          {backend.mode === 'live'
            ? 'Every quote, new version and booking is written to the SDG Railway register (Google Sheet) with a PDF, so trainers can follow each team.'
            : 'Demo mode: the quotation service is not connected, so quotes and bookings are saved in this browser only.'}
        </Callout>
      </div>
    </>
  );
}
