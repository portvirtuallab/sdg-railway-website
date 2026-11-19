import { Suspense } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ButtonLink, PageHero, Section } from '@/components/ui/layout';
import { QuoteForm } from '@/features/quote/QuoteForm';
import { QuoteInfo } from '@/features/quote/QuoteInfo';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('request-a-quotation');

const FLOW: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'quote',
    title: 'Quote',
    text: 'Request a door-to-door or terminal-to-terminal offer. You receive an RWQ quote with prices by leg, scope and validity.',
  },
  {
    icon: 'check',
    title: 'Accept',
    text: 'A quote is not a booking. Accepting it asks SDG Railway to confirm capacity on the train.',
  },
  {
    icon: 'train',
    title: 'Train and booking',
    text: 'You get a booking reference linked to the quote and the assigned train – or a “pending confirmation” status.',
  },
  {
    icon: 'route',
    title: 'Hand off to Click & Cargo',
    text: 'Download the handoff data for your ERP file: references, legs, prices, dates and train.',
  },
];

export default function GetAQuotePage() {
  const page = getPage('request-a-quotation');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-032"
        eyebrow="Intermodal quotation"
        intro="Your team acts as the freight forwarder. SDG Railway, the intermodal carrier, quotes the whole chain: road legs, terminals and the train."
      />

      <Section className="print:hidden">
        <ol className="grid gap-4 md:grid-cols-4">
          {FLOW.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
            >
              <span
                className="font-display text-railway-green-100 absolute top-4 right-4 text-3xl font-bold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="bg-railway-blue-900 inline-flex size-11 items-center justify-center rounded-xl text-white">
                <Icon name={s.icon} />
              </span>
              <h2 className="text-railway-blue-900 mt-3 font-bold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" id="quote-form">
        <Suspense fallback={<p className="text-neutral-600">Loading the quotation form…</p>}>
          <QuoteForm />
        </Suspense>
      </Section>

      <Section
        id="lanes"
        eyebrow="What you can quote"
        title="The SDG Railway network in the quotation"
        intro="Any two connected terminals, or a door area served by a road leg. If there is no rail route, the form says so instead of making up an offer."
        className="print:hidden"
      >
        <QuoteInfo />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/my-quotes/" variant="secondary">
            My quotes and bookings
          </ButtonLink>
          <ButtonLink href="/teaching-help/" variant="secondary">
            Worked example and help
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
