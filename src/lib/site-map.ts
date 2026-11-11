import { SITE_PAGES } from '@/content/site-map';
import type { SitePage } from '@/types/site';

export interface NavItem {
  page: SitePage;
  children: SitePage[];
}

export function getPageById(id: string): SitePage | undefined {
  return SITE_PAGES.find((p) => p.id === id);
}

/** Converts a route path to the segment array used by the catch-all route. */
export function pathToSlug(path: string): string[] {
  return path.split('/').filter(Boolean);
}

export function getPageBySlug(slug: readonly string[]): SitePage | undefined {
  const joined = slug.join('/');
  // The source site used /home for the homepage; keep it resolvable.
  if (joined === 'home') return getPageById('home');
  return SITE_PAGES.find((p) => pathToSlug(p.path).join('/') === joined);
}

/** Top-level navigation with one level of submenu, as on the source site. */
export function getNavigation(): NavItem[] {
  return SITE_PAGES.filter((p) => p.parentId === null && p.inNav).map((page) => ({
    page,
    children: SITE_PAGES.filter((c) => c.parentId === page.id && c.inNav),
  }));
}

/** Ancestors from the top level down to (and including) the given page. */
export function getBreadcrumbs(page: SitePage): SitePage[] {
  const trail: SitePage[] = [];
  let current: SitePage | undefined = page;
  while (current) {
    trail.unshift(current);
    current = current.parentId ? getPageById(current.parentId) : undefined;
  }
  return trail;
}

export function getChildren(page: SitePage): SitePage[] {
  return SITE_PAGES.filter((p) => p.parentId === page.id);
}
