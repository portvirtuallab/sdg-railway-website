import { Img } from '@/components/ui/Img';
import { ButtonLink, Callout, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import resources from '@/data/dg-resources.json';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('dangerous-goods');

export default function DangerousGoodsPage() {
  const page = getPage('dangerous-goods');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-087"
        eyebrow="RID · OTIF"
        intro="How the carriage of dangerous goods by rail works in the SDG Railway simulation, and where to find the regulations."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4 text-lg leading-relaxed text-neutral-600">
            <p>
              In the scenario, SDG Railway has its own Dangerous Goods teams. Its European and
              Mediterranean regions each apply their own handling procedures for DG applications and
              approvals.
            </p>
            <p>
              Simulated DG coordinators advise shippers, and a shipper’s dangerous goods cargo is
              checked against the legal requirements of the countries, terminals and ports involved.
              Stowage and segregation requirements protect the cargo, the train, the crew, cargo
              handlers and the environment.
            </p>
            <p>
              SDG Railway follows the regulations of the Intergovernmental Organisation for
              International Carriage by Rail (OTIF).
            </p>
            <div className="pt-2">
              <ButtonLink href="https://otif.org/" external variant="secondary">
                Visit otif.org
              </ButtonLink>
            </div>
          </div>
          <Callout title="Simulated approval steps">
            DG teams, coordinators and approvals described on this page are part of the learning
            scenario. No real authorisation is given and acceptance of dangerous goods is never
            guaranteed. For real shipments, consult the current RID edition published by OTIF.
          </Callout>
        </div>
      </Section>
      <Section tone="muted" eyebrow="Learning resources" title="RID and Blue Skills">
        <ul className="grid gap-6 lg:grid-cols-3">
          {resources.map((r) => (
            <li
              key={r.title}
              className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
            >
              {r.icon && <Img id={r.icon} className="mx-auto h-40 w-auto" />}
              <h3 className="text-railway-blue-900 mt-4 text-xl font-bold">{r.title}</h3>
              <div
                className="prose-rail mt-3 text-sm leading-relaxed text-neutral-600"
                dangerouslySetInnerHTML={{ __html: r.html }}
              />
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
