import { Img, imageUrl } from '@/components/ui/Img';
import { ButtonLink, Callout, OriginalPageLink, PageHero, Section } from '@/components/ui/layout';
import itus from '@/data/itus.json';
import { getPage, pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata('railway-equipment-fleet');

// V-01: the source list is misaligned (labels shifted by one row). Shown verbatim until reviewed.
const EURODUAL_SOURCE = [
  ['Locomotive type', 'Bi-mode (Electric/Diesel-electric)'],
  ['Track gauge', '1,435 mm / 1,668 mm'],
  ['Axle arrangement', 'Co’Co’'],
  ['Supply voltage', '1.5 kV DC / 3 kV DC /'],
  ['Electric power', '15 kV AC / 25 kV AC'],
  ['Diesel power', 'Up to 7,000 kW'],
  ['Starting tractive effort', 'Up to 2,800 kW'],
  ['Fuel tank', 'Up to 500 kN'],
  ['Transmission', 'Up to 4,000 l'],
  ['Maximum speed', 'AC/AC'],
  ['Brake system', 'Up to 160 km/h'],
  ['Mechanic', 'Pneumatic'],
  ['Dynamic', 'Regenerative/rheostatic; 2 distributors, one per bogie'],
  [
    'Suspension',
    'Primary: coil springs · Secondary: rubber metal · Vertical and horizontal dampers',
  ],
];

const T3000E = [
  ['Tare weight', '34.3 t'],
  ['Wheelset load', '22.5 t'],
  ['Length between buffers', '34.20 m'],
  ['Buffer', 'UIC 526-3, Group L'],
  ['Bogie', 'Y25Ls(s)i / Y25Ls(s)i1(f)'],
  ['Wheelsets', 'BA 004'],
  ['Brake', '2 × DK-GP-A-(K)'],
];

export default function FleetPage() {
  const page = getPage('railway-equipment-fleet');
  return (
    <>
      <PageHero
        page={page}
        image="IMG-092"
        eyebrow="Rolling stock and loading units"
        intro="The intermodal transport units, locomotives and wagons used in SDG Railway exercises."
      />

      <Section
        eyebrow="Intermodal Transport Units (ITUs)"
        title="Loading units for rail, road and sea"
        intro="Standardised equipment that carries cargo across rail, road and maritime networks without direct handling of the goods, compatible with European intermodal terminals and rolling stock such as the T3000e double pocket wagon."
      >
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {itus.map((u) => (
            <li
              key={u.id}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
            >
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-neutral-50 p-4">
                {u.image && <Img id={u.image} className="max-h-full w-auto object-contain" />}
              </div>
              <h3 className="text-railway-blue-900 mt-4 text-lg font-bold">{u.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{u.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" eyebrow="EURODUAL" title="Bi-mode locomotive">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
              <Img id="IMG-107" className="w-full" />
            </div>
            <p className="mt-6 text-lg leading-relaxed text-neutral-700">
              A vehicle at the avant-garde of technology, offering rail operators numerous economic
              and ecological benefits. The EURODUAL is more than a “last mile” locomotive: a
              six-axle locomotive with AC/AC transmission and low axle load, usable on freight and
              passenger main lines at up to 160 km/h, on electrified and non-electrified lines, in
              different gauges and overhead voltages (1.5 kV DC, 3 kV DC, 15 kV AC, 25 kV AC).
            </p>
            <a
              href={imageUrl('IMG-093')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md"
            >
              <Img id="IMG-093" className="w-full" />
              <span className="text-railway-green-700 mt-2 block text-sm font-semibold">
                Open the diagram full size<span className="sr-only"> (opens in a new tab)</span>
              </span>
            </a>
          </div>
          <div>
            <Callout title="Technical data under review">
              The vehicle data below is shown exactly as on the original site. Some labels and
              values appear to be shifted by one row (for example “Fuel tank: Up to 500 kN”), so do
              not use these figures as verified specifications until they are reviewed.
            </Callout>
            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
              <table className="w-full text-left text-sm">
                <caption className="text-railway-blue-900 border-b border-neutral-200 px-5 py-3 text-left font-semibold">
                  Vehicle data (source, unverified)
                </caption>
                <tbody className="divide-y divide-neutral-200">
                  {EURODUAL_SOURCE.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="w-2/5 px-5 py-2.5 font-medium text-neutral-600">
                        {k}
                      </th>
                      <td className="text-railway-blue-900 px-5 py-2.5 font-mono">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <ButtonLink href="/services/railway-equipment-fleet/our-locomotive-models/">
                Explore our locomotive models
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section eyebrow="Double pocket car" title="T3000e wagon">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
              <Img id="IMG-094" className="w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['IMG-095', 'IMG-096'].map((id) => (
                <a
                  key={id}
                  href={imageUrl(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md"
                >
                  <Img id={id} className="w-full" />
                  <span className="text-railway-green-700 mt-2 block text-xs font-semibold">
                    Open drawing full size<span className="sr-only"> (opens in a new tab)</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
              <table className="w-full text-left text-sm">
                <caption className="text-railway-blue-900 border-b border-neutral-200 px-5 py-3 text-left font-semibold">
                  General and undercarriage
                </caption>
                <tbody className="divide-y divide-neutral-200">
                  {T3000E.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="w-2/5 px-5 py-2.5 font-medium text-neutral-600">
                        {k}
                      </th>
                      <td className="text-railway-blue-900 px-5 py-2.5 font-mono">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-railway-blue-900 mt-8 text-lg font-bold">
              The wagon is suitable for
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-neutral-700">
              <li>
                All saddle semi-trailers according to UIC 596-5, Annex 3 (max. 40 t per
                semi-trailer).
              </li>
              <li>ISO containers with a height of 8′ and 8′6″ classified in UIC 592-2.</li>
              <li>Swap bodies C 715, C 745 and C 782 (max. 34 t + 16 t per wagon segment).</li>
              <li>Swap bodies of class A (max. 36 t per swap body).</li>
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Loading plan: semi-trailers and large interchangeable containers of various lengths
              (20′ to 45′). Container loading combinations are shown in drawing N-211-00-00-30-0.
              The underframe absorbs impacts against other wagons with a total weight of 80 t (empty
              wagon up to 12 km/h, maximally loaded wagon up to 7 km/h).
            </p>
          </div>
        </div>
        <div className="mt-10">
          <OriginalPageLink page={page} />
        </div>
      </Section>
    </>
  );
}
