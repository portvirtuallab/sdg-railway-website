import { Callout, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import { CorridorExplorer } from '@/features/network/CorridorExplorer';
import { NetworkStats, ServicesTable } from '@/features/network/ServicesTable';
import { DeparturesBoard } from '@/features/quotation/DeparturesBoard';
import { SNAPSHOT_CATALOGUE } from '@/features/quote/snapshot';
import { TerminalDirectory } from '@/features/terminals/TerminalDirectory';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('network-routes');

const MAP_URL = 'https://www.google.com/maps/d/viewer?mid=12qF7fhR-AwS88h5Y0DNExOJO8TWq3uI';
const cfg = SNAPSHOT_CATALOGUE.config;

export default function NetworkAndTrainsPage() {
  const page = getPage('network-routes');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-030"
        eyebrow="FAST rail services"
        intro="The SDG Railway rail network of the simulation: services, corridors and terminals you can quote and book. Everything on this page comes from the SDG Railway Sheet."
      >
        <NetworkStats />
      </PageHero>

      <Section
        id="trains"
        eyebrow="Rail services"
        title="Services and timetable"
        intro={`Each service runs on the days shown from every terminal of the route. Gate in at the origin terminal before the cut-off, ${cfg.cutOffHours} hours before departure. A quote proposes the first departure with free capacity.`}
      >
        <ServicesTable />
        <div className="mt-6">
          <Callout title="No train, no offer">
            When no departure has room within {cfg.searchDays} days of the ready date, the quote
            shows the train as pending instead of inventing one, and ERP steps that need a train
            stay blocked.
          </Callout>
        </div>
      </Section>

      <Section tone="muted" id="departures" eyebrow="Departures" title="Next departures">
        <DeparturesBoard />
      </Section>

      <Section
        eyebrow="Corridors"
        title="The rail corridor network"
        intro="Corridors group the rail links of the network. The quotation finds the route through these links automatically."
      >
        <CorridorExplorer />
        <p className="mt-6 text-sm">
          <a
            href={MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-railway-blue-700 font-semibold underline underline-offset-4"
          >
            Open the original interactive network map
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </Section>

      <Section
        id="terminals"
        tone="muted"
        eyebrow="Intermodal terminals"
        title="Terminals in the SDG Railway network"
        intro="Filter by country or search by city. Terminals marked DG handle dangerous goods; routes with dangerous goods only pass through them."
      >
        <TerminalDirectory />
        <div className="mt-8">
          <Callout title="About this directory">
            Terminal names refer to real places, but their role, connections and services here are
            simulation content maintained in the SDG Railway Sheet.
          </Callout>
        </div>
        <div className="mt-8">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
