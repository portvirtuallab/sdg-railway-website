import { Img } from '@/components/ui/Img';
import { ButtonLink, Callout, PageHero, Section } from '@/components/ui/layout';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = {
  ...pageMetadata('railway-dashboard'),
  robots: { index: false, follow: false },
};

// Railway Quotation Simulator (Google Apps Script web app, see docs/audit/embedded-tools.md).
const SIMULATOR_URL =
  'https://script.google.com/macros/s/AKfycbwSdyo-qdgybXUhh0eGJgENMOusCZ0NYkgl5qn3gc1_J865vHqnSB06S8CB_9rlB9jZ/exec';

export default function DashboardPage() {
  const page = getPage('railway-dashboard');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-034"
        eyebrow="Quotation simulator"
        intro="Your entry point to the SDG Railway quotation simulator."
      />
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4 text-lg leading-relaxed text-neutral-600">
            <h2 className="text-railway-blue-900 text-3xl font-bold tracking-tight">
              Why inland rail?
            </h2>
            <p>
              Railway inland transport is one of the smartest ways to move cargo across a continent.
            </p>
            <p>
              Freight trains can replace dozens of trucks in a single movement, with lower CO₂
              emissions, less noise and far less road congestion. Along major European corridors,
              inland rail offers high capacity, reliable transit times and competitive costs,
              especially when integrated with ports, terminals and last-mile road transport.
            </p>
            <p>
              For students, understanding inland rail means learning to design efficient and
              sustainable logistics solutions, where choices of route, terminal, train type and
              intermodal connection directly affect cost, lead time and environmental performance.
            </p>
            <div className="pt-2">
              <ButtonLink href={SIMULATOR_URL} external icon="quote">
                Open the quotation simulator
              </ButtonLink>
            </div>
          </div>
          <Img id="IMG-035" className="w-full rounded-2xl shadow-xl" />
        </div>
        <div className="mt-10">
          <Callout title="Simulation only">
            The simulator runs on Google Apps Script. Quotations, prices and booking references are
            generated for the exercise and have no commercial validity.
          </Callout>
        </div>
      </Section>
    </>
  );
}
