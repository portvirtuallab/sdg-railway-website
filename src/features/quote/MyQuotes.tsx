'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  buildHandoff,
  effectiveStatus,
  formatDateTime,
  placeName,
  type Booking,
  type Quote,
  type TerminalOrders,
} from '@/engine';
import { backend, clearDemoData, isFailure, type TeamData } from './backend';
import { useCatalogue } from './catalogue-client';
import { money, STATUS_LABEL } from './format';
import { QuoteDocument } from './QuoteDocument';
import { REQUOTE_KEY } from './requote';

const input =
  'min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-railway-blue-700';
const btn = 'inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-semibold';

function bookingFor(data: TeamData, quote: Quote): Booking | null {
  return (
    data.bookings.find((b) => b.quoteRef === quote.ref && b.quoteVersion === quote.version) ?? null
  );
}

const statusOf = (q: Quote) => effectiveStatus(q, new Date());

export function MyQuotes() {
  const params = useSearchParams();
  const catalogue = useCatalogue();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinInput, setPinInput] = useState(params.get('pin') ?? '');
  const [pin, setPin] = useState(params.get('pin') ?? '');
  const [pinError, setPinError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ ref: string; v: number } | null>(
    params.get('ref') ? { ref: params.get('ref')!, v: Number(params.get('v') ?? 1) } : null,
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const team = data?.team;

  // Load the team's quotes from the register whenever the PIN changes.
  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    backend.list(pin).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (isFailure(res)) {
        setPinError(res.errors.map((e) => e.message).join(' '));
        setData(null);
      } else {
        setPinError(null);
        setData(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pin]);

  async function reload() {
    const res = await backend.list(pin);
    if (!isFailure(res)) setData(res);
  }

  function openTeam(e: React.FormEvent) {
    e.preventDefault();
    const next = pinInput.trim();
    if (!/^\d{4}$/.test(next)) {
      setPinError('Enter your team’s 4-digit PVL PIN.');
      return;
    }
    setSelected(null);
    setLoading(true);
    if (next === pin) void reload().then(() => setLoading(false));
    else setPin(next);
  }

  const quotes = data ? [...data.quotes].sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)) : [];
  const current = selected
    ? quotes.find((q) => q.ref === selected.ref && q.version === selected.v)
    : undefined;

  return (
    <div className="grid gap-8">
      <form
        onSubmit={openTeam}
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 print:hidden"
      >
        <div className="grid gap-1.5">
          <label htmlFor="mq-pin" className="text-railway-blue-900 text-sm font-semibold">
            Team PIN
          </label>
          <input
            id="mq-pin"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            className={`${input} w-40`}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            aria-invalid={pinError ? true : undefined}
            aria-describedby={pinError ? 'mq-pin-err' : undefined}
          />
        </div>
        <button type="submit" className={`${btn} bg-railway-blue-900 text-white`}>
          Show quotes
        </button>
        {loading && (
          <p role="status" className="text-sm text-neutral-600">
            Loading the register…
          </p>
        )}
        {team && !loading && (
          <p className="text-sm text-neutral-600">
            Showing <strong className="text-railway-blue-900">{team.name}</strong>
            {team.role === 'trainer' ? ' (all teams)' : ''}
          </p>
        )}
        {pinError && (
          <p id="mq-pin-err" role="alert" className="w-full text-sm font-semibold text-[#8a1a1a]">
            {pinError}
          </p>
        )}
      </form>

      {team && data && (
        <section aria-labelledby="mq-list" className="print:hidden">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="mq-list" className="text-railway-blue-900 text-2xl font-bold">
              Quotes and bookings
            </h2>
            <Link
              href="/request-a-quotation/"
              className={`${btn} bg-railway-green-700 hover:bg-railway-green-800 text-white`}
            >
              <Icon name="quote" className="size-4" /> New quote
            </Link>
          </div>
          {quotes.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-neutral-600">
              No quotes yet for {team.name}
              {backend.mode === 'demo' ? ' in this browser' : ''}.{' '}
              <Link
                href="/request-a-quotation/?example=1"
                className="text-railway-blue-700 font-semibold underline"
              >
                Start with the worked example
              </Link>
              .
            </div>
          ) : (
            <div
              className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-neutral-200"
              tabIndex={0}
              role="region"
              aria-label="Quotes table"
            >
              <table className="w-full min-w-[46rem] text-left text-sm">
                <caption className="sr-only">Quotes of {team.name}</caption>
                <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Quote
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Route
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Booking and train
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {quotes.map((q) => {
                    const b = bookingFor(data, q);
                    const isSel = current === q;
                    return (
                      <tr
                        key={`${q.ref}-${q.version}`}
                        className={isSel ? 'bg-railway-green-100/60' : ''}
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelected({ ref: q.ref, v: q.version })}
                            className="text-railway-blue-700 min-h-11 text-left font-mono font-semibold underline underline-offset-4"
                            aria-current={isSel ? 'true' : undefined}
                          >
                            {q.ref} v{q.version}
                          </button>
                          <span className="block text-xs text-neutral-600">
                            {formatDateTime(q.issuedAt)}
                            {team.role === 'trainer' ? ` · ${q.team}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {placeName(catalogue, q.request.origin)} →{' '}
                          {placeName(catalogue, q.request.destination)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {money(q.total, q.currency)}
                        </td>
                        <td className="px-4 py-3">{STATUS_LABEL[statusOf(q)]}</td>
                        <td className="px-4 py-3">
                          {b ? (
                            <>
                              <span className="font-mono font-semibold">{b.ref}</span>
                              <span className="block text-xs text-neutral-600">
                                {b.status === 'confirmed'
                                  ? `Train ${formatDateTime(b.train.departure)}`
                                  : 'Train pending'}
                              </span>
                            </>
                          ) : (
                            <span className="text-neutral-600">–</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {team && data && current && (
        <QuoteDetail
          key={`${current.ref}-${current.version}`}
          quote={current}
          booking={bookingFor(data, current)}
          pin={pin}
          onChange={reload}
        />
      )}

      {team && backend.mode === 'demo' && (
        <div className="print:hidden">
          {confirmReset ? (
            <div
              role="alertdialog"
              aria-labelledby="reset-q"
              className="flex flex-wrap items-center gap-3 rounded-xl bg-[#fdecec] p-4 text-sm text-[#8a1a1a]"
            >
              <p id="reset-q" className="font-semibold">
                Delete every quote and booking stored in this browser? This cannot be undone.
              </p>
              <button
                type="button"
                className={`${btn} bg-[#8a1a1a] text-white`}
                onClick={() => {
                  clearDemoData();
                  setConfirmReset(false);
                  setSelected(null);
                  void reload();
                }}
              >
                Delete all
              </button>
              <button
                type="button"
                className={`${btn} border border-[#8a1a1a]`}
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-sm font-semibold text-neutral-600 underline underline-offset-4"
            >
              Reset demo data in this browser
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuoteDetail({
  quote,
  booking,
  pin,
  onChange,
}: {
  quote: Quote;
  booking: Booking | null;
  pin: string;
  onChange: () => Promise<void>;
}) {
  const catalogue = useCatalogue();
  const status = booking ? booking.status : statusOf(quote);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const handoff = buildHandoff(catalogue, quote, booking);

  async function accept() {
    setBusy(true);
    const res = await backend.accept(catalogue, pin, quote.ref, quote.version);
    setBusy(false);
    setMsg(
      isFailure(res)
        ? res.errors.map((e) => e.message).join(' ')
        : `Booking ${res.booking.ref} created${res.booking.status === 'confirmed' ? ` on the ${formatDateTime(res.booking.train.departure)} departure` : ' – train pending confirmation'}.`,
    );
    await onChange();
  }

  function requote() {
    try {
      sessionStorage.setItem(
        REQUOTE_KEY,
        JSON.stringify({ ref: quote.ref, request: quote.request }),
      );
    } catch {
      // The form then starts empty.
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(handoff, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `click-and-cargo-${quote.ref}-v${quote.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(handoff, null, 2));
      setMsg('Handoff data copied to the clipboard.');
    } catch {
      setMsg('Copying is not allowed in this browser. Use the download instead.');
    }
  }

  return (
    <section aria-labelledby="detail-title" className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 id="detail-title" className="text-railway-blue-900 text-2xl font-bold">
          {quote.ref} v{quote.version}
        </h2>
        <div className="flex flex-wrap gap-2">
          {status === 'issued' && (
            <button
              type="button"
              onClick={accept}
              disabled={busy}
              className={`${btn} bg-railway-green-700 hover:bg-railway-green-800 text-white disabled:opacity-60`}
            >
              <Icon name="check" className="size-4" /> Accept quote
            </button>
          )}
          {(status === 'issued' || status === 'expired') && (
            <Link
              href={`/request-a-quotation/?requote=${encodeURIComponent(quote.ref)}`}
              onClick={requote}
              className={`${btn} text-railway-blue-900 border border-neutral-200 bg-white`}
            >
              New version
            </Link>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className={`${btn} text-railway-blue-900 border border-neutral-200 bg-white`}
          >
            <Icon name="download" className="size-4" /> Print or save as PDF
          </button>
        </div>
      </div>
      {msg && (
        <p
          role="status"
          className="bg-railway-blue-100 text-railway-blue-950 rounded-xl p-3 text-sm print:hidden"
        >
          {msg}
        </p>
      )}

      <QuoteDocument quote={quote} status={status} booking={booking} />

      {booking && <TerminalOrdersForm booking={booking} quote={quote} pin={pin} />}

      <section
        aria-labelledby="handoff-title"
        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-7 print:hidden"
      >
        <h3 id="handoff-title" className="text-railway-blue-900 text-lg font-bold">
          Hand off to Click & Cargo
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Structured summary for your ERP file: references, parties, UTI, route, legs, prices,
          dates, train and terminal orders. Until there is an API, download it or copy it.
        </p>
        {handoff.readyForErp ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={download}
              className={`${btn} bg-railway-blue-900 text-white`}
            >
              <Icon name="download" className="size-4" /> Download handoff (JSON)
            </button>
            <button
              type="button"
              onClick={copy}
              className={`${btn} text-railway-blue-900 border border-neutral-200 bg-white`}
            >
              Copy handoff data
            </button>
          </div>
        ) : (
          <p className="border-notice-border bg-notice-bg text-notice-text mt-4 rounded-xl border-l-4 p-4 text-sm">
            <strong>Not ready for the ERP.</strong> {handoff.blockedReason}
          </p>
        )}
        <details className="mt-4">
          <summary className="text-railway-blue-700 min-h-11 cursor-pointer py-2 text-sm font-semibold">
            Show the handoff sheet
          </summary>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {[
              [
                'Quote reference',
                `${handoff.references.quote} v${handoff.references.quoteVersion}`,
              ],
              ['Booking reference', handoff.references.booking ?? 'Not booked'],
              ['Customer (forwarder)', handoff.parties.customer],
              ['Shipper', handoff.parties.shipper],
              ['Consignee', handoff.parties.consignee],
              ['Incoterm', handoff.incoterm],
              ['UTI', `${handoff.cargo.quantity} × ${handoff.cargo.uti}`],
              ['Route', `${handoff.route.origin} → ${handoff.route.destination}`],
              [
                'Train',
                `${handoff.service.name} – ${handoff.train.status}${handoff.train.departure ? `, ${formatDateTime(handoff.train.departure)}` : ''}`,
              ],
              ['Supplier cost (total)', money(handoff.total, handoff.currency)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="grid grid-cols-[10rem_1fr] gap-2 border-b border-neutral-200 py-1.5"
              >
                <dt className="text-neutral-600">{k}</dt>
                <dd className="text-railway-blue-900 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      </section>
    </section>
  );
}

function TerminalOrdersForm({
  booking,
  quote,
  pin,
}: {
  booking: Booking;
  quote: Quote;
  pin: string;
}) {
  const catalogue = useCatalogue();
  const [o, setO] = useState<TerminalOrders>(booking.terminalOrders);
  const [saved, setSaved] = useState('');
  const originRoadIncluded = quote.legs.find((l) => l.kind === 'origin-road')?.scope === 'included';
  const destRoadIncluded =
    quote.legs.find((l) => l.kind === 'destination-road')?.scope === 'included';
  const set = (k: keyof TerminalOrders, v: string) => {
    setO((s) => ({ ...s, [k]: v }));
    setSaved('');
  };
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaved('Saving…');
        const res = await backend.orders(pin, booking.ref, o);
        setSaved(isFailure(res) ? res.errors.map((x) => x.message).join(' ') : 'Saved.');
      }}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-7"
      aria-labelledby="orders-title"
    >
      <h3 id="orders-title" className="text-railway-blue-900 text-lg font-bold">
        Terminal delivery and collection orders
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        Driver and vehicle registration for the gate-in and gate-out orders.{' '}
        {originRoadIncluded || destRoadIncluded
          ? `Where ${catalogue.config.haulierName} is included, enter the details the haulier gives you.`
          : 'In a terminal-to-terminal service your team arranges both road legs.'}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(
          [
            ['deliveryDriver', 'Delivery driver (gate in)'],
            ['deliveryVehicle', 'Delivery vehicle registration'],
            ['collectionDriver', 'Collection driver (gate out)'],
            ['collectionVehicle', 'Collection vehicle registration'],
          ] as const
        ).map(([k, l]) => (
          <div key={k} className="grid gap-1.5">
            <label htmlFor={`to-${k}`} className="text-railway-blue-900 text-sm font-semibold">
              {l}
            </label>
            <input
              id={`to-${k}`}
              className={input}
              value={o[k]}
              onChange={(e) => set(k, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 print:hidden">
        <button type="submit" className={`${btn} bg-railway-blue-900 text-white`}>
          Save orders
        </button>
        <span role="status" className="text-railway-green-700 text-sm">
          {saved}
        </span>
      </div>
    </form>
  );
}
