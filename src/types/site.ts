/** Review state shared by every content record (see docs/content-model.md). */
export type ReviewState = 'source' | 'needs-review' | 'approved' | 'proposed';

export interface SitePage {
  /** Stable identifier, never changes once published. */
  id: string;
  /** Page name used in the navigation and as the page title. */
  label: string;
  /** Original page name on the Google Sites website, when the label changed. */
  sourceLabel?: string;
  /** Route path in the new site, with leading and trailing slash. */
  path: string;
  /** Full URL of the page on the original Google Sites website; null for new pages. */
  sourceUrl: string | null;
  /** Parent page id (navigation group and breadcrumbs), or null for top-level pages. */
  parentId: string | null;
  /** Whether the page appears in the main navigation. */
  inNav: boolean;
  /** One-sentence description for metadata. Must not present the simulation as a real operator. */
  description: string;
  reviewState: ReviewState;
}
