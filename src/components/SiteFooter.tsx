import Link from 'next/link';
import { Img } from '@/components/ui/Img';
import { TrackDivider } from '@/components/ui/layout';
import { ESCOLA_URL, PVL_ONE_URL, SITE_PAGES } from '@/content/site-map';

const col = (ids: string[]) =>
  ids.map((id) => SITE_PAGES.find((p) => p.id === id)!).filter(Boolean);

const COLUMNS = [
  { title: 'Company', pages: col(['about-us', 'railway-general-sales-conditions', 'contact']) },
  {
    title: 'Services',
    pages: col([
      'services',
      'container-and-trailer-packing',
      'railway-equipment-fleet',
      'our-locomotive-models',
      'dangerous-goods',
    ]),
  },
  { title: 'Plan & learn', pages: col(['network-routes', 'request-a-quotation', 'resources']) },
];

/**
 * Legal wording is pending owner review (verification log V-14): the source footer says
 * "All rights reserved" while its licence badge says CC BY-NC-ND 4.0. Do not add a ® to
 * SDG Railway unless the owner confirms it.
 */
export function SiteFooter() {
  return (
    <footer className="bg-railway-blue-950 mt-auto text-white">
      <TrackDivider />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-xl font-bold">SDG Railway</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            The simulated rail freight operator of Port Virtual Lab, developed by Escola Europea –
            Intermodal Transport for education and professional training. It does not provide real
            transport services.
          </p>
          <a
            href={PVL_ONE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex rounded-xl bg-white p-3"
          >
            <Img id="IMG-010" className="h-10 w-auto" />
            <span className="sr-only"> – PVL.ONE (opens in a new tab)</span>
          </a>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={`Footer – ${c.title}`}>
            <p className="text-railway-green-100 font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-0.5 text-sm">
              {c.pages.map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.path}
                    className="inline-flex min-h-11 items-center text-white/85 underline-offset-4 hover:text-white hover:underline md:min-h-9"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Port Virtual Lab © Escola Europea. Licence and trademark notice pending owner review.
          </p>
          <p className="flex gap-4">
            <a
              className="inline-flex min-h-11 items-center hover:text-white hover:underline sm:min-h-0"
              href={ESCOLA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escola Europea – Intermodal Transport
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              className="inline-flex min-h-11 items-center hover:text-white hover:underline sm:min-h-0"
              href={PVL_ONE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              PVL.ONE<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
