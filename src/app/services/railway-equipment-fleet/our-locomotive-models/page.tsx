import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { OriginalPageLink, PageHero, ScenarioBadge, Section } from '@/components/ui/layout';
import locomotives from '@/data/locomotives.json';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('our-locomotive-models');

// Groups follow the series digits of the source EVN numbers (e.g. 9 5 71 0 [201] 501 4) and the
// regions named in each locomotive's description.
const SERIES: Record<string, string> = {
  '201': 'Cardinal virtues',
  '301': 'PR series',
  '401': 'Egyptian network',
  '501': 'French network',
  '601': 'Desert line',
};

export default function LocomotiveModelsPage() {
  const page = getPage('our-locomotive-models');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-106"
        eyebrow="Areté in motion"
        intro="Each SDG Railway locomotive embodies a virtue. Inspired by the Greek concept of areté, the pursuit of excellence, the fleet unites courage, balance and justice in motion."
      />
      <Section>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl bg-neutral-50 p-6 ring-1 ring-neutral-200">
            <Img id="IMG-107" className="w-full" />
          </div>
          <div>
            <ScenarioBadge>Simulation fleet</ScenarioBadge>
            <h2 className="text-railway-blue-900 mt-4 text-3xl font-bold tracking-tight">
              {locomotives.length} named locomotives
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">
              The fleet is based on the EURODUAL bi-mode locomotive. Every unit carries a European
              Vehicle Number (EVN) and a name that reflects the values of SDG Railway and the
              regions it serves.
            </p>
          </div>
        </div>
      </Section>
      <Section tone="muted" title="Meet the fleet">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {locomotives.map((l) => {
            const series = SERIES[l.evn.replace(/\D/g, '').slice(5, 8)] ?? 'SDG Railway';
            return (
              <li key={l.id}>
                <details className="group open:ring-railway-green-600 h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 transition open:ring-2">
                  <summary className="flex min-h-11 cursor-pointer list-none flex-col [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      <span className="bg-railway-blue-900 inline-flex size-11 items-center justify-center rounded-xl text-white">
                        <Icon name="train" />
                      </span>
                      <span className="bg-railway-green-100 text-railway-green-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {series}
                      </span>
                    </span>
                    <span className="font-display text-railway-blue-900 mt-4 text-xl font-bold">
                      {l.name}
                    </span>
                    <span className="text-railway-green-700">{l.motto}</span>
                    <span className="mt-2 font-mono text-xs text-neutral-600">
                      EVN {l.evn.replace(/^E-PRS\s*/, '')}
                    </span>
                    <span className="text-railway-blue-700 mt-3 text-sm font-semibold group-open:hidden">
                      Read the story
                    </span>
                    <span className="text-railway-blue-700 mt-3 hidden text-sm font-semibold group-open:block">
                      Hide the story
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 border-t border-neutral-200 pt-4 text-sm leading-relaxed text-neutral-600">
                    {l.description.map((p) => (
                      <p key={p.slice(0, 40)}>{p}</p>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
        <div className="mt-10">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
