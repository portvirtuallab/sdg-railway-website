import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-config';

export const dynamic = 'force-static';

/** Indexing stays off for previews until NEXT_PUBLIC_ALLOW_INDEXING=true is approved. */
export default function robots(): MetadataRoute.Robots {
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';
  return {
    rules: allow ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
