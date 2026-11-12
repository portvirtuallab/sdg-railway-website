import { Icon, type IconName } from '@/components/ui/Icon';
import { ButtonLink, Callout, PageHero, Section } from '@/components/ui/layout';
import { RAIL_SERVICES } from '@/data/departures';
import { DeparturesBoard } from '@/features/quotation/DeparturesBoard';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('request-a-quotation');

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'lock',
    title: 'Enter your PVL PIN code',
    text: 'Your trainer gives you a 4-digit Port Virtual Lab PIN. Enter it on the quotation page to open the Railway Dashboard.',
  },
  {
    icon: 'route',
    title: 'Plan the shipment',
    text: 'Choose origin and destination terminals, the loading unit, units, weight, cargo and whether it is dangerous goods.',
  },
  {
    icon: 'clock',
    title: 'Pick a service and date',
    text: 'Compare Standard, Express and Green rail services and choose an available departure.',
  },
  {
    icon: 'quote',
    title: 'Generate the quotation',
    text: 'Review your request and generate a simulated quotation with a booking reference for your exercise.',
  },
];

export default function QuotationPage() {
  const page = getPage('request-a-quotation');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-032"
        eyebrow="Simulated quotation"
        intro="Plan a rail freight shipment and generate a simulated quotation as part of a Port Virtual Lab exercise."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={page.sourceUrl} external icon="lock">
            Enter your PVL PIN code
          </ButtonLink>
          <ButtonLink href="#departures" variant="ghost-light" icon="clock">
            See departures
          </ButtonLink>
        </div>
      </PageHero>

      <Section eyebrow="How it works" title="From PIN code to quotation in four steps">
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
            >
              <span
                className="font-display text-railway-green-100 absolute top-5 right-5 text-4xl font-bold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="bg-railway-green-700 inline-flex size-12 items-center justify-center rounded-xl text-white">
                <Icon name={s.icon} />
              </span>
              <h3 className="text-railway-blue-900 mt-4 text-lg font-bold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Callout title="Where your request goes">
            The PIN check and the quotation simulator run on Google Apps Script, provided by Escola
            Europea. Pricing comes from the simulation and has no commercial validity. The simulator
            asks for a company, contact name and email for the exercise: use the details your
            trainer tells you to.
          </Callout>
          <Callout title="Moving to the new site" tone="info">
            The quotation workflow still opens on the original SDG Railway site while it is being
            integrated into this website.
          </Callout>
        </div>
      </Section>

      <Section tone="muted" eyebrow="Services" title="Choose your rail service">
        <ul className="grid gap-5 md:grid-cols-3">
          {RAIL_SERVICES.map((s) => (
            <li key={s.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <p className="font-mono text-xs font-semibold text-neutral-600">{s.id}</p>
              <h3 className="text-railway-blue-900 mt-1 text-xl font-bold">{s.name}</h3>
              <p className="text-railway-green-700 text-sm">{s.trainName}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-neutral-600">Average speed</dt>
                  <dd className="text-railway-blue-900 font-semibold">{s.speedKmh} km/h</dd>
                </div>
                <div>
                  <dt className="text-neutral-600">Departure</dt>
                  <dd className="text-railway-blue-900 font-semibold">{s.time}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-neutral-600">Operating days</dt>
                  <dd className="text-railway-blue-900 font-semibold">{s.days.join(' · ')}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-neutral-600">Dangerous goods</dt>
                  <dd className="text-railway-blue-900 font-semibold">
                    {s.dangerousGoods ? 'Accepted' : 'Not accepted'}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="departures"
        eyebrow="Departures board"
        title="Scenario departures for the next 7 days"
      >
        <DeparturesBoard />
      </Section>
    </>
  );
}
