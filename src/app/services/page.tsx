import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import {
  ButtonLink,
  Callout,
  LinkCard,
  OriginalPageLink,
  PageHero,
  Section,
} from '@/components/ui/layout';
import catalogue from '@/data/demo-catalogue.json';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('services');

// Images of the loading units from the original Railway Equipment Fleet page.
const ITU_IMAGE: Record<string, string> = {
  '20DV': 'IMG-097',
  '40DV': 'IMG-098',
  '40HC': 'IMG-099',
  '45HC': 'IMG-100',
  '40RF': 'IMG-102',
  TANK: 'IMG-103',
  SWAP: 'IMG-104',
  TRLR: 'IMG-105',
};
const city = (id: string) => catalogue.terminals.find((t) => t.id === id)?.city ?? id;

export default function EquipmentAndCargoPage() {
  const page = getPage('services');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-036"
        eyebrow="Loading units and special cargo"
        intro="Which loading units (ITUs) SDG Railway accepts, on which trains, and the limits for weight, volume and special cargo."
      />

      <Section eyebrow="Loading units" title="What you can ship with SDG Railway">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalogue.itus.map((u) => {
            const lanes = catalogue.lanes.filter((l) => l.acceptedItus.includes(u.code)).length;
            return (
              <li
                key={u.code}
                className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
              >
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-neutral-50 p-3">
                  <Img id={ITU_IMAGE[u.code]!} className="max-h-full w-auto object-contain" />
                </div>
                <h3 className="text-railway-blue-900 mt-4 font-bold">{u.name}</h3>
                <p className="font-mono text-xs text-neutral-600">{u.code}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-neutral-600">Max gross</dt>
                    <dd className="text-railway-blue-900 font-semibold">
                      {u.maxGrossKg.toLocaleString('en-GB')} kg
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-600">Volume</dt>
                    <dd className="text-railway-blue-900 font-semibold">about {u.volumeM3} m³</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-neutral-600">Bookable on</dt>
                    <dd className="text-railway-blue-900 font-semibold">
                      {lanes} of {catalogue.lanes.length} trains
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-sm text-neutral-600">
          Weights and volumes are learning values to be confirmed. The 60 ft extended container
          shown on the fleet page is not yet bookable in catalogue {catalogue.version}.
        </p>
      </Section>

      <Section
        tone="muted"
        id="compatibility"
        eyebrow="Route compatibility"
        title="Which unit runs on which train"
      >
        <div
          className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Compatibility table"
        >
          <table className="w-full min-w-[52rem] text-center text-sm">
            <caption className="sr-only">Loading units accepted on each train</caption>
            <thead className="bg-railway-blue-900 text-white">
              <tr>
                <th scope="col" className="px-3 py-3 text-left">
                  Train and route
                </th>
                {catalogue.itus.map((u) => (
                  <th key={u.code} scope="col" className="px-2 py-3 font-mono">
                    {u.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {catalogue.lanes.map((l) => (
                <tr key={l.id}>
                  <th scope="row" className="px-3 py-2.5 text-left">
                    <span className="text-railway-blue-900 font-mono font-semibold">
                      {l.train.id}
                    </span>
                    <span className="block text-xs font-normal text-neutral-600">
                      {city(l.from)} → {city(l.to)}
                    </span>
                  </th>
                  {catalogue.itus.map((u) =>
                    l.acceptedItus.includes(u.code) ? (
                      <td key={u.code} className="text-railway-green-700 px-2 py-2.5">
                        <Icon name="check" className="mx-auto size-5" />
                        <span className="sr-only">Accepted</span>
                      </td>
                    ) : (
                      <td key={u.code} className="px-2 py-2.5 text-neutral-600">
                        <span aria-hidden="true">–</span>
                        <span className="sr-only">Not accepted</span>
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Special cargo" title="Dangerous goods, reefers and semi-trailers">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: 'hazard' as const,
              title: 'Dangerous goods (RID)',
              text: 'Accepted only on Standard Rail trains and at terminals that handle dangerous goods. Declare the RID class (and UN number if you know it) in the quote.',
              href: '/services/dangerous-goods/',
              link: 'Dangerous goods resources',
            },
            {
              icon: 'snow' as const,
              title: 'Reefer containers',
              text: 'Need power and monitoring on the train: only on trains marked for reefers. Give the set temperature in the quote; a reefer surcharge applies.',
              href: '/network-routes/#trains',
              link: 'Train table',
            },
            {
              icon: 'container' as const,
              title: 'P400 semi-trailers',
              text: 'Travel unaccompanied in T3000e pocket wagons within the P400 loading gauge, only on the trains marked for semi-trailers.',
              href: '/services/container-and-trailer-packing/',
              link: 'Loading methods',
            },
          ].map((c) => (
            <article
              key={c.title}
              className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
            >
              <span className="bg-railway-blue-900 inline-flex size-12 items-center justify-center rounded-xl text-white">
                <Icon name={c.icon} />
              </span>
              <h3 className="text-railway-blue-900 mt-4 text-lg font-bold">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{c.text}</p>
              <Link
                href={c.href}
                className="text-railway-green-700 mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold"
              >
                {c.link} <Icon name="arrow" className="size-4" />
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-6">
          <Callout title="Checked before pricing">
            The quote form checks the lane, the loading unit, weight, volume and special cargo
            before giving a price. If something does not fit, you get a clear message instead of an
            offer.
          </Callout>
        </div>
        <div className="mt-6">
          <ButtonLink href="/request-a-quotation/" icon="quote">
            Get a quote
          </ButtonLink>
        </div>
      </Section>

      <Section tone="muted" eyebrow="More about equipment" title="Fleet, loading and safety">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
            <LinkCard
              href="/services/railway-equipment-fleet/our-locomotive-models/"
              icon="train"
              title="Our Locomotive Models"
            >
              The 12 named locomotives of the fleet.
            </LinkCard>
          </li>
          <li>
            <LinkCard
              href="/services/container-and-trailer-packing/"
              icon="package"
              title="Container and Trailer Packing"
            >
              Loading methods, weight distribution and securing.
            </LinkCard>
          </li>
          <li>
            <LinkCard href="/services/dangerous-goods/" icon="hazard" title="Dangerous Goods">
              RID regulations and learning resources.
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
