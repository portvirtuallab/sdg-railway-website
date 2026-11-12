import { Icon, type IconName } from '@/components/ui/Icon';
import { Img, imageUrl } from '@/components/ui/Img';
import { ButtonLink, LinkCard, ScenarioBadge, Section, TrackDivider } from '@/components/ui/layout';
import { PVL_ONE_URL } from '@/content/site-map';
import corridors from '@/data/corridors.json';
import services from '@/data/home-services.json';
import locomotives from '@/data/locomotives.json';
import terminals from '@/data/terminals.json';

const SERVICE_ICONS: Record<string, IconName> = {
  'Rail Motorway Services': 'train',
  'Intermodal Container Services': 'container',
  'Sustainability & Environment': 'leaf',
  Vehicles: 'car',
  'Cold Chain': 'snow',
  Quality: 'badge',
  Digitalisation: 'chip',
  'Dangerous Goods': 'hazard',
};

const VALUES = [
  {
    title: 'Efficiency',
    image: 'IMG-021',
    text: 'Optimised routes, scheduling and intermodal coordination so that every shipment moves on time and cost-effectively, with reliable services that minimise delays.',
  },
  {
    title: 'Sustainability',
    image: 'IMG-022',
    text: 'Electric traction and environmental responsibility: learners compare the carbon footprint of rail with road transport and build greener logistics networks across Europe.',
  },
  {
    title: 'Digital Innovation',
    image: 'IMG-023',
    text: 'Digital tools and data support transparency, traceability and decision-making, creating a more connected and intelligent supply chain.',
  },
];

const countries = new Set(terminals.map((t) => t.country)).size;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="hero-title"
        className="bg-railway-blue-950 relative isolate overflow-hidden text-white"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-[70%_center] sm:bg-right"
          style={{ backgroundImage: `url(${imageUrl('IMG-030')})` }}
        />
        <div
          aria-hidden="true"
          className="from-railway-blue-950 via-railway-blue-950/80 to-railway-blue-950/10 absolute inset-0 -z-10 bg-linear-to-r"
        />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-36">
          <p className="text-railway-green-100 text-sm font-semibold tracking-[0.18em] uppercase">
            The rail freight simulation of Port Virtual Lab
          </p>
          <h1
            id="hero-title"
            className="mt-4 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl"
          >
            Connecting ports and inland terminals through rail simulation
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
            Explore railway equipment, terminal procedures and intermodal connections while
            practising freight operations in Port Virtual Lab.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/request-a-quotation/" icon="quote">
              Request a simulated quotation
            </ButtonLink>
            <ButtonLink href="/network-routes/" variant="ghost-light" icon="route">
              Explore the network
            </ButtonLink>
            <ButtonLink href={PVL_ONE_URL} variant="ghost-light" external>
              Access PVL.ONE
            </ButtonLink>
          </div>
          <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-white/20 pt-6">
            {[
              [terminals.length, 'Terminals'],
              [corridors.length, 'Corridors'],
              [countries, 'Countries'],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="text-sm text-white/75">{l}</dt>
                <dd className="font-display text-3xl font-bold text-white">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
        <TrackDivider />
      </section>

      {/* Introduction */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <ScenarioBadge>Simulated company</ScenarioBadge>
            <h2 className="text-railway-blue-900 mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Your partner in sustainable rail freight
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-neutral-600">
              <p>
                In the Port Virtual Lab scenario, SDG Railway serves logistics operators, freight
                forwarders and shippers with rail transport solutions that connect major ports and
                inland terminals across Europe and the Mediterranean.
              </p>
              <p>
                Learners use its digital environment to plan routes, request simulated quotations
                and coordinate intermodal shipments, exploring door-to-terminal and port-to-inland
                connections as a real freight company would.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/about-us/" variant="secondary">
                About SDG Railway
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            <div
              aria-hidden="true"
              className="bg-railway-green-100 absolute -inset-3 -z-10 rotate-2 rounded-3xl"
            />
            <Img id="IMG-020" className="aspect-square w-full rounded-2xl object-cover shadow-xl" />
          </div>
        </div>
      </Section>

      {/* Key values */}
      <Section
        tone="muted"
        eyebrow="Key values"
        title="Efficiency, sustainability and digital innovation"
      >
        <ul className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <li
              key={v.title}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"
            >
              <Img id={v.image} className="aspect-[16/10] w-full object-cover" />
              <div className="p-6">
                <h3 className="text-railway-blue-900 text-xl font-bold">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-neutral-600">{v.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Services */}
      <Section
        id="services"
        eyebrow="Our services"
        title="Rail and intermodal services in the simulation"
        intro="Each service is a learning scenario: open a card to read how it works."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.title}>
              <details className="group open:ring-railway-green-600 h-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition open:shadow-md open:ring-2">
                <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="bg-railway-blue-900 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-white">
                    <Icon name={SERVICE_ICONS[s.title] ?? 'train'} />
                  </span>
                  <span className="flex-1">
                    <span className="text-railway-blue-900 block font-semibold">{s.title}</span>
                    <span className="text-railway-green-700 mt-0.5 block text-sm group-open:hidden">
                      Read more
                    </span>
                    <span className="text-railway-green-700 mt-0.5 hidden text-sm group-open:block">
                      Show less
                    </span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-neutral-600">{s.description}</p>
              </details>
            </li>
          ))}
        </ul>
      </Section>

      {/* Quick access */}
      <Section tone="muted" eyebrow="Quick access" title="Find what you need for your exercise">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <LinkCard href="/services/#terminals" icon="pin" title="Find a terminal">
              Search {terminals.length} scenario terminals by country or city.
            </LinkCard>
          </li>
          <li>
            <LinkCard href="/network-routes/" icon="route" title="Explore the network">
              {corridors.length} rail corridors from the Atlantic to the Red Sea.
            </LinkCard>
          </li>
          <li>
            <LinkCard
              href="/services/railway-equipment-fleet/"
              icon="train"
              title="View railway equipment"
            >
              Loading units, the EURODUAL locomotive and T3000e wagons.
            </LinkCard>
          </li>
          <li>
            <LinkCard
              href="/services/container-and-trailer-packing/"
              icon="package"
              title="Read packing guidance"
            >
              Loading methods, weight distribution and load securing.
            </LinkCard>
          </li>
          <li>
            <LinkCard
              href="/services/dangerous-goods/"
              icon="hazard"
              title="Dangerous goods resources"
            >
              RID, OTIF and the Blue Skills learning resources.
            </LinkCard>
          </li>
          <li>
            <LinkCard href="/resources/" icon="book" title="Open the railway glossary">
              Key rail and intermodal terms, linked to the SDGs.
            </LinkCard>
          </li>
        </ul>
      </Section>

      {/* Fleet teaser */}
      <Section tone="dark">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-xl">
            <Img id="IMG-107" className="w-full" />
          </div>
          <div>
            <p className="text-railway-green-100 text-sm font-semibold tracking-[0.18em] uppercase">
              Our fleet
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {locomotives.length} locomotives, each named after a virtue
            </h2>
            <p className="mt-4 text-lg text-white/85">
              From ANDREIA (courage) to PR VELOCE (speed): discover the bi-mode locomotives of the
              SDG Railway simulation fleet, the intermodal units they haul and the T3000e pocket
              wagons.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/services/railway-equipment-fleet/our-locomotive-models/">
                Meet the locomotives
              </ButtonLink>
              <ButtonLink href="/services/railway-equipment-fleet/" variant="ghost-light">
                Railway equipment
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* Quotation CTA */}
      <Section>
        <div className="bg-railway-green-100 grid items-center gap-10 overflow-hidden rounded-3xl p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-railway-blue-900 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to quote?
            </h2>
            <p className="mt-4 text-lg text-neutral-700">
              Plan a shipment from origin to destination terminal, choose the loading unit and the
              service, and generate a simulated quotation with your PVL PIN code.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/request-a-quotation/" icon="quote">
                Request a simulated quotation
              </ButtonLink>
            </div>
          </div>
          <Img id="IMG-035" className="w-full rounded-2xl shadow-lg" />
        </div>
      </Section>
    </>
  );
}
