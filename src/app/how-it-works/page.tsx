import { Icon, type IconName } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { ButtonLink, Callout, PageHero, Section } from '@/components/ui/layout';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('how-it-works');

const CONTRACT_CHAIN = [
  {
    who: 'Shipper and consignee',
    role: 'Define the cargo, the destination and the Incoterm of the case.',
    you: 'Case data',
  },
  {
    who: 'Freight forwarder',
    role: 'Receives the customer’s request and quotes the customer.',
    you: 'Your team, in Click & Cargo',
  },
  {
    who: 'SDG Railway – intermodal carrier',
    role: 'Offers the integrated service, selects the loading unit (ITU) and coordinates every leg.',
    you: 'This website',
  },
  {
    who: 'MTO',
    role: 'Books train capacity and coordinates the terminals.',
    you: 'Bundled in SDG Railway',
  },
  { who: 'Railway undertaking', role: 'Runs the train on the rail leg.', you: 'Explanatory layer' },
];

const PHYSICAL: { icon: IconName; label: string }[] = [
  { icon: 'pin', label: 'Door' },
  { icon: 'car', label: 'Truck' },
  { icon: 'container', label: 'Terminal' },
  { icon: 'train', label: 'Train' },
  { icon: 'container', label: 'Terminal' },
  { icon: 'car', label: 'Truck' },
  { icon: 'pin', label: 'Door' },
];

const SIMULATED = [
  [
    'Shipper, consignee',
    'Case data given by the trainer',
    'You read them from the case and enter them in the quote.',
  ],
  [
    'Freight forwarder',
    'Your team (e.g. Futura Cargo, PlayForwarding)',
    'You request, compare and accept the offer, then sell to your customer.',
  ],
  [
    'Intermodal carrier',
    'SDG Railway',
    'Quotes door-to-door or terminal-to-terminal and is your counterparty.',
  ],
  [
    'MTO',
    'SDG Railway (bundled)',
    'Books capacity on the train; shown in the booking, not contracted by you.',
  ],
  [
    'Road haulage',
    'Play Haulier',
    'First and last road legs, priced separately in the quote when included.',
  ],
  [
    'Terminals',
    'Scenario terminals (Barcelona Morrot, Civitavecchia…)',
    'Gate in, loading, unloading and gate out.',
  ],
  [
    'Railway undertaking, infrastructure managers, rolling stock',
    'Not simulated as parties',
    'Explained here only: your team never contracts them directly.',
  ],
];

const GATE = [
  {
    title: 'Gate In – origin terminal',
    image: 'IMG-037',
    checks: [
      'Documentation: booking reference, consignment note and dangerous goods declaration if applicable.',
      'Condition and identification of the loading unit (container, swap body or trailer).',
      'Safety and weight standards before the unit is allocated to the train.',
    ],
    outro:
      'The unit is registered and assigned to a wagon. The Gate In time starts SDG Railway’s operational responsibility – it must be before the train’s cut-off.',
  },
  {
    title: 'Gate Out – destination terminal',
    image: 'IMG-038',
    checks: [
      'Integrity and sealing of the unit.',
      'No visible damage or irregularities.',
      'Delivery documents signed and validated (interchange report or electronic acknowledgement).',
    ],
    outro: 'The Gate Out time ends SDG Railway’s responsibility for the shipment.',
  },
];

export default function HowItWorksPage() {
  const page = getPage('how-it-works');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-043"
        eyebrow="Roles and responsibilities"
        intro="An intermodal shipment involves many parties. This page shows the real chain, and which roles the SDG Railway simulation bundles so your team can follow a guided version."
      />

      <Section eyebrow="Physical chain" title="How the loading unit travels">
        <ol
          className="flex flex-wrap items-center gap-2"
          aria-label="Physical chain from door to door"
        >
          {PHYSICAL.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={`flex min-w-24 flex-col items-center gap-1 rounded-xl px-3 py-3 text-sm font-semibold ${s.label === 'Train' ? 'bg-railway-green-700 text-white' : 'bg-railway-blue-100 text-railway-blue-900'}`}
              >
                <Icon name={s.icon} />
                {s.label}
              </span>
              {i < PHYSICAL.length - 1 && <Icon name="arrow" className="size-5 text-neutral-600" />}
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-3xl text-lg text-neutral-600">
          The road legs (first and last mile) and the terminals are part of the service. In a{' '}
          <strong className="text-railway-blue-900">door-to-door</strong> offer SDG Railway quotes
          all of them; in a <strong className="text-railway-blue-900">terminal-to-terminal</strong>{' '}
          offer your team arranges the road legs.
        </p>
      </Section>

      <Section tone="muted" eyebrow="Contractual chain" title="Who contracts whom">
        <ol className="grid gap-3 lg:grid-cols-5" aria-label="Contractual chain">
          {CONTRACT_CHAIN.map((c, i) => (
            <li
              key={c.who}
              className={`relative flex flex-col rounded-2xl p-5 ring-1 ${c.you === 'This website' ? 'bg-railway-blue-900 ring-railway-blue-900 text-white' : c.you.startsWith('Your team') ? 'bg-railway-green-100 ring-railway-green-600' : 'bg-white ring-neutral-200'}`}
            >
              <span
                className={`text-xs font-bold tracking-wide uppercase ${c.you === 'This website' ? 'text-railway-green-100' : 'text-railway-green-700'}`}
              >
                {i + 1} · {c.you}
              </span>
              <h3
                className={`mt-1 text-lg font-bold ${c.you === 'This website' ? 'text-white' : 'text-railway-blue-900'}`}
              >
                {c.who}
              </h3>
              <p
                className={`mt-1 text-sm leading-relaxed ${c.you === 'This website' ? 'text-white/85' : 'text-neutral-600'}`}
              >
                {c.role}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-3xl text-neutral-600">
          Supporting parties: <strong className="text-railway-blue-900">Play Haulier</strong> for
          the road legs, the terminals, infrastructure managers and rolling-stock owners. They
          provide resources for the service; the forwarder does not contract them directly in this
          exercise.
        </p>
      </Section>

      <Section
        eyebrow="What the simulation bundles"
        title="Real roles and how Port Virtual Lab plays them"
      >
        <div
          className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Roles table"
        >
          <table className="w-full min-w-[42rem] text-left text-sm">
            <caption className="sr-only">
              Real roles and their representation in the simulation
            </caption>
            <thead className="bg-railway-blue-900 text-white">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Real role
                </th>
                <th scope="col" className="px-4 py-3">
                  In the simulation
                </th>
                <th scope="col" className="px-4 py-3">
                  What it means for your team
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {SIMULATED.map(([a, b, c]) => (
                <tr key={a}>
                  <th scope="row" className="text-railway-blue-900 px-4 py-3 font-semibold">
                    {a}
                  </th>
                  <td className="px-4 py-3">{b}</td>
                  <td className="px-4 py-3 text-neutral-600">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <Callout title="A simplification for learning" tone="info">
            In real operations the intermodal carrier, the MTO and the railway undertaking are often
            different companies. SDG Railway bundles the carrier and MTO tasks into one offer so the
            exercise stays manageable. Trainers can open the full complexity in Teaching help.
          </Callout>
        </div>
      </Section>

      <Section
        tone="muted"
        eyebrow="Two kinds of offer"
        title="Door-to-door or terminal-to-terminal"
      >
        <div
          className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Offer comparison table"
        >
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">What each type of offer includes</caption>
            <thead className="bg-white text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Leg
                </th>
                <th scope="col" className="px-4 py-3">
                  Door-to-door
                </th>
                <th scope="col" className="px-4 py-3">
                  Terminal-to-terminal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {[
                [
                  'Origin road haulage (Play Haulier)',
                  'Included',
                  'Excluded – your team arranges it',
                ],
                ['Origin terminal handling', 'Included', 'Included'],
                ['Rail leg (train)', 'Included', 'Included'],
                ['Destination terminal handling', 'Included', 'Included'],
                [
                  'Final road haulage (Play Haulier)',
                  'Included',
                  'Excluded – your team arranges it',
                ],
              ].map(([a, b, c]) => (
                <tr key={a}>
                  <th scope="row" className="text-railway-blue-900 px-4 py-3 font-semibold">
                    {a}
                  </th>
                  <td className="px-4 py-3">{b}</td>
                  <td className="px-4 py-3">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="At the terminals" title="Gate In and Gate Out">
        <div className="grid gap-6 lg:grid-cols-2">
          {GATE.map((g) => (
            <article
              key={g.title}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"
            >
              <Img id={g.image} className="aspect-[21/9] w-full object-cover" />
              <div className="p-6 sm:p-8">
                <h3 className="text-railway-blue-900 text-2xl font-bold">{g.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {g.checks.map((c) => (
                    <li key={c} className="flex gap-3 text-neutral-700">
                      <span className="bg-railway-green-100 text-railway-green-700 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full">
                        <Icon name="check" className="size-4" />
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-neutral-600">{g.outro}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="muted" eyebrow="Documents" title="Documents along the way">
        <ol className="grid gap-3 md:grid-cols-5">
          {[
            ['Delivery order', 'Driver and vehicle that bring the unit to the origin terminal.'],
            ['Gate in', 'Registration of the unit at the terminal, before cut-off.'],
            ['Train', 'Booking linked to the quote and the assigned train.'],
            ['Arrival', 'The unit is unloaded at the destination terminal.'],
            ['Collection order', 'Driver and vehicle that collect the unit at gate out.'],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
              <span className="text-railway-green-700 font-mono text-xs font-bold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-railway-blue-900 mt-1 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-neutral-600">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-3xl text-sm text-neutral-600">
          The transport document (for example CMR for road, CIM for rail, or a multimodal document)
          depends on the case, the loading unit and the jurisdiction. Your trainer tells you which
          one applies.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/request-a-quotation/" icon="quote">
            Get a quote
          </ButtonLink>
          <ButtonLink href="/teaching-help/" variant="secondary">
            Worked example
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
