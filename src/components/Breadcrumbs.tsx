import Link from 'next/link';
import type { SitePage } from '@/types/site';

export function Breadcrumbs({
  trail,
  inverted = false,
}: {
  trail: SitePage[];
  inverted?: boolean;
}) {
  if (trail.length < 2 && trail[0]?.id === 'home') return null;
  const tone = inverted ? 'text-white/80' : 'text-neutral-600';
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${tone}`}>
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
          >
            Home
          </Link>
        </li>
        {trail
          .filter((p) => p.id !== 'home')
          .map((p, i, arr) => (
            <li key={p.id} className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              {i === arr.length - 1 ? (
                <span aria-current="page" className={inverted ? 'text-white' : ''}>
                  {p.label}
                </span>
              ) : (
                <Link
                  href={p.path}
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  {p.label}
                </Link>
              )}
            </li>
          ))}
      </ol>
    </nav>
  );
}
