import { ESCOLA_URL, PVL_ONE_URL } from '@/content/site-map';

/**
 * Legal wording is pending owner review (verification log V-14): the source footer says
 * "All rights reserved" while its licence badge says CC BY-NC-ND 4.0. Do not add a ® to
 * SDG Railway unless the owner confirms it.
 */
export function SiteFooter() {
  return (
    <footer className="bg-railway-blue-950 mt-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2">
        <div>
          <p className="font-semibold">SDG Railway</p>
          <p className="mt-2 max-w-prose text-sm text-white/85">
            The simulated rail freight operator of Port Virtual Lab, developed by Escola Europea –
            Intermodal Transport for education and professional training. It does not provide real
            transport services.
          </p>
        </div>
        <ul className="space-y-1 text-sm sm:justify-self-end">
          <li>
            <a
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              href={PVL_ONE_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              PVL.ONE<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              href={ESCOLA_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Escola Europea – Intermodal Transport
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
      <p className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/75">
        Port Virtual Lab © Escola Europea. Licence and trademark notice pending owner review.
      </p>
    </footer>
  );
}
