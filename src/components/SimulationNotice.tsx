import { ESCOLA_URL } from '@/content/site-map';

/** Required on every page: SDG Railway is an educational simulation (brief §11, §27). */
export function SimulationNotice() {
  return (
    <div
      role="note"
      aria-label="Educational simulation notice"
      className="border-notice-border bg-notice-bg text-notice-text border-b"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-sm">
        <p>
          <strong>Educational simulation.</strong> SDG Railway is part of Port Virtual Lab. It does
          not provide real transport services.
        </p>
        <p className="font-semibold">
          PVL powered by{' '}
          <a
            href={ESCOLA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:no-underline"
          >
            Escola Europea – Intermodal Transport
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </div>
  );
}
