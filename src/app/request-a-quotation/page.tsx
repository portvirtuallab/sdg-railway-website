import { Suspense } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ButtonLink, Callout, PageHero, Section } from '@/components/ui/layout';
import catalogue from '@/data/demo-catalogue.json';
import { QuoteForm } from '@/features/quote/QuoteForm';
import { dayName } from '@/features/quote/time';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('request-a-quotation');

const FLOW: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'quote',
    title: 'Quote',
    text: 'Request a door-to-door or terminal-to-terminal offer. You receive an RWQ quote with prices by leg, scope and validity.',
  },
  {
    icon: 'check',
    title: 'Accept',
    text: 'A quote is not a booking. Accepting it asks SDG Railway to confirm capacity on the train.',
  },
  {
    icon: 'train',
    title: 'Train and booking',
    text: 'You get a booking reference linked to the quote and the assigned train – or a “pending confirmation” status.',
  },
  {
    icon: 'route',
    title: 'Hand off to Click & Cargo',
    text: 'Download the handoff data for your ERP file: references, legs, prices, dates and train.',
  },
];

const terminal = (id: string) => catalogue.terminals.find((t) => t.id === id)!;

export default function GetAQuotePage() {
  const page = getPage('request-a-quotation');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-032"
        eyebrow="Intermodal quotation"
        intro="Your team acts as the freight forwarder. SDG Railway, the intermodal carrier, quotes the whole chain: road legs, terminals and the train."
      />

      <Section className="print:hidden">
        <ol className="grid gap-4 md:grid-cols-4">
          {FLOW.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
            >
              <span
                className="font-display text-railway-green-100 absolute top-4 right-4 text-3xl font-bold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="bg-railway-blue-900 inline-flex size-11 items-center justify-center rounded-xl text-white">
                <Icon name={s.icon} />
              </span>
              <h2 className="text-railway-blue-900 mt-3 font-bold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" id="quote-form">
        <Suspense fallback={<p className="text-neutral-600">Loading the quotation form…</p>}>
          <QuoteForm />
        </Suspense>
      </Section>

      <Section
        id="lanes"
        eyebrow={`Test catalogue ${catalogue.version}`}
        title="Lanes you can quote"
        intro="Only these approved lanes are quoted. Any other route returns “route not covered” instead of a made-up offer."
        className="print:hidden"
      >
        <div
          className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Covered lanes table"
        >
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Lanes covered by the test catalogue</caption>
            <thead className="bg-railway-blue-900 text-white">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Lane
                </th>
                <th scope="col" className="px-4 py-3">
                  Terminals
                </th>
                <th scope="col" className="px-4 py-3">
                  Train
                </th>
                <th scope="col" className="px-4 py-3">
                  Departures
                </th>
                <th scope="col" className="px-4 py-3">
                  Loading units
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {catalogue.lanes.map((l) => (
                <tr key={l.id}>
                  <th
                    scope="row"
                    className="text-railway-blue-900 px-4 py-3 font-mono font-semibold"
                  >
                    {l.id}
                    {l.teaching && (
                      <span className="bg-notice-bg text-notice-text ml-2 rounded-full px-2 py-0.5 font-sans text-xs">
                        teaching case
                      </span>
                    )}
                  </th>
                  <td className="px-4 py-3">
                    {terminal(l.from).city} → {terminal(l.to).city}
                  </td>
                  <td className="px-4 py-3">{l.train.id}</td>
                  <td className="px-4 py-3">
                    {l.train.days.map(dayName).join(', ')} {l.train.departure}
                  </td>
                  <td className="px-4 py-3">{l.acceptedItus.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-neutral-600">
          Door collection and delivery areas with Play Haulier road legs:{' '}
          {catalogue.doors.map((d) => d.label).join('; ')}.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Callout title="Simulated prices">
            All amounts, trains and capacities come from the versioned DEMO test catalogue{' '}
            {catalogue.version}, valid {catalogue.validFrom} to {catalogue.validTo}. They are for
            teaching only and are not a commercial tariff.
          </Callout>
          <Callout title="Where your quotes are kept" tone="info">
            In this prototype, quotes and bookings are saved in this browser only. In the final
            version they are recorded by SDG Railway’s back end, so trainers can see every
            operation.
          </Callout>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/my-quotes/" variant="secondary">
            My quotes and bookings
          </ButtonLink>
          <ButtonLink href="/teaching-help/" variant="secondary">
            Worked example and help
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
