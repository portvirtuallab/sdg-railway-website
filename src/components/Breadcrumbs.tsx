import Link from 'next/link';
import type { SitePage } from '@/types/site';

export function Breadcrumbs({ trail }: { trail: SitePage[] }) {
  if (trail.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="underline-offset-4 hover:underline">
            Home
          </Link>
        </li>
        {trail
          .filter((p) => p.id !== 'home')
          .map((p, i, arr) => (
            <li key={p.id} className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              {i === arr.length - 1 ? (
                <span aria-current="page">{p.label}</span>
              ) : (
                <Link href={p.path} className="underline-offset-4 hover:underline">
                  {p.label}
                </Link>
              )}
            </li>
          ))}
      </ol>
    </nav>
  );
}
