import type { MetadataRoute } from 'next';
import { SITE_PAGES } from '@/content/site-map';
import { absoluteUrl } from '@/lib/site-config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_PAGES.map((p) => ({ url: absoluteUrl(p.path) }));
}
