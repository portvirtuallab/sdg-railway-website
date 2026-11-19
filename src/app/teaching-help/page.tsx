import Link from 'next/link';
import { ButtonLink, Callout, LinkCard, PageHero, Section } from '@/components/ui/layout';
import { buildQuote, terminalById } from '@/engine';
import { money } from '@/features/quote/format';
import { SNAPSHOT_CATALOGUE as catalogue, SNAPSHOT_DATE } from '@/features/quote/snapshot';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('teaching-help');

// The worked example is priced by the same engine and Sheet data as the quote form (snapshot taken
// when the site was built), so the figures match a quote made that day.
const result = buildQuote(
  catalogue,
  {
    pin: '4821',
    requester: 'Futura Cargo operations desk',
    shipper: 'Toledo automotive parts manufacturer',
    consignee: 'Atessa assembly plant',
    incoterm: 'DAP',
    origin: { kind: 'door', id: 'DOOR-TOLEDO' },
    destination: { kind: 'door', id: 'DOOR-ATESSA' },
    readyDate: '2026-11-24',
    serviceId: 'STD-RAIL',
    routingMetric: 'DISTANCE',
    cargoDescription: 'Automotive parts',
    grossWeightKg: 18000,
    packages: 24,
    packageCm: { length: 120, width: 100, height: 160 },
    utiType: 'CONTAINER-40',
    quantity: 1,
    dangerousGoods: null,
    temperatureC: null,
    insuranceValue: null,
  },
  {
    ref: 'RWQ-EXAMPLE',
    version: 1,
    now: new Date(2026, 10, 19, 10, 0),
    usage: {},
    team: 'Futura Cargo – Group B',
  },
);
if (!result.ok) throw new Error(`Worked example cannot be quoted: ${result.errors[0]?.message}`);
const example = result.quote;
const cities = example.route.pathIds.map((id) => terminalById(catalogue, id)?.city ?? id);
// The forwarder's own price: about 15 % over the supplier cost, rounded up to 50.
const SELLING_PRICE = Math.ceil((example.total * 1.15) / 50) * 50;

const STEPS = [
  ['Create customer and request in Click & Cargo.', 'Shipper, consignee, Incoterm and cargo data.'],
  [
    'Consult SDG Railway as the intermodal carrier and select door-to-door.',
    'Route and breakdown of every leg.',
  ],
  [
    'Compare the services and check the unit, date, scope and train.',
    'Saved RWQ quote and PDF; note on cost and transit time.',
  ],
  ['Accept the offer and confirm capacity.', 'Booking linked to the RWQ and the assigned train.'],
  [
    'Create the customer offer in the ERP and open the file.',
    'Supplier cost, selling price and margin.',
  ],
  [
    'Record the unit, carriers, driver, vehicle and terminal orders when applicable.',
    'Consistent file and documents.',
  ],
  ['Explain who contracted whom.', 'Commercial chain distinguished from the production layer.'],
];

const ERRORS = [
  [
    'Invalid PIN',
    'The PIN is not in the TEAMS tab of the SDG Railway Sheet, or the team is inactive.',
    'Check the 4-digit PIN with your trainer.',
  ],
  [
    'Route not covered',
    'There is no rail connection between the places you chose (or, with dangerous goods, none through terminals that handle them).',
    'Pick other terminals: see the corridors in Network and trains. Some countries are separate networks.',
  ],
  [
    'No tariff for this unit',
    'The service has no tariff for that loading unit.',
    'Choose another service or unit: see the tariff table in Equipment and cargo.',
  ],
  [
    'Weight or volume too high',
    'The cargo does not fit the units you chose.',
    'Add units or choose a larger loading unit.',
  ],
  [
    'Train pending confirmation',
    'The proposed train is full or outside the timetable.',
    'Your booking is kept, but ERP steps that need a train stay blocked until SDG Railway confirms one.',
  ],
  ['Quote expired', 'The validity date has passed.', 'Request a new version of the quote.'],
  [
    'Mixing references',
    'Using the RWQ quote reference where the RWB booking reference is needed (or the other way round).',
    'The quote is the offer; the booking is the confirmed capacity. Both appear in the PDF and the handoff.',
  ],
];

export default function TeachingHelpPage() {
  const page = getPage('teaching-help');
  const margin = SELLING_PRICE - example.total;
  return (
    <>
      <PageHero
        page={page}
        image="IMG-019"
        eyebrow="Students and trainers"
        intro="A worked example, the Click & Cargo handoff and the most common errors in the SDG Railway quotation exercise."
      />

      <Section eyebrow="Worked example" title="Toledo to Atessa with one 40 ft container">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4 text-lg leading-relaxed text-neutral-600">
            <p>
              Futura Cargo, the freight forwarder (your team), receives an order from a manufacturer
              in Toledo to move one 40 ft container of automotive parts to a plant in Atessa.
            </p>
            <p>
              Route found by the quotation:{' '}
              <strong className="text-railway-blue-900">
                Toledo → {cities.join(' → ')} → Atessa
              </strong>{' '}
              ({example.route.distanceKm.toLocaleString('en-GB')} km by rail, {example.service.name}
              ). Futura Cargo asks SDG Railway, the intermodal carrier, for a door-to-door service.
              SDG Railway books capacity on the train as MTO and coordinates{' '}
              {catalogue.config.haulierName} for the road legs.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href="/request-a-quotation/?example=1" icon="quote">
                Try it in the quote form
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h3 className="text-railway-blue-900 font-bold">
              Illustrative arithmetic{' '}
              <span className="bg-notice-bg text-notice-text ml-1 rounded px-1.5 py-0.5 text-xs">
                Simulation
              </span>
            </h3>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">Worked example cost and margin</caption>
              <tbody className="divide-y divide-neutral-200">
                {example.lines.map((l) => (
                  <tr key={l.id}>
                    <th scope="row" className="py-2 text-left font-normal">
                      {l.label}
                    </th>
                    <td className="py-2 text-right tabular-nums">{money(l.amount)}</td>
                  </tr>
                ))}
                <tr className="text-railway-blue-900 font-bold">
                  <th scope="row" className="py-2 text-left">
                    Integrated cost from SDG Railway
                  </th>
                  <td className="py-2 text-right tabular-nums">{money(example.total)}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 text-left font-normal">
                    Selling price to the customer (set by the forwarder)
                  </th>
                  <td className="py-2 text-right tabular-nums">{money(SELLING_PRICE)}</td>
                </tr>
                <tr className="text-railway-green-700 font-bold">
                  <th scope="row" className="py-2 text-left">
                    Gross margin before other expenses
                  </th>
                  <td className="py-2 text-right tabular-nums">{money(margin)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-neutral-600">
              Prices from the SDG Railway Sheet on {SNAPSHOT_DATE}, cargo ready on 24 Nov 2026. A
              quote made today may differ if the trainers changed the tariff. Simulated amounts, not
              a commercial tariff.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted" eyebrow="Guided exercise" title="Seven steps from request to ERP file">
        <div
          className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Exercise steps table"
        >
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Guided quotation and ERP exercise</caption>
            <thead className="bg-railway-blue-900 text-white">
              <tr>
                <th scope="col" className="w-14 px-4 py-3">
                  Step
                </th>
                <th scope="col" className="px-4 py-3">
                  Student action
                </th>
                <th scope="col" className="px-4 py-3">
                  Expected output
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {STEPS.map(([a, b], i) => (
                <tr key={a}>
                  <td className="text-railway-green-700 px-4 py-3 font-mono font-bold">{i + 1}</td>
                  <th scope="row" className="text-railway-blue-900 px-4 py-3 font-semibold">
                    {a}
                  </th>
                  <td className="px-4 py-3 text-neutral-600">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Click & Cargo handoff" title="What you take to your ERP file">
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="grid gap-2 text-neutral-700 sm:grid-cols-2">
            {[
              'Quote reference (RWQ) and version',
              'Booking reference (RWB)',
              'Customer, shipper and consignee',
              'Incoterm',
              'Loading unit type and quantity',
              'Route, terminals and legs',
              'Prices by leg and total (supplier cost)',
              'Service, departure, cut-off and arrival',
              'Ready date and estimated delivery',
              'Driver and vehicle for terminal orders',
              'Documents: quotation PDF, booking, terminal orders',
            ].map((i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="bg-railway-green-600 mt-1.5 size-2 shrink-0 rounded-full"
                />
                {i}
              </li>
            ))}
          </ul>
          <Callout title="One operation, entered once" tone="info">
            Download the handoff from{' '}
            <Link href="/my-quotes/" className="font-semibold underline">
              My quotes and bookings
            </Link>{' '}
            once the train is confirmed. While the train is pending, the handoff is blocked so you
            do not open an ERP file with an invented train.
          </Callout>
        </div>
      </Section>

      <Section tone="muted" eyebrow="Common errors" title="What the messages mean">
        <div
          className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Common errors table"
        >
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Common errors and how to fix them</caption>
            <thead className="bg-white text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Message
                </th>
                <th scope="col" className="px-4 py-3">
                  Why
                </th>
                <th scope="col" className="px-4 py-3">
                  What to do
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {ERRORS.map(([a, b, c]) => (
                <tr key={a}>
                  <th scope="row" className="text-railway-blue-900 px-4 py-3 font-semibold">
                    {a}
                  </th>
                  <td className="px-4 py-3 text-neutral-600">{b}</td>
                  <td className="px-4 py-3">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Learn more" title="Reference material">
        <ul className="grid gap-5 md:grid-cols-3">
          <li>
            <LinkCard href="/resources/" icon="book" title="Glossary and resources">
              Rail and intermodal terms, linked to the SDGs.
            </LinkCard>
          </li>
          <li>
            <LinkCard href="/how-it-works/" icon="route" title="How it works">
              Actor map, contractual and physical chain.
            </LinkCard>
          </li>
          <li>
            <LinkCard href="/services/" icon="container" title="Equipment and cargo">
              Loading units, compatibility and special cargo.
            </LinkCard>
          </li>
        </ul>
      </Section>

      <Section tone="dark" id="trainers" eyebrow="For trainers" title="Trainer notes">
        <div className="grid gap-4 text-white/90">
          <details className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/15">
            <summary className="min-h-11 cursor-pointer text-lg font-bold text-white">
              Checks before the session
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>
                Check the TEAMS tab of the SDG Railway Sheet: one active row (with a PIN) per team,
                and a trainer row.
              </li>
              <li>
                Make the worked example with a team PIN and compare the PDF in the Drive folder with
                the quote on screen.
              </li>
              <li>
                Check that the booking reference and the train reach the student and the ERP file,
                with no duplicate terminal charges.
              </li>
              <li>
                A PIN with Role “trainer” in the TEAMS tab shows every team’s quotes in My quotes.
                Every operation is also in QUOTE_LOG, BOOKINGS and HISTORY.
              </li>
            </ul>
          </details>
          <details className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/15">
            <summary className="min-h-11 cursor-pointer text-lg font-bold text-white">
              Student presentation outline
            </summary>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
              <li>
                Mission: receive a request and deliver an intermodal offer that can be operated in
                the ERP.
              </li>
              <li>Physical chain: door → truck → terminal → train → terminal → truck → door.</li>
              <li>
                Contractual chain: shipper → forwarder → SDG Railway → MTO → railway undertaking.
              </li>
              <li>
                What PVL simulates: map real roles to this website and Click & Cargo; state the
                simplifications.
              </li>
              <li>
                Unit and corridor: one 40 ft container, terminals, restrictions and a confirmed
                train.
              </li>
              <li>
                The offer: price breakdown, scope, validity, RWQ and its difference from a booking.
              </li>
              <li>Live demo: quote → accept → assign train → hand off data to the ERP.</li>
              <li>Documents: delivery order, gate in, train, arrival and collection.</li>
              <li>
                Decision: total cost, transit time, frequency, reliability and emissions – not train
                price alone.
              </li>
              <li>
                Team task: complete the file, explain risks and justify the offer to the customer.
              </li>
            </ol>
            <p className="mt-3 text-sm text-white/75">For a short pilot, use points 1–7.</p>
          </details>
          <details className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/15">
            <summary className="min-h-11 cursor-pointer text-lg font-bold text-white">
              Known limits
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>
                Prices, trains and capacity are simulation data that the trainers keep in the SDG
                Railway Sheet; they are not real rates.
              </li>
              <li>
                Without the quotation service connected (demo mode), quotes are kept in each browser
                only.
              </li>
              <li>
                The transport document (CMR, CIM or multimodal) must be validated academically for
                each case.
              </li>
            </ul>
          </details>
        </div>
      </Section>
    </>
  );
}
