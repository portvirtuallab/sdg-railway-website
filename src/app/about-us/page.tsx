import { Img } from '@/components/ui/Img';
import {
  ButtonLink,
  Callout,
  OriginalPageLink,
  PageHero,
  ScenarioBadge,
  Section,
} from '@/components/ui/layout';
import team from '@/data/team.json';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('about-us');

const PILLARS = [
  {
    title: 'Mission',
    subtitle: 'What drives us',
    icon: 'IMG-003',
    text: 'To redefine the future of freight transport by combining the efficiency of rail logistics with digital innovation and sustainability. Smarter, cleaner transport is not only possible, it is essential: our commitment goes beyond moving goods, we move progress.',
  },
  {
    title: 'Vision',
    subtitle: 'Where we are going',
    icon: 'IMG-004',
    text: 'To set new standards for sustainable and intelligent rail freight in the European intermodal network, bridging ports, terminals and industries, and inspiring innovation and continuous learning among logistics professionals.',
  },
  {
    title: 'Our role in PVL',
    subtitle: 'Learning by doing',
    icon: 'IMG-005',
    text: 'SDG Railway operates within Port Virtual Lab, a digital learning and simulation platform for logistics, transport and international trade. Through case studies, users plan rail operations, compare intermodal routes and experience the decisions of a freight company.',
  },
];

export default function AboutPage() {
  const page = getPage('about-us');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-001"
        eyebrow="Who we are"
        intro="The simulated rail freight operator of Port Virtual Lab, developed by Escola Europea – Intermodal Transport."
      />

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Img
            id="IMG-002"
            className="aspect-[4/3] w-full rounded-2xl object-cover object-top shadow-xl"
          />
          <div>
            <ScenarioBadge>Simulated organisation</ScenarioBadge>
            <h2 className="text-railway-blue-900 mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Our professional team
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">
              Behind SDG Railway is a team of experts dedicated to efficient, safe and sustainable
              freight operations. Each department combines experience, innovation and commitment. In
              exercises, learners interact with these departments.
            </p>
          </div>
        </div>
        <div
          className="mt-12 overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
          tabIndex={0}
          role="region"
          aria-label="Departments table"
        >
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">SDG Railway departments</caption>
            <thead className="bg-railway-blue-900 text-white">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Department
                </th>
                <th scope="col" className="px-5 py-3">
                  Expertise
                </th>
                <th scope="col" className="px-5 py-3">
                  Focus area
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {team.map((t) => (
                <tr key={t.department}>
                  <th scope="row" className="text-railway-blue-900 px-5 py-3 font-semibold">
                    {t.department}
                  </th>
                  <td className="px-5 py-3 text-neutral-600">{t.expertise}</td>
                  <td className="px-5 py-3 text-neutral-600">{t.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        tone="muted"
        eyebrow="Purpose"
        title="Mission, vision and our role in Port Virtual Lab"
      >
        <ul className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <li
              key={p.title}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-neutral-200"
            >
              <Img id={p.icon} className="h-20 w-auto" />
              <p className="text-railway-green-700 mt-5 text-sm font-semibold tracking-wide uppercase">
                {p.subtitle}
              </p>
              <h3 className="text-railway-blue-900 mt-1 text-2xl font-bold">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-neutral-600">{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Compliance & commitment" title="The frameworks behind our exercises">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4 text-lg leading-relaxed text-neutral-600">
            <p>
              SDG Railway exercises are built around European rules and goals for safe and
              sustainable rail freight: the Regulations concerning the International Carriage of
              Dangerous Goods by Rail (RID), the objectives of the European Green Deal, and quality
              and environmental management principles such as those of ISO 9001 and ISO 14001.
            </p>
            <p>Learners apply a compliance protocol from loading to dispatch, including:</p>
            <ul className="list-disc space-y-1.5 pl-6 text-base">
              <li>monitoring safety and environmental performance;</li>
              <li>training and certification of the staff involved in intermodal operations;</li>
              <li>digital traceability of operational data;</li>
              <li>working with partners who share sustainability and compliance values.</li>
            </ul>
            <Callout title="Educational framing">
              SDG Railway is a simulated company: it holds no real certifications and is not
              audited. References to standards describe what learners study and practise.
            </Callout>
          </div>
          <div className="grid gap-5">
            <div className="flex items-center gap-5 rounded-2xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
              <Img id="IMG-008" className="h-28 w-auto" />
              <p className="text-sm text-neutral-600">
                <strong className="text-railway-blue-900">RID</strong> – international carriage of
                dangerous goods by rail, published by OTIF.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-200">
              <Img id="IMG-009" className="w-full" />
              <p className="bg-neutral-50 p-4 text-sm text-neutral-600">
                <strong className="text-railway-blue-900">European Green Deal</strong> – the EU
                roadmap to a sustainable economy.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="dark">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Don’t know the technical terms?</h2>
            <p className="mt-2 text-white/85">
              Check their meanings and definitions in our glossary.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/resources/#glossary">Go to the glossary</ButtonLink>
            <ButtonLink href="/about-us/railway-general-sales-conditions/" variant="ghost-light">
              General Sales Conditions
            </ButtonLink>
          </div>
        </div>
      </Section>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <OriginalPageLink page={page} />
      </div>
    </>
  );
}
