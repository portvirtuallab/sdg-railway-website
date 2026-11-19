import { Callout, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import catalogue from '@/data/demo-catalogue.json';
import corridors from '@/data/corridors.json';
import terminals from '@/data/terminals.json';
import { CorridorExplorer } from '@/features/network/CorridorExplorer';
import { DeparturesBoard } from '@/features/quotation/DeparturesBoard';
import { dayName } from '@/features/quote/time';
import { TerminalDirectory } from '@/features/terminals/TerminalDirectory';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('network-routes');

const MAP_URL = 'https://www.google.com/maps/d/viewer?mid=12qF7fhR-AwS88h5Y0DNExOJO8TWq3uI';
const city = (id: string) => catalogue.terminals.find((t) => t.id === id)?.city ?? id;

function cutOffLabel(departure: string): string {
  const [h, m] = departure.split(':').map(Number);
  const mins = h! * 60 + m! - catalogue.cutOffHoursBeforeDeparture * 60;
  const day = mins < 0 ? 'day before, ' : 'same day, ';
  const t = ((mins % 1440) + 1440) % 1440;
  return `${day}${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export default function NetworkAndTrainsPage() {
  const page = getPage('network-routes');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-030"
        eyebrow="FAST rail services"
        intro="The scenario rail network of SDG Railway: corridors, terminals and the trains you can book in the quotation exercise."
      >
        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/20 pt-6">
          {[
            [catalogue.lanes.length, 'Bookable trains'],
            [corridors.length, 'Corridors'],
            [terminals.length, 'Terminals'],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="text-sm text-white/75">{l}</dt>
              <dd className="font-display text-3xl font-bold">{n}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <Section
        id="trains"
        eyebrow={`Test catalogue ${catalogue.version}`}
        title="Train table"
        intro={`Approved terminal-to-terminal services, valid ${catalogue.validFrom} to ${catalogue.validTo}. Gate in at the origin terminal before the cut-off, ${catalogue.cutOffHoursBeforeDeparture} hours before departure.`}
      >
        <div
          className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Train table"
        >
          <table className="w-full min-w-[60rem] text-left text-sm">
            <caption className="sr-only">
              Bookable trains with timetable, cut-off and equipment
            </caption>
            <thead className="bg-railway-blue-900 text-white">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Train
                </th>
                <th scope="col" className="px-4 py-3">
                  Route
                </th>
                <th scope="col" className="px-4 py-3">
                  Frequency
                </th>
                <th scope="col" className="px-4 py-3">
                  Departure
                </th>
                <th scope="col" className="px-4 py-3">
                  Cut-off
                </th>
                <th scope="col" className="px-4 py-3">
                  Transit
                </th>
                <th scope="col" className="px-4 py-3">
                  Equipment
                </th>
                <th scope="col" className="px-4 py-3">
                  Restrictions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {catalogue.lanes.map((l) => {
                const service = catalogue.services.find((s) => s.id === l.serviceId)!;
                const restrictions = [
                  l.dangerousGoods ? 'Dangerous goods accepted' : 'No dangerous goods',
                  l.acceptedItus.includes('40RF') ? 'Reefers accepted' : 'No reefers',
                  l.acceptedItus.includes('TRLR')
                    ? 'P400 trailers on pocket wagons'
                    : 'No semi-trailers',
                  `${l.train.slotsPerDeparture} units per departure`,
                ];
                return (
                  <tr key={l.id}>
                    <th scope="row" className="px-4 py-3 align-top">
                      <span className="text-railway-blue-900 font-mono font-semibold">
                        {l.train.id}
                      </span>
                      <span className="block text-xs font-normal text-neutral-600">
                        {service.name}
                      </span>
                      {l.teaching && (
                        <span className="bg-notice-bg text-notice-text mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold">
                          teaching case
                        </span>
                      )}
                    </th>
                    <td className="text-railway-blue-900 px-4 py-3 align-top font-medium">
                      {city(l.from)} → {city(l.to)}
                      <span className="block text-xs font-normal text-neutral-600">
                        {l.distanceKm.toLocaleString('en-GB')} km
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">{l.train.days.map(dayName).join(', ')}</td>
                    <td className="px-4 py-3 align-top tabular-nums">{l.train.departure}</td>
                    <td className="px-4 py-3 align-top tabular-nums">
                      {cutOffLabel(l.train.departure)}
                    </td>
                    <td className="px-4 py-3 align-top tabular-nums">about {l.transitHours} h</td>
                    <td className="px-4 py-3 align-top">{l.acceptedItus.join(', ')}</td>
                    <td className="px-4 py-3 align-top text-neutral-600">
                      {restrictions.join(' · ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <Callout title="No train, no offer">
            Only the trains in this table can be quoted and booked. A corridor or terminal that has
            no train here shows “no service” in the quotation instead of an invented departure.
          </Callout>
        </div>
      </Section>

      <Section tone="muted" id="departures" eyebrow="Departures" title="Next departures">
        <DeparturesBoard />
      </Section>

      <Section
        eyebrow="Corridors"
        title="The scenario corridor network"
        intro="Each card lists the stops of a corridor in order. Corridors describe the network; bookable trains are listed in the train table above."
      >
        <CorridorExplorer corridors={corridors} />
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
        title={`${terminals.length} terminals in the SDG Railway scenario`}
        intro="Filter by country or search by city. Terminals marked DG are flagged for dangerous goods in the source material."
      >
        <TerminalDirectory terminals={terminals} />
        <div className="mt-8">
          <Callout title="About this directory">
            Terminal names refer to real places, but their role, connections and services here are
            simulation scenario content. Some names and country groupings are being reviewed with
            the owner.
          </Callout>
        </div>
        <div className="mt-8">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
