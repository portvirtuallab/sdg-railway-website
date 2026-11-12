import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { Callout, LinkCard, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import terminals from '@/data/terminals.json';
import { TerminalDirectory } from '@/features/terminals/TerminalDirectory';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('services');

const GATE = [
  {
    title: 'Gate In procedures',
    image: 'IMG-037',
    intro:
      'At the origin terminal, every loading unit is inspected before it enters the rail terminal area. SDG Railway staff and the terminal operator verify:',
    checks: [
      'Documentation accuracy: booking reference, consignment note and dangerous goods declaration if applicable.',
      'Condition and identification of the loading unit (container, swap body or trailer).',
      'Compliance with safety and weight standards before train allocation.',
    ],
    outro:
      'Once verified, the unit is registered in SDG Railway’s digital system and assigned to a railcar. The Gate In timestamp marks the start of SDG Railway’s operational responsibility.',
  },
  {
    title: 'Gate Out procedures',
    image: 'IMG-038',
    intro:
      'At the destination terminal, loading units are unloaded and inspected before release. The terminal operator and the customer representative confirm:',
    checks: [
      'Integrity and sealing of the unit.',
      'Absence of visible damage or irregularities.',
      'Delivery documentation signed and validated (interchange report or electronic acknowledgement).',
    ],
    outro: 'The Gate Out timestamp concludes SDG Railway’s responsibility for the shipment.',
  },
];

export default function ServicesPage() {
  const page = getPage('services');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-036"
        eyebrow="Terminal operations"
        intro="How loading units enter and leave the SDG Railway network, and the intermodal terminals of the simulation."
      />

      <Section eyebrow="Procedures" title="Gate In and Gate Out">
        <div className="grid gap-6 lg:grid-cols-2">
          {GATE.map((g, i) => (
            <article
              key={g.title}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"
            >
              <Img id={g.image} className="aspect-[21/9] w-full object-cover" />
              <div className="p-6 sm:p-8">
                <p className="text-railway-green-700 text-sm font-bold">
                  Step {i === 0 ? '1 · Origin terminal' : '2 · Destination terminal'}
                </p>
                <h3 className="text-railway-blue-900 mt-1 text-2xl font-bold">{g.title}</h3>
                <p className="mt-3 text-neutral-600">{g.intro}</p>
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

      <Section
        id="terminals"
        tone="muted"
        eyebrow="Intermodal terminals"
        title={`${terminals.length} terminals in the SDG Railway scenario`}
        intro="Filter by country or search by city. Terminals marked DG are flagged for dangerous goods in the source material."
      >
        <TerminalDirectory terminals={terminals} />
        <div className="mt-8">
          <Callout title="About this directory">
            Terminal names refer to real places, but their role, connections and services here are
            simulation scenario content. Some names and country groupings are being reviewed with
            the owner. A terminal being listed does not mean it is connected to every other
            terminal: see Network &amp; Routes for the scenario corridors.
          </Callout>
        </div>
      </Section>

      <Section eyebrow="More services" title="Packing, equipment and dangerous goods">
        <ul className="grid gap-5 md:grid-cols-3">
          <li>
            <LinkCard
              href="/services/container-and-trailer-packing/"
              icon="package"
              title="Container and Trailer Packing"
            >
              Loading methods, weight distribution and load securing.
            </LinkCard>
          </li>
          <li>
            <LinkCard
              href="/services/railway-equipment-fleet/"
              icon="train"
              title="Railway Equipment Fleet"
            >
              Loading units, the EURODUAL locomotive and the T3000e wagon.
            </LinkCard>
          </li>
          <li>
            <LinkCard href="/services/dangerous-goods/" icon="hazard" title="Dangerous Goods">
              RID regulations and dangerous goods learning resources.
            </LinkCard>
          </li>
        </ul>
        <div className="mt-8">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
