/**
 * Public URL of the deployed site, used for canonical URLs, Open Graph and the sitemap.
 * Defaults to the GitHub Pages preview location. The production domain is still to be
 * confirmed by the owner; do not set it to www.sdgrailway.com without approval (brief §18).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portvirtuallab.github.io/sdg-railway-website'
).replace(/\/$/, '');

export const SITE_NAME = 'SDG Railway';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
