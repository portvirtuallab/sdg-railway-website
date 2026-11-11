import Link from 'next/link';
import { PVL_ONE_URL } from '@/content/site-map';

/** Phase 1 homepage skeleton. Hero imagery and source sections arrive in Phases 2–3. */
export default function HomePage() {
  return (
    <>
      <section aria-labelledby="hero-title" className="bg-railway-blue-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-railway-green-100 text-sm font-semibold tracking-widest uppercase">
            The rail freight simulation of Port Virtual Lab
          </p>
          <h1
            id="hero-title"
            className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Connecting ports and inland terminals through rail simulation
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            Explore railway equipment, terminal procedures and intermodal connections while
            practising freight operations in Port Virtual Lab.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/request-a-quotation/"
              className="bg-railway-green-700 inline-flex min-h-11 items-center rounded-md px-5 font-semibold text-white underline-offset-4 hover:underline"
            >
              Request a simulated quotation
            </Link>
            <Link
              href="/network-routes/"
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 px-5 font-semibold hover:bg-white/10"
            >
              Explore the network
            </Link>
            <a
              href={PVL_ONE_URL}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-flex min-h-11 items-center px-2 font-semibold underline underline-offset-4"
            >
              Access PVL.ONE<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="max-w-prose text-neutral-600">
          SDG Railway is the simulated rail freight operator of Port Virtual Lab, developed by
          Escola Europea – Intermodal Transport for education and professional training.
        </p>
      </div>
    </>
  );
}
