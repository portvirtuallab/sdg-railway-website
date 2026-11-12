import { Icon } from '@/components/ui/Icon';
import { ButtonLink, Callout, PageHero, ScenarioBadge, Section } from '@/components/ui/layout';
import { ESCOLA_URL, PVL_ONE_URL } from '@/content/site-map';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('contact');

const HUBS = ['Barcelona', 'Lyon', 'Verona', 'Cairo', 'Amman'];

export default function ContactPage() {
  const page = getPage('contact');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-017"
        eyebrow="Let’s move forward together"
        intro="Connect with SDG Railway for sustainable, efficient and digital rail logistics across the Mediterranean network – in the simulation – or reach the real Port Virtual Lab team."
      />
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-neutral-200">
            <ScenarioBadge>Scenario contact details</ScenarioBadge>
            <h2 className="text-railway-blue-900 mt-4 text-2xl font-bold">
              SDG Railway (simulated company)
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Use these details inside your exercise documents. They are not real contact channels.
            </p>
            <dl className="mt-6 space-y-4">
              {[
                ['pin', 'Head office', 'Intermodal Hub – Barcelona, Spain'],
                ['mail', 'Email', 'contact@sdgrailway.com'],
                ['info', 'Phone', '+34 93 000 000'],
                ['route', 'Website', 'www.sdgrailway.com'],
              ].map(([icon, k, v]) => (
                <div key={k} className="grid grid-cols-[2.5rem_1fr] gap-x-4">
                  <dt className="contents">
                    <span className="bg-railway-blue-100 text-railway-blue-900 row-span-2 inline-flex size-10 items-center justify-center rounded-lg">
                      <Icon name={icon as 'pin'} className="size-5" />
                    </span>
                    <span className="text-sm text-neutral-600">{k}</span>
                  </dt>
                  <dd className="text-railway-blue-900 col-start-2 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 border-t border-neutral-200 pt-6">
              <h3 className="text-railway-blue-900 font-bold">Our network</h3>
              <p className="mt-1 text-sm text-neutral-600">
                Strategic intermodal hubs across Europe, the Mediterranean and North Africa:
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {HUBS.map((h) => (
                  <li
                    key={h}
                    className="bg-railway-green-100 text-railway-green-700 rounded-full px-3 py-1 text-sm font-semibold"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </article>
          <article className="bg-railway-blue-900 flex flex-col rounded-2xl p-7 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Real support and collaborations</h2>
            <p className="mt-3 text-white/85">
              For questions about courses, the platform or educational collaborations, contact the
              Port Virtual Lab team at Escola Europea – Intermodal Transport.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={PVL_ONE_URL} external>
                PVL.ONE
              </ButtonLink>
              <ButtonLink href={ESCOLA_URL} external variant="ghost-light">
                Escola Europea
              </ButtonLink>
            </div>
            <div className="mt-auto pt-8">
              <Callout title="Exercise contact form" tone="info">
                The original site has a contact form for exercises. It sends your name and email to
                a Google Apps Script service of Escola Europea.{' '}
                <a
                  href={page.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Open the form on the original site
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                .
              </Callout>
            </div>
          </article>
        </div>
      </Section>
    </>
  );
}
