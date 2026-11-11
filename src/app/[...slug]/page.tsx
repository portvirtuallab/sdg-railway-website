import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { SITE_PAGES } from '@/content/site-map';
import { getPageBySlug, pathToSlug } from '@/lib/site-map';
import HomePage from '../page';

interface Props {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  const params = SITE_PAGES.filter((p) => p.path !== '/').map((p) => ({
    slug: pathToSlug(p.path),
  }));
  // Keep the source site's /home path working.
  return [...params, { slug: ['home'] }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.id === 'home' ? { absolute: 'SDG Railway' } : page.label,
    description: page.description,
    // /home duplicates the homepage; its canonical points to /.
    alternates: { canonical: page.path },
    openGraph: { title: page.label, description: page.description, url: page.path },
  };
}

export default async function SourcePage({ params }: Props) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();
  if (page.id === 'home') return <HomePage />;
  return <PageShell page={page} />;
}
