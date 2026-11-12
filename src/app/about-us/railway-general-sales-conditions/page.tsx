import { ButtonLink, Callout, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import conditions from '@/data/sales-conditions.json';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('railway-general-sales-conditions');

export default function SalesConditionsPage() {
  const page = getPage('railway-general-sales-conditions');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-016"
        eyebrow={conditions.title}
        intro="The academic conditions of sale that govern SDG Railway exercises in Port Virtual Lab."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={conditions.downloadUrl} external icon="download">
            Download the full document
          </ButtonLink>
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          <div>
            <Callout title="Academic document – no legal validity">
              This document has been written solely for academic purposes and has no real-world
              validity in legal, commercial or administrative terms. Use it only within the
              educational context for which it was created; it is not professional or legal advice.
            </Callout>
            <p className="mt-8 text-lg leading-relaxed text-neutral-600">
              These General Conditions govern the relationship between SDG Railway and its customers
              for combined international rail and intermodal haulage services. They are supplemented
              by the Schedule of Fares and any Special Conditions agreed with the Customer. Ordering
              services implies the Customer’s unconditional acceptance of these General Conditions,
              which take precedence over any general conditions of the Customer.
            </p>
            <div className="mt-8 space-y-3">
              {conditions.sections.map((s, i) => (
                <details
                  key={s.title}
                  id={`clause-${i + 1}`}
                  className="group open:ring-railway-green-600 scroll-mt-24 rounded-xl bg-white ring-1 ring-neutral-200 open:ring-2"
                >
                  <summary className="text-railway-blue-900 flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                    {s.title}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      className="size-3 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    >
                      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </summary>
                  <div
                    className="prose-rail border-t border-neutral-200 px-5 py-4 text-sm leading-relaxed text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: s.html }}
                  />
                </details>
              ))}
            </div>
          </div>
          <nav aria-label="Clauses" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-railway-blue-900 text-sm font-semibold">Clauses</p>
            <ol className="mt-2 space-y-0.5 text-sm">
              {conditions.sections.map((s, i) => (
                <li key={s.title}>
                  <a
                    href={`#clause-${i + 1}`}
                    className="hover:text-railway-green-700 inline-flex min-h-9 items-center text-neutral-600 hover:underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <div className="mt-10">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
