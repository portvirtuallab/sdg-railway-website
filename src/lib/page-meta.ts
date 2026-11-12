import type { Metadata } from 'next';
import { getPageById } from '@/lib/site-map';
import type { SitePage } from '@/types/site';

export function getPage(id: string): SitePage {
  const page = getPageById(id);
  if (!page) throw new Error(`Unknown page id: ${id}`);
  return page;
}

export function pageMetadata(id: string): Metadata {
  const page = getPage(id);
  return {
    title: page.label,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: { title: page.label, description: page.description, url: page.path },
  };
}

export const COUNTRY_NAMES: Record<string, string> = {
  ES: 'Spain',
  FR: 'France',
  IT: 'Italy',
  PT: 'Portugal',
  JO: 'Jordan',
  EG: 'Egypt',
};

/** Regional-indicator flag emoji for an ISO country code (decorative). */
export function flag(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}
