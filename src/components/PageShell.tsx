import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getBreadcrumbs, getChildren } from '@/lib/site-map';
import type { SitePage } from '@/types/site';

/**
 * Temporary page body used until each page's content is migrated (Phase 3).
 * It links to the original page so course instructions keep working during the preview.
 */
export function PageShell({ page }: { page: SitePage }) {
  const children = getChildren(page);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs trail={getBreadcrumbs(page)} />
      <h1 className="text-railway-blue-900 mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {page.label}
      </h1>
      <p className="mt-4 max-w-prose text-lg text-neutral-600">{page.description}</p>

      <section
        aria-labelledby="migration-status"
        className="mt-8 max-w-prose rounded-lg border border-neutral-200 bg-neutral-50 p-5"
      >
        <h2 id="migration-status" className="text-railway-blue-900 font-semibold">
          Content migration in progress
        </h2>
        <p className="mt-2 text-neutral-600">
          This page is being rebuilt from the original SDG Railway website. Until it is complete,
          use the original page for course activities.
        </p>
        <a
          href={page.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="text-railway-green-700 mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          Open the original {page.label} page
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </section>

      {children.length > 0 && (
        <section aria-labelledby="subpages" className="mt-8">
          <h2 id="subpages" className="text-railway-blue-900 text-xl font-semibold">
            In this section
          </h2>
          <ul className="mt-3 space-y-1">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.path}
                  className="text-railway-blue-700 inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
