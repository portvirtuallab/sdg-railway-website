import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import {
  ButtonLink,
  Callout,
  OriginalPageLink,
  PageHero,
  ScenarioBadge,
  Section,
} from '@/components/ui/layout';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('container-and-trailer-packing');

const METHODS = [
  {
    title: 'Containerised cargo',
    tag: 'Lo-Lo · cranes and reach stackers',
    image: 'IMG-077',
    text: [
      'Containers are handled by gantry cranes or reach stackers in accordance with UIC 592. Each unit is lifted vertically and placed precisely on the wagon’s twist locks, ensuring full alignment.',
      'Operators verify that all four corners are locked before dispatch. This method is mainly used for 20′, 40′ and 45′ containers.',
    ],
  },
  {
    title: 'Pocket wagon system – T3000e',
    tag: 'Lo-Lo · unaccompanied',
    image: 'IMG-078',
    text: [
      'Semi-trailers compliant with the P400 profile are lifted by crane onto T3000e pocket wagons so that the wheels rest in the lower pockets and the kingpin locks into a front support.',
      'Only the trailer travels by rail; the tractor unit and driver stay at the terminal. The method is compatible across European intermodal corridors.',
    ],
  },
  {
    title: 'Swap bodies',
    tag: 'Lo-Lo · unaccompanied',
    image: 'IMG-079',
    text: [
      'The swap body is lifted from the truck chassis and positioned on dedicated wagon supports that accommodate its foldable legs and frame, then secured with locking and support systems.',
      'The unit moves independently of the road vehicle, with fast terminal operations and good weight distribution.',
    ],
  },
  {
    title: 'Vehicles (car transport)',
    tag: 'Ro-Ro · autorack wagons',
    image: 'IMG-080',
    text: [
      'Cars, vans and light commercial vehicles are driven onto single or multi-level autorack wagons via ramps and secured with wheel chocks and lashing systems.',
      'The method is widely used by the automotive industry for large-scale vehicle distribution across European rail corridors.',
    ],
  },
  {
    title: 'Rolling highway (Ro-La)',
    tag: 'Ro-Ro · accompanied',
    image: 'IMG-081',
    text: [
      'Complete trucks, tractor unit and semi-trailer, are driven onto low-floor wagons via a ramp. Drivers may travel with the train or return separately.',
      'Ro-La is mainly used on environmentally sensitive corridors such as Alpine routes, to reduce congestion, emissions and driving restrictions.',
    ],
  },
];

const SECURING = [
  { title: 'Twist locks', image: 'IMG-083' },
  { title: 'Kingpin locks', image: 'IMG-084' },
  { title: 'Additional lashings', image: 'IMG-085' },
  { title: 'Anti-slip mats and shock absorbers', image: 'IMG-086' },
];

const INSPECTION = [
  'The container or semi-trailer is checked for structural integrity and cleanliness.',
  'Weight and Verified Gross Mass (VGM) are confirmed.',
  'Dangerous goods, if applicable, are verified according to RID classification and documentation.',
  'Every inspection is logged digitally for traceability.',
];

export default function PackingPage() {
  const page = getPage('container-and-trailer-packing');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-076"
        eyebrow="Loading and securing"
        intro="How containers, swap bodies, trailers and vehicles are loaded, balanced and secured on SDG Railway wagons."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-railway-blue-900 text-3xl font-bold tracking-tight">
              Safe, efficient and traceable handling
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">
              In the simulation, SDG Railway’s packing operations follow intermodal safety
              standards. The loading processes refer to European railway rules (UIC, EN 12195 and
              RID) and are designed for stability and sustainability on every journey.
            </p>
          </div>
          <div className="bg-railway-blue-900 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold">Pre-loading inspection</h3>
            <p className="mt-1 text-sm text-white/80">Before each unit is loaded:</p>
            <ul className="mt-4 space-y-3 text-sm">
              {INSPECTION.map((i) => (
                <li key={i} className="flex gap-3">
                  <Icon name="check" className="text-railway-green-100 mt-0.5 size-5 shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="muted" eyebrow="Loading process" title="Five loading methods">
        <ul className="space-y-6">
          {METHODS.map((m, i) => (
            <li
              key={m.title}
              className="grid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 md:grid-cols-2"
            >
              <Img
                id={m.image}
                className={`aspect-[16/10] size-full object-cover md:aspect-auto ${i % 2 ? 'md:order-2' : ''}`}
              />
              <div className="p-6 sm:p-8">
                <p className="text-railway-green-700 text-sm font-bold">
                  {String(i + 1).padStart(2, '0')} · {m.tag}
                </p>
                <h3 className="text-railway-blue-900 mt-1 text-2xl font-bold">{m.title}</h3>
                {m.text.map((t) => (
                  <p key={t.slice(0, 30)} className="mt-3 leading-relaxed text-neutral-600">
                    {t}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Weight distribution & safety" title="Balance the train">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-lg leading-relaxed text-neutral-600">
            <p>Cargo must be evenly distributed to keep wagons balanced and braking safe.</p>
            <p>
              Heavy containers go towards the centre of the train; lighter units are arranged on the
              outer wagons.
            </p>
            <p>Load securing follows EN 12195-1 (lashing and securing of cargo).</p>
            <div className="pt-2">
              <ButtonLink href={page.sourceUrl} external variant="secondary">
                Try the Load Planner (original site)
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-6 ring-1 ring-neutral-200">
            <ScenarioBadge>Simulation partner</ScenarioBadge>
            <div className="mt-4 flex items-center gap-5">
              <Img id="IMG-082" className="h-24 w-auto rounded-xl bg-white p-2" />
              <p className="text-neutral-600">
                In the scenario, SDG Railway works with{' '}
                <strong className="text-railway-blue-900">PlayPackaging</strong>, the packaging
                digital game of Port Virtual Lab, for intermodal packaging solutions.
              </p>
            </div>
            <p className="mt-4 text-sm text-neutral-600">
              The Load Planner tool lets learners place units on wagons and check axle loads and
              balance before departure.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted" eyebrow="Securing the load" title="All units are secured using">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECURING.map((s) => (
            <li
              key={s.title}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"
            >
              <Img id={s.image} className="aspect-square w-full object-cover" />
              <p className="text-railway-blue-900 p-4 font-semibold">{s.title}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Callout title="Educational guidance">
            This page explains loading practice for learning purposes. It is not an operating
            instruction. Always check the current regulations (UIC loading guidelines, EN 12195-1,
            RID) and qualified expert advice for real operations.
          </Callout>
        </div>
        <div className="mt-8">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
