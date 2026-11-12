import { Callout, LinkCard, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import corridors from '@/data/corridors.json';
import terminals from '@/data/terminals.json';
import { CorridorExplorer } from '@/features/network/CorridorExplorer';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('network-routes');

const MAP_URL = 'https://www.google.com/maps/d/viewer?mid=12qF7fhR-AwS88h5Y0DNExOJO8TWq3uI';

export default function NetworkRoutesPage() {
  const page = getPage('network-routes');
  const countries = new Set(corridors.map((c) => c.country)).size;
  const stops = new Set(corridors.flatMap((c) => c.stops)).size;
  return (
    <>
      <PageHero
        page={page}
        image="IMG-030"
        eyebrow="FAST rail services"
        intro="Multi-country intermodal rail corridors of the SDG Railway scenario, across Europe and the Middle East and North Africa."
      >
        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/20 pt-6">
          {[
            [corridors.length, 'Corridors'],
            [countries, 'Countries'],
            [stops, 'Cities served'],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="text-sm text-white/75">{l}</dt>
              <dd className="font-display text-3xl font-bold">{n}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <Section
        eyebrow="Corridors"
        title="Explore the scenario network"
        intro="Each card lists the stops of a corridor in order. Use these corridors when you plan routes in your exercise."
      >
        <CorridorExplorer corridors={corridors} />
      </Section>

      <Section tone="muted">
        <div className="grid gap-6 lg:grid-cols-2">
          <Callout title="Scenario network" tone="info">
            Corridors and connections are simulation content prepared for Port Virtual Lab
            exercises. They are not real timetables or commercial services. Only the corridors
            listed here are confirmed scenario connections.
          </Callout>
          <div className="grid gap-5 sm:grid-cols-2">
            <LinkCard href={`/services/#terminals`} icon="pin" title="Terminal directory">
              Photos and details of {terminals.length} terminals.
            </LinkCard>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:border-railway-green-600 flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="text-railway-blue-900 text-lg font-semibold">Interactive map</span>
              <span className="mt-1 text-neutral-600">
                Open the original Google My Maps network map.
              </span>
              <span className="text-railway-green-700 mt-auto pt-4 text-sm font-semibold">
                Opens in a new tab
              </span>
            </a>
          </div>
        </div>
        <div className="mt-8">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
