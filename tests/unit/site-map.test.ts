import { describe, expect, it } from 'vitest';
import { SITE_PAGES } from '@/content/site-map';
import { getBreadcrumbs, getNavigation, getPageBySlug, pathToSlug } from '@/lib/site-map';

const SOURCE_ROOT = 'https://sites.google.com/escolaeuropea.eu/sdgrailway';

describe('site map', () => {
  it('contains all 13 pages found in the source audit', () => {
    expect(SITE_PAGES).toHaveLength(13);
  });

  it('has unique ids and paths', () => {
    expect(new Set(SITE_PAGES.map((p) => p.id)).size).toBe(SITE_PAGES.length);
    expect(new Set(SITE_PAGES.map((p) => p.path)).size).toBe(SITE_PAGES.length);
  });

  it('only references existing parents', () => {
    const ids = new Set(SITE_PAGES.map((p) => p.id));
    for (const p of SITE_PAGES) if (p.parentId) expect(ids).toContain(p.parentId);
  });

  it('keeps every source path as the target path', () => {
    for (const p of SITE_PAGES) {
      const sourcePath = p.sourceUrl.replace(SOURCE_ROOT, '');
      const expected = p.id === 'home' ? '/' : `${sourcePath}/`;
      expect(p.path).toBe(expected);
    }
  });

  it('preserves the source navigation labels and order', () => {
    const nav = getNavigation();
    expect(nav.map((n) => n.page.label)).toEqual([
      'Home',
      'About Us',
      'Services',
      'Network & Routes',
      'Request a quotation',
      'Contact',
      'Resources',
    ]);
    expect(nav.find((n) => n.page.id === 'about-us')?.children.map((c) => c.label)).toEqual([
      'Railway General Sales Conditions',
    ]);
    expect(nav.find((n) => n.page.id === 'services')?.children.map((c) => c.label)).toEqual([
      'Container and Trailer Packing',
      'Railway Equipment Fleet',
      'Dangerous Goods',
    ]);
  });

  it('keeps the two hidden source pages out of the navigation', () => {
    const hidden = SITE_PAGES.filter((p) => !p.inNav).map((p) => p.id);
    expect(hidden).toEqual(['our-locomotive-models', 'railway-dashboard']);
  });

  it('resolves slugs, including the legacy /home path', () => {
    expect(getPageBySlug(['home'])?.id).toBe('home');
    expect(getPageBySlug(pathToSlug('/services/dangerous-goods/'))?.id).toBe('dangerous-goods');
    expect(getPageBySlug(['does-not-exist'])).toBeUndefined();
  });

  it('builds breadcrumbs from the hierarchy', () => {
    const page = getPageBySlug(['services', 'railway-equipment-fleet', 'our-locomotive-models']);
    expect(page).toBeDefined();
    expect(getBreadcrumbs(page!).map((p) => p.id)).toEqual([
      'services',
      'railway-equipment-fleet',
      'our-locomotive-models',
    ]);
  });

  it('never describes SDG Railway as a real operator in metadata', () => {
    for (const p of SITE_PAGES) {
      expect(p.description).not.toMatch(/\b(leading|trusted|certified|real-time)\b/i);
    }
  });
});
