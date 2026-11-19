import catalogue from '@/data/demo-catalogue.json';
import { legLabel, placeName } from './engine';
import { formatDateTime } from './time';
import type { Booking, Quote } from './types';

export function money(n: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

const SCOPE_STYLE: Record<string, string> = {
  included: 'bg-railway-green-100 text-railway-green-700',
  excluded: 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200',
  pending: 'bg-notice-bg text-notice-text',
};

export const STATUS_LABEL: Record<string, string> = {
  issued: 'Issued – awaiting acceptance',
  accepted: 'Accepted',
  expired: 'Expired',
  superseded: 'Superseded by a newer version',
  confirmed: 'Booking confirmed',
  'pending-train': 'Booking – train pending confirmation',
};

/** The quotation as shown on screen, in "My quotes" and in the printable PDF. */
export function QuoteDocument({
  quote,
  status,
  booking,
}: {
  quote: Quote;
  status: string;
  booking: Booking | null;
}) {
  const r = quote.request;
  const itu = catalogue.itus.find((u) => u.code === r.ituCode)!;
  const train = booking?.train ?? quote.train;
  return (
    <article
      className="quote-doc rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"
      aria-labelledby={`q-${quote.ref}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 p-5 sm:p-7">
        <div>
          <p className="text-railway-green-700 text-sm font-semibold tracking-wide uppercase">
            SDG Railway · simulated quotation
          </p>
          <h2
            id={`q-${quote.ref}`}
            className="text-railway-blue-900 mt-1 font-mono text-2xl font-bold"
          >
            {quote.ref}{' '}
            <span className="text-base font-semibold text-neutral-600">v{quote.version}</span>
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Issued {formatDateTime(quote.issuedAt)} · valid until{' '}
            {formatDateTime(quote.expiresAt.slice(0, 10), false)} · catalogue{' '}
            {quote.catalogueVersion}
          </p>
        </div>
        <div className="text-right">
          <span className="bg-railway-blue-100 text-railway-blue-900 inline-flex rounded-full px-3 py-1 text-sm font-semibold">
            {STATUS_LABEL[status] ?? status}
          </span>
          {booking && (
            <p className="text-railway-blue-900 mt-2 font-mono text-sm font-semibold">
              Booking {booking.ref}
            </p>
          )}
        </div>
      </div>

      <p className="border-notice-border/40 bg-notice-bg text-notice-text border-b px-5 py-2 text-xs sm:px-7">
        Educational simulation: SDG Railway, its prices and its operations are simulated. Amounts
        come from DEMO test data and are not a commercial tariff.
      </p>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-neutral-600">Customer</dt>
          <dd className="text-railway-blue-900 font-semibold">{quote.team}</dd>
          <dt className="text-neutral-600">Requested by</dt>
          <dd>{r.requester}</dd>
          <dt className="text-neutral-600">Shipper</dt>
          <dd>{r.shipper}</dd>
          <dt className="text-neutral-600">Consignee</dt>
          <dd>{r.consignee}</dd>
          <dt className="text-neutral-600">Incoterm</dt>
          <dd>{r.incoterm}</dd>
          <dt className="text-neutral-600">Provider</dt>
          <dd>SDG Railway, intermodal carrier (also acting as MTO)</dd>
        </dl>
        <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-neutral-600">From</dt>
          <dd className="text-railway-blue-900 font-semibold">{placeName(catalogue, r.origin)}</dd>
          <dt className="text-neutral-600">To</dt>
          <dd className="text-railway-blue-900 font-semibold">
            {placeName(catalogue, r.destination)}
          </dd>
          <dt className="text-neutral-600">Cargo</dt>
          <dd>
            {r.cargoDescription}, {r.packages} packages, {r.grossWeightKg.toLocaleString('en-GB')}{' '}
            kg gross
          </dd>
          <dt className="text-neutral-600">Loading unit</dt>
          <dd>
            {r.quantity} × {itu.name} ({itu.code})
          </dd>
          <dt className="text-neutral-600">Special</dt>
          <dd>
            {r.dangerousGoods
              ? `Dangerous goods, RID class ${r.dangerousGoods.ridClass}${r.dangerousGoods.unNumber ? `, UN ${r.dangerousGoods.unNumber}` : ''}`
              : 'General cargo'}
            {r.temperatureC !== null && ` · ${r.temperatureC} °C`}
          </dd>
          <dt className="text-neutral-600">Ready on</dt>
          <dd>{formatDateTime(r.readyDate, false)}</dd>
        </dl>
      </div>

      <section className="border-t border-neutral-200 p-5 sm:p-7" aria-label="Train">
        <h3 className="text-railway-blue-900 text-lg font-bold">Train and timing</h3>
        {train.status === 'proposed' ? (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
            {[
              [
                booking?.status === 'confirmed' ? 'Assigned train' : 'Proposed train',
                `${train.trainId} · ${train.serviceName}`,
              ],
              ['Cut-off (gate in)', formatDateTime(train.cutOff)],
              ['Departure', formatDateTime(train.departure)],
              ['Arrival at terminal', formatDateTime(train.arrival)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-neutral-50 p-3">
                <dt className="text-neutral-600">{k}</dt>
                <dd className="text-railway-blue-900 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="border-notice-border bg-notice-bg text-notice-text mt-3 rounded-xl border-l-4 p-4 text-sm">
            <strong>Train pending confirmation.</strong> {train.reason} ERP steps that need a train
            are blocked until SDG Railway confirms one.
          </p>
        )}
        <p className="mt-3 text-sm text-neutral-600">
          Estimated delivery:{' '}
          <strong className="text-railway-blue-900">
            {formatDateTime(quote.deliveryEstimate)}
          </strong>
          {!booking &&
            train.status === 'proposed' &&
            ' · The proposed train is confirmed only when you accept the quote.'}
        </p>
      </section>

      <section className="border-t border-neutral-200 p-5 sm:p-7" aria-label="Legs and scope">
        <h3 className="text-railway-blue-900 text-lg font-bold">Legs and scope</h3>
        <ol className="mt-3 grid gap-2">
          {quote.legs.map((l) => (
            <li
              key={l.kind}
              className="grid gap-1 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[13rem_1fr_auto] sm:items-center sm:gap-4"
            >
              <span className="text-railway-blue-900 font-semibold">{legLabel(l.kind)}</span>
              <span className="text-sm text-neutral-600">
                {l.from === l.to ? l.from : `${l.from} → ${l.to}`} · {l.provider}
                <span className="block text-xs">{l.note}</span>
              </span>
              <span
                className={`justify-self-start rounded-full px-2.5 py-0.5 text-xs font-bold sm:justify-self-end ${SCOPE_STYLE[l.scope]}`}
              >
                {l.scope}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-neutral-200 p-5 sm:p-7" aria-label="Prices">
        <h3 className="text-railway-blue-900 text-lg font-bold">Price by leg</h3>
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Price table">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Price by leg for {quote.ref}</caption>
            <thead className="border-b border-neutral-200 text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="py-2 pr-3">
                  Item
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Qty
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Unit price
                </th>
                <th scope="col" className="py-2 text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {quote.lines.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-3">
                    <span className="text-railway-blue-900 font-medium">{l.label}</span>
                    <span className="block text-xs text-neutral-600">{l.detail}</span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {money(l.unitPrice, quote.currency)}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">
                    {money(l.amount, quote.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-railway-blue-900 border-t-2">
                <th scope="row" colSpan={3} className="py-3 text-base">
                  Total (taxes not included){' '}
                  <span className="bg-notice-bg text-notice-text ml-1 rounded px-1.5 py-0.5 text-xs">
                    DEMO
                  </span>
                </th>
                <td className="text-railway-blue-900 py-3 text-right text-lg font-bold tabular-nums">
                  {money(quote.total, quote.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="grid gap-6 border-t border-neutral-200 p-5 sm:p-7 md:grid-cols-3">
        <section aria-label="Included">
          <h3 className="text-railway-blue-900 font-bold">Included</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {quote.inclusions.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
        <section aria-label="Not included">
          <h3 className="text-railway-blue-900 font-bold">Not included</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {quote.exclusions.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
        <section aria-label="Conditions">
          <h3 className="text-railway-blue-900 font-bold">Conditions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {quote.conditions.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
