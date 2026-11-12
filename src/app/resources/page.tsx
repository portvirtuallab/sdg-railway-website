import { LinkCard, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import glossary from '@/data/glossary.json';
import { GlossaryBrowser } from '@/features/glossary/GlossaryBrowser';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('resources');

export default function ResourcesPage() {
  const page = getPage('resources');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-017"
        eyebrow="Learning resources"
        intro="The SDG Railway glossary and reference material for rail and intermodal exercises."
      />
      <Section
        id="glossary"
        tone="muted"
        eyebrow="SDG Railway Glossary"
        title="Rail and intermodal terms"
        intro={`${glossary.length} key terms, many linked to the UN Sustainable Development Goals.`}
      >
        <GlossaryBrowser entries={glossary} />
      </Section>
      <Section eyebrow="More resources" title="Reference material">
        <ul className="grid gap-5 md:grid-cols-3">
          <li>
            <LinkCard
              href="/about-us/railway-general-sales-conditions/"
              icon="book"
              title="General Sales Conditions"
            >
              The academic conditions of sale used in exercises.
            </LinkCard>
          </li>
          <li>
            <LinkCard href="/services/dangerous-goods/" icon="hazard" title="Dangerous goods">
              RID, OTIF and the Blue Skills resources.
            </LinkCard>
          </li>
          <li>
            <LinkCard
              href="/services/container-and-trailer-packing/"
              icon="package"
              title="Packing guidance"
            >
              Loading methods and load securing.
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
