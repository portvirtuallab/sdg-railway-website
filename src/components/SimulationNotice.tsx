/** Required on every page: SDG Railway is an educational simulation (brief §11, §27). */
export function SimulationNotice() {
  return (
    <div
      role="note"
      aria-label="Educational simulation notice"
      className="border-notice-border bg-notice-bg text-notice-text border-b"
    >
      <p className="mx-auto max-w-6xl px-4 py-2 text-sm">
        <strong>Educational simulation.</strong> SDG Railway is part of Port Virtual Lab. It does
        not provide real transport services.
      </p>
    </div>
  );
}
