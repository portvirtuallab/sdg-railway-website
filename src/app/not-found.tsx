import Link from 'next/link';
import { getNavigation } from '@/lib/site-map';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-railway-blue-900 text-3xl font-bold">Page not found</h1>
      <p className="mt-4 max-w-prose text-neutral-600">
        The page you are looking for does not exist or has moved. These are the main sections of SDG
        Railway:
      </p>
      <ul className="mt-4 space-y-1">
        {getNavigation().map(({ page }) => (
          <li key={page.id}>
            <Link
              href={page.path}
              className="text-railway-blue-700 inline-flex min-h-11 items-center underline underline-offset-4"
            >
              {page.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
