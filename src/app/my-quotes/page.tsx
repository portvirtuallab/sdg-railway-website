import { Suspense } from 'react';
import { Callout, PageHero, Section } from '@/components/ui/layout';
import { MyQuotes } from '@/features/quote/MyQuotes';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = { ...pageMetadata('my-quotes'), robots: { index: false, follow: false } };

export default function MyQuotesPage() {
  const page = getPage('my-quotes');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-034"
        eyebrow="Your operations"
        intro="Enter your team PIN to see your quotes, accept one, check the assigned train and hand the operation over to Click & Cargo."
      />
      <Section tone="muted">
        <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
          <MyQuotes />
        </Suspense>
      </Section>
      <Section className="print:hidden">
        <div className="grid gap-6 lg:grid-cols-2">
          <Callout title="Quote, booking and train are different things" tone="info">
            The RWQ quote is an offer with a validity date. When you accept it, SDG Railway creates
            a booking (RWB reference) linked to that quote and assigns a train if capacity is free.
            If not, the booking shows “train pending confirmation” and the handoff to the ERP stays
            blocked.
          </Callout>
          <Callout title="Prototype storage">
            Quotes and bookings are kept in this browser only. Another computer, or a cleared
            browser, will not show them. Use the trainer PIN to see every team’s quotes in this
            browser.
          </Callout>
        </div>
      </Section>
    </>
  );
}
