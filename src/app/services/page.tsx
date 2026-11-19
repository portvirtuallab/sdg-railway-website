import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import {
  ButtonLink,
  Callout,
  LinkCard,
  OriginalPageLink,
  PageHero,
  Section,
} from '@/components/ui/layout';
import { TariffMatrix, UtiCards } from '@/features/network/EquipmentSheet';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('services');

export default function EquipmentAndCargoPage() {
  const page = getPage('services');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-036"
        eyebrow="Loading units and special cargo"
        intro="Which loading units SDG Railway carries, on which services and at what rail tariff, and the rules for special cargo."
      />

      <Section eyebrow="Loading units" title="What you can ship with SDG Railway">
        <UtiCards />
        <p className="mt-6 text-sm text-neutral-600">
          Units, limits and tariffs come from the UTI_TYPES and TARIFFS tabs of the SDG Railway
          Sheet. Maximum load and volume are standard container values for learning.
        </p>
      </Section>

      <Section
        tone="muted"
        id="compatibility"
        eyebrow="Rail tariff"
        title="Rail freight by service and unit"
        intro="Per loading unit: a fixed fee plus a rate per kilometre of the rail route, never less than the minimum. Surcharges (terminal, documentation, dangerous goods, border crossings…) are added in the quote."
      >
        <TariffMatrix />
      </Section>

      <Section eyebrow="Special cargo" title="Dangerous goods, reefers and semi-trailers">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: 'hazard' as const,
              title: 'Dangerous goods (ADR/RID)',
              text: 'Accepted only on services that allow dangerous goods, through terminals that handle them. Declare the ADR/RID class (and UN number if you know it); class surcharges apply.',
              href: '/services/dangerous-goods/',
              link: 'Dangerous goods resources',
            },
            {
              icon: 'snow' as const,
              title: 'Reefer containers',
              text: 'Need power and monitoring on the train. Give the set temperature in the quote; a reefer power surcharge applies per unit.',
              href: '/network-routes/#trains',
              link: 'Services and timetable',
            },
            {
              icon: 'container' as const,
              title: 'P400 semi-trailers',
              text: 'Travel unaccompanied in T3000e pocket wagons within the P400 loading gauge, at the semi-trailer tariff.',
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
            The quote form checks the route, the loading unit, weight, volume and special cargo
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
