import { describe, expect, it } from 'vitest';
import { SITE_PAGES } from '@/content/site-map';
import { getBreadcrumbs, getNavigation, getPageBySlug, pathToSlug } from '@/lib/site-map';

const SOURCE_ROOT = 'https://sites.google.com/escolaeuropea.eu/sdgrailway';

/** The 13 pages found in the source audit (docs/audit/page-migration.md). */
const SOURCE_PATHS = [
  '/home',
  '/about-us',
  '/about-us/railway-general-sales-conditions',
  '/services',
  '/services/container-and-trailer-packing',
  '/services/railway-equipment-fleet',
  '/services/railway-equipment-fleet/our-locomotive-models',
  '/services/dangerous-goods',
  '/network-routes',
  '/request-a-quotation',
  '/request-a-quotation/railway-dashboard',
  '/contact',
  '/resources',
];

describe('site map', () => {
  it('keeps all 13 source pages and adds the 3 pages of the 2026 brief', () => {
    expect(SITE_PAGES).toHaveLength(16);
    const sources = SITE_PAGES.filter((p) => p.sourceUrl).map((p) =>
      p.sourceUrl!.replace(SOURCE_ROOT, ''),
    );
    expect(sources.sort()).toEqual([...SOURCE_PATHS].sort());
    expect(SITE_PAGES.filter((p) => !p.sourceUrl).map((p) => p.id)).toEqual([
      'how-it-works',
      'my-quotes',
      'teaching-help',
    ]);
  });

  it('has unique ids and paths', () => {
    expect(new Set(SITE_PAGES.map((p) => p.id)).size).toBe(SITE_PAGES.length);
    expect(new Set(SITE_PAGES.map((p) => p.path)).size).toBe(SITE_PAGES.length);
  });

  it('only references existing parents', () => {
    const ids = new Set(SITE_PAGES.map((p) => p.id));
    for (const p of SITE_PAGES) if (p.parentId) expect(ids).toContain(p.parentId);
  });

  it('keeps every source URL path unchanged', () => {
    for (const p of SITE_PAGES.filter((x) => x.sourceUrl)) {
      const sourcePath = p.sourceUrl!.replace(SOURCE_ROOT, '');
      expect(p.path).toBe(p.id === 'home' ? '/' : `${sourcePath}/`);
    }
  });

  it('records the original name of every relabelled page', () => {
    expect(SITE_PAGES.filter((p) => p.sourceLabel).map((p) => [p.id, p.sourceLabel])).toEqual([
      ['network-routes', 'Network & Routes'],
      ['services', 'Services'],
      ['request-a-quotation', 'Request a quotation'],
      ['resources', 'Resources'],
    ]);
  });

  it('follows the task-based navigation of the 2026 brief', () => {
    const nav = getNavigation();
    expect(nav.map((n) => n.page.label)).toEqual([
      'Home',
      'How it works',
      'Network and trains',
      'Equipment and cargo',
      'Get a quote',
      'My quotes and bookings',
      'Teaching help',
      'About Us',
    ]);
    expect(nav.find((n) => n.page.id === 'services')?.children.map((c) => c.label)).toEqual([
      'Railway Equipment Fleet',
      'Container and Trailer Packing',
      'Dangerous Goods',
    ]);
    expect(nav.find((n) => n.page.id === 'teaching-help')?.children.map((c) => c.label)).toEqual([
      'Glossary and resources',
    ]);
    expect(nav.find((n) => n.page.id === 'about-us')?.children.map((c) => c.label)).toEqual([
      'Railway General Sales Conditions',
      'Contact',
    ]);
  });

  it('keeps the two hidden source pages out of the menus', () => {
    expect(SITE_PAGES.filter((p) => !p.inNav).map((p) => p.id)).toEqual([
      'our-locomotive-models',
      'railway-dashboard',
    ]);
  });

  it('resolves slugs, including the legacy /home path', () => {
    expect(getPageBySlug(['home'])?.id).toBe('home');
    expect(getPageBySlug(pathToSlug('/services/dangerous-goods/'))?.id).toBe('dangerous-goods');
    expect(getPageBySlug(['does-not-exist'])).toBeUndefined();
  });

  it('builds breadcrumbs from the hierarchy', () => {
    const page = getPageBySlug(['services', 'railway-equipment-fleet', 'our-locomotive-models']);
    expect(getBreadcrumbs(page!).map((p) => p.id)).toEqual([
      'services',
      'railway-equipment-fleet',
      'our-locomotive-models',
    ]);
    expect(getBreadcrumbs(getPageBySlug(['resources'])!).map((p) => p.id)).toEqual([
      'teaching-help',
      'resources',
    ]);
  });

  it('never describes SDG Railway as a real operator in metadata', () => {
    for (const p of SITE_PAGES) {
      expect(p.description).not.toMatch(/\b(leading|trusted|certified|real-time)\b/i);
    }
  });
});
